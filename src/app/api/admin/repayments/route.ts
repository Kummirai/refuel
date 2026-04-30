// src/app/api/admin/repayments/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");
    const usersCollection = db.collection("user");

    // Get all approved cash loans
    const loans = await serviceRequestsCollection
      .find({ type: "cash", status: "approved" })
      .sort({ requestDate: -1 })
      .toArray();

    const repayments = await Promise.all(
      loans.map(async (loan: any) => {
        const driver = await usersCollection.findOne({ _id: loan.userId });

        // Calculate repayment status
        const totalRepayable =
          loan.totalRepayable ||
          loan.amount * (1 + (loan.interestRate || 13) / 100);
        const repaidAmount = loan.repaidAmount || 0;
        const remainingAmount = totalRepayable - repaidAmount;
        const today = new Date();
        const dueDate = loan.approvedDate
          ? new Date(
              new Date(loan.approvedDate).getTime() +
                (loan.repaymentDays || 14) * 24 * 60 * 60 * 1000,
            )
          : new Date();

        let status = "pending";
        if (repaidAmount >= totalRepayable) {
          status = "paid";
        } else if (today > dueDate) {
          status = "overdue";
        }

        return {
          id: loan._id.toString(),
          loanId: loan._id.toString(),
          driverId: loan.userId,
          driverName: driver?.name || "Unknown",
          driverEmail: driver?.email || "Unknown",
          driverPhone: driver?.phone || "Unknown",
          carRegistration: loan.carNumber || "Not provided",
          amount: loan.amount,
          interestRate: loan.interestRate || 13,
          totalRepayable,
          repaidAmount,
          remainingAmount,
          dueDate: dueDate.toISOString(),
          status,
          dailyPayment:
            loan.dailyPayment ||
            Math.ceil(totalRepayable / (loan.repaymentDays || 14)),
          repaymentDays: loan.repaymentDays || 14,
          nextPaymentDate: new Date().toISOString(),
          lastPaymentDate: loan.lastPaymentDate,
        };
      }),
    );

    return NextResponse.json(repayments);
  } catch (error) {
    console.error("Error fetching repayments:", error);
    return NextResponse.json(
      { error: "Failed to fetch repayments" },
      { status: 500 },
    );
  }
}
