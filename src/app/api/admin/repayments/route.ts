// src/app/api/admin/repayments/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");
    const usersCollection = db.collection("user");

    // Get ALL completed and approved requests (all service types)
    const loans = await serviceRequestsCollection
      .find({
        status: { $in: ["approved", "completed"] },
      })
      .sort({ requestDate: -1 })
      .toArray();

    console.log(`Found ${loans.length} requests with repayments`);

    const repayments = await Promise.all(
      loans.map(async (loan: any) => {
        // Get driver details
        let driver = await usersCollection.findOne({ _id: loan.userId });

        // If not found by ObjectId, try as string
        if (!driver && typeof loan.userId === "string") {
          driver = await usersCollection.findOne({ _id: loan.userId });
        }

        // Calculate repayment amounts
        const totalRepayable =
          loan.totalRepayable ||
          loan.amount * (1 + (loan.interestRate || 13) / 100);
        const repaidAmount = loan.repaidAmount || 0;
        const remainingAmount = totalRepayable - repaidAmount;
        const today = new Date();

        // Calculate due date based on approval date
        const approvedDate = loan.approvedDate || loan.requestDate;
        const dueDate = approvedDate
          ? new Date(
              new Date(approvedDate).getTime() +
                (loan.repaymentDays || 7) * 24 * 60 * 60 * 1000,
            )
          : new Date();

        // Determine status
        let status = "pending";
        if (loan.status === "completed" || repaidAmount >= totalRepayable) {
          status = "paid";
        } else if (today > dueDate) {
          status = "overdue";
        }

        // Get service type display name
        const getServiceTypeLabel = (type: string) => {
          switch (type) {
            case "fuel":
              return "Fuel";
            case "airtime":
              return "Airtime";
            case "cash":
              return "Cash Loan";
            case "carwash":
              return "Car Wash";
            default:
              return type;
          }
        };

        // Get package info for car wash
        const packageInfo =
          loan.type === "carwash" && loan.package
            ? { package: loan.package, description: loan.packageDescription }
            : null;

        return {
          id: loan._id.toString(),
          loanId: loan._id.toString(),
          driverId: loan.userId,
          driverName: loan.driverName || driver?.name || "Unknown",
          driverEmail: loan.driverEmail || driver?.email || "Unknown",
          driverPhone: loan.driverPhone || driver?.phone || "Unknown",
          carRegistration: loan.carNumber || "Not provided",
          serviceType: loan.type,
          serviceTypeLabel: getServiceTypeLabel(loan.type),
          amount: loan.amount,
          interestRate: loan.interestRate || 13,
          interest:
            loan.interest || (loan.amount * (loan.interestRate || 13)) / 100,
          totalRepayable: totalRepayable,
          repaidAmount: repaidAmount,
          remainingAmount: remainingAmount,
          dueDate: dueDate.toISOString(),
          status: status,
          dailyPayment:
            loan.dailyPayment ||
            Math.ceil(totalRepayable / (loan.repaymentDays || 7)),
          repaymentDays: loan.repaymentDays || 7,
          nextPaymentDate: new Date().toISOString(),
          lastPaymentDate: loan.lastPaymentDate,
          approvedDate: loan.approvedDate,
          completedDate: loan.completedDate,
          requestDate: loan.requestDate,
          packageInfo: packageInfo,
          fuelType: loan.fuelType,
          contactPhone: loan.contactPhone,
          otp: loan.otp,
          payments: loan.payments || [],
        };
      }),
    );

    return NextResponse.json(repayments);
  } catch (error) {
    console.error("Error fetching repayments:", error);
    return NextResponse.json(
      { error: "Failed to fetch repayments", details: String(error) },
      { status: 500 },
    );
  }
}
