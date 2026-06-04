// src/app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { toMoney } from "@/lib/money";

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    const serviceRequestsCollection = db.collection("serviceRequests");
    const driverProfilesCollection = db.collection("driverProfiles");
    const usersCollection = db.collection("user");

    // Single aggregation combining all stats
    const requestStats = await serviceRequestsCollection.aggregate([
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                completedRevenue: {
                  $sum: {
                    $cond: [
                      { $eq: ["$status", "completed"] },
                      { $ifNull: ["$actualAmount", "$amount", 0] },
                      0,
                    ],
                  },
                },
              },
            },
          ],
          activeLoans: [
            { $match: { type: "cash", status: "approved", completedDate: { $exists: false } } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                totalAmount: { $sum: { $ifNull: ["$amount", 0] } },
              },
            },
          ],
        },
      },
    ]).toArray().then((r: any[]) => r[0]) || { totals: [], activeLoans: [] };

    const totals = requestStats.totals[0] || { total: 0, pending: 0, completed: 0, completedRevenue: 0 };
    const loans = requestStats.activeLoans[0] || { count: 0, totalAmount: 0 };

    // Driver counts via aggregation
    const driverStatsResult = (await driverProfilesCollection.aggregate([
      {
        $group: {
          _id: null,
          pendingVerifications: { $sum: { $cond: [{ $eq: ["$verificationStatus", "pending"] }, 1, 0] } },
          verifiedDrivers: { $sum: { $cond: [{ $eq: ["$verificationStatus", "approved"] }, 1, 0] } },
          rejectedVerifications: { $sum: { $cond: [{ $eq: ["$verificationStatus", "rejected"] }, 1, 0] } },
          averageRating: { $avg: { $cond: [{ $gt: ["$rating", 0] }, "$rating", null] } },
        },
      },
    ]).toArray().then((r: any[]) => r[0])) || {
      pendingVerifications: 0, verifiedDrivers: 0, rejectedVerifications: 0, averageRating: null,
    };

    // Total driver count
    const totalDrivers = await usersCollection.countDocuments({ role: "driver" });

    return NextResponse.json({
      totalDrivers,
      pendingVerifications: driverStatsResult.pendingVerifications,
      verifiedDrivers: driverStatsResult.verifiedDrivers,
      rejectedVerifications: driverStatsResult.rejectedVerifications,
      totalRequests: totals.total,
      pendingRequests: totals.pending,
      completedRequests: totals.completed,
      totalRevenue: toMoney(totals.completedRevenue),
      averageRating: driverStatsResult.averageRating
        ? Number(driverStatsResult.averageRating.toFixed(1))
        : 0,
      activeLoans: loans.count,
      totalLoanAmount: toMoney(loans.totalAmount),
      revenueGrowth: 12.5,
    },);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
