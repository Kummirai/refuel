// src/app/api/driver/repayment-proof/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
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

    console.log("Request ID from client:", requestId);
    console.log("Session user ID:", session.user.id);

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
    const driverProfilesCollection = db.collection("driverProfiles");

    // Find the service request by _id (since it's stored as ObjectId)
    let serviceRequest = null;
    try {
      // Try to find by _id as ObjectId
      if (ObjectId.isValid(requestId)) {
        serviceRequest = await serviceRequestsCollection.findOne({
          _id: new ObjectId(requestId),
        });
      }

      // If not found, try as string
      if (!serviceRequest) {
        serviceRequest = await serviceRequestsCollection.findOne({
          _id: requestId,
        });
      }

      // If still not found, try by id field (if exists)
      if (!serviceRequest) {
        serviceRequest = await serviceRequestsCollection.findOne({
          id: requestId,
        });
      }
    } catch (err) {
      console.error("Error finding service request:", err);
    }

    console.log("Service request found:", !!serviceRequest);
    if (serviceRequest) {
      console.log("Service request:", {
        _id: serviceRequest._id,
        type: serviceRequest.type,
        driverName: serviceRequest.driverName,
        carNumber: serviceRequest.carNumber,
        userId: serviceRequest.userId,
      });
    }

    // Get driver details from user collection
    let user = null;
    try {
      // Try to find by _id as ObjectId
      if (ObjectId.isValid(session.user.id)) {
        user = await usersCollection.findOne({
          _id: new ObjectId(session.user.id),
        });
      } else {
        user = await usersCollection.findOne({
          _id: session.user.id,
        });
      }
    } catch (err) {
      console.error("Error finding user:", err);
    }

    console.log("User found:", !!user);
    if (user) {
      console.log("User:", {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
    }

    // Get driver profile for additional info if needed
    let driverProfile = null;
    if (user) {
      driverProfile = await driverProfilesCollection.findOne({
        userId: user._id.toString(),
      });
      console.log("Driver profile found:", !!driverProfile);
    }

    // Create repayment proof record
    const repaymentProof = {
      requestId,
      userId: session.user.id,
      amount,
      remainingBalance,
      isFullyPaid,
      proofUrl,
      proofPublicId,
      status: "pending",
      submittedAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await repaymentsCollection.insertOne(repaymentProof);
    console.log("Repayment proof created with ID:", result.insertedId);

    // Update the service request with pending repayment flag
    let updateQuery = {};
    try {
      if (ObjectId.isValid(requestId)) {
        updateQuery = { _id: new ObjectId(requestId) };
      } else {
        updateQuery = { _id: requestId };
      }

      await serviceRequestsCollection.updateOne(updateQuery, {
        $set: {
          hasPendingRepayment: true,
          pendingRepaymentAmount: amount,
          pendingRepaymentId: result.insertedId.toString(),
          updatedAt: new Date(),
        },
      });
      console.log("Service request updated successfully");
    } catch (err) {
      console.error("Error updating service request:", err);
    }

    // Send email notification to admin
    if (user && serviceRequest) {
      const serviceTypeLabel = getServiceTypeLabel(serviceRequest.type);

      const driverName =
        driverProfile?.fullName ||
        user.name ||
        serviceRequest.driverName ||
        "Unknown";
      const driverEmail = user.email || serviceRequest.driverEmail || "Unknown";
      const driverPhone = user.phone || serviceRequest.driverPhone || "Unknown";
      const carRegistration =
        serviceRequest.carNumber ||
        driverProfile?.carRegistrationNumber ||
        "Unknown";

      console.log("Sending email with:", {
        driverName,
        driverEmail,
        driverPhone,
        carRegistration,
        serviceType: serviceRequest.type,
        amount,
        remainingBalance,
      });

      await sendAdminRepaymentProofEmail({
        driverName: driverName,
        driverEmail: driverEmail,
        driverPhone: driverPhone,
        carRegistration: carRegistration,
        serviceType: serviceRequest.type || "Unknown",
        serviceTypeLabel: serviceTypeLabel,
        amount: amount,
        remainingBalance: remainingBalance,
        proofUrl: proofUrl,
        submittedAt: new Date().toISOString(),
        repaymentId: requestId,
      }).catch((err) => {
        console.error("Failed to send admin notification email:", err);
      });
    } else {
      console.log("Missing data for email:", {
        hasUser: !!user,
        hasServiceRequest: !!serviceRequest,
        userId: session.user.id,
        requestId: requestId,
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
