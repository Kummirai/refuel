import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
    const { requestId, reason } = await request.json();

    if (!requestId) {
      return NextResponse.json(
        { error: "Missing request ID" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");

    let objectId;
    try {
      objectId = new ObjectId(requestId);
    } catch {
      return NextResponse.json(
        { error: "Invalid request ID format" },
        { status: 400 },
      );
    }

    const requestDoc = await serviceRequestsCollection.findOne({ _id: objectId });

    if (!requestDoc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    await serviceRequestsCollection.updateOne(
      { _id: objectId },
      {
        $set: {
          receiptStatus: "rejected",
          receiptRejectionReason: reason || "No reason provided",
          receiptRejectedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({
      success: true,
      message: "Receipt rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting receipt:", error);
    return NextResponse.json(
      { error: "Failed to reject receipt" },
      { status: 500 },
    );
  }
}
