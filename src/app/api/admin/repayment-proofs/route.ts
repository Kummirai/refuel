// src/app/api/admin/repayment-proofs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { toMoney } from "@/lib/money";
import {
  sendDriverRepaymentApprovalEmail,
  sendDriverRepaymentRejectionEmail,
  sendRepaymentCompletedEmail,
} from "@/lib/email";

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
          serviceTypeLabel: getServiceTypeLabel(
            serviceRequest?.type || "Unknown",
          ),
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
    const { proofId, status, reason } = body;

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

    // Get service request and driver details for emails
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

    // If approved, send email notification (financial updates handled by pay API)
    if (status === "approved") {
      if (driver?.email) {
        const totalRepayable =
          serviceRequest?.totalRepayable || toMoney(serviceRequest?.amount * 1.13);
        const currentRepaid = serviceRequest?.repaidAmount || 0;
        const newRepaid = toMoney(currentRepaid + proof.amount);
        const isFullyPaid = newRepaid >= totalRepayable;

        await sendDriverRepaymentApprovalEmail({
          driverEmail: driver.email,
          driverName: driver.name || serviceRequest?.driverName || "Driver",
          carRegistration: serviceRequest?.carNumber || "Unknown",
          serviceTypeLabel: getServiceTypeLabel(
            serviceRequest?.type || "service",
          ),
          amount: proof.amount,
          remainingBalance: toMoney(Math.max(0, totalRepayable - newRepaid)),
          isFullyPaid: isFullyPaid,
        }).catch((err) => console.error("Failed to send approval email:", err));

        if (isFullyPaid) {
          await sendRepaymentCompletedEmail({
            driverEmail: driver.email,
            driverName: driver.name || serviceRequest?.driverName || "Driver",
            carRegistration: serviceRequest?.carNumber || "Unknown",
            serviceTypeLabel: getServiceTypeLabel(
              serviceRequest?.type || "service",
            ),
            totalPaid: newRepaid,
            completedDate: new Date().toISOString(),
          }).catch((err) =>
            console.error("Failed to send completion email:", err),
          );
        }
      }
    }

    // If rejected, send rejection email to driver
    if (status === "rejected" && driver?.email) {
      await sendDriverRepaymentRejectionEmail({
        driverEmail: driver.email,
        driverName: driver.name || serviceRequest?.driverName || "Driver",
        carRegistration: serviceRequest?.carNumber || "Unknown",
        serviceTypeLabel: getServiceTypeLabel(
          serviceRequest?.type || "service",
        ),
        amount: proof.amount,
        reason:
          reason ||
          "No specific reason provided. Please contact support for more information.",
      }).catch((err) => console.error("Failed to send rejection email:", err));
    }

    // Clear pending repayment flag on the service request (if not already cleared)
    await serviceRequestsCollection.updateOne(
      { _id: new ObjectId(proof.requestId) },
      {
        $unset: {
          hasPendingRepayment: "",
          pendingRepaymentAmount: "",
          pendingRepaymentId: "",
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
