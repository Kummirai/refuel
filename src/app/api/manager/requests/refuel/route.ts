import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json(
        { error: "Missing requestId" },
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
        { error: "Invalid request ID" },
        { status: 400 },
      );
    }

    const requestDoc = await serviceRequestsCollection.findOne({ _id: objectId });
    if (!requestDoc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (requestDoc.status !== "approved" && requestDoc.status !== "sent") {
      return NextResponse.json(
        { error: `Cannot refuel a request with status "${requestDoc.status}"` },
        { status: 400 },
      );
    }

    await serviceRequestsCollection.updateOne(
      { _id: objectId },
      {
        $set: {
          status: "completed",
          refueledByManager: true,
          completedDate: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({
      success: true,
      message: "Request marked as refueled (completed)",
    });
  } catch (error) {
    console.error("Error marking as refueled:", error);
    return NextResponse.json(
      { error: "Failed to mark as refueled" },
      { status: 500 },
    );
  }
}
