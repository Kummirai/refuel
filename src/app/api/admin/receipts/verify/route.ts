// src/app/api/admin/receipts/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const body = await req.json();
    const { requestId, action } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 },
      );
    }

    const serviceRequestsCollection = db.collection("serviceRequests");

    // Convert requestId to ObjectId
    let objectId;
    try {
      objectId = new ObjectId(requestId);
    } catch {
      return NextResponse.json(
        { error: "Invalid request ID format" },
        { status: 400 },
      );
    }

    if (action === "verify") {
      const result = await serviceRequestsCollection.updateOne(
        { _id: objectId },
        {
          $set: {
            hasReceipt: true,
            receiptVerifiedAt: new Date(),
            updatedAt: new Date(),
          },
        },
      );

      if (result.modifiedCount === 0) {
        return NextResponse.json(
          { error: "Failed to verify receipt" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Receipt verified successfully",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error verifying receipt:", error);
    return NextResponse.json(
      { error: "Failed to verify receipt" },
      { status: 500 },
    );
  }
}
