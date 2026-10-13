// src/app/api/driver/fuel-credit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getDriverFuelCredit, getFuelCreditWeek } from "@/lib/fuel-credit";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const credit = await getDriverFuelCredit(db, userId);

    return NextResponse.json(credit);
  } catch (error) {
    console.error("Error fetching fuel credit:", error);
    const week = getFuelCreditWeek();
    return NextResponse.json(
      {
        error: "Failed to fetch fuel credit",
        limit: 0,
        used: 0,
        remaining: 0,
        weekStart: week.startDate,
        weekEnd: week.endDate,
        isDefaultLimit: true,
      },
      { status: 500 },
    );
  }
}
