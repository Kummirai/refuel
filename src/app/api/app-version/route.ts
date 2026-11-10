import { NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/app-version";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(APP_VERSION, {
    headers: { "Cache-Control": "no-store" },
  });
}
