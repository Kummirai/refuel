// src/app/api/admin/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { sendDriverVerificationResultEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { verification, action, verificationId, reason } = body;

    const { db } = await connectToDatabase();
    const driverProfilesCollection = db.collection("driverProfiles");
    const usersCollection = db.collection("users");

    let profile;
    let userId;

    // Find the profile
    if (verificationId) {
      try {
        const objectId = new ObjectId(verificationId);
        profile = await driverProfilesCollection.findOne({ _id: objectId });
        if (profile) {
          userId = profile.userId;
        }
      } catch (error) {
        console.error("Invalid verification ID format:", error);
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
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 },
      );
    }

    // Get user details for email
    const user = await usersCollection.findOne({ _id: userId });

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
        { _id: userId },
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

      // Send email notification to driver (run in background)
      (async () => {
        try {
          await sendDriverVerificationResultEmail({
            driverEmail: user?.email || "",
            driverName: profile.fullName || user?.name || "Driver",
            status: "approved",
            reason: null,
          });
          console.log("✅ Verification approved email sent to driver:", userId);
        } catch (emailError) {
          console.error("❌ Failed to send approval email:", emailError);
        }
      })();

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
            rejectedAt: new Date(),
            rejectionReason: reason || "No reason provided",
            updatedAt: new Date(),
          },
        },
      );

      // Update user's verification status
      await usersCollection.updateOne(
        { _id: userId },
        {
          $set: {
            verificationStatus: "rejected",
            isVerified: false,
            rejectedAt: new Date(),
            rejectionReason: reason || "No reason provided",
            updatedAt: new Date(),
          },
        },
      );

      // Send email notification to driver (run in background)
      (async () => {
        try {
          await sendDriverVerificationResultEmail({
            driverEmail: user?.email || "",
            driverName: profile.fullName || user?.name || "Driver",
            status: "rejected",
            reason: reason || "No reason provided",
          });
          console.log(
            "✅ Verification rejection email sent to driver:",
            userId,
          );
        } catch (emailError) {
          console.error("❌ Failed to send rejection email:", emailError);
        }
      })();

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
