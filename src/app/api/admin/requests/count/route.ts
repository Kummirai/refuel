// src/app/api/admin/requests/count/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    const pending = await db.collection("serviceRequests").countDocuments({
      status: "pending",
    });

    console.log(pending);

    return NextResponse.json({ pending });
  } catch (error) {
    console.error("Error fetching requests count:", error);
    return NextResponse.json({ pending: 0 });
  }
}
