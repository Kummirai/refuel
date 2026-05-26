// src/app/api/admin/repayments/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driverId");
    const date = searchParams.get("date");

    const serviceRequestsCollection = db.collection("serviceRequests");
    const usersCollection = db.collection("user");
    const repaymentProofsCollection = db.collection("repaymentProofs");

    // Get all service requests that have payments
    const serviceRequests = await serviceRequestsCollection
      .find({ payments: { $exists: true, $ne: [] } })
      .toArray();

    // Fetch user details for unique user IDs
    const userIds = [
      ...new Set(
        serviceRequests
          .map((sr: any) => sr.userId)
          .filter(Boolean),
      ),
    ] as string[];
    const users = userIds.length > 0
      ? await usersCollection
          .find({ _id: { $in: userIds.map((id: string) => {
            try { return new ObjectId(id); } catch { return id; }
          })} })
          .toArray()
      : [];
    const userMap = new Map<string, any>();
    for (const u of users) {
      userMap.set(u._id.toString(), u);
    }

    // Fetch ALL proofs to check approval status per payment
    const allProofs = await repaymentProofsCollection
      .find()
      .toArray();

    // Index proofs by proofPublicId and proofUrl for fast per-payment lookup
    const proofByPublicId = new Map<string, any>();
    const proofByUrl = new Map<string, any>();
    for (const p of allProofs) {
      if (p.proofPublicId) proofByPublicId.set(p.proofPublicId, p);
      if (p.proofUrl) proofByUrl.set(p.proofUrl, p);
    }

    // Build entries from each service request's payments array
    const entries: any[] = [];
    for (const sr of serviceRequests) {
      const driver = userMap.get(sr.userId);
      const driverName = sr.driverName || driver?.name || "Unknown";
      const driverEmail = sr.driverEmail || driver?.email || "";
      const driverPhone = sr.driverPhone || driver?.phone || "";

      for (const payment of (sr.payments || [])) {
        // Find the matching proof for this payment (by public ID or URL)
        let matchingProof: any = null;
        if (payment.proofPublicId) {
          matchingProof = proofByPublicId.get(payment.proofPublicId) || null;
        } else if (payment.proofUrl) {
          matchingProof = proofByUrl.get(payment.proofUrl) || null;
        }

        // If a proof exists for this payment but it's not approved, skip (payment was reversed)
        if (matchingProof && matchingProof.status !== "approved") continue;

        const paymentDate = payment.date || payment.createdAt;
        const approvedAt = matchingProof?.approvedAt || paymentDate;
        const isProofApproval = !!matchingProof;

        entries.push({
          id: payment.id,
          loanId: sr._id.toString(),
          driverId: sr.userId,
          driverName,
          driverEmail,
          driverPhone,
          carNumber: sr.carNumber || "Not provided",
          serviceType: sr.type || "unknown",
          serviceTypeLabel: getServiceTypeLabel(sr.type),
          amount: payment.amount,
          method: payment.method || "cash",
          paymentDate,
          approvedAt,
          approvedDate: new Date(approvedAt).toISOString().split("T")[0],
          remainingBalance: sr.remainingBalance,
          isProofApproval,
          proofId: matchingProof?._id?.toString(),
        });
      }
    }

    // Apply filters
    let filtered = entries;
    if (driverId) {
      filtered = filtered.filter((e: any) => e.driverId === driverId);
    }
    if (date) {
      filtered = filtered.filter((e: any) => e.approvedDate === date);
    }

    // Group by driver + approved date
    const groups = new Map<string, any>();
    for (const entry of filtered) {
      const key = `${entry.driverId}::${entry.approvedDate}`;
      if (!groups.has(key)) {
        groups.set(key, {
          driverId: entry.driverId,
          driverName: entry.driverName,
          driverEmail: entry.driverEmail,
          driverPhone: entry.driverPhone,
          approvedDate: entry.approvedDate,
          entries: [],
          totalAmount: 0,
        });
      }
      const group = groups.get(key)!;
      group.entries.push(entry);
      group.totalAmount += entry.amount;
    }

    const grouped = Array.from(groups.values()).sort((a, b) => {
      const dateCmp = b.approvedDate.localeCompare(a.approvedDate);
      if (dateCmp !== 0) return dateCmp;
      return a.driverName.localeCompare(b.driverName);
    });

    // Stats
    const totalAmount = filtered.reduce((s: number, e: any) => s + e.amount, 0);
    const uniqueDrivers = new Set(filtered.map((e: any) => e.driverId)).size;

    return NextResponse.json({
      groups: grouped,
      stats: { totalAmount, totalEntries: filtered.length, uniqueDrivers },
    });
  } catch (error) {
    console.error("Error fetching repayment history:", error);
    return NextResponse.json(
      { error: "Failed to fetch repayment history" },
      { status: 500 },
    );
  }
}

function getServiceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    fuel: "Fuel",
    airtime: "Airtime",
    cash: "Cash Loan",
    carwash: "Car Wash",
  };
  return labels[type] || type || "Service";
}
