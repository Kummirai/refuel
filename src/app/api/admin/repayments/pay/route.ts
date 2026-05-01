// src/app/api/admin/repayments/pay/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
    const { repaymentId, amount, method, reference } = await request.json();

    if (!repaymentId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment details" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");
    const paymentsCollection = db.collection("loanPayments");

    // Get the loan/service request
    const loan = await serviceRequestsCollection.findOne({
      _id: new ObjectId(repaymentId),
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    const totalRepayable = loan.totalRepayable || loan.amount * 1.13;
    const currentRepaid = loan.repaidAmount || 0;
    const newRepaid = currentRepaid + amount;
    const isFullyPaid = newRepaid >= totalRepayable;

    // Generate payment ID
    const paymentId = new ObjectId();

    // Record the payment
    await paymentsCollection.insertOne({
      _id: paymentId,
      loanId: repaymentId,
      amount: amount,
      paymentDate: new Date(),
      method: method || "cash",
      reference: reference || null,
      remainingBalance: totalRepayable - newRepaid,
      createdAt: new Date(),
    });

    // Update loan with new repaid amount
    const updateFields: any = {
      repaidAmount: newRepaid,
      lastPaymentDate: new Date(),
    };

    // If fully paid, mark as paid (financial settlement complete)
    if (isFullyPaid) {
      updateFields.isPaid = true;
      updateFields.paidDate = new Date();
      // Note: status remains as is (completed means service was delivered)
      // We don't change service status here - only financial status
    }

    await serviceRequestsCollection.updateOne(
      { _id: new ObjectId(repaymentId) },
      {
        $set: updateFields,
        $push: {
          payments: {
            id: paymentId.toString(),
            amount: amount,
            date: new Date(),
            method: method || "cash",
            reference: reference || null,
          },
        },
      },
    );

    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully",
      remainingBalance: totalRepayable - newRepaid,
      isFullyPaid,
      repaidAmount: newRepaid,
      totalRepayable: totalRepayable,
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 },
    );
  }
}
