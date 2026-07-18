import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { toMoney } from "@/lib/money";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const match: any = {};
    if (from || to) {
      const dateQuery: any = {};
      if (from) dateQuery.$gte = new Date(from);
      if (to) {
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        dateQuery.$lte = endDate;
      }
      match.requestDate = dateQuery;
    }

    const result = await db
      .collection("serviceRequests")
      .aggregate([
        { $match: match },
        {
          $addFields: {
            _amount: { $ifNull: ["$actualAmount", "$amount", 0] },
            _repaid: { $ifNull: ["$repaidAmount", 0] },
            _interest: {
              $cond: [
                { $and: [{ $ne: ["$interest", null] }, { $gt: ["$interest", 0] }] },
                "$interest",
                { $round: [{ $multiply: [{ $ifNull: ["$actualAmount", "$amount", 0] }, 0.13] }] },
              ],
            },
          },
        },
        {
          $addFields: {
            _totalRepayable: { $add: ["$_amount", "$_interest"] },
            _repayRatio: {
              $cond: [
                { $gt: [{ $add: ["$_amount", "$_interest"] }, 0] },
                { $min: [{ $divide: ["$_repaid", { $add: ["$_amount", "$_interest"] }] }, 1] },
                0,
              ],
            },
          },
        },
        {
          $addFields: {
            _actualInterest: { $multiply: ["$_interest", "$_repayRatio"] },
            _potentialInterest: {
              $cond: [
                { $lt: ["$_repaid", { $add: ["$_amount", "$_interest"] }] },
                { $multiply: ["$_interest", { $subtract: [1, "$_repayRatio"] }] },
                0,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            moneyRequested: { $sum: "$_amount" },
            repaidAmount: { $sum: "$_repaid" },
            actualInterest: { $sum: "$_actualInterest" },
            potentialInterest: { $sum: "$_potentialInterest" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const stats = result[0] || {
      moneyRequested: 0,
      repaidAmount: 0,
      actualInterest: 0,
      potentialInterest: 0,
      count: 0,
    };

    return NextResponse.json({
      moneyRequested: toMoney(stats.moneyRequested),
      principalRepaid: toMoney(stats.repaidAmount - stats.actualInterest),
      actualInterest: toMoney(stats.actualInterest),
      potentialInterest: toMoney(stats.potentialInterest),
      count: stats.count,
    });
  } catch (error) {
    console.error("Error fetching financial summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial summary" },
      { status: 500 },
    );
  }
}
