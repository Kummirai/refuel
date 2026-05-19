// src/app/api/admin/repayments/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { toMoney } from "@/lib/money";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");
    const usersCollection = db.collection("user");
    const repaymentProofsCollection = db.collection("repaymentProofs");

    // Get ALL completed and approved requests (all service types)
    const loans = await serviceRequestsCollection
      .find({
        status: { $in: ["approved", "completed"] },
      })
      .sort({ requestDate: -1 })
      .toArray();

    console.log(`Found ${loans.length} requests`);

    const repayments = await Promise.all(
      loans.map(async (loan: any) => {
        // Get driver details
        let driver = await usersCollection.findOne({ _id: loan.userId });
        if (!driver && typeof loan.userId === "string") {
          try {
            driver = await usersCollection.findOne({
              _id: new ObjectId(loan.userId),
            });
          } catch {
            driver = await usersCollection.findOne({ _id: loan.userId });
          }
        }

        // Fetch repayment proofs for this request (single or bulk)
        const proofs = await repaymentProofsCollection
          .find({
            $or: [
              { requestId: loan._id.toString() },
              { requestIds: loan._id.toString() },
            ],
          })
          .sort({ submittedAt: -1 })
          .toArray();

        const pendingProofs = proofs
          .filter((p: any) => p.status === "pending")
          .map((p: any) => ({
            id: p._id.toString(),
            requestIds: p.requestIds || undefined,
            approvedRequestIds: p.approvedRequestIds || undefined,
            amount: p.amount,
            status: p.status,
            submittedAt: p.submittedAt,
            proofUrl: p.proofUrl,
            remainingBalance: p.remainingBalance,
            isFullyPaid: p.isFullyPaid,
          }));

        // Enrich pending proofs with linked request details (for bulk repayments)
        const enrichedPendingProofs = await Promise.all(
          pendingProofs.map(async (proof: any) => {
            if (proof.requestIds && proof.requestIds.length > 1) {
              const linkedRequests = await serviceRequestsCollection
                .find({
                  _id: { $in: proof.requestIds.map((id: string) => new ObjectId(id)) },
                })
                .toArray();
              return {
                ...proof,
                linkedRequests: linkedRequests.map((r: any) => ({
                  id: r._id.toString(),
                  type: r.type,
                  amount: r.amount,
                  totalRepayable: r.totalRepayable || r.amount,
                  remainingBalance: r.remainingBalance || r.totalRepayable || r.amount,
                  carNumber: r.carNumber,
                  driverName: r.driverName,
                })),
              };
            }
            return proof;
          }),
        );

        // Calculate financial status
        const totalRepayable = loan.totalRepayable || toMoney(loan.amount * 1.13);
        const repaidAmount = loan.repaidAmount || 0;
        const remainingAmount = toMoney(totalRepayable - repaidAmount);
        const today = new Date();

        // Calculate due date based on approved date or request date
        const approvedDate = loan.approvedDate || loan.requestDate;
        const dueDate = approvedDate
          ? new Date(
              new Date(approvedDate).getTime() +
                (loan.repaymentDays || 7) * 24 * 60 * 60 * 1000,
            )
          : new Date();

        // Determine financial status
        const isPaid = loan.isPaid === true || remainingAmount <= 0;

        let financialStatus = "pending";
        if (isPaid) {
          financialStatus = "paid";
        } else if (today > dueDate) {
          financialStatus = "overdue";
        }

        // Service status (completed means service was delivered)
        const isServiceCompleted = loan.status === "completed";

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
          requestedAmount: loan.amount,
          actualAmount: loan.actualAmount || null,
          amount: loan.actualAmount || loan.amount,
          interestRate: loan.interestRate || 13,
          interest:
            loan.interest ||
            toMoney((loan.actualAmount || loan.amount) * 0.13),
          totalRepayable: totalRepayable,
          repaidAmount: repaidAmount,
          remainingAmount: remainingAmount,
          dueDate: dueDate.toISOString(),
          status: financialStatus,
          isPaid: isPaid,
          isServiceCompleted: isServiceCompleted,
          dailyPayment:
            loan.dailyPayment ||
            toMoney(totalRepayable / (loan.repaymentDays || 7)),
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
          popUrl: loan.popUrl,
          popUploadedAt: loan.popUploadedAt,
          payments: loan.payments || [],
          pendingRepaymentProofs: enrichedPendingProofs,
          hasPendingProofs: enrichedPendingProofs.length > 0,
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
