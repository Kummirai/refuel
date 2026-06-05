// src/app/api/admin/requests/reject/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { sendDriverRejectionEmail } from "@/lib/email";
import { sendPushNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const { requestId, reason } = await request.json();

    console.log("Rejecting request:", requestId, "Reason:", reason);

    if (!requestId) {
      return NextResponse.json(
        { error: "Missing request ID" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");
    const driverProfilesCollection = db.collection("driverProfiles");

    // Convert string ID to ObjectId
    let objectId;
    try {
      objectId = new ObjectId(requestId);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request ID format" },
        { status: 400 },
      );
    }

    // Find the request by ID using ObjectId
    const requestDoc = await serviceRequestsCollection.findOne({
      _id: objectId,
    });

    if (!requestDoc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Get driver profile to fetch car registration
    let carRegistration = "Not provided";
    try {
      // Try to find driver profile by userId or driverEmail
      const driverProfile = await driverProfilesCollection.findOne({
        $or: [
          { userId: requestDoc.userId },
          { userId: requestDoc.driverId },
          { email: requestDoc.driverEmail },
          { driverEmail: requestDoc.driverEmail },
        ],
      });

      if (driverProfile) {
        carRegistration =
          driverProfile.carRegistrationNumber ||
          driverProfile.carRegistration ||
          "Not provided";
        console.log(
          "Found car registration for rejection email:",
          carRegistration,
        );
      } else {
        console.log(
          "No driver profile found for rejection request:",
          requestId,
        );
      }
    } catch (profileError) {
      console.error(
        "Error fetching driver profile for rejection:",
        profileError,
      );
    }

    // Update request status
    await serviceRequestsCollection.updateOne(
      { _id: objectId },
      {
        $set: {
          status: "rejected",
          rejectionReason: reason || "No reason provided",
          rejectedDate: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    // Trigger push notification if token exists
    const usersCollection = db.collection("user");
    let user;
    try {
      user = await usersCollection.findOne({ _id: new ObjectId(requestDoc.userId) });
    } catch {
      user = null;
    }
    if (!user?.expoPushToken && requestDoc.driverEmail) {
      user = await usersCollection.findOne({ email: requestDoc.driverEmail });
    }
    const pushTokens = user?.pushTokens?.length ? user.pushTokens : user?.expoPushToken ? [user.expoPushToken] : [];

    if (pushTokens.length) {

      await sendPushNotification(

        pushTokens,
        "Request Rejected",
        `Your ${requestDoc.type || requestDoc.serviceType || "service"} request has been rejected. Reason: ${reason || "No reason provided"}`,
        { screen: "History" }
      );
    }

    // Send email notification to driver (run in background)
    (async () => {
      try {
        await sendDriverRejectionEmail({
          driverEmail: requestDoc.driverEmail,
          driverName: requestDoc.driverName,
          carRegistration: carRegistration, // Add car registration here
          requestId: requestId,
          serviceType: requestDoc.type || requestDoc.serviceType,
          amount: requestDoc.amount,
          reason: reason || "No reason provided",
        });
        console.log("Driver rejection email sent for request:", requestId);
      } catch (emailError) {
        console.error("Failed to send driver rejection email:", emailError);
        // Don't fail the request if email fails
      }
    })();

    return NextResponse.json({
      success: true,
      message: "Request rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting request:", error);
    return NextResponse.json(
      { error: "Failed to reject request" },
      { status: 500 },
    );
  }
}
