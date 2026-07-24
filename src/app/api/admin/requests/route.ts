// src/app/api/admin/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { toMoney } from "@/lib/money";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(parseInt(limitParam), 500) : null;
    const skip = parseInt(searchParams.get("skip") || "0");
    const countsOnly = searchParams.get("countsOnly") === "true";

    const query: any = {};
    if (from || to) {
      const dateQuery: any = {};
      if (from) dateQuery.$gte = new Date(from);
      if (to) {
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        dateQuery.$lte = endDate;
      }
      query.requestDate = dateQuery;
    }
    if (status && status !== "all") {
      if (status === "refueled") {
        query.status = "completed";
        query.refueledByManager = true;
      } else if (status === "completed") {
        query.status = "completed";
        query.refueledByManager = { $ne: true };
      } else {
        query.status = status;
      }
    }
    if (search) {
      const esc = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { driverName: { $regex: esc, $options: "i" } },
        { driverEmail: { $regex: esc, $options: "i" } },
        { carNumber: { $regex: esc, $options: "i" } },
      ];
    }

    const serviceRequestsCollection = db.collection("serviceRequests");

    // Get counts via aggregation — respect date/status filters
    const countPipeline: any[] = [];
    if (Object.keys(query).length > 0) {
      countPipeline.push({ $match: query });
    }
    countPipeline.push({
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
        sent: { $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] } },
        completed: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$status", "completed"] }, { $ne: ["$refueledByManager", true] }] },
              1, 0,
            ],
          },
        },
        rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
        refueled: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$status", "completed"] }, { $eq: ["$refueledByManager", true] }] },
              1, 0,
            ],
          },
        },
        totalRevenue: {
          $sum: {
            $cond: [
              { $eq: ["$status", "completed"] },
              { $ifNull: ["$actualAmount", "$amount", 0] },
              0,
            ],
          },
        },
        totalRepayable: {
          $sum: {
            $cond: [
              { $eq: ["$status", "completed"] },
              { $ifNull: ["$totalRepayable", "$amount", 0] },
              0,
            ],
          },
        },
        totalRepaid: { $sum: { $ifNull: ["$repaidAmount", 0] } },
      },
    });
    const countStats = await serviceRequestsCollection.aggregate(countPipeline).toArray();

    const counts = countStats[0] || {
      total: 0, pending: 0, approved: 0, sent: 0, completed: 0,
      rejected: 0, refueled: 0, totalRevenue: 0, totalRepayable: 0, totalRepaid: 0,
    };

    if (countsOnly) {
      return NextResponse.json({
        requests: [],
        total: counts.total,
        pending: counts.pending,
        approved: counts.approved,
        sent: counts.sent,
        completed: counts.completed,
        rejected: counts.rejected,
        refueled: counts.refueled,
        totalRevenue: toMoney(counts.totalRevenue),
        totalRepayable: toMoney(counts.totalRepayable),
        totalRepaid: toMoney(counts.totalRepaid),
      });
    }

    // Fetch requests
    const findQuery = serviceRequestsCollection
      .find(query)
      .sort({ requestDate: -1 })
      .project({
        type: 1, status: 1, refueledByManager: 1,
        driverName: 1, carNumber: 1, amount: 1, requestDate: 1,
      });
    const requests = limit !== null
      ? await findQuery.skip(skip).limit(limit).toArray()
      : await findQuery.toArray();

    const requestsWithDetails = requests.map((request: any) => ({
      id: request._id.toString(),
      type: request.type,
      amount: request.amount,
      carNumber: request.carNumber,
      driverName: request.driverName || "Unknown",
      status: request.status,
      requestDate: request.requestDate,
      refueledByManager: request.refueledByManager || false,
    }));

    return NextResponse.json({
      requests: requestsWithDetails,
      total: counts.total,
      pending: counts.pending,
      approved: counts.approved,
      sent: counts.sent,
      completed: counts.completed,
      rejected: counts.rejected,
      refueled: counts.refueled,
      totalRevenue: toMoney(counts.totalRevenue),
      totalRepayable: toMoney(counts.totalRepayable),
      totalRepaid: toMoney(counts.totalRepaid),
      hasMore: limit !== null
        ? (search ? requests.length === limit : skip + limit < counts.total)
        : false,
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 },
    );
  }
}
