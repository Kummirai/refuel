import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { toMoney } from "@/lib/money";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const settings = await db.collection("settings").findOne({ type: "app_settings" });
    const budget = settings?.fuelBudget || { total: 0, lastReset: null };

    const total = budget.total || 0;
    const searchParams = request.nextUrl.searchParams;
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    let sinceDate: Date;
    if (fromParam) {
      sinceDate = new Date(fromParam);
    } else {
      sinceDate = budget.lastReset ? new Date(budget.lastReset) : new Date(0);
    }

    const matchFilter: any = { type: "fuel", status: { $in: ["approved", "sent", "completed"] } };
    if (fromParam || toParam) {
      matchFilter.requestDate = {};
      if (fromParam) matchFilter.requestDate.$gte = new Date(fromParam);
      if (toParam) {
        const endDate = new Date(toParam);
        endDate.setHours(23, 59, 59, 999);
        matchFilter.requestDate.$lte = endDate;
      }
    } else {
      matchFilter.requestDate = { $gte: sinceDate };
    }

    const fuelRequests = await db.collection("serviceRequests")
      .find(matchFilter)
      .toArray();

    const used = toMoney(fuelRequests.reduce((s: number, r: any) => s + (r.actualAmount || r.amount || 0), 0));
    const remaining = toMoney(Math.max(0, total - used));

    return NextResponse.json({ total, used, remaining, lastReset: budget.lastReset });
  } catch (error) {
    console.error("Error fetching fuel budget:", error);
    return NextResponse.json({ total: 0, used: 0, remaining: 0, lastReset: null });
  }
}

export async function POST(request: Request) {
  try {
    const { total } = await request.json();
    if (typeof total !== "number" || total < 0) {
      return NextResponse.json({ error: "Invalid budget amount" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    await db.collection("settings").updateOne(
      { type: "app_settings" },
      {
        $set: {
          "fuelBudget.total": toMoney(total),
          "fuelBudget.lastReset": new Date(),
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({ success: true, total: toMoney(total), lastReset: new Date().toISOString() });
  } catch (error) {
    console.error("Error setting fuel budget:", error);
    return NextResponse.json({ error: "Failed to set fuel budget" }, { status: 500 });
  }
}
