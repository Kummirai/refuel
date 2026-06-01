import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const settingsCollection = db.collection("settings");
    const settings = await settingsCollection.findOne({ type: "app_settings" });

    let cycle = settings?.managerCycle || null;

    if (!cycle?.startDate || !cycle?.endDate) {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      cycle = {
        startDate: monday.toISOString(),
        endDate: sunday.toISOString(),
        periodType: "weekly",
      };
    }

    return NextResponse.json({ cycle });
  } catch (error) {
    console.error("Error fetching cycle:", error);
    return NextResponse.json(
      { error: "Failed to fetch cycle" },
      { status: 500 },
    );
  }
}
