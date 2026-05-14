// src/app/api/admin/invoices/send/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { sendDriverWeeklyInvoiceEmail } from "@/lib/email";
import { toMoney } from "@/lib/money";

export async function POST() {
  try {
    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");
    const repaymentProofsCollection = db.collection("repaymentProofs");
    const usersCollection = db.collection("user");

    const allRequests = await serviceRequestsCollection
      .find({ status: "completed" })
      .toArray();

    const outstandingByUser: Record<
      string,
      {
        driverEmail: string;
        driverName: string;
        items: {
          type: string;
          carNumber: string;
          amount: number;
          totalRepayable: number;
          remainingBalance: number;
        }[];
        totalOutstanding: number;
      }
    > = {};

    for (const req of allRequests) {
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
        }

        outstandingByUser[userId] = {
          driverEmail,
          driverName,
          items: [],
          totalOutstanding: 0,
        };
      }

      outstandingByUser[userId].items.push({
        type: req.type,
        carNumber: req.carNumber || "Unknown",
        amount: req.actualAmount || req.amount || 0,
        totalRepayable,
        remainingBalance,
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
