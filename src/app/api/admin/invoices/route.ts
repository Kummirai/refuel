// src/app/api/admin/invoices/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { toMoney } from "@/lib/money";

export async function GET() {
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
        userId: string;
        driverEmail: string;
        driverName: string;
        driverPhone: string;
        items: {
          requestId: string;
          type: string;
          carNumber: string;
          amount: number;
          totalRepayable: number;
          remainingBalance: number;
          completedDate: string;
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
          userId,
          driverEmail,
          driverName,
          driverPhone,
          items: [],
          totalOutstanding: 0,
        };
      }

      outstandingByUser[userId].items.push({
        requestId,
        type: req.type,
        carNumber: req.carNumber || "Unknown",
        amount: req.amount || 0,
        totalRepayable,
        remainingBalance,
        completedDate: req.completedDate
          ? new Date(req.completedDate).toISOString()
          : "",
      });
      outstandingByUser[userId].totalOutstanding = toMoney(
        outstandingByUser[userId].totalOutstanding + remainingBalance,
      );
    }

    const drivers = Object.values(outstandingByUser).sort(
      (a, b) => b.totalOutstanding - a.totalOutstanding,
    );

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
