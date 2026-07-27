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
    const loanPaymentsCollection = db.collection("loanPayments");
    const repaymentRequestsCollection = db.collection("repaymentRequests");
    const repaymentProofsCollection = db.collection("repaymentProofs");

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
    const paymentId = new ObjectId();

    if (remainingAmount > 0) {
      // 1. Insert final payment in loanPayments collection
      await loanPaymentsCollection.insertOne({
        _id: paymentId,
        loanId: repaymentId,
        amount: remainingAmount,
        paymentDate: new Date(),
        method: "bulk_completion",
        reference: "Marked as fully paid by admin",
        remainingBalance: 0,
        createdAt: new Date(),
      });

      // 2. Update any pending repayment request status
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

      // Also approve any pending repayment proofs for this loan
      await repaymentProofsCollection.updateMany(
        {
          $or: [
            { requestId: repaymentId },
            { requestIds: repaymentId },
          ],
          status: "pending",
        },
        {
          $set: {
            status: "approved",
            approvedAt: new Date(),
            approvedBy: "admin",
            updatedAt: new Date(),
          },
          $addToSet: { approvedRequestIds: repaymentId },
        },
      );

      // 3. Update loan as fully paid
      await serviceRequestsCollection.updateOne(
        { _id: new ObjectId(repaymentId) },
        {
          $set: {
            repaidAmount: totalRepayable,
            remainingBalance: 0,
            lastPaymentDate: new Date(),
            isPaid: true,
            paidDate: new Date(),
          },
          $unset: {
            hasPendingRepayment: "",
            pendingRepaymentAmount: "",
            pendingRepaymentId: "",
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

      // Also approve any pending repayment proofs
      await repaymentProofsCollection.updateMany(
        {
          $or: [
            { requestId: repaymentId },
            { requestIds: repaymentId },
          ],
          status: "pending",
        },
        {
          $set: {
            status: "approved",
            approvedAt: new Date(),
            approvedBy: "admin",
            updatedAt: new Date(),
          },
          $addToSet: { approvedRequestIds: repaymentId },
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
