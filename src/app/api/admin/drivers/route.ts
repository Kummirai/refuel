// src/app/api/admin/drivers/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { calculateDriverRating } from "@/lib/utils/rating";

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
  carColor: string;
  drivingLicenseUrl?: string;
  carRegistrationUrl?: string;
  profilePhotoUrl?: string;
  address?: string;
  city?: string;
  createdAt?: Date;
  fullName?: string;
  dateOfBirth?: string;
  pincode?: string;
}

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    const usersCollection = db.collection("user");
    const driverProfilesCollection = db.collection("driverProfiles");
    const serviceRequestsCollection = db.collection("serviceRequests");
    const repaymentProofsCollection = db.collection("repaymentProofs");

    // Get all drivers (users with role 'driver')
    const drivers = await usersCollection.find({ role: "driver" }).toArray();

    // Get driver profiles and request counts
    const driversWithData = await Promise.all(
      drivers.map(async (driver: User) => {
        const userId = driver._id.toString();
        const profile = (await driverProfilesCollection.findOne({
          userId: userId,
        })) as DriverProfile | null;

        // Fetch requests and repayments to calculate rating
        const requests = await serviceRequestsCollection
          .find({ userId: userId })
          .toArray();
        
        const enhancedRequests = await Promise.all(
          requests.map(async (req: any) => {
            const requestId = req._id.toString();
            const repayments = await repaymentProofsCollection
              .find({ requestId: requestId })
              .toArray();
            
            const totalRepaid = repayments
              .filter((r: any) => r.status === "approved")
              .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
            
            const totalRepayable = req.totalRepayable || req.amount;
            const remainingBalance = Math.max(0, totalRepayable - totalRepaid);

            return {
              ...req,
              repayments,
              remainingBalance,
              isPaid: remainingBalance <= 0
            };
          })
        );

        const totalSpent = requests.reduce(
          (sum: number, req: any) => sum + (req.amount || 0),
          0,
        );

        const rating = calculateDriverRating(profile, enhancedRequests);

        return {
          id: driver._id,
          userId: userId,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          carRegistration: profile?.carRegistrationNumber || "Not provided",
          carModel: profile?.carModel || "Not provided",
          carYear: profile?.carYear || "Not provided",
          carColor: profile?.carColor || "Not provided",
          verificationStatus: profile?.verificationStatus || "not_submitted",
          rating: rating,
          totalRequests: requests.length,
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
        // Get the user document to get email and phone
        let user = null;
        try {
          user = await usersCollection.findOne({
            _id: new ObjectId(verification.userId),
          });
        } catch {
          // If ObjectId conversion fails, try as string
          user = await usersCollection.findOne({
            _id: verification.userId as any,
          });
        }

        return {
          id: verification._id,
          name: verification.fullName || user?.name || "Unknown",
          email: user?.email || "Unknown",
          phone: user?.phone || "Unknown",
          date: verification.createdAt,
          submittedAt: verification.createdAt,
          verificationStatus: verification.verificationStatus,
          carRegistration: verification.carRegistrationNumber,
          carModel: verification.carModel,
          carColor: verification.carColor,
          carYear: verification.carYear,
          address: verification.address,
          city: verification.city,
          pincode: verification.pincode,
          dateOfBirth: verification.dateOfBirth,
          drivingLicenseUrl: verification.drivingLicenseUrl,
          carRegistrationUrl: verification.carRegistrationUrl,
          profilePhotoUrl: verification.profilePhotoUrl,
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
