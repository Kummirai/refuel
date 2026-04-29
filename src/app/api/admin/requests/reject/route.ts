// src/app/api/admin/requests/reject/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

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

    // Find the request by ID
    const requestDoc = await serviceRequestsCollection.findOne({
      _id: requestId,
    });

    if (!requestDoc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Update request status
    await serviceRequestsCollection.updateOne(
      { _id: requestId },
      {
        $set: {
          status: "rejected",
          rejectionReason: reason || "No reason provided",
          approvedDate: new Date(),
        },
      },
    );

    return NextResponse.json({
      success: true,
      message: "Request rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting request:", error);
    return NextResponse.json(
      { error: "Failed to reject request" },
      { status: 500 },
    );
  }
}
