import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const history = await db
      .collection("invoiceHistory")
      .find()
      .sort({ sentAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Error fetching invoice history:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice history" },
      { status: 500 },
    );
  }
}
