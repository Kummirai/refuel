import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { driverName, driverEmail, driverPhone, items, totalOutstanding } = body;

    if (!driverName) {
      return NextResponse.json({ error: "driverName is required" }, { status: 400 });
    }

    await db.collection("invoiceHistory").insertOne({
      channel: "whatsapp",
      sentAt: new Date(),
      singleRecipient: true,
      driverName,
      driverEmail: driverEmail || "",
      driverPhone: driverPhone || "",
      totalOutstanding: totalOutstanding || 0,
      items: items || [],
      sent: 1,
      errors: 0,
      dateRange: body.dateRange || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging WhatsApp invoice:", error);
    return NextResponse.json(
      { error: "Failed to log WhatsApp invoice" },
      { status: 500 },
    );
  }
}
