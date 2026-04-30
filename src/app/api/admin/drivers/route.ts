// src/app/api/admin/drivers/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

interface User {
  _id: ObjectId;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DriverProfile {
  _id: ObjectId;
  userId: string;
  carRegistrationNumber?: string;
  carModel?: string;
  carYear?: number;
  verificationStatus?: string;
  rating?: number;
  activeLoan?: any;
  drivingLicenseUrl?: string;
  carRegistrationUrl?: string;
  profilePhotoUrl?: string;
  address?: string;
  city?: string;
  createdAt?: Date;
  fullName?: string;
}

interface ServiceRequest {
  amount: number;
}

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
      drivers.map(async (driver: User) => {
        const profile = (await driverProfilesCollection.findOne({
          userId: driver._id.toString(),
        })) as DriverProfile | null;

        // Get driver's request count and total spent
        const driverRequests = (await serviceRequestsCollection
          .find({ userId: driver._id.toString() })
          .toArray()) as ServiceRequest[];

        const totalRequests = driverRequests.length;
        const totalSpent = driverRequests.reduce(
          (sum, req) => sum + (req.amount || 0),
          0,
        );

        return {
          id: driver._id,
          userId: driver._id.toString(),
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
    const recentVerificationsRaw = (await driverProfilesCollection
      .find({ verificationStatus: "pending" })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()) as DriverProfile[];

    const recentVerifications = await Promise.all(
      recentVerificationsRaw.map(async (verification: DriverProfile) => {
        const user = (await usersCollection.findOne({
          _id: verification.userId,
        })) as User | null;

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
