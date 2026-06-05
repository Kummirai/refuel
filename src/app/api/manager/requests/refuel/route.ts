import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { sendPushNotification, sendAdminPushNotification } from "@/lib/notifications";

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
    const usersCollection = db.collection("user");

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

    // Send push notification to driver
    const user = await usersCollection.findOne({ _id: new ObjectId(requestDoc.userId) });
    const pushTokens = user?.pushTokens?.length ? user.pushTokens : user?.expoPushToken ? [user.expoPushToken] : [];

    if (pushTokens.length) {

      await sendPushNotification(

        pushTokens,
        "Refueling Completed",
        `Your ${requestDoc.type} request has been marked as completed by the manager.`,
        { screen: "Requests" }
      );
    }

    // Send push notification to all admins
    sendAdminPushNotification(
      "Refueling Completed",
      `${requestDoc.driverName || "A driver"}'s ${requestDoc.type} request has been completed by the manager.`,
      { screen: "AdminRequests" }
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
