// src/app/api/admin/requests/approve/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { sendDriverApprovalEmail } from "@/lib/email";
import { sendPushNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const { requestId, otp } = await request.json();

    console.log("Approving request:", requestId);

    if (!requestId || !otp) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");
    const driverProfilesCollection = db.collection("driverProfiles");
    const usersCollection = db.collection("user");

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

    // Get driver profile to fetch car registration and banking details
    let carRegistration = "Not provided";
    let driverProfile: Record<string, unknown> | null = null;
    try {
      // Try to find driver profile by userId or driverEmail
      driverProfile = await driverProfilesCollection.findOne({
        $or: [
          { userId: requestDoc.userId },
          { userId: requestDoc.driverId },
          { email: requestDoc.driverEmail },
          { driverEmail: requestDoc.driverEmail },
        ],
      });

      if (driverProfile) {
        carRegistration =
          (driverProfile.carRegistrationNumber as string) ||
          (driverProfile.carRegistration as string) ||
          "Not provided";
        console.log("Found car registration:", carRegistration);
      } else {
        console.log("No driver profile found for request:", requestId);
      }
    } catch (profileError) {
      console.error("Error fetching driver profile:", profileError);
    }

    // Update request status
    await serviceRequestsCollection.updateOne(
      { _id: objectId },
      {
        $set: {
          status: "approved",
          otp: otp,
          approvedDate: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    // Trigger push notification if token exists
    const user = await usersCollection.findOne({ _id: new ObjectId(requestDoc.userId) });
    const pushTokens = user?.pushTokens?.length ? user.pushTokens : user?.expoPushToken ? [user.expoPushToken] : [];

    if (pushTokens.length) {

      await sendPushNotification(

        pushTokens,
        "Request Approved",
        `Your request has been approved. OTP: ${otp}`,
        { screen: "Requests" }
      );
    }

    // Send email notification to driver (run in background, don't await)
    (async () => {
      try {
        await sendDriverApprovalEmail({
          driverEmail: requestDoc.driverEmail,
          driverName: requestDoc.driverName,
          requestId: requestId,
          serviceType: requestDoc.type || requestDoc.serviceType,
          amount: requestDoc.amount,
          otp: otp,
          carRegistration: carRegistration,
          bankName: driverProfile?.bankName as string | undefined,
          accountHolder: driverProfile?.accountHolder as string | undefined,
          accountNumber: driverProfile?.accountNumber as string | undefined,
          branchCode: driverProfile?.branchCode as string | undefined,
        });
        console.log("Driver approval email sent for request:", requestId);
      } catch (emailError) {
        console.error("Failed to send driver approval email:", emailError);
        // Don't fail the request if email fails
      }
    })();

    return NextResponse.json({
      success: true,
      message: "Request approved successfully",
      otp,
    });
  } catch (error) {
    console.error("Error approving request:", error);
    return NextResponse.json(
      { error: "Failed to approve request" },
      { status: 500 },
    );
  }
}
