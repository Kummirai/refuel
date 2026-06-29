import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ discountPercent: 0 });
    }

    const discount = await db.collection("discounts").findOne({ driverEmail: email });
    return NextResponse.json({
      discountPercent: discount?.discountPercent || 0,
    });
  } catch (error) {
    console.error("Error fetching driver discount:", error);
    return NextResponse.json({ error: "Failed to fetch discount" }, { status: 500 });
  }
}
