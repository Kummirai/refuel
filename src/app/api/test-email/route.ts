import { NextResponse } from "next/server";
import { sendAdminNotificationEmail } from "@/lib/email";

export async function GET() {
  try {
    await sendAdminNotificationEmail({
      requestId: "TEST123",
      driverName: "Test Driver",
      driverEmail: "mieltonkumirai@gmail.com",
      driverPhone: "1234567890",
      carRegistration: "TEST 123",
      carModel: "Test Car",
      serviceType: "fuel",
      amount: 1000,
      phoneNumber: "9876543210",
      requestDate: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Test email sent! Check your admin email inbox.",
    });
  } catch (error) {
    console.error("Test email failed:", error);
    return NextResponse.json(
      { error: "Failed to send test email: " + (error as Error).message },
      { status: 500 },
    );
  }
}
