// src/app/api/admin/repayment-proofs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const repaymentProofsCollection = db.collection("repaymentProofs");
    const serviceRequestsCollection = db.collection("serviceRequests");
    const usersCollection = db.collection("user");

    const proofs = await repaymentProofsCollection
      .find({})
      .sort({ submittedAt: -1 })
      .toArray();

    // Enrich proofs with driver and request details
    const enrichedProofs = await Promise.all(
      proofs.map(async (proof: any) => {
        const serviceRequest = await serviceRequestsCollection.findOne({
          _id: new ObjectId(proof.requestId),
        });

        let driver = null;
        if (serviceRequest?.userId) {
          try {
            driver = await usersCollection.findOne({
              _id: new ObjectId(serviceRequest.userId),
            });
          } catch {
            driver = await usersCollection.findOne({
              _id: serviceRequest.userId,
            });
          }
        }

        return {
          id: proof._id.toString(),
          requestId: proof.requestId,
          userId: proof.userId,
          amount: proof.amount,
          remainingBalance: proof.remainingBalance,
          isFullyPaid: proof.isFullyPaid,
          proofUrl: proof.proofUrl,
          proofPublicId: proof.proofPublicId,
          status: proof.status,
          submittedAt: proof.submittedAt,
          approvedAt: proof.approvedAt,
          rejectionReason: proof.rejectionReason,
          driverName: serviceRequest?.driverName || driver?.name || "Unknown",
          driverEmail:
            serviceRequest?.driverEmail || driver?.email || "Unknown",
          driverPhone:
            serviceRequest?.driverPhone || driver?.phone || "Unknown",
          carNumber: serviceRequest?.carNumber || "Not provided",
          serviceType: serviceRequest?.type || "Unknown",
          requestedAmount: serviceRequest?.amount || 0,
          totalRepayable: serviceRequest?.totalRepayable || 0,
        };
      }),
    );

    return NextResponse.json(enrichedProofs);
  } catch (error) {
    console.error("Error fetching repayment proofs:", error);
    return NextResponse.json(
      { error: "Failed to fetch repayment proofs" },
      { status: 500 },
    );
  }
}

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
            $unset: {
              hasPendingRepayment: "",
              pendingRepaymentAmount: "",
              pendingRepaymentStatus: "",
            },
          },
        );
      }
    }

    // Clear pending repayment flag on the service request
    await serviceRequestsCollection.updateOne(
      { _id: new ObjectId(proof.requestId) },
      {
        $unset: {
          hasPendingRepayment: "",
          pendingRepaymentAmount: "",
          pendingRepaymentStatus: "",
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
