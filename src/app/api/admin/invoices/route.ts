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
      .filter((d: any) => d.items.length > 0)
      .sort((a: any, b: any) => b.totalOutstanding - a.totalOutstanding);

    // Check which drivers are on active payment plans
    const paymentPlansCollection = db.collection("paymentPlans");
    const driverUserIds = drivers.map((d: any) => d.userId).filter(Boolean);
    const activePlans = driverUserIds.length > 0
      ? await paymentPlansCollection
          .find({ userId: { $in: driverUserIds }, isActive: true })
          .toArray()
      : [];
    const planByUserId = new Map<string, any>(
      activePlans.map((p: any) => [p.userId, p]),
    );
    for (const d of drivers) {
      const plan = planByUserId.get(d.userId);
      if (plan) {
        d.onPaymentPlan = true;
        d.paymentPlanInstallment = plan.installmentAmount;
        d.paymentPlanDate = plan.installmentDate;
      }
    }

    // Check which drivers' current items were already sent via WhatsApp
    const driverEmails = drivers.map((d: any) => d.driverEmail).filter(Boolean);
    const whatsappSentRecords = driverEmails.length > 0
      ? await db.collection("invoiceHistory").find(
          { driverEmail: { $in: driverEmails }, channel: "whatsapp" },
          { projection: { driverEmail: 1, requestIds: 1 } },
        ).toArray()
      : [];
    // Map driverEmail -> Set of requestIds that have been sent
    const sentRequestIdsByEmail = new Map<string, Set<string>>();
    for (const rec of whatsappSentRecords) {
      if (!rec.driverEmail || !rec.requestIds?.length) continue;
      const existing = sentRequestIdsByEmail.get(rec.driverEmail) || new Set();
      for (const rid of rec.requestIds) existing.add(rid);
      sentRequestIdsByEmail.set(rec.driverEmail, existing);
    }
    for (const d of drivers) {
      if (!d.driverEmail) continue;
      const sentIds = sentRequestIdsByEmail.get(d.driverEmail);
      if (!sentIds) continue;
      const currentIds = d.items.map((i: any) => i.requestId).filter(Boolean);
      // Only mark as sent if ALL current requestIds were previously sent via WhatsApp
      if (currentIds.length > 0 && currentIds.every((rid: string) => sentIds.has(rid))) {
        d.whatsappSent = true;
      }
    }

    // Attach discount per driver
    if (driverEmails.length > 0) {
      const discountRecords = await db.collection("discounts").find(
        { driverEmail: { $in: driverEmails } },
      ).toArray();
      const discountMap = new Map<string, number>();
      for (const rec of discountRecords) {
        discountMap.set(rec.driverEmail, rec.discountPercent);
      }
      for (const d of drivers) {
        if (d.driverEmail && discountMap.has(d.driverEmail)) {
          d.discountPercent = discountMap.get(d.driverEmail);
        }
      }
    }

    const totalOutstandingAll = drivers.reduce(
      (sum: number, d: any) => sum + d.totalOutstanding,
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
