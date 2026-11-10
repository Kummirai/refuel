import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    const [verifications, requests, repayments, receipts, deposits, proofUserIds] =
      await Promise.all([
        db.collection("driverProfiles").countDocuments({ verificationStatus: "pending" }),
        db.collection("serviceRequests").countDocuments({ status: "pending" }),
        db.collection("repaymentProofs").countDocuments({ status: "pending" }),
        db.collection("serviceRequests").countDocuments({
          completedDate: { $ne: null },
          popUrl: { $exists: true, $nin: [null, ""] },
          $nor: [
            { hasReceipt: true },
            { receiptStatus: "verified" },
          ],
        }),
        db.collection("depositProofs").countDocuments({ status: "pending" }),
        db.collection("depositProofs").distinct("userId", {}),
      ]);

    // Contracts accepted but no proof uploaded yet — needs admin follow-up.
    const depositContracts = await db
      .collection("driverProfiles")
      .countDocuments({
        depositTier: { $in: ["TIER_1", "TIER_2"] },
        userId: { $nin: proofUserIds },
        $expr: { $eq: [{ $ifNull: ["$securityDepositBalance", 0] }, 0] },
      });

    return NextResponse.json({
      verifications,
      requests,
      repayments,
      receipts,
      deposits,
      depositContracts,
    });
  } catch (error) {
    console.error("Error fetching notification counts:", error);
    return NextResponse.json({
      verifications: 0,
      requests: 0,
      repayments: 0,
      receipts: 0,
      deposits: 0,
      depositContracts: 0,
    });
  }
}
