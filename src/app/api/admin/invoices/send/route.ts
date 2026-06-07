// src/app/api/admin/invoices/send/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { sendDriverWeeklyInvoiceEmail } from "@/lib/email";
import { sendPushNotification } from "@/lib/notifications";
import { toMoney } from "@/lib/money";
import { ObjectId } from "mongodb";

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
        userId: string;
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

      let remainingBalance: number;
      if (req.remainingBalance !== undefined) {
        remainingBalance = req.remainingBalance;
      } else {
        const approvedRepayments = await repaymentProofsCollection
          .find({ requestId, status: "approved" })
          .toArray();
        const totalRepaid = approvedRepayments.reduce(
          (sum: number, r: any) => sum + (r.amount || 0),
          0,
        );
        remainingBalance = Math.max(0, totalRepayable - totalRepaid);
      }
      remainingBalance = toMoney(remainingBalance);

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
              _id: new ObjectId(userId),
            });
          } catch {
            user = await usersCollection.findOne({ id: userId });
          }
          driverEmail = user?.email || "";
          driverPhone = user?.phone || "";
        }

        outstandingByUser[userId] = {
          userId,
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

        // Trigger push notification if token exists
        const user = await usersCollection.findOne({ _id: new ObjectId(entry.userId) });
        const pushTokens = user?.pushTokens?.length ? user.pushTokens : user?.expoPushToken ? [user.expoPushToken] : [];

        if (pushTokens.length) {

          await sendPushNotification(

            pushTokens,
                "New Weekly Invoice",
                `Your weekly invoice for R${entry.totalOutstanding} is ready.`,
                { screen: "Invoices" }
            );
        }

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
        channel: "email",
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
