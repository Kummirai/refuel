import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { toMoney } from "@/lib/money";

export async function POST(request: Request) {
  try {
    const { loanId, interestAmount, interestRate } = await request.json();

    if (!loanId) {
      return NextResponse.json(
        { error: "loanId is required" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");
    const loanPaymentsCollection = db.collection("loanPayments");

    const loan = await serviceRequestsCollection.findOne({
      _id: new ObjectId(loanId),
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    if (loan.isPaid) {
      return NextResponse.json(
        { error: "Loan is already fully paid" },
        { status: 400 },
      );
    }

    const remainingBalance = toMoney(loan.remainingBalance || 0);
    if (remainingBalance <= 0) {
      return NextResponse.json(
        { error: "No outstanding balance to charge interest on" },
        { status: 400 },
      );
    }

    let amount = interestAmount;
    let rate = interestRate;

    if (!amount && rate) {
      amount = toMoney(remainingBalance * (rate / 100));
    } else if (!amount && !rate) {
      rate = loan.interestRate ?? 13;
      amount = toMoney(remainingBalance * (rate / 100));
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid interest amount" },
        { status: 400 },
      );
    }

    const previousTotalRepayable = toMoney(loan.totalRepayable || 0);
    const newTotalRepayable = toMoney(previousTotalRepayable + amount);
    const newRemainingBalance = toMoney(remainingBalance + amount);

    const adjustmentId = new ObjectId();

    await loanPaymentsCollection.insertOne({
      _id: adjustmentId,
      loanId,
      amount: -amount,
      paymentDate: new Date(),
      method: "interest_charge",
      reference: `Interest charge at ${rate}% on remaining balance of ${remainingBalance}`,
      remainingBalance: newRemainingBalance,
      uploadedByAdmin: true,
      createdAt: new Date(),
    });

    await serviceRequestsCollection.updateOne(
      { _id: new ObjectId(loanId) },
      {
        $set: {
          totalRepayable: newTotalRepayable,
          remainingBalance: newRemainingBalance,
        },
        $push: {
          payments: {
            id: adjustmentId.toString(),
            amount: -amount,
            date: new Date(),
            method: "interest_charge",
            reference: `Interest charge at ${rate}% on remaining balance of ${remainingBalance}`,
          },
          interestAdjustments: {
            id: adjustmentId.toString(),
            amount,
            rate,
            previousRemainingBalance: remainingBalance,
            newRemainingBalance,
            addedAt: new Date(),
          },
        },
      },
    );

    return NextResponse.json({
      success: true,
      message: `Interest of ${amount} charged at ${rate}%`,
      interestAmount: amount,
      interestRate: rate,
      previousRemainingBalance: remainingBalance,
      newRemainingBalance,
      newTotalRepayable,
      adjustmentId: adjustmentId.toString(),
    });
  } catch (error) {
    console.error("Error adding interest:", error);
    return NextResponse.json(
      { error: "Failed to add interest", details: String(error) },
      { status: 500 },
    );
  }
}
