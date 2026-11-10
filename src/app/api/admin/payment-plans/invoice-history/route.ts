import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const searchParams = request.nextUrl.searchParams;
    const driverEmail = searchParams.get("driverEmail");

    if (!driverEmail) {
      return NextResponse.json(
        { error: "driverEmail is required" },
        { status: 400 },
      );
    }

    const records = await db
      .collection("invoiceHistory")
      .find({ driverEmail, type: "payment-plan" })
      .sort({ sentAt: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json(
      records.map((r: any) => ({
        id: r._id?.toString(),
        channel: r.channel,
        mode: r.mode || "full",
        installmentAmount: r.installmentAmount || 0,
        outstandingBalance: r.outstandingBalance || 0,
        sentAt: r.sentAt,
      })),
    );
  } catch (error) {
    console.error("Error fetching payment plan invoice history:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice history" },
      { status: 500 },
    );
  }
}
