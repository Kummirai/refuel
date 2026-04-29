// src/app/api/admin/requests/approve/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { requestId, otp } = await request.json();

    if (!requestId || !otp) {
      return NextResponse.json(
        { error: "Missing required fields" },
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
