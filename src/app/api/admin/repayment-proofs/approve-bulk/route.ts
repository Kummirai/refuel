import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { toMoney } from "@/lib/money";

export async function POST(request: NextRequest) {
  try {
    const { proofId, amount } = await request.json();

    if (!proofId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "proofId and a positive amount are required" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const repaymentProofsCollection = db.collection("repaymentProofs");
    const serviceRequestsCollection = db.collection("serviceRequests");
    const loanPaymentsCollection = db.collection("loanPayments");
    const repaymentRequestsCollection = db.collection("repaymentRequests");

    // 1. Atomically claim this proof to prevent double-approval
    const proof = await repaymentProofsCollection.findOneAndUpdate(
      {
        _id: new ObjectId(proofId),
        status: { $ne: "approved" },
      },
      {
        $set: { status: "approved", approvedAt: new Date(), updatedAt: new Date() },
      },
      { returnDocument: "after" },
    );

    if (!proof) {
      return NextResponse.json(
        { error: "Repayment proof not found or already approved" },
        { status: 400 },
      );
    }

    // 2. Get all linked request IDs
    const allRequestIds: string[] =
      proof.requestIds && proof.requestIds.length > 0
        ? [...proof.requestIds]
        : [proof.requestId];

    // 3. Fetch all linked service requests
    const serviceRequests = await serviceRequestsCollection
      .find({
        _id: { $in: allRequestIds.map((id: string) => new ObjectId(id)) },
      })
      .toArray();

    // Sort oldest first so we fill the oldest debts first
    serviceRequests.sort((a: any, b: any) => {
      const dateA = a.createdAt || a.requestDate || new Date(0);
      const dateB = b.createdAt || b.requestDate || new Date(0);
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    // 4. Spread the payment across requests
    let remaining = toMoney(amount);
    const results: {
      requestId: string;
      allocated: number;
      previousRepaid: number;
      newRepaid: number;
      previousRemaining: number;
      newRemaining: number;
      isFullyPaid: boolean;
    }[] = [];

    for (const sr of serviceRequests) {
      if (remaining <= 0) break;

      const totalRepayable = toMoney(
        sr.totalRepayable || toMoney(sr.amount * 1.13),
      );
      const currentRepaid = sr.repaidAmount || 0;
      const currentRemaining = toMoney(
        Math.max(0, totalRepayable - currentRepaid),
      );

      if (currentRemaining <= 0) continue; // already fully paid

      const cappedAmount = toMoney(Math.min(remaining, currentRemaining));
      const newRepaid = toMoney(currentRepaid + cappedAmount);
      const isFullyPaid = newRepaid >= totalRepayable;
      const newRemaining = toMoney(Math.max(0, totalRepayable - newRepaid));

      // Generate payment ID
      const paymentId = new ObjectId();
      const paymentDate = new Date();

      // Record in loanPayments
      await loanPaymentsCollection.insertOne({
        _id: paymentId,
        loanId: sr._id.toString(),
        amount: cappedAmount,
        paymentDate,
        method: "cash",
        reference: `Bulk approval (proof ${proofId.slice(-6)})`,
        remainingBalance: newRemaining,
        uploadedByAdmin: true,
        createdAt: new Date(),
        isBulkAllocation: true,
        bulkProofId: proofId,
      });

      // Update the service request atomically — only update if repaidAmount hasn't changed since read
      const updateFields: Record<string, any> = {
        repaidAmount: newRepaid,
        remainingBalance: newRemaining,
        lastPaymentDate: paymentDate,
      };

      if (isFullyPaid) {
        updateFields.isPaid = true;
        updateFields.paidDate = new Date();
      }

      const updateResult = await serviceRequestsCollection.findOneAndUpdate(
        {
          _id: sr._id,
          repaidAmount: currentRepaid, // optimistic lock: only update if unchanged
        },
        {
          $set: updateFields,
          $push: {
            payments: {
              id: paymentId.toString(),
              amount: cappedAmount,
              date: paymentDate,
              method: "cash",
              reference: `Bulk approval (proof ${proofId.slice(-6)})`,
            },
          },
          $unset: {
            hasPendingRepayment: "",
            pendingRepaymentAmount: "",
            pendingRepaymentId: "",
          },
        },
        { returnDocument: "after" },
      );

      // If the update didn't match (concurrent modification), skip this request
      if (!updateResult) {
        remaining = toMoney(remaining + cappedAmount);
        continue;
      }

      // If fully paid, update matching repaymentRequests
      if (isFullyPaid) {
        await repaymentRequestsCollection.findOneAndUpdate(
          {
            requestId: sr._id.toString(),
            status: "pending",
          },
          {
            $set: {
              status: "approved",
              approvedAt: new Date(),
              approvedBy: "admin",
              updatedAt: new Date(),
            },
          },
        );
      }

      remaining = toMoney(remaining - cappedAmount);

      results.push({
        requestId: sr._id.toString(),
        allocated: cappedAmount,
        previousRepaid: currentRepaid,
        newRepaid,
        previousRemaining: currentRemaining,
        newRemaining,
        isFullyPaid,
      });
    }

    // 5. Clear hasPendingRepayment on all remaining linked requests that weren't updated in the loop
    const allocatedIds = new Set(results.map((r) => r.requestId));
    const unallocatedIds = allRequestIds.filter((id) => !allocatedIds.has(id));
    if (unallocatedIds.length > 0) {
      await serviceRequestsCollection.updateMany(
        { _id: { $in: unallocatedIds.map((id: string) => new ObjectId(id)) } },
        {
          $unset: {
            hasPendingRepayment: "",
            pendingRepaymentAmount: "",
            pendingRepaymentId: "",
          },
        },
      );
    }

    // 6. Set approvedRequestIds on the proof (status was already set atomically in step 1)
    await repaymentProofsCollection.updateOne(
      { _id: new ObjectId(proofId) },
      { $set: { approvedRequestIds: allRequestIds } },
    );

    const totalAllocated = toMoney(amount - remaining);
    const fullyPaidCount = results.filter((r) => r.isFullyPaid).length;
    const pendingCount = results.filter((r) => !r.isFullyPaid).length;

    return NextResponse.json({
      success: true,
      message:
        remaining > 0
          ? `Allocated ${totalAllocated}. ${remaining} remaining (exceeded all outstanding balances).`
          : `Allocated ${totalAllocated} across ${results.length} request(s). ${fullyPaidCount} fully paid, ${pendingCount} still have an outstanding balance.`,
      totalAllocated,
      unallocated: remaining,
      results,
      fullyPaidCount,
      pendingCount,
    });
  } catch (error) {
    console.error("Error in bulk approval:", error);
    return NextResponse.json(
      { error: "Failed to process bulk approval" },
      { status: 500 },
    );
  }
}
