import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getManagerCycle } from "@/lib/utils/cycle";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const { startDate: cycleStart, endDate: cycleEnd } = await getManagerCycle(db, from, to);

    const serviceRequestsCollection = db.collection("serviceRequests");

    const [pendingCount, completedCount, refueledCount] = await Promise.all([
      serviceRequestsCollection.countDocuments({
        approvedDate: { $gte: cycleStart, $lte: cycleEnd },
        status: { $in: ["approved", "sent"] },
      }),
      serviceRequestsCollection.countDocuments({
        approvedDate: { $gte: cycleStart, $lte: cycleEnd },
        status: "completed",
      }),
      serviceRequestsCollection.countDocuments({
        approvedDate: { $gte: cycleStart, $lte: cycleEnd },
        status: "completed",
        refueledByManager: true,
      }),
    ]);

    return NextResponse.json({
      pending: pendingCount,
      completed: completedCount,
      refueledByManager: refueledCount,
    });
  } catch (error) {
    console.error("Error fetching manager stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
