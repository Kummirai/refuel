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

    const allowedStatuses = ["rejected", "approved", "sent"];
    if (!allowedStatuses.includes(serviceRequest.status)) {
      return NextResponse.json(
        {
          error: `Requests with status "${serviceRequest.status}" cannot be deleted. Only rejected, approved, or sent requests can be deleted.`,
        },
        { status: 400 },
      );
    }

    const result = await serviceRequestsCollection.deleteOne({
      _id: objectId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Failed to delete request" },
        { status: 500 },
      );
    }

    if (serviceRequest.type === "cash") {
      const cashLoansCollection = db.collection("cashLoans");
      await cashLoansCollection.deleteMany({
        serviceRequestId: requestId,
      });
    }

    if (serviceRequest.type === "fuel") {
      const fuelRequestsCollection = db.collection("fuelRequests");
      await fuelRequestsCollection.deleteMany({
        serviceRequestId: requestId,
      });
    }

    if (serviceRequest.type === "airtime") {
      const airtimeRequestsCollection = db.collection("airtimeRequests");
      await airtimeRequestsCollection.deleteMany({
        serviceRequestId: requestId,
      });
    }

    if (serviceRequest.type === "carwash") {
      const carwashRequestsCollection = db.collection("carwashRequests");
      await carwashRequestsCollection.deleteMany({
        serviceRequestId: requestId,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting request:", error);
    return NextResponse.json(
      { error: "Failed to delete request" },
      { status: 500 },
    );
  }
}
