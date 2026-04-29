// src/app/api/admin/drivers/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    const usersCollection = db.collection("user");
    const driverProfilesCollection = db.collection("driverProfiles");
    const serviceRequestsCollection = db.collection("serviceRequests");

    // Get all drivers (users with role 'driver')
    const drivers = await usersCollection.find({ role: "driver" }).toArray();

    // Get driver profiles and request counts
    const driversWithData = await Promise.all(
      drivers.map(async (driver) => {
        const profile = await driverProfilesCollection.findOne({
          userId: driver._id.toString(),
        });

        // Get driver's request count and total spent
        const driverRequests = await serviceRequestsCollection
          .find({ userId: driver._id.toString() })
          .toArray();
        const totalRequests = driverRequests.length;
        const totalSpent = driverRequests.reduce(
          (sum, req) => sum + (req.amount || 0),
          0,
        );

        return {
          id: driver._id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          carRegistration: profile?.carRegistrationNumber || "Not provided",
          carModel: profile?.carModel || "Not provided",
          carYear: profile?.carYear || "Not provided",
          verificationStatus: profile?.verificationStatus || "not_submitted",
          rating: profile?.rating || 0,
          totalRequests,
          totalSpent,
          activeLoan: profile?.activeLoan || null,
          joinedDate: driver.createdAt,
          lastActive: driver.updatedAt,
        };
      }),
    );

    // Get recent pending verifications (last 5)
    const recentVerificationsRaw = await driverProfilesCollection
      .find({ verificationStatus: "pending" })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    const recentVerifications = await Promise.all(
      recentVerificationsRaw.map(async (verification) => {
        const user = await usersCollection.findOne({
          _id: verification.userId,
        });
        return {
          id: verification._id,
          name: user?.name || "Unknown",
          email: user?.email || "Unknown",
          phone: user?.phone || "Unknown",
          date: verification.createdAt,
          status: verification.verificationStatus,
          carRegistration: verification.carRegistrationNumber,
          carModel: verification.carModel,
          carYear: verification.carYear,
          address: verification.address,
          documents: {
            license: verification.drivingLicenseUrl,
            registration: verification.carRegistrationUrl,
            profilePhoto: verification.profilePhotoUrl,
          },
        };
      }),
    );

    // Calculate stats
    const verifiedCount = driversWithData.filter(
      (d) => d.verificationStatus === "approved",
    ).length;
    const pendingCount = driversWithData.filter(
      (d) => d.verificationStatus === "pending",
    ).length;
    const rejectedCount = driversWithData.filter(
      (d) => d.verificationStatus === "rejected",
    ).length;

    return NextResponse.json({
      drivers: driversWithData,
      recent: recentVerifications,
      total: driversWithData.length,
      verified: verifiedCount,
      pending: pendingCount,
      rejected: rejectedCount,
    });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return NextResponse.json(
      { error: "Failed to fetch drivers" },
      { status: 500 },
    );
  }
}
