// src/app/api/admin/repayments/complete/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
    const { repaymentId } = await request.json();

    if (!repaymentId) {
      return NextResponse.json(
        { error: "Missing repayment ID" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");

    // Get the loan/service request
    const loan = await serviceRequestsCollection.findOne({
      _id: new ObjectId(repaymentId),
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // Use the stored values
    const totalRepayable = loan.totalRepayable || loan.amount * 1.13;
    const remainingAmount = totalRepayable - (loan.repaidAmount || 0);

    // Create a final payment record for the remaining amount
    const paymentsCollection = db.collection("loanPayments");
    const paymentId = new ObjectId();

    await paymentsCollection.insertOne({
      _id: paymentId,
      loanId: repaymentId,
      amount: remainingAmount,
      paymentDate: new Date(),
      method: "bulk_completion",
      reference: "Marked as fully paid by admin",
      remainingBalance: 0,
      createdAt: new Date(),
    });

    // Get existing payments
    const existingPayments = loan.payments || [];

    // Update loan as fully paid
    await serviceRequestsCollection.updateOne(
      { _id: new ObjectId(repaymentId) },
      {
        $set: {
          repaidAmount: totalRepayable,
          lastPaymentDate: new Date(),
          status: "completed",
          completedDate: new Date(),
        },
        $push: {
          payments: {
            id: paymentId.toString(),
            amount: remainingAmount,
            date: new Date(),
            method: "bulk_completion",
            reference: "Marked as fully paid by admin",
          },
        },
      },
    );

    return NextResponse.json({
      success: true,
      message: "Loan marked as fully paid",
      repaidAmount: totalRepayable,
      completedDate: new Date(),
    });
  } catch (error) {
    console.error("Error completing loan:", error);
    return NextResponse.json(
      { error: "Failed to mark loan as paid" },
      { status: 500 },
    );
  }
}
