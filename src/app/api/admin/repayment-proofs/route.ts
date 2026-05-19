// src/app/api/admin/repayment-proofs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import {
  sendDriverRepaymentApprovalEmail,
  sendDriverRepaymentRejectionEmail,
} from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const repaymentProofsCollection = db.collection("repaymentProofs");
    const serviceRequestsCollection = db.collection("serviceRequests");
    const usersCollection = db.collection("user");

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("requestId");

    const query: any = {};
    if (requestId) {
      query.$or = [
        { requestId: requestId },
        { requestIds: requestId },
      ];
    }

    const proofs = await repaymentProofsCollection
      .find(query)
      .sort({ submittedAt: -1 })
      .toArray();

    // Enrich proofs with driver and request details
    const enrichedProofs = await Promise.all(
      proofs.map(async (proof: any) => {
        const requestIds = proof.requestIds && proof.requestIds.length > 0
          ? proof.requestIds
          : [proof.requestId];

        const serviceRequests = await serviceRequestsCollection
          .find({
            _id: { $in: requestIds.map((id: string) => new ObjectId(id)) },
          })
          .toArray();

        const firstRequest = serviceRequests[0];

        let driver = null;
        if (firstRequest?.userId) {
          try {
            driver = await usersCollection.findOne({
              _id: new ObjectId(firstRequest.userId),
            });
          } catch {
            driver = await usersCollection.findOne({
              _id: firstRequest.userId,
            });
          }
        }

        const totalRequestedAmount = serviceRequests.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
        const totalRepayableAmount = serviceRequests.reduce((sum: number, r: any) => sum + (r.totalRepayable || r.amount || 0), 0);

        return {
          id: proof._id.toString(),
          requestId: proof.requestId,
          requestIds: proof.requestIds || undefined,
          approvedRequestIds: proof.approvedRequestIds || undefined,
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
          driverName: firstRequest?.driverName || driver?.name || "Unknown",
          driverEmail:
            firstRequest?.driverEmail || driver?.email || "Unknown",
          driverPhone:
            firstRequest?.driverPhone || driver?.phone || "Unknown",
          carNumber: firstRequest?.carNumber || "Not provided",
          serviceType: proof.requestIds?.length > 1 ? "bulk" : (firstRequest?.type || "Unknown"),
          serviceTypeLabel: proof.requestIds?.length > 1
            ? `Bulk Repayment (${proof.requestIds.length} requests)`
            : getServiceTypeLabel(firstRequest?.type || "Unknown"),
          requestedAmount: totalRequestedAmount,
          totalRepayable: totalRepayableAmount,
          linkedRequests: serviceRequests.map((r: any) => ({
            id: r._id.toString(),
            type: r.type,
            amount: r.amount,
            totalRepayable: r.totalRepayable || r.amount,
            remainingBalance: r.remainingBalance || r.totalRepayable || r.amount,
            carNumber: r.carNumber,
          })),
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

// Helper function to get service type label
function getServiceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    fuel: "Fuel Request",
    airtime: "Airtime Request",
    cash: "Cash Loan",
    carwash: "Car Wash",
    Fuel: "Fuel Request",
    Airtime: "Airtime Request",
    Cash: "Cash Loan",
    Carwash: "Car Wash",
  };
  return labels[type] || type || "Service Request";
}

export async function PUT(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { proofId, status, reason, requestId } = body;

    if (!proofId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const repaymentProofsCollection = db.collection("repaymentProofs");
    const serviceRequestsCollection = db.collection("serviceRequests");
    const usersCollection = db.collection("user");

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

    // Determine which request IDs to process (bulk or single)
    const isBulkProof = proof.requestIds && proof.requestIds.length > 0;

    // If requestId is provided, process only that request (individual approval/rejection)
    // Otherwise, process all linked requests
    const targetIds = requestId && isBulkProof
      ? [requestId]
      : (isBulkProof ? [...proof.requestIds] : [proof.requestId]);

    // Get service requests for the target IDs
    const serviceRequests = await serviceRequestsCollection
      .find({
        _id: { $in: targetIds.map((id: string) => new ObjectId(id)) },
      })
      .toArray();

    const firstRequest = serviceRequests[0];

    let driver = null;
    if (firstRequest?.userId) {
      try {
        driver = await usersCollection.findOne({
          _id: new ObjectId(firstRequest.userId),
        });
      } catch {
        driver = await usersCollection.findOne({
          _id: firstRequest.userId,
        });
      }
    }

    // Update the proof status
    const proofUpdate: Record<string, any> = {
      status: status,
      updatedAt: new Date(),
    };

    if (status === "approved") {
      proofUpdate.approvedAt = new Date();
      // For individual approval on a bulk proof, track which requests are approved
      if (requestId && isBulkProof) {
        const approvedRequestIds = proof.approvedRequestIds || [];
        if (!approvedRequestIds.includes(requestId)) {
          approvedRequestIds.push(requestId);
        }
        proofUpdate.approvedRequestIds = approvedRequestIds;

        // If all linked requests are now approved, mark proof as approved
        const allApproved = proof.requestIds.every(
          (id: string) => approvedRequestIds.includes(id),
        );
        if (allApproved) {
          proofUpdate.status = "approved";
          proofUpdate.approvedAt = new Date();
        } else {
          // Keep as pending until all are approved
          proofUpdate.status = "pending";
        }
      }
    }

    if (status === "rejected") {
      proofUpdate.rejectionReason = reason || null;
    }

    await repaymentProofsCollection.updateOne(
      { _id: new ObjectId(proofId) },
      { $set: proofUpdate },
    );

    // Clear pending flags on target requests
    for (const id of targetIds) {
      await serviceRequestsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $unset: {
            hasPendingRepayment: "",
            pendingRepaymentAmount: "",
            pendingRepaymentId: "",
          },
        },
      );
    }

    // Send notifications
    if (status === "approved" && driver?.email) {
      await sendDriverRepaymentApprovalEmail({
        driverEmail: driver.email,
        driverName: driver.name || firstRequest?.driverName || "Driver",
        carRegistration: firstRequest?.carNumber || "Unknown",
        serviceTypeLabel:
          targetIds.length > 1
            ? `Bulk Repayment (${targetIds.length} requests)`
            : getServiceTypeLabel(firstRequest?.type || "service"),
        amount: proof.amount,
        remainingBalance: 0,
        isFullyPaid: false,
      }).catch((err) => console.error("Failed to send approval email:", err));
    }

    if (status === "rejected" && driver?.email) {
      await sendDriverRepaymentRejectionEmail({
        driverEmail: driver.email,
        driverName: driver.name || firstRequest?.driverName || "Driver",
        carRegistration: firstRequest?.carNumber || "Unknown",
        serviceTypeLabel:
          targetIds.length > 1
            ? `Bulk Repayment (${targetIds.length} requests)`
            : getServiceTypeLabel(firstRequest?.type || "service"),
        amount: proof.amount,
        reason:
          reason ||
          "No specific reason provided. Please contact support for more information.",
      }).catch((err) => console.error("Failed to send rejection email:", err));
    }

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
