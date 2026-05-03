// src/app/api/driver/repayment-proof/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import { sendAdminRepaymentProofEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  console.log("you reached this point");

  try {
    // Verify user is authenticated
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      requestId,
      amount,
      remainingBalance,
      isFullyPaid,
      proofUrl,
      proofPublicId,
    } = body;

    if (!requestId || !amount || !proofUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const repaymentsCollection = db.collection("repaymentProofs");
    const serviceRequestsCollection = db.collection("serviceRequests");
    const usersCollection = db.collection("user");

    // Get service request details for email
    const serviceRequest = await serviceRequestsCollection.findOne({
      id: requestId,
      userId: session.user.id,
    });

    // Get driver details for email
    const driver = await usersCollection.findOne({
      _id: session.user.id,
    });

    // Create repayment proof record
    const repaymentProof = {
      requestId,
      userId: session.user.id,
      amount,
      remainingBalance,
      isFullyPaid,
      proofUrl,
      proofPublicId,
      status: "pending", // pending, approved, rejected
      submittedAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await repaymentsCollection.insertOne(repaymentProof);

    // Update the service request with pending repayment flag
    await serviceRequestsCollection.updateOne(
      { id: requestId, userId: session.user.id },
      {
        $set: {
          hasPendingRepayment: true,
          pendingRepaymentAmount: amount,
          pendingRepaymentId: result.insertedId.toString(),
          updatedAt: new Date(),
        },
      },
    );

    // Send email notification to admin
    if (driver && serviceRequest) {
      const serviceTypeLabel = getServiceTypeLabel(serviceRequest.type);

      await sendAdminRepaymentProofEmail({
        driverName: driver.name || serviceRequest.driverName || "Unknown",
        driverEmail: driver.email || serviceRequest.driverEmail || "Unknown",
        driverPhone: driver.phone || serviceRequest.driverPhone || "Unknown",
        carRegistration:
          serviceRequest.carNumber ||
          serviceRequest.carRegistration ||
          "Unknown",
        serviceType: serviceRequest.type || "Unknown",
        serviceTypeLabel: serviceTypeLabel,
        amount: amount,
        remainingBalance: remainingBalance,
        proofUrl: proofUrl,
        submittedAt: new Date().toISOString(),
        repaymentId: requestId,
      }).catch((err) => {
        console.error("Failed to send admin notification email:", err);
        // Don't fail the request if email fails
      });
    } else {
      console.log("Missing driver or service request data for email", {
        hasDriver: !!driver,
        hasServiceRequest: !!serviceRequest,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Repayment proof submitted successfully. Awaiting admin verification.",
      repaymentId: result.insertedId,
    });
  } catch (error) {
    console.error("Repayment proof error:", error);
    return NextResponse.json(
      { error: "Failed to submit repayment proof" },
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
