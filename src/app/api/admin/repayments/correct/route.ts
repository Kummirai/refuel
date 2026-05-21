import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { toMoney } from "@/lib/money";

export async function POST(request: Request) {
  try {
    const { actions } = await request.json();

    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json(
        { error: "No actions provided" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");
    const loanPaymentsCollection = db.collection("loanPayments");
    const repaymentProofsCollection = db.collection("repaymentProofs");
    const results: any[] = [];

    for (const action of actions) {
      const { type, loanId, paymentId, data } = action;

      switch (type) {
        // Delete a duplicate payment record from loanPayments + serviceRequest.payments array
        case "delete_payment": {
          if (!loanId || !paymentId) {
            results.push({ error: "Missing loanId or paymentId for delete_payment" });
            continue;
          }
          await loanPaymentsCollection.deleteOne({ _id: new ObjectId(paymentId) });
          await serviceRequestsCollection.updateOne(
            { _id: new ObjectId(loanId) },
            { $pull: { payments: { id: paymentId } } as any },
          );
          results.push({ success: true, type: "delete_payment", paymentId });
          break;
        }

        // Correct a payment amount in loanPayments + serviceRequest.payments array
        case "correct_payment": {
          if (!loanId || !paymentId || data?.amount === undefined) {
            results.push({ error: "Missing fields for correct_payment" });
            continue;
          }
          await loanPaymentsCollection.updateOne(
            { _id: new ObjectId(paymentId) },
            { $set: { amount: data.amount } },
          );
          await serviceRequestsCollection.updateOne(
            { _id: new ObjectId(loanId), "payments.id": paymentId },
            { $set: { "payments.$.amount": data.amount } },
          );
          results.push({ success: true, type: "correct_payment", paymentId, amount: data.amount });
          break;
        }

        // Recalculate and correct the loan's repaidAmount, remainingBalance, and isPaid
        case "recalc_loan": {
          if (!loanId) {
            results.push({ error: "Missing loanId for recalc_loan" });
            continue;
          }
          const allPayments = await loanPaymentsCollection
            .find({ loanId })
            .toArray();

          const totalRepayable = data?.totalRepayable || 0;
          const totalPaid = allPayments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
          const newRemaining = toMoney(Math.max(0, totalRepayable - totalPaid));
          const isFullyPaid = newRemaining <= 0;

          const updateFields: any = {
            repaidAmount: totalPaid,
            remainingBalance: newRemaining,
          };
          if (isFullyPaid) {
            updateFields.isPaid = true;
            updateFields.paidDate = new Date();
          } else {
            updateFields.isPaid = false;
          }

          await serviceRequestsCollection.updateOne(
            { _id: new ObjectId(loanId) },
            { $set: updateFields },
          );

          results.push({
            success: true,
            type: "recalc_loan",
            loanId,
            repaidAmount: totalPaid,
            remainingBalance: newRemaining,
            isPaid: isFullyPaid,
            paymentCount: allPayments.length,
          });
          break;
        }

        // Manually set repaidAmount and remainingBalance (for complex fixes)
        case "manual_fix": {
          if (!loanId || data?.repaidAmount === undefined || data?.remainingBalance === undefined) {
            results.push({ error: "Missing fields for manual_fix" });
            continue;
          }
          const fixFields: any = {
            repaidAmount: data.repaidAmount,
            remainingBalance: data.remainingBalance,
            isPaid: data.remainingBalance <= 0,
          };
          if (data.remainingBalance <= 0) {
            fixFields.paidDate = new Date();
          }

          await serviceRequestsCollection.updateOne(
            { _id: new ObjectId(loanId) },
            { $set: fixFields },
          );
          results.push({ success: true, type: "manual_fix", loanId, ...fixFields });
          break;
        }

        default:
          results.push({ error: `Unknown action type: ${type}` });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.filter((r) => r.success).length} actions completed`,
      results,
    });
  } catch (error) {
    console.error("Error in repayments/correct:", error);
    return NextResponse.json(
      { error: "Failed to process corrections", details: String(error) },
      { status: 500 },
    );
  }
}
