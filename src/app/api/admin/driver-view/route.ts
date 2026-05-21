import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { toMoney } from "@/lib/money";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const requests = await db.collection("serviceRequests").find({}).toArray();
    const proofs = await db.collection("repaymentProofs").find({}).toArray();
    const usersCollection = db.collection("user");

    const proofsByRequest: Record<string, any[]> = {};
    for (const p of proofs) {
      const list = proofsByRequest[p.requestId] || [];
      list.push(p);
      proofsByRequest[p.requestId] = list;
    }

    const activeStatuses = ["approved", "sent", "completed"];
    const groups: Record<
      string,
      {
        userId: string;
        driverName: string;
        driverEmail: string;
        driverPhone: string;
        paid: number;
        outstanding: number;
        loans: { id: string; type: string; amount: number; totalRepayable: number; repaid: number; remaining: number; status: string; hasReceipt: boolean; completedDate?: string; carNumber?: string }[];
      }
    > = {};

    for (const r of requests) {
      if (!activeStatuses.includes(r.status)) continue;

      const userId = r.userId;
      const name = (r.driverName || "Unknown").trim();

      const reqProofs = proofsByRequest[r._id.toString()] || [];
      const proofsTotal = reqProofs
        .filter((p: any) => p.status === "approved")
        .reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const totalRepayable = r.totalRepayable || r.amount || 0;
      const totalRepaid = Math.min(Math.max(proofsTotal, r.repaidAmount || 0), totalRepayable);
      const remaining = Math.max(0, totalRepayable - totalRepaid);

      if (!groups[userId]) {
        let driverEmail = r.driverEmail || "";
        let driverPhone = r.driverPhone || "";
        if (!driverEmail) {
          try {
            const user = await usersCollection.findOne({ _id: new (require("mongodb").ObjectId)(userId) });
            driverEmail = user?.email || "";
            driverPhone = user?.phone || "";
          } catch {}
        }
        groups[userId] = { userId, driverName: name, driverEmail, driverPhone, paid: 0, outstanding: 0, loans: [] };
      } else {
        if (r.driverName?.trim()) groups[userId].driverName = name;
      }

      groups[userId].paid += totalRepaid;
      groups[userId].outstanding += remaining;
      groups[userId].loans.push({
        id: r._id.toString(),
        type: r.type,
        amount: r.actualAmount || r.amount || 0,
        totalRepayable,
        repaid: totalRepaid,
        remaining,
        status: r.status,
        hasReceipt: !!r.hasReceipt,
        completedDate: r.completedDate,
        carNumber: r.carNumber,
      });
    }

    const drivers = Object.values(groups)
      .map((d) => ({
        ...d,
        paid: toMoney(d.paid),
        outstanding: toMoney(d.outstanding),
        loans: d.loans.map((l) => ({ ...l, repaid: toMoney(l.repaid), remaining: toMoney(l.remaining) })),
      }))
      .sort((a, b) => a.driverName.localeCompare(b.driverName));

    return NextResponse.json({ drivers });
  } catch (error) {
    console.error("Error fetching driver view data:", error);
    return NextResponse.json({ error: "Failed to fetch driver view data" }, { status: 500 });
  }
}
