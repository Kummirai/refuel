import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("serviceRequests");

    const pending = await collection.countDocuments({
      completedDate: { $ne: null },
      popUrl: { $exists: true, $nin: [null, ""] },
      hasReceipt: { $eq: false },
    });

    const noReceipt = await collection.countDocuments({
      $or: [
        {
          status: { $in: ["approved", "sent"] },
          $or: [
            { popUrl: { $exists: false } },
            { popUrl: null },
            { popUrl: "" },
          ],
        },
        {
          status: "completed",
          refueledByManager: true,
          $or: [
            { popUrl: { $exists: false } },
            { popUrl: null },
            { popUrl: "" },
          ],
        },
      ],
    });

    return NextResponse.json({ pending, noReceipt });
  } catch (error) {
    console.error("Error fetching receipt counts:", error);
    return NextResponse.json({ pending: 0, noReceipt: 0 });
  }
}
