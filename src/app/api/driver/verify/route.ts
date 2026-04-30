// src/app/api/driver/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { sendVerificationNotificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      fullName,
      dateOfBirth,
      address,
      city,
      pincode,
      carRegistrationNumber,
      carModel,
      carYear,
      carColor,
      drivingLicenseUrl,
      carRegistrationUrl,
      profilePhotoUrl,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const driverProfiles = db.collection("driverProfiles");
    const usersCollection = db.collection("users");

    // Get user details for email
    const user = await usersCollection.findOne({ _id: userId });

    // Update or create driver profile
    const result = await driverProfiles.updateOne(
      { userId },
      {
        $set: {
          fullName,
          dateOfBirth,
          address,
          city,
          pincode,
          carRegistrationNumber,
          carModel,
          carYear,
          carYearInt: carYear ? parseInt(carYear) : null,
          carColor,
          drivingLicenseUrl,
          carRegistrationUrl,
          profilePhotoUrl,
          verificationStatus: "pending",
          updatedAt: new Date(),
        },
        $setOnInsert: {
          userId,
          createdAt: new Date(),
          totalRequests: 0,
          totalSpent: 0,
          rating: 0,
        },
      },
      { upsert: true },
    );

    // Get the profile ID for the verification
    let profileId;
    if (result.upsertedId) {
      profileId = result.upsertedId.toString();
    } else {
      const profile = await driverProfiles.findOne({ userId });
      profileId = profile?._id?.toString();
    }

    // Update user's verification status
    await usersCollection.updateOne(
      { _id: userId },
      {
        $set: {
          verificationStatus: "pending",
          isVerified: false,
          verificationSubmittedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    // Send email notification to admin (run in background, don't await)
    (async () => {
      try {
        await sendVerificationNotificationEmail({
          driverName: fullName || user?.name || "Unknown",
          driverEmail: user?.email || "",
          driverPhone: user?.phone || "",
          carRegistration: carRegistrationNumber || "Not provided",
          carModel: carModel || "Not provided",
          verificationId: profileId || "unknown",
          submissionDate: new Date().toISOString(),
        });
        console.log(
          "✅ Verification notification email sent for user:",
          userId,
        );
      } catch (emailError) {
        console.error(
          "❌ Failed to send verification notification email:",
          emailError,
        );
        // Don't fail the request if email fails
      }
    })();

    return NextResponse.json({
      success: true,
      message: "Verification submitted successfully",
      verificationId: profileId,
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Failed to submit verification" },
      { status: 500 },
    );
  }
}
