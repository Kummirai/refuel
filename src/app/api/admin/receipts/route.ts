// src/app/api/admin/receipts/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "100");

    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");
    const usersCollection = db.collection("user");

    let query: any = {};

    if (status === "pending") {
      // Completed requests where receipt is uploaded but NOT yet verified
      // Exclude manager-confirmed requests without popUrl (they go to noReceipt tab)
      query = {
        completedDate: { $ne: null },
        popUrl: { $exists: true, $nin: [null, ""] },
        $nor: [
          { hasReceipt: true },
          { receiptStatus: "verified" },
        ],
      };
    } else if (status === "verified") {
      // Completed requests with verified receipts
      query.completedDate = { $ne: null };
      query.$or = [
        { hasReceipt: true },
        { receiptStatus: "verified" },
      ];
    } else if (status === "noreceipt") {
      query = {
        $or: [
          {
            status: { $in: ["approved", "sent"] },
            $or: [
              { popUrl: { $exists: false } },
              { popUrl: null },
              { popUrl: "" },
            ],
          },
          {
            status: "completed",
            refueledByManager: true,
            $or: [
              { popUrl: { $exists: false } },
              { popUrl: null },
              { popUrl: "" },
            ],
          },
        ],
      };
    }

    const receipts = await serviceRequestsCollection
      .find(query)
      .sort({ completedDate: -1 })
      .limit(limit)
      .toArray();

    // Get driver details for each receipt
    const receiptsWithDetails = await Promise.all(
      receipts.map(async (request: any) => {
        let userIdQuery;
        try {
          userIdQuery = new ObjectId(request.userId);
        } catch {
          userIdQuery = request.userId;
        }

        let user = await usersCollection.findOne({ _id: userIdQuery });
        if (!user && typeof request.userId === "string") {
          user = await usersCollection.findOne({ _id: request.userId });
        }

        return {
          id: request._id.toString(),
          _id: request._id.toString(),
          userId: request.userId,
          type: request.type,
          amount: request.amount,
          actualAmount: request.actualAmount || null,
          carNumber: request.carNumber,
          carRegistration: request.carNumber,
          driverName: request.driverName || user?.name || "Unknown",
          driverEmail: request.driverEmail || user?.email || "Unknown",
          driverPhone: request.driverPhone || user?.phone || "Unknown",
          serviceType: request.type,
          status: request.status,
          requestDate: request.requestDate,
          completedDate: request.completedDate,
          popUrl: request.popUrl,
          popUploadedAt: request.popUploadedAt,
          hasReceipt: request.hasReceipt || false,
          receiptVerifiedAt: request.receiptVerifiedAt || null,
          receiptStatus: request.receiptStatus || (request.hasReceipt ? "verified" : "pending"),
          receiptRejectionReason: request.receiptRejectionReason || null,
          receiptRejectedAt: request.receiptRejectedAt || null,
          correctedByAdmin: request.correctedByAdmin || false,
          totalRepayable: request.totalRepayable,
          remainingBalance: request.remainingBalance,
          dueDate: request.dueDate || request.completedDate, // Fallback for sorting/display
        };
      }),
    );

    return NextResponse.json({
      data: receiptsWithDetails,
      count: receiptsWithDetails.length
    });
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipts" },
      { status: 500 },
    );
  }
}
