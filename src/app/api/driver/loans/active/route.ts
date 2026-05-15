// src/app/api/driver/loans/active/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { toMoney } from "@/lib/money";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");

    const activeLoan = await serviceRequestsCollection.findOne({
      userId,
      type: "cash",
      status: "approved",
      completedDate: { $exists: false },
    });

    if (activeLoan) {
      // Calculate remaining amount and daily payment
      const repaid = toMoney(
        activeLoan.amount - (activeLoan.remaining || activeLoan.amount)
      );
      const remaining = activeLoan.remaining || activeLoan.amount;
      const dailyPayment = toMoney(remaining / 14); // Assuming 14 days repayment period

      return NextResponse.json({
        id: activeLoan._id,
        amount: activeLoan.amount,
        remaining: remaining,
        repaid: repaid,
        dailyPayment: dailyPayment,
        interestRate: activeLoan.interestRate || 13,
        dueDate: activeLoan.approvedDate
          ? new Date(
              new Date(activeLoan.approvedDate).getTime() +
                14 * 24 * 60 * 60 * 1000,
            )
          : null,
      });
    }

    return NextResponse.json(null);
  } catch (error) {
    console.error("Error fetching active loan:", error);
    return NextResponse.json(
      { error: "Failed to fetch active loan" },
      { status: 500 },
    );
  }
}
