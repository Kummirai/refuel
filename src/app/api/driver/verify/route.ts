// src/app/api/driver/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

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

    // Update or create driver profile
    await driverProfiles.updateOne(
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

    // Update user's verification status
    await usersCollection.updateOne(
      { _id: userId },
      {
        $set: {
          verificationStatus: "pending",
          isVerified: false,
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({
      success: true,
      message: "Verification submitted successfully",
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Failed to submit verification" },
      { status: 500 },
    );
  }
}
