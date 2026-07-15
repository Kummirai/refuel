import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { toMoney } from "@/lib/money";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 500);
    const skip = parseInt(searchParams.get("skip") || "0");

    const query: any = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const requests = await db.collection("serviceRequests")
      .find(query)
      .project({
        userId: 1, type: 1, amount: 1, actualAmount: 1, totalRepayable: 1,
        repaidAmount: 1, remainingBalance: 1, isPaid: 1, status: 1,
        driverName: 1, driverEmail: 1, driverPhone: 1, carNumber: 1,
        hasReceipt: 1, completedDate: 1, requestDate: 1,
      })
      .toArray();

    const proofQuery: any = {};
    if (status && status !== "all") {
      // When filtering by status, we still need proofs for all matching requests
    }
    const proofs = await db.collection("repaymentProofs")
      .find(proofQuery)
      .project({ requestId: 1, status: 1, amount: 1 })
      .toArray();

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

    // Batch user lookups for users missing email
    const userIdsNeeded = [...new Set(
      requests
        .filter((r: any) => !r.driverEmail)
        .map((r: any) => r.userId)
    )] as string[];
    const userMap = new Map<string, any>();
    if (userIdsNeeded.length > 0) {
      const userObjectIds = userIdsNeeded.map((id: string) => {
        try { return new ObjectId(id); } catch { return id; }
      });
      const users: any[] = await db.collection("user")
        .find({ _id: { $in: userObjectIds } })
        .project({ email: 1, phone: 1 })
        .toArray();
      for (const u of users) {
        userMap.set(u._id.toString(), u);
      }
    }

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
          const user = userMap.get(userId);
          if (user) {
            driverEmail = user.email || "";
            driverPhone = user.phone || "";
          }
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

    let allDrivers = Object.values(groups)
      .map((d) => ({
        ...d,
        paid: toMoney(d.paid),
        outstanding: toMoney(d.outstanding),
        loans: d.loans.map((l) => ({ ...l, repaid: toMoney(l.repaid), remaining: toMoney(l.remaining) })),
      }))
      .sort((a, b) => a.driverName.localeCompare(b.driverName));

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      allDrivers = allDrivers.filter((d: any) =>
        d.driverName?.toLowerCase().includes(q) ||
        d.driverEmail?.toLowerCase().includes(q)
      );
    }

    // Paginate
    const paginated = allDrivers.slice(skip, skip + limit);

    return NextResponse.json({
      drivers: paginated,
      total: allDrivers.length,
      hasMore: skip + limit < allDrivers.length,
    });
  } catch (error) {
    console.error("Error fetching driver view data:", error);
    return NextResponse.json({ error: "Failed to fetch driver view data" }, { status: 500 });
  }
}
