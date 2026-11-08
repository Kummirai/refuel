// src/app/api/driver/deposit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getDriverDepositSummary } from "@/lib/deposit";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const isAdmin = (session.user as { role?: string }).role === "admin";
    if (!isAdmin && session.user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { db } = await connectToDatabase();
    const deposit = await getDriverDepositSummary(db, userId);
    return NextResponse.json(deposit);
  } catch (error) {
    console.error("Error fetching deposit:", error);
    return NextResponse.json(
      { error: "Failed to fetch deposit" },
      { status: 500 },
    );
  }
}
