// src/app/api/admin/invoices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { toMoney } from "@/lib/money";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");
    const repaymentProofsCollection = db.collection("repaymentProofs");
    const usersCollection = db.collection("user");

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const allRequests = await serviceRequestsCollection
      .find({ status: "completed" })
      .toArray();

    // Batch fetch repayment proofs for requests without pre-calculated remainingBalance
    const requestIdsNeedingBalance = allRequests
      .filter((r: any) => !r.isPaid && r.remainingBalance === undefined)
      .map((r: any) => r._id.toString());

    let calcRemainingBalance = new Map<string, number>();
    if (requestIdsNeedingBalance.length > 0) {
      const approvedRepayments = await repaymentProofsCollection
        .find({ requestId: { $in: requestIdsNeedingBalance }, status: "approved" })
        .toArray();
      const repaymentsByRequest = new Map<string, any[]>();
      for (const rp of approvedRepayments) {
        const list = repaymentsByRequest.get(rp.requestId) || [];
        list.push(rp);
        repaymentsByRequest.set(rp.requestId, list);
      }
      for (const rid of requestIdsNeedingBalance) {
        const reqDoc = allRequests.find((r: any) => r._id.toString() === rid);
        const totalRep = reqDoc?.totalRepayable || reqDoc?.amount || 0;
        const rps = repaymentsByRequest.get(rid) || [];
        const repaid = rps.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
        calcRemainingBalance.set(rid, Math.max(0, totalRep - repaid));
      }
    }

    // Batch user lookups
    const userIdsNeeded = [...new Set(allRequests
      .filter((r: any) => !r.isPaid)
      .filter((r: any) => {
        const totalRep = r.totalRepayable || r.amount || 0;
        const remBal = r.remainingBalance ?? calcRemainingBalance.get(r._id.toString()) ?? totalRep;
        return toMoney(remBal) > 0;
      })
      .filter((r: any) => !r.driverEmail)
      .map((r: any) => r.userId))] as string[];

    const userMap = new Map<string, any>();
    if (userIdsNeeded.length > 0) {
      const userObjectIds = (userIdsNeeded as string[]).map((id: string) => {
        try { return new ObjectId(id); } catch { return id; }
      });
      const users: any[] = await usersCollection.find({ _id: { $in: userObjectIds } }).toArray();
      for (const u of users) {
        userMap.set(u._id.toString(), u);
      }
    }

    const outstandingByUser: Record<string, any> = {};

    for (const req of allRequests) {
      if (req.isPaid) continue;

      const completedDate = req.completedDate ? new Date(req.completedDate) : null;
      if (startDate && completedDate && completedDate < new Date(startDate)) continue;
      if (endDate && completedDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (completedDate > endOfDay) continue;
      }

      const totalRepayable = req.totalRepayable || req.amount || 0;
      const requestId = req._id.toString();

      const remainingBalance = toMoney(
        req.remainingBalance ?? calcRemainingBalance.get(requestId) ?? totalRepayable,
      );

      if (remainingBalance <= 0) continue;

      const userId = req.userId;

      if (!outstandingByUser[userId]) {
        const user = userMap.get(userId);
        outstandingByUser[userId] = {
          userId,
          driverEmail: req.driverEmail || user?.email || "",
          driverName: req.driverName || user?.name || "Driver",
          driverPhone: req.driverPhone || user?.phone || "",
          items: [],
          totalOutstanding: 0,
        };
      }

      if (!outstandingByUser[userId].carRegistration && req.carNumber) {
        outstandingByUser[userId].carRegistration = req.carNumber;
      }

      const originalAmount = req.actualAmount || req.amount || 0;
      const effectiveAmount =
        totalRepayable > 0
          ? toMoney(originalAmount * (remainingBalance / totalRepayable))
          : originalAmount;

      outstandingByUser[userId].items.push({
        requestId,
        type: req.type,
        carNumber: req.carNumber || "Unknown",
        amount: effectiveAmount,
        totalRepayable: remainingBalance,
        remainingBalance,
        completedDate: req.completedDate
          ? new Date(req.completedDate).toISOString()
          : "",
      });
      outstandingByUser[userId].totalOutstanding = toMoney(
        outstandingByUser[userId].totalOutstanding + remainingBalance,
      );
    }

    const drivers = Object.values(outstandingByUser)
      .filter((d) => d.items.length > 0)
      .sort((a, b) => b.totalOutstanding - a.totalOutstanding);

    const totalOutstandingAll = drivers.reduce(
      (sum, d) => sum + d.totalOutstanding,
      0,
    );

    return NextResponse.json({
      drivers,
      totalDrivers: drivers.length,
      totalOutstanding: toMoney(totalOutstandingAll),
    });
  } catch (error) {
    console.error("Error fetching invoice data:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice data" },
      { status: 500 },
    );
  }
}
