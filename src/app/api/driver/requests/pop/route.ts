// src/app/api/driver/requests/pop/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb/client";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    console.log("POP API called");

    // Verify user is authenticated
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User authenticated:", session.user.id);

    const body = await request.json();
    console.log("Received body:", JSON.stringify(body, null, 2));

    const {
      requestId,
      actualAmount,
      popUrl,
      popPublicId,
      interest,
      totalRepayable,
      dailyPayment,
      repaymentDays,
    } = body;

    // Validate required fields
    if (!requestId) {
      console.log("Missing requestId");
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    if (!actualAmount || actualAmount <= 0) {
      console.log("Missing or invalid actualAmount");
      return NextResponse.json(
        { error: "Missing or invalid actual amount" },
        { status: 400 },
      );
    }

    if (!popUrl) {
      console.log("Missing popUrl");
      return NextResponse.json({ error: "Missing popUrl" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const requestsCollection = db.collection("serviceRequests");

    console.log(`These are the ${requestsCollection}`);

    // Find the request
    const existingRequest = await requestsCollection.findOne({
      _id: new ObjectId(requestId),
      userId: session.user.id,
    });

    if (!existingRequest) {
      console.log("Request not found:", requestId);
      return NextResponse.json(
        { error: `Request ${requestId} not found` },
        { status: 404 },
      );
    }

    console.log("Found request:", existingRequest);

    // Update the request
    const updateResult = await requestsCollection.updateOne(
      {
        _id: new ObjectId(requestId),
        userId: session.user.id,
      },
      {
        $set: {
          actualAmount: actualAmount,
          popUrl: popUrl,
          popPublicId: popPublicId || `pop_${requestId}_${Date.now()}`,
          popUploadedAt: new Date(),
          interest: interest,
          totalRepayable: totalRepayable,
          dailyPayment: dailyPayment,
          repaymentDays: repaymentDays || 7,
          status: "completed",
          updatedAt: new Date(),
        },
      },
    );

    console.log("Update result:", updateResult);

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update request" },
        { status: 500 },
      );
    }

    // Update user's total spent
    const driverProfilesCollection = db.collection("driverProfiles");
    await driverProfilesCollection.updateOne(
      { userId: session.user.id },
      {
        $inc: { totalSpent: actualAmount, totalRequests: 1 },
        $set: { updatedAt: new Date() },
      },
      { upsert: true },
    );

    console.log("Successfully updated profile");

    return NextResponse.json({
      success: true,
      message: "POP uploaded successfully",
      data: { actualAmount, totalRepayable, dailyPayment },
    });
  } catch (error) {
    console.error("POP upload error:", error);
    return NextResponse.json(
      { error: "Failed to process POP: " + error.message },
      { status: 500 },
    );
  }
}
