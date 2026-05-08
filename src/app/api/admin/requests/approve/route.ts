// src/app/api/admin/requests/approve/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { sendDriverApprovalEmail } from "@/lib/email";

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
          carRegistration: carRegistration, // Add car registration here
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
