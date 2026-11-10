// src/app/api/driver/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { sendVerificationNotificationEmail } from "@/lib/email";
import { sendPushNotification, sendAdminPushNotification } from "@/lib/notifications";
import { ObjectId } from "mongodb";

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
      ownershipStatus,
      referenceName,
      referencePhone,
      carOwnerName,
      carOwnerPhone,
      carOwnerAddress,
      agreeAccuracy,
      agreeRefTenure,
      agreeOwnerContact,
      agreeRepayment,
      agreeEscalation,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const driverProfiles = db.collection("driverProfiles");
    const usersCollection = db.collection("user");

    // Get user details for email - FIXED: Convert string ID to ObjectId if needed
    let user;
    try {
      // Try to find by ObjectId if it's a valid ObjectId string
      if (ObjectId.isValid(userId)) {
        user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      } else {
        // Otherwise try as string ID
        user = await usersCollection.findOne({ _id: userId });
      }
    } catch (error) {
      console.error("Error finding user:", error);
    }

    // If user not found, try to find by customId or email
    if (!user) {
      user = await usersCollection.findOne({ customId: userId });
      if (!user) {
        user = await usersCollection.findOne({ email: userId });
      }
    }

    // Check if verification is already under review or approved
    if (user?.verificationStatus === "pending") {
      return NextResponse.json(
        { error: "Verification is already under review. Please wait for admin approval." },
        { status: 400 },
      );
    }

    if (user?.verificationStatus === "approved" || user?.isVerified === true) {
      return NextResponse.json(
        { error: "Your account is already verified." },
        { status: 400 },
      );
    }

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
          ownershipStatus: ownershipStatus || "own",
          referenceName,
          referencePhone,
          carOwnerName,
          carOwnerPhone,
          carOwnerAddress,
          agreeAccuracy: agreeAccuracy === true,
          agreeRefTenure: agreeRefTenure === true,
          agreeOwnerContact: agreeOwnerContact === true,
          agreeRepayment: agreeRepayment === true,
          agreeEscalation: agreeEscalation === true,
          verificationStatus: "pending",
          updatedAt: new Date(),
          // Store email and phone in the driver profile as well for redundancy
          driverEmail: user?.email || "",
          driverPhone: user?.phone || "",
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
      { _id: user?._id || userId },
      {
        $set: {
          verificationStatus: "pending",
          isVerified: false,
          verificationSubmittedAt: new Date(),
          updatedAt: new Date(),
          // Make sure email and phone are set on the user if missing
          ...(user?.email ? {} : { email: body.email || "" }),
          ...(user?.phone ? {} : { phone: body.phone || "" }),
        },
      },
    );

    // Trigger push notification if token exists
    const pushTokens = user?.pushTokens?.length ? user.pushTokens : user?.expoPushToken ? [user.expoPushToken] : [];

    if (pushTokens.length) {

      await sendPushNotification(

        pushTokens,
        "Verification Submitted",
        "Your verification documents have been submitted and are under review.",
        { screen: "Verification" }
      );
    }

    // Prepare email data with better fallbacks
    const driverEmail = user?.email || body.email || "";
    const driverName = fullName || user?.name || body.fullName || "Unknown";

    // Notify admins of new verification request
    sendAdminPushNotification(
      "New Verification Request",
      `${driverName || "A driver"} submitted verification documents for review.`,
      { screen: "AdminVerification" }
    );

    // Send email notification to admin (run in background, don't await)
    (async () => {
      try {
        if (!driverEmail) return;

        await sendVerificationNotificationEmail({
          driverName: driverName,
          driverEmail: driverEmail,
          driverPhone: user?.phone || body.phone || "",
          carRegistration: carRegistrationNumber || "Not provided",
          carModel: carModel || "Not provided",
          verificationId: profileId || "unknown",
          submissionDate: new Date().toISOString(),
        });
      } catch (emailError) {
        console.error("❌ Failed to send verification notification email:", emailError);
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
