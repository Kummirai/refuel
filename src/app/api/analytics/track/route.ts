import { type NextRequest, NextResponse } from "next/server";
import { track } from "@vercel/analytics/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventName, properties, flags } = body;

    if (!eventName || typeof eventName !== "string") {
      return NextResponse.json(
        { error: "eventName is required and must be a string" },
        { status: 400 },
      );
    }

    await track(eventName, properties, {
      flags,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Analytics] Track error:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 },
    );
  }
}
