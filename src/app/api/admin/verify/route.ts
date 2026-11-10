import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { sendDriverVerificationResultEmail } from "@/lib/email";
import { sendPushNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { verification, action, verificationId, reason } = body;

    console.log("Verification request:", {
      verificationId,
      action,
      verification,
    });

    const { db } = await connectToDatabase();
    const driverProfilesCollection = db.collection("driverProfiles");
    const usersCollection = db.collection("user");

    let profile;
    let userId;

    // Find the profile
    if (verificationId) {
      console.log("Looking for profile with userId:", verificationId);
      try {
        profile = await driverProfilesCollection.findOne({
          userId: verificationId,
        });
        if (profile) {
          userId = profile.userId;
        }
      } catch (error) {
        console.error("Error finding by userId:", error);
      }
    } else if (verification && verification.id) {
      try {
        const objectId = new ObjectId(verification.id);
        profile = await driverProfilesCollection.findOne({ _id: objectId });
        if (profile) {
          userId = profile.userId;
        }
      } catch (error) {
        console.error("Invalid verification ID format:", error);
      }
    } else if (verification && verification.userId) {
      profile = await driverProfilesCollection.findOne({
        userId: verification.userId,
      });
      if (profile) {
        userId = verification.userId;
      }
    }

    if (!profile || !userId) {
      console.error("Profile not found for:", { verificationId, verification });
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 },
      );
    }

    console.log("Found profile:", {
      userId,
      profileId: profile._id,
      carRegistrationNumber: profile.carRegistrationNumber,
    });

    // Get user details for email - try both _id formats
    let user = null;
    try {
      // Try as ObjectId first
      if (ObjectId.isValid(userId)) {
        user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      } else {
        user = await usersCollection.findOne({ _id: userId as any });
      }
    } catch (err) {
      console.error("Error finding user:", err);
      user = await usersCollection.findOne({ _id: userId as any });
    }

    if (action === "approve") {
      // Update driver profile status
      await driverProfilesCollection.updateOne(
        { userId },
        {
          $set: {
            verificationStatus: "approved",
            verifiedAt: new Date(),
            rejectionReason: null,
            updatedAt: new Date(),
          },
        },
      );

      // Update user's verification status
      await usersCollection.updateOne(
        { _id: user?._id || userId },
        {
          $set: {
            verificationStatus: "approved",
            isVerified: true,
            verifiedAt: new Date(),
            rejectionReason: null,
            updatedAt: new Date(),
          },
        },
      );

      // Trigger push notification if token exists
      const pushTokens = user?.pushTokens?.length ? user.pushTokens : user?.expoPushToken ? [user.expoPushToken] : [];

      if (pushTokens.length) {

        await sendPushNotification(

          pushTokens,
          "Verification Approved",
          "Congratulations! Your account has been verified.",
          { screen: "Profile" }
        );
      }

      // Send email notification to driver (run in background)
      const driverEmail = user?.email || profile?.email;
      const driverName = profile.fullName || user?.name || "Driver";
      const carRegistration =
        profile.carRegistrationNumber ||
        profile.carRegistration ||
        "Not provided";

      if (driverEmail && driverEmail !== "Unknown" && driverEmail !== "") {
        (async () => {
          try {
            await sendDriverVerificationResultEmail({
              driverEmail: driverEmail,
              driverName: driverName,
              carRegistration: carRegistration, // ADDED: Include car registration
              status: "approved",
              reason: null,
            });
            console.log("✅ Verification approved email sent to:", driverEmail);
          } catch (emailError) {
            console.error("❌ Failed to send approval email:", emailError);
          }
        })();
      } else {
        console.warn("⚠️ No valid email found for driver:", {
          userId,
          driverEmail,
          user,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Verification approved successfully",
      });
    } else if (action === "reject") {
      // Update driver profile status
      await driverProfilesCollection.updateOne(
        { userId },
        {
          $set: {
            verificationStatus: "rejected",
            rejectionReason: reason || "No reason provided",
            updatedAt: new Date(),
          },
        },
      );

      // Update user's verification status
      await usersCollection.updateOne(
        { _id: user?._id || userId },
        {
          $set: {
            verificationStatus: "rejected",
            isVerified: false,
            rejectionReason: reason || "No reason provided",
            updatedAt: new Date(),
          },
        },
      );

      // Trigger push notification if token exists
      const pushTokens = user?.pushTokens?.length ? user.pushTokens : user?.expoPushToken ? [user.expoPushToken] : [];

      if (pushTokens.length) {

        await sendPushNotification(

          pushTokens,
          "Verification Rejected",
          `Your verification has been rejected. Reason: ${reason || "No reason provided"}`,
          { screen: "Profile" }
        );
      }

      // Send email notification to driver (run in background)
      const driverEmail = user?.email || profile?.email;
      const driverName = profile.fullName || user?.name || "Driver";
      const carRegistration =
        profile.carRegistrationNumber ||
        profile.carRegistration ||
        "Not provided";

      if (driverEmail && driverEmail !== "Unknown" && driverEmail !== "") {
        (async () => {
          try {
            await sendDriverVerificationResultEmail({
              driverEmail: driverEmail,
              driverName: driverName,
              carRegistration: carRegistration,
              status: "rejected",
              reason: reason || "No reason provided",
            });
            console.log("✅ Verification rejection email sent to:", driverEmail);
          } catch (emailError) {
            console.error("❌ Failed to send rejection email:", emailError);
          }
        })();
      } else {
        console.warn("⚠️ No valid email found for driver:", {
          userId,
          driverEmail,
          user,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Verification rejected successfully",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing verification:", error);
    return NextResponse.json(
      { error: "Failed to process verification" },
      { status: 500 },
    );
  }
}
