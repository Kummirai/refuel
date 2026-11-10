import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { driverName, driverEmail, driverPhone, installmentAmount, outstandingBalance, mode } = body;

    if (!driverName) {
      return NextResponse.json(
        { error: "driverName is required" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection("invoiceHistory");

    await collection.insertOne({
      driverName,
      driverEmail: driverEmail || "",
      driverPhone: driverPhone || "",
      channel: "whatsapp",
      type: "payment-plan",
      mode: mode || "installment",
      installmentAmount: installmentAmount || 0,
      outstandingBalance: outstandingBalance || 0,
      sentAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging payment plan WhatsApp invoice:", error);
    return NextResponse.json(
      { error: "Failed to log invoice" },
      { status: 500 },
    );
  }
}
