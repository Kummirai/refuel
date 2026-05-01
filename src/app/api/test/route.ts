// src/app/api/test/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  console.log("✅ Test API was called!");
  return NextResponse.json({
    success: true,
    message: "Test API is working",
    timestamp: new Date().toISOString(),
  });
}

export async function POST() {
  console.log("✅ Test API POST was called!");
  return NextResponse.json({
    success: true,
    message: "Test API POST is working",
  });
}
