// src/app/api/admin/requests/sent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const body = await req.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 },
      );
    }

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

    const serviceRequest = await serviceRequestsCollection.findOne({
      _id: objectId,
    });

    if (!serviceRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (serviceRequest.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved requests can be marked as sent" },
        { status: 400 },
      );
    }

    const result = await serviceRequestsCollection.updateOne(
      { _id: objectId },
      {
        $set: {
          status: "sent",
          sentDate: new Date().toISOString(),
        },
      },
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update request status" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Request marked as sent successfully",
    });
  } catch (error) {
    console.error("Error marking request as sent:", error);
    return NextResponse.json(
      { error: "Failed to mark request as sent" },
      { status: 500 },
    );
  }
}
