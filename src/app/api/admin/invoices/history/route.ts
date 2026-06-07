import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");

    const filter: Record<string, any> = {};
    if (channel) filter.channel = channel;

    const history = await db
      .collection("invoiceHistory")
      .find(filter)
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
