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

    const totalRepayable = loan.totalRepayable || loan.amount * 1.13;
    const remainingAmount = totalRepayable - (loan.repaidAmount || 0);

    // Record a final payment for the remaining amount
    const paymentsCollection = db.collection("loanPayments");
    const paymentId = new ObjectId();

    if (remainingAmount > 0) {
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

      // Update loan as fully paid (financial settlement complete)
      await serviceRequestsCollection.updateOne(
        { _id: new ObjectId(repaymentId) },
        {
          $set: {
            repaidAmount: totalRepayable,
            lastPaymentDate: new Date(),
            isPaid: true, // Mark as financially paid
            paidDate: new Date(),
            // Status remains "completed" (service was already delivered)
            // We don't change the service status here
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
    } else {
      // Already fully paid, just mark as paid if not already
      await serviceRequestsCollection.updateOne(
        { _id: new ObjectId(repaymentId) },
        {
          $set: {
            isPaid: true,
            paidDate: new Date(),
          },
        },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Request marked as fully paid",
      remainingBalance: 0,
      isFullyPaid: true,
    });
  } catch (error) {
    console.error("Error marking as paid:", error);
    return NextResponse.json(
      { error: "Failed to mark as paid" },
      { status: 500 },
    );
  }
}
