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

    // Query for requests that have been completed (POP uploaded) but haven't had their receipts verified
    let query: any = { 
      completedDate: { $ne: null }
    };

    if (status === "pending") {
      query.hasReceipt = { $eq: false };
    } else if (status === "verified") {
      query.hasReceipt = { $eq: true };
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
