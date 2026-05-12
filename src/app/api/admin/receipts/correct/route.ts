import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
    const { requestId, updates } = await request.json();

    if (!requestId) {
      return NextResponse.json(
        { error: "Missing request ID" },
        { status: 400 },
      );
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
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

    const allowedFields = [
      "actualAmount",
      "driverName",
      "driverEmail",
      "driverPhone",
      "carNumber",
    ];

    const setFields: Record<string, any> = {
      updatedAt: new Date(),
    };

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setFields[key] = value;
      }
    }

    setFields.correctedByAdmin = true;
    setFields.correctedAt = new Date();

    const result = await serviceRequestsCollection.updateOne(
      { _id: objectId },
      { $set: setFields },
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "No changes were made" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Receipt information corrected successfully",
      updatedFields: Object.keys(setFields).filter(k => k !== "updatedAt" && k !== "correctedByAdmin" && k !== "correctedAt"),
    });
  } catch (error) {
    console.error("Error correcting receipt:", error);
    return NextResponse.json(
      { error: "Failed to correct receipt" },
      { status: 500 },
    );
  }
}
