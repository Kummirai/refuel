// src/app/api/admin/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { toMoney } from "@/lib/money";

function tryObjectIdStr(id: string): string {
  try { return new ObjectId(id).toString(); } catch { return id; }
}

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
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
    const usersCollection = db.collection("user");
    const driverProfilesCollection = db.collection("driverProfiles");

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
        recent: [],
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

    // Fetch paginated requests
    const requests = await serviceRequestsCollection
      .find(query)
      .sort({ requestDate: -1 })
      .skip(skip)
      .limit(limit)
      .project({
        userId: 1, type: 1, amount: 1, actualAmount: 1, carNumber: 1, carModel: 1,
        carRegistration: 1, fuelType: 1, contactPhone: 1, driverName: 1, driverPhone: 1,
        driverEmail: 1, interest: 1, totalRepayable: 1, interestRate: 1, repaymentDays: 1,
        dailyPayment: 1, package: 1, packageDescription: 1, status: 1, otp: 1,
        requestDate: 1, createdAt: 1, approvedDate: 1, completedDate: 1, popUrl: 1,
        popPublicId: 1, popUploadedAt: 1, updatedAt: 1, repaidAmount: 1, remainingBalance: 1,
        isPaid: 1, refueledByManager: 1, location: 1, recipientPhoneNumber: 1,
        collateral: 1, hasReceipt: 1,
      })
      .toArray();

    // Batch user lookups
    const userIds = [...new Set(requests.map((r: any) => r.userId))] as string[];
    const userObjectIds = userIds.map((id: string) => {
      try { return new ObjectId(id); } catch { return id; }
    });
    const users: any[] = await usersCollection
      .find({ _id: { $in: userObjectIds } })
      .project({ name: 1, email: 1, phone: 1 })
      .toArray();
    const profiles: any[] = await driverProfilesCollection
      .find({ userId: { $in: userIds } })
      .project({ userId: 1, fullName: 1, name: 1, phone: 1, address: 1 })
      .toArray();

    const userMap = new Map<string, any>(users.map((u: any) => [u._id.toString(), u]));
    const profileMap = new Map<string, any>(profiles.map((p: any) => [p.userId, p]));

    const requestsWithDetails = requests.map((request: any) => {
      const user = userMap.get(request.userId) || userMap.get(tryObjectIdStr(request.userId));
      const driverProfile = profileMap.get(request.userId);

      return {
        id: request._id.toString(),
        _id: request._id.toString(),
        userId: request.userId,
        type: request.type,
        amount: request.amount,
        actualAmount: request.actualAmount || null,
        carNumber: request.carNumber,
        carModel: request.carModel,
        carRegistration: request.carRegistration,
        fuelType: request.fuelType,
        contactPhone: request.contactPhone,
        driverName: request.driverName || user?.name || driverProfile?.fullName || driverProfile?.name || "Unknown",
        driverPhone: request.driverPhone || user?.phone || driverProfile?.phone || "Unknown",
        driverEmail: request.driverEmail || user?.email || "Unknown",
        interest: request.interest,
        totalRepayable: request.totalRepayable,
        interestRate: request.interestRate,
        repaymentDays: request.repaymentDays,
        dailyPayment: request.dailyPayment,
        package: request.package,
        packageDescription: request.packageDescription,
        status: request.status,
        otp: request.otp,
        requestDate: request.requestDate,
        createdAt: request.createdAt,
        approvedDate: request.approvedDate,
        completedDate: request.completedDate,
        popUrl: request.popUrl,
        popPublicId: request.popPublicId,
        popUploadedAt: request.popUploadedAt,
        updatedAt: request.updatedAt,
        repaidAmount: request.repaidAmount || 0,
        remainingBalance: request.remainingBalance || 0,
        isPaid: request.isPaid || false,
        refueledByManager: request.refueledByManager || false,
        location: request.location || driverProfile?.address || "Not provided",
        phoneNumber: request.recipientPhoneNumber || request.contactPhone,
        collateral: request.collateral || null,
      };
    });

    return NextResponse.json({
      requests: requestsWithDetails,
      recent: requestsWithDetails.filter((r: any) => r.status === "pending").slice(0, 5),
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
      hasMore: search
        ? requests.length === limit
        : skip + limit < counts.total,
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 },
    );
  }
}
