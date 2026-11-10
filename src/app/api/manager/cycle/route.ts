import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getManagerCycle } from "@/lib/utils/cycle";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const { startDate, endDate } = await getManagerCycle(db);

    return NextResponse.json({
      cycle: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        periodType: "weekly",
      },
    }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("Error fetching cycle:", error);
    return NextResponse.json(
      { error: "Failed to fetch cycle" },
      { status: 500 },
    );
  }
}
