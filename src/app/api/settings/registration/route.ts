import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

function buildAdminPhones(settings: any): string {
  const phoneSources = [
    settings?.general?.adminPhoneNumbers,
    settings?.notifications?.adminPhone,
    settings?.general?.contactPhone,
    settings?.business?.businessPhone,
  ];
  const unique = phoneSources
    .filter(Boolean)
    .flatMap((p) => p.split(",").map((s: string) => s.trim()))
    .filter(Boolean);
  return [...new Set(unique)].join(", ");
}

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const settings = await db.collection("settings").findOne(
      { type: "app_settings" },
    );

    return NextResponse.json({
      holdRegistration: settings?.general?.holdRegistration ?? false,
      adminPhoneNumbers: buildAdminPhones(settings),
    }, {
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
  } catch {
    return NextResponse.json({
      holdRegistration: false,
      adminPhoneNumbers: "",
    }, {
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
  }
}
