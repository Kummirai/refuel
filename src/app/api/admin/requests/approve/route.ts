// src/app/api/admin/requests/approve/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb"; // Import ObjectId

export async function POST(request: Request) {
  try {
    const { requestId, otp } = await request.json();

    console.log(requestId);

    if (!requestId || !otp) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");

    // Convert string ID to ObjectId
    let objectId;
    try {
      objectId = new ObjectId(requestId);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request ID format" },
        { status: 400 },
      );
    }

    // Find the request by ID using ObjectId
    const requestDoc = await serviceRequestsCollection.findOne({
      _id: objectId,
    });

    if (!requestDoc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Update request status
    await serviceRequestsCollection.updateOne(
      { _id: objectId },
      {
        $set: {
          status: "approved",
          otp: otp,
          approvedDate: new Date(),
        },
      },
    );

    return NextResponse.json({
      success: true,
      message: "Request approved successfully",
      otp,
    });
  } catch (error) {
    console.error("Error approving request:", error);
    return NextResponse.json(
      { error: "Failed to approve request" },
      { status: 500 },
    );
  }
}
