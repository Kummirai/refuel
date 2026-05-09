// src/app/api/admin/drivers/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    console.log("Fetching profile for userId:", userId);

    if (!userId || userId === "undefined" || userId === "null") {
      return NextResponse.json(
        { error: "Valid User ID is required" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection("user");
    const driverProfilesCollection = db.collection("driverProfiles");

    // Get user
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      console.log("User not found for userId:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get driver profile
    const profile = await driverProfilesCollection.findOne({ userId: userId });

    if (!profile) {
      console.log("Profile not found for userId:", userId);
      return NextResponse.json(
        { error: "Driver profile not found" },
        { status: 404 },
      );
    }

    console.log("Found profile:", profile._id);

    // Return complete profile with all fields
    const fullProfile = {
      // Personal Information
      fullName: profile.fullName || "",
      dateOfBirth: profile.dateOfBirth || "",
      address: profile.address || "",
      city: profile.city || "",
      pincode: profile.pincode || "",

      // Vehicle Information
      carRegistration: profile.carRegistrationNumber || "",
      carRegistrationNumber: profile.carRegistrationNumber || "",
      carModel: profile.carModel || "",
      carYear: profile.carYear || "",
      carColor: profile.carColor || "",

      // Document URLs
      drivingLicenseUrl: profile.drivingLicenseUrl || "",
      carRegistrationUrl: profile.carRegistrationUrl || "",
      profilePhotoUrl: profile.profilePhotoUrl || "",

      // Status
      verificationStatus: profile.verificationStatus || "pending",
      rejectionReason: profile.rejectionReason || null,

      // Timestamps
      submittedDate: profile.createdAt,
      verifiedAt: profile.verifiedAt || null,

      // Statistics
      totalRequests: profile.totalRequests || 0,
      totalSpent: profile.totalSpent || 0,
      rating: profile.rating || 0,

      // User info
      email: user.email || "",
      phone: user.phone || "",
      name: profile.fullName || user.name || "",
    };

    return NextResponse.json({
      success: true,
      profile: fullProfile,
    });
  } catch (error) {
    console.error("Error fetching driver profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch driver profile" },
      { status: 500 },
    );
  }
}
