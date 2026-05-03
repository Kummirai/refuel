// src/app/api/admin/verifications/count/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    const pending = await db.collection("driverProfiles").countDocuments({
      verificationStatus: "pending",
    });

    console.log(`Pending verifications ${pending}`);

    return NextResponse.json({ pending });
  } catch (error) {
    console.error("Error fetching verification count:", error);
    return NextResponse.json({ pending: 0 });
  }
}
