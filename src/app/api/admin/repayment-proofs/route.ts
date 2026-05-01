// src/app/api/admin/repayment-proofs/route.ts (New admin endpoint)
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function PUT(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { proofId, status, reason } = body;

    if (!proofId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const repaymentProofsCollection = db.collection("repaymentProofs");
    const serviceRequestsCollection = db.collection("serviceRequests");

    // Find the repayment proof
    const proof = await repaymentProofsCollection.findOne({
      _id: new ObjectId(proofId),
    });

    if (!proof) {
      return NextResponse.json(
        { error: "Repayment proof not found" },
        { status: 404 },
      );
    }

    // Update the proof status
    await repaymentProofsCollection.updateOne(
      { _id: new ObjectId(proofId) },
      {
        $set: {
          status: status,
          approvedAt: status === "approved" ? new Date() : null,
          rejectionReason: status === "rejected" ? reason : null,
          updatedAt: new Date(),
        },
      },
    );

    // If approved, update the service request's repaid amount
    if (status === "approved") {
      const serviceRequest = await serviceRequestsCollection.findOne({
        _id: new ObjectId(proof.requestId),
      });

      if (serviceRequest) {
        const currentRepaid = serviceRequest.repaidAmount || 0;
        const newRepaid = currentRepaid + proof.amount;
        const totalRepayable =
          serviceRequest.totalRepayable || serviceRequest.amount * 1.13;
        const isFullyPaid = newRepaid >= totalRepayable;

        await serviceRequestsCollection.updateOne(
          { _id: new ObjectId(proof.requestId) },
          {
            $set: {
              repaidAmount: newRepaid,
              remainingBalance: totalRepayable - newRepaid,
              isPaid: isFullyPaid,
              lastPaymentDate: new Date(),
              ...(isFullyPaid && { paidDate: new Date() }),
            },
            $setOnInsert: {
              hasPendingRepayment: false,
              pendingRepaymentAmount: 0,
              pendingRepaymentStatus: null,
            },
          },
        );
      }
    }

    // Clear pending repayment flag on the service request
    await serviceRequestsCollection.updateOne(
      { _id: new ObjectId(proof.requestId) },
      {
        $set: {
          hasPendingRepayment: false,
          pendingRepaymentAmount: 0,
          pendingRepaymentStatus: null,
        },
      },
    );

    return NextResponse.json({
      success: true,
      message: `Repayment ${status === "approved" ? "approved" : "rejected"} successfully`,
    });
  } catch (error) {
    console.error("Error processing repayment proof:", error);
    return NextResponse.json(
      { error: "Failed to process repayment proof" },
      { status: 500 },
    );
  }
}
