import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { db } = await connectToDatabase();
    const batch = await db
      .collection("invoiceHistory")
      .findOne({ _id: new ObjectId(id) });

    if (!batch) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ batch });
  } catch (error) {
    console.error("Error fetching invoice batch:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice batch" },
      { status: 500 },
    );
  }
}
