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

    // Validate status before deleting — peek without deleting yet
    const serviceRequest = await serviceRequestsCollection.findOne(
      { _id: objectId },
      { projection: { status: 1, type: 1 } }, // only fetch what we need
    );

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

    // Delete the main record in one shot
    const deleted = await serviceRequestsCollection.findOneAndDelete({
      _id: objectId,
    });

    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete request" },
        { status: 500 },
      );
    }

    // Clean up related records in parallel — don't wait sequentially
    const type = serviceRequest.type;
    const relatedCollectionMap: Record<string, string> = {
      cash: "cashLoans",
      fuel: "fuelRequests",
      airtime: "airtimeRequests",
      carwash: "carwashRequests",
    };

    const relatedCollection = relatedCollectionMap[type];
    if (relatedCollection) {
      // Fire and forget — don't block the response on cleanup
      db.collection(relatedCollection)
        .deleteMany({ serviceRequestId: requestId })
        .catch((err: any) => {
          console.error(`Failed to clean up ${relatedCollection}:`, err);
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
