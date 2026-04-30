// src/app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    // Get collections
    const usersCollection = db.collection("user");
    const driverProfilesCollection = db.collection("driverProfiles");
    const serviceRequestsCollection = db.collection("serviceRequests");

    // Get all users with role 'driver'
    const allDrivers = await usersCollection.find({ role: "driver" }).toArray();
    const totalDrivers = allDrivers.length;

    // Get verification stats from driverProfiles
    const pendingVerifications = await driverProfilesCollection.countDocuments({
      verificationStatus: "pending",
    });
    const verifiedDrivers = await driverProfilesCollection.countDocuments({
      verificationStatus: "approved",
    });
    const rejectedVerifications = await driverProfilesCollection.countDocuments(
      { verificationStatus: "rejected" },
    );

    // Get request stats
    const totalRequests = await serviceRequestsCollection.countDocuments();
    const pendingRequests = await serviceRequestsCollection.countDocuments({
      status: "pending",
    });
    const completedRequests = await serviceRequestsCollection.countDocuments({
      status: "completed",
    });

    // Calculate total revenue from completed requests
    const completedRequestsData = await serviceRequestsCollection
      .find({ status: "completed" })
      .toArray();
    const totalRevenue = completedRequestsData.reduce(
      (sum: any, req: any) => sum + (req.amount || 0),
      0,
    );

    // Calculate average rating
    const driversWithRatings = await driverProfilesCollection
      .find({ rating: { $gt: 0 } })
      .toArray();
    const averageRating =
      driversWithRatings.length > 0
        ? driversWithRatings.reduce(
            (sum: any, d: any) => sum + (d.rating || 0),
            0,
          ) / driversWithRatings.length
        : 0;

    // Get active loans (cash requests that are approved but not completed)
    const activeLoans = await serviceRequestsCollection.countDocuments({
      type: "cash",
      status: "approved",
      completedDate: { $exists: false },
    });

    // Get total loan amount
    const loanData = await serviceRequestsCollection
      .find({ type: "cash", status: "approved" })
      .toArray();
    const totalLoanAmount = loanData.reduce(
      (sum: any, loan: any) => sum + (loan.amount || 0),
      0,
    );

    return NextResponse.json({
      totalDrivers,
      pendingVerifications,
      verifiedDrivers,
      rejectedVerifications,
      totalRequests,
      pendingRequests,
      completedRequests,
      totalRevenue,
      averageRating: Number(averageRating.toFixed(1)),
      activeLoans,
      totalLoanAmount,
      revenueGrowth: 12.5, // This could be calculated from historical data
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
