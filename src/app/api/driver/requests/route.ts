// src/app/api/driver/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");

    const requests = await serviceRequestsCollection
      .find({ userId })
      .sort({ requestDate: -1 })
      .toArray();

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      type,
      amount,
      carNumber,
      location,
      fuelType,
      phoneNumber,
      interest,
      totalRepayable,
    } = body;

    if (!userId || !type || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");

    const requestData = {
      userId,
      type,
      amount,
      carNumber,
      location,
      fuelType,
      phoneNumber,
      interest,
      totalRepayable,
      status: "pending",
      requestDate: new Date(),
      createdAt: new Date(),
    };

    const result = await serviceRequestsCollection.insertOne(requestData);

    return NextResponse.json({
      success: true,
      requestId: result.insertedId,
      message: "Request submitted successfully",
    });
  } catch (error) {
    console.error("Error creating request:", error);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 },
    );
  }
}
