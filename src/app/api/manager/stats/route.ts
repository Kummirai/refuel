import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const settingsCollection = db.collection("settings");
    const settings = await settingsCollection.findOne({ type: "app_settings" });

    let cycleStart: Date;
    let cycleEnd: Date;

    if (from && to) {
      cycleStart = new Date(from);
      cycleEnd = new Date(to);
      cycleEnd.setHours(23, 59, 59, 999);
    } else if (settings?.managerCycle?.startDate && settings?.managerCycle?.endDate) {
      cycleStart = new Date(settings.managerCycle.startDate);
      cycleEnd = new Date(settings.managerCycle.endDate);
      cycleEnd.setHours(23, 59, 59, 999);
    } else {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      cycleStart = new Date(now);
      cycleStart.setDate(now.getDate() + diffToMonday);
      cycleStart.setHours(0, 0, 0, 0);
      cycleEnd = new Date(cycleStart);
      cycleEnd.setDate(cycleStart.getDate() + 6);
      cycleEnd.setHours(23, 59, 59, 999);
    }

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
