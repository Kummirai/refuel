// src/app/api/admin/invoices/send/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { sendDriverWeeklyInvoiceEmail } from "@/lib/email";
import { toMoney } from "@/lib/money";

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");
    const repaymentProofsCollection = db.collection("repaymentProofs");
    const usersCollection = db.collection("user");

    const body = await request.json();
    const startDate = body?.startDate || null;
    const endDate = body?.endDate || null;

    const allRequests = await serviceRequestsCollection
      .find({ status: "completed" })
      .toArray();

    const outstandingByUser: Record<
      string,
      {
        driverEmail: string;
        driverName: string;
        driverPhone?: string;
        carRegistration?: string;
        items: {
          type: string;
          carNumber: string;
          amount: number;
          totalRepayable: number;
          remainingBalance: number;
          completedDate?: string;
        }[];
        totalOutstanding: number;
      }
    > = {};

    for (const req of allRequests) {
      if (req.isPaid) continue;

      const completedDate = req.completedDate
        ? new Date(req.completedDate)
        : null;

      if (startDate && completedDate && completedDate < new Date(startDate)) continue;
      if (endDate && completedDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (completedDate > endOfDay) continue;
      }

      const totalRepayable = req.totalRepayable || req.amount || 0;
      const requestId = req._id.toString();

      const approvedRepayments = await repaymentProofsCollection
        .find({ requestId, status: "approved" })
        .toArray();
      const totalRepaid = approvedRepayments.reduce(
        (sum: number, r: any) => sum + (r.amount || 0),
        0,
      );

      const remainingBalance = toMoney(
        Math.max(0, totalRepayable - totalRepaid),
      );

      if (remainingBalance <= 0) continue;

      const userId = req.userId;

      if (!outstandingByUser[userId]) {
        const driverName = req.driverName || "Driver";
        let driverEmail = req.driverEmail || "";
        let driverPhone = req.driverPhone || "";

        if (!driverEmail) {
          let user;
          try {
            user = await usersCollection.findOne({
              _id: new (require("mongodb").ObjectId)(userId),
            });
          } catch {
            user = await usersCollection.findOne({ id: userId });
          }
          driverEmail = user?.email || "";
          driverPhone = user?.phone || "";
        }

        outstandingByUser[userId] = {
          driverEmail,
          driverName,
          driverPhone,
          items: [],
          totalOutstanding: 0,
        };
      }

      if (!outstandingByUser[userId].carRegistration && req.carNumber) {
        outstandingByUser[userId].carRegistration = req.carNumber;
      }

      const originalAmount = req.actualAmount || req.amount || 0;
      const effectiveTotal = remainingBalance;
      const effectiveAmount =
        totalRepayable > 0
          ? toMoney(originalAmount * (remainingBalance / totalRepayable))
          : originalAmount;

      outstandingByUser[userId].items.push({
        type: req.type,
        carNumber: req.carNumber || "Unknown",
        amount: effectiveAmount,
        totalRepayable: effectiveTotal,
        remainingBalance,
        completedDate: req.completedDate
          ? new Date(req.completedDate).toISOString()
          : "",
      });
      outstandingByUser[userId].totalOutstanding = toMoney(
        outstandingByUser[userId].totalOutstanding + remainingBalance,
      );
    }

    let sent = 0;
    let errors = 0;

    for (const entry of Object.values(outstandingByUser)) {
      if (!entry.driverEmail) {
        errors++;
        continue;
      }

      try {
        await sendDriverWeeklyInvoiceEmail({
          driverEmail: entry.driverEmail,
          driverName: entry.driverName,
          totalOutstanding: entry.totalOutstanding,
          items: entry.items,
        });
        sent++;
      } catch (err) {
        console.error(
          `Failed to send weekly invoice to ${entry.driverEmail}:`,
          err,
        );
        errors++;
      }
    }

    const driversList = Object.values(outstandingByUser).map((d) => ({
      driverName: d.driverName,
      driverEmail: d.driverEmail,
      driverPhone: d.driverPhone || "",
      carRegistration: d.carRegistration || "",
      outstanding: d.totalOutstanding,
      items: d.items,
    }));

    try {
      await db.collection("invoiceHistory").insertOne({
        sentAt: new Date(),
        totalDrivers: driversList.length,
        totalOutstanding: driversList.reduce((s, d) => s + d.outstanding, 0),
        sent,
        errors,
        dateRange:
          startDate || endDate
            ? { startDate: startDate || "", endDate: endDate || "" }
            : null,
        drivers: driversList,
      });
    } catch (err) {
      console.error("Failed to save invoice history:", err);
    }

    return NextResponse.json({
      success: true,
      sent,
      errors,
      total: sent + errors,
    });
  } catch (error) {
    console.error("Error sending invoices:", error);
    return NextResponse.json(
      { error: "Failed to send invoices" },
      { status: 500 },
    );
  }
}
