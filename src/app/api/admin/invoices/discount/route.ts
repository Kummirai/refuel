import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { driverEmail, discountPercent } = body;

    if (!driverEmail || discountPercent === undefined) {
      return NextResponse.json(
        { error: "driverEmail and discountPercent are required" },
        { status: 400 },
      );
    }

    if (discountPercent < 0 || discountPercent > 100) {
      return NextResponse.json(
        { error: "discountPercent must be between 0 and 100" },
        { status: 400 },
      );
    }

    await db.collection("discounts").updateOne(
      { driverEmail },
      { $set: { driverEmail, discountPercent, updatedAt: new Date() } },
      { upsert: true },
    );

    return NextResponse.json({ success: true, driverEmail, discountPercent });
  } catch (error) {
    console.error("Error saving discount:", error);
    return NextResponse.json({ error: "Failed to save discount" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const driverEmail = searchParams.get("driverEmail");

    if (!driverEmail) {
      const discounts = await db.collection("discounts").find({}).toArray();
      const map: Record<string, number> = {};
      for (const d of discounts) {
        map[d.driverEmail] = d.discountPercent;
      }
      return NextResponse.json({ discounts: map });
    }

    const discount = await db.collection("discounts").findOne({ driverEmail });
    return NextResponse.json({
      discountPercent: discount?.discountPercent || 0,
    });
  } catch (error) {
    console.error("Error fetching discount:", error);
    return NextResponse.json({ error: "Failed to fetch discount" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    let driverEmail: string | null = null;

    try {
      const body = await request.json();
      driverEmail = body.driverEmail;
    } catch {
      const { searchParams } = new URL(request.url);
      driverEmail = searchParams.get("driverEmail");
    }

    if (!driverEmail) {
      return NextResponse.json({ error: "driverEmail is required" }, { status: 400 });
    }

    await db.collection("discounts").deleteOne({ driverEmail });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting discount:", error);
    return NextResponse.json({ error: "Failed to delete discount" }, { status: 500 });
  }
}
