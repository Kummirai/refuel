import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

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
    const paymentPlansCollection = db.collection("paymentPlans");

    const plan = await paymentPlansCollection.findOne({ userId, isActive: true });

    return NextResponse.json({
      onPaymentPlan: !!plan,
      plan: plan
        ? {
            id: plan._id.toString(),
            installmentAmount: plan.installmentAmount,
            installmentDate: plan.installmentDate,
            outstandingBalance: plan.outstandingBalance,
            totalPaid: plan.totalPaid || 0,
          }
        : null,
    });
  } catch (error) {
    console.error("Error checking payment plan:", error);
    return NextResponse.json(
      { error: "Failed to check payment plan status" },
      { status: 500 },
    );
  }
}
