// src/app/api/admin/requests/complete/route.ts
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

    // Find the request
    const serviceRequest = await serviceRequestsCollection.findOne({
      _id: objectId,
    });

    if (!serviceRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Check if request is approved (can only complete approved requests)
    if (serviceRequest.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved requests can be marked as completed" },
        { status: 400 },
      );
    }

    // Update the request status to completed
    const result = await serviceRequestsCollection.updateOne(
      { _id: objectId },
      {
        $set: {
          status: "completed",
          completedDate: new Date().toISOString(),
        },
      },
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update request status" },
        { status: 500 },
      );
    }

    // Get the updated request
    const updatedRequest = await serviceRequestsCollection.findOne({
      _id: objectId,
    });

    // If it's a cash loan, update any related loan record
    if (serviceRequest.type === "cash") {
      const cashLoansCollection = db.collection("cashLoans");

      await cashLoansCollection.updateMany(
        { serviceRequestId: requestId },
        {
          $set: {
            status: "completed",
            completedAt: new Date().toISOString(),
          },
        },
      );
    }

    // If it's fuel request, you might want to update fuel request status
    if (serviceRequest.type === "fuel") {
      const fuelRequestsCollection = db.collection("fuelRequests");

      await fuelRequestsCollection.updateMany(
        { serviceRequestId: requestId },
        {
          $set: {
            status: "completed",
            completedAt: new Date().toISOString(),
          },
        },
      );
    }

    // If it's airtime request, update airtime request status
    if (serviceRequest.type === "airtime") {
      const airtimeRequestsCollection = db.collection("airtimeRequests");

      await airtimeRequestsCollection.updateMany(
        { serviceRequestId: requestId },
        {
          $set: {
            status: "completed",
            completedAt: new Date().toISOString(),
          },
        },
      );
    }

    // If it's carwash request, update carwash request status
    if (serviceRequest.type === "carwash") {
      const carwashRequestsCollection = db.collection("carwashRequests");

      await carwashRequestsCollection.updateMany(
        { serviceRequestId: requestId },
        {
          $set: {
            status: "completed",
            completedAt: new Date().toISOString(),
          },
        },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Request marked as completed successfully",
      request: {
        id: updatedRequest._id,
        status: updatedRequest.status,
        completedDate: updatedRequest.completedDate,
      },
    });
  } catch (error) {
    console.error("Error completing request:", error);
    return NextResponse.json(
      { error: "Failed to complete request" },
      { status: 500 },
    );
  }
}
