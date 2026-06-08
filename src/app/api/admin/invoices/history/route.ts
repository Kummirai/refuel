import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");

    const filter: Record<string, any> = {};
    if (channel) filter.channel = channel;

    const raw = await db
      .collection("invoiceHistory")
      .find(filter)
      .sort({ sentAt: -1 })
      .limit(50)
      .toArray();

    const history = raw.map((r: any) => {
      if (r.singleRecipient && !r.drivers) {
        r.drivers = [{
          driverName: r.driverName || '',
          driverEmail: r.driverEmail || '',
          driverPhone: r.driverPhone || '',
          outstanding: r.totalOutstanding || 0,
          items: r.items || [],
        }];
      }
      if (r.totalOutstanding === undefined) r.totalOutstanding = 0;
      if (r.totalDrivers === undefined) r.totalDrivers = (r.drivers && r.drivers.length) || 1;
      return r;
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Error fetching invoice history:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice history" },
      { status: 500 },
    );
  }
}
