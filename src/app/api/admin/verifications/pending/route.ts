// src/app/api/admin/verifications/pending/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5");

    const { db } = await connectToDatabase();
    
    // Fetch pending verifications from driverProfiles collection
    const pendingVerifications = await db
      .collection("driverProfiles")
      .find({ verificationStatus: "pending" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({ data: pendingVerifications });
  } catch (error) {
    console.error("Error fetching pending verifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending verifications" },
      { status: 500 },
    );
  }
}
