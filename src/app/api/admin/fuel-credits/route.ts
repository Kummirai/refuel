// src/app/api/admin/fuel-credits/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { toMoney } from "@/lib/money";
import { getAllDriverFuelCredits } from "@/lib/fuel-credit";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if ((session.user as { role?: string }).role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { db } = await connectToDatabase();
    const data = await getAllDriverFuelCredits(db);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching fuel credits:", error);
    return NextResponse.json(
      { error: "Failed to fetch fuel credits" },
      { status: 500 },
    );
  }
}

// body: { userId, limit: number | null, isDefaultLimit?: boolean }
// - limit: number → set per-driver override
// - limit: null → clear override (back to global default)
// - isDefaultLimit: true with no userId → update the global default
export async function PUT(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { userId, limit, isDefaultLimit } = body;

    if (isDefaultLimit === true && !userId) {
      const value = Number(limit);
      if (!Number.isFinite(value) || value < 0) {
        return NextResponse.json(
          { error: "Invalid default limit amount" },
          { status: 400 },
        );
      }

      const { db } = await connectToDatabase();
      const defaultLimit = toMoney(value);
      await db.collection("settings").updateOne(
        { type: "app_settings" },
        {
          $set: {
            "fuelCredit.defaultLimit": defaultLimit,
            updatedAt: new Date(),
          },
          $setOnInsert: { type: "app_settings" },
        },
        { upsert: true },
      );

      return NextResponse.json({ success: true, defaultLimit });
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    if (limit === null) {
      const { db } = await connectToDatabase();
      await db.collection("driverProfiles").updateOne(
        { userId },
        { $unset: { fuelCreditLimit: "" }, $set: { updatedAt: new Date() } },
      );
      return NextResponse.json({ success: true, userId, limit: null });
    }

    const value = Number(limit);
    if (!Number.isFinite(value) || value < 0) {
      return NextResponse.json(
        { error: "Invalid limit amount" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const capped = toMoney(value);
    await db.collection("driverProfiles").updateOne(
      { userId },
      {
        $set: { fuelCreditLimit: capped, updatedAt: new Date() },
        $setOnInsert: { userId },
      },
      { upsert: true },
    );

    return NextResponse.json({ success: true, userId, limit: capped });
  } catch (error) {
    console.error("Error updating fuel credit:", error);
    return NextResponse.json(
      { error: "Failed to update fuel credit" },
      { status: 500 },
    );
  }
}
