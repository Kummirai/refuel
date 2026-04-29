// src/app/api/admin/repayments/pay/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { repaymentId, amount } = await request.json();

    if (!repaymentId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment details" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");
    const paymentsCollection = db.collection("loanPayments");

    // Get the loan
    const loan = await serviceRequestsCollection.findOne({ _id: repaymentId });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    const totalRepayable =
      loan.totalRepayable ||
      loan.amount * (1 + (loan.interestRate || 13) / 100);
    const currentRepaid = loan.repaidAmount || 0;
    const newRepaid = currentRepaid + amount;
    const isFullyPaid = newRepaid >= totalRepayable;

    // Record the payment
    await paymentsCollection.insertOne({
      loanId: repaymentId,
      amount,
      paymentDate: new Date(),
      remainingBalance: totalRepayable - newRepaid,
      createdAt: new Date(),
    });

    // Update loan with new repaid amount and status
    await serviceRequestsCollection.updateOne(
      { _id: repaymentId },
      {
        $set: {
          repaidAmount: newRepaid,
          lastPaymentDate: new Date(),
          ...(isFullyPaid && {
            status: "completed",
            completedDate: new Date(),
          }),
        },
      },
    );

    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully",
      remainingBalance: totalRepayable - newRepaid,
      isFullyPaid,
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 },
    );
  }
}
