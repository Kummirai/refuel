// src/app/api/driver/repayment-proof/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { sendAdminRepaymentProofEmail } from "@/lib/email";
import { sendPushNotification, sendAdminPushNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      requestId,
      requestIds,
      amount,
      remainingBalance,
      isFullyPaid,
      proofUrl,
      proofPublicId,
    } = body;

    const ids = requestIds && requestIds.length > 0 ? requestIds : requestId ? [requestId] : [];

    if (ids.length === 0 || !amount || !proofUrl) {
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

    // Find all service requests
    const serviceRequests = await serviceRequestsCollection
      .find({
        _id: { $in: ids.map((id: string) => {
          try { return new ObjectId(id); } catch { return id; }
        })},
      })
      .toArray();

    const idToRequest = new Map(serviceRequests.map((r: any) => [r._id.toString(), r]));
    const notFound = ids.filter((id: string) => !idToRequest.has(id));
    if (notFound.length > 0) {
      return NextResponse.json(
        { error: `Requests not found: ${notFound.join(", ")}` },
        { status: 404 },
      );
    }

    // Get driver details
    let user = null;
    try {
      if (ObjectId.isValid(session.user.id)) {
        user = await usersCollection.findOne({ _id: new ObjectId(session.user.id) });
      } else {
        user = await usersCollection.findOne({ _id: session.user.id });
      }
    } catch (err) {
      console.error("Error finding user:", err);
    }

    let driverProfile = null;
    if (user) {
      driverProfile = await driverProfilesCollection.findOne({
        userId: user._id.toString(),
      });
    }

    // Create repayment proof record
    const repaymentProof: Record<string, any> = {
      requestId: ids[0],
      requestIds: ids.length > 1 ? ids : undefined,
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
    const proofId = result.insertedId.toString();

    // Trigger push notification if token exists
    if (user?.expoPushToken) {
      await sendPushNotification(
        user.expoPushToken,
        "Repayment Submitted",
        `Your repayment of R${amount} has been submitted and is pending verification.`,
        { screen: "Repayments" }
      );
    }

    // Update all service requests with pending repayment flag
    for (const id of ids) {
      try {
        await serviceRequestsCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              hasPendingRepayment: true,
              pendingRepaymentAmount: amount,
              pendingRepaymentId: proofId,
              updatedAt: new Date(),
            },
          },
        );
      } catch (err) {
        console.error(`Error updating service request ${id}:`, err);
      }
    }

    // Send push notification to admins
    sendAdminPushNotification(
      "Repayment Proof Submitted",
      `${user?.name || "A driver"} submitted a repayment proof of R${amount}.`,
      { screen: "AdminRepayments" }
    );

    // Send email notification to admin
    const firstRequest = serviceRequests[0];
    if (user && firstRequest) {
      const driverName =
        driverProfile?.fullName ||
        user.name ||
        firstRequest.driverName ||
        "Unknown";
      const driverEmail = user.email || firstRequest.driverEmail || "Unknown";
      const driverPhone = user.phone || firstRequest.driverPhone || "Unknown";
      const carRegistration =
        firstRequest.carNumber ||
        driverProfile?.carRegistrationNumber ||
        "Unknown";
      const types = serviceRequests.map((r: any) => r.type).join(", ");

      await sendAdminRepaymentProofEmail({
        driverName,
        driverEmail,
        driverPhone,
        carRegistration,
        serviceType: types || "Unknown",
        serviceTypeLabel: ids.length > 1 ? `Bulk Repayment (${ids.length} requests)` : getServiceTypeLabel(firstRequest.type),
        amount,
        remainingBalance,
        proofUrl,
        submittedAt: new Date().toISOString(),
        repaymentId: proofId,
      }).catch((err) => {
        console.error("Failed to send admin notification email:", err);
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
