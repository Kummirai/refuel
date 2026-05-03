// src/app/api/admin/repayments/pay/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
    const { repaymentId, amount, method, reference, proofUrl, proofPublicId } =
      await request.json();

    if (!repaymentId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment details" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");
    const loanPaymentsCollection = db.collection("loanPayments");
    const repaymentRequestsCollection = db.collection("repaymentRequests");

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

    // 1. Record the payment in loanPayments collection
    await loanPaymentsCollection.insertOne({
      _id: paymentId,
      loanId: repaymentId,
      amount: amount,
      paymentDate: new Date(),
      method: method || "cash",
      reference: reference || null,
      remainingBalance: totalRepayable - newRepaid,
      createdAt: new Date(),
      ...(proofUrl && { proofUrl, proofPublicId }),
    });

    // 2. Update the repayment request status if it exists and is now fully paid
    if (isFullyPaid) {
      // Find and update any pending repayment request for this loan
      const repaymentRequest = await repaymentRequestsCollection.findOne({
        requestId: repaymentId,
        status: "pending",
      });

      if (repaymentRequest) {
        await repaymentRequestsCollection.updateOne(
          { _id: repaymentRequest._id },
          {
            $set: {
              status: "approved",
              approvedAt: new Date(),
              approvedBy: "admin",
              updatedAt: new Date(),
            },
          },
        );
      }
    }

    // 3. Update loan with new repaid amount
    const updateFields: any = {
      repaidAmount: newRepaid,
      lastPaymentDate: new Date(),
    };

    // If fully paid, mark as paid (financial settlement complete)
    if (isFullyPaid) {
      updateFields.isPaid = true;
      updateFields.paidDate = new Date();
      // Note: status remains as is (completed means service was delivered)
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
            ...(proofUrl && { proofUrl }),
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
      paymentId: paymentId.toString(),
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 },
    );
  }
}
