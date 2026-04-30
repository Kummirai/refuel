import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { sendDriverRejectionEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { requestId, reason } = await request.json();

    console.log("Rejecting request:", requestId, "Reason:", reason);

    if (!requestId) {
      return NextResponse.json(
        { error: "Missing request ID" },
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
          status: "rejected",
          rejectionReason: reason || "No reason provided",
          rejectedDate: new Date(),
        },
      },
    );

    // Send email notification to driver (run in background)
    (async () => {
      try {
        await sendDriverRejectionEmail({
          driverEmail: requestDoc.driverEmail,
          driverName: requestDoc.driverName,
          requestId: requestId,
          serviceType: requestDoc.type,
          amount: requestDoc.amount,
          reason: reason || "No reason provided",
        });
        console.log("Driver rejection email sent for request:", requestId);
      } catch (emailError) {
        console.error("Failed to send driver rejection email:", emailError);
        // Don't fail the request if email fails
      }
    })();

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
