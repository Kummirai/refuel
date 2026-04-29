// src/app/api/admin/verify/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { verificationId, action, reason } = await request.json();
    console.log(request.body);

    if (!verificationId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const driverProfilesCollection = db.collection("driverProfiles");
    const usersCollection = db.collection("user");

    // Get the verification document
    const verification = await driverProfilesCollection.findOne({
      userId: verificationId,
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 },
      );
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    // Update driver profile verification status
    await driverProfilesCollection.updateOne(
      { userId: verificationId },
      {
        $set: {
          verificationStatus: newStatus,
          isVerified: action === "approve",
          reviewedAt: new Date(),
          rejectionReason: action === "reject" ? reason : null,
        },
      },
    );

    // Update user's isVerified status
    await usersCollection.updateOne(
      { _id: verification },
      {
        $set: {
          isVerified: action === "approve",
          verificationStatus: newStatus,
        },
      },
    );

    return NextResponse.json({
      success: true,
      message: `Verification ${action}d successfully`,
    });
  } catch (error) {
    console.error("Error processing verification:", error);
    return NextResponse.json(
      { error: "Failed to process verification" },
      { status: 500 },
    );
  }
}
