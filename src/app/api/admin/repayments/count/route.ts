// src/app/api/admin/repayments/count/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    const pending = await db.collection("repaymentProofs").countDocuments({
      status: "pending",
    });

    console.log(`Pending repayments: ${pending}`);

    return NextResponse.json({ pending });
  } catch (error) {
    console.error("Error fetching repayments count:", error);
    return NextResponse.json({ pending: 0 });
  }
}
