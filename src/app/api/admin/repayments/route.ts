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

    // Batch user lookups
    const userIds = [...new Set(loans.map((l: any) => l.userId))] as string[];
    const userObjectIds = userIds.map((id: string) => {
      try { return new ObjectId(id); } catch { return id; }
    });
    const users: any[] = await usersCollection.find({ _id: { $in: userObjectIds } }).toArray();
    const userMap = new Map<string, any>(users.map((u: any) => [u._id.toString(), u]));

    // Batch proof lookups — fetch all proofs for all loans at once
    const loanIds = loans.map((l: any) => l._id.toString());
    const allProofs = await repaymentProofsCollection
      .find({
        $or: [
          { requestId: { $in: loanIds } },
          { requestIds: { $in: loanIds } },
        ],
      })
      .sort({ submittedAt: -1 })
      .toArray();
    const proofsByLoan = new Map<string, any[]>();
    for (const p of allProofs) {
      const key = p.requestId;
      if (key) {
        const list = proofsByLoan.get(key) || [];
        list.push(p);
        proofsByLoan.set(key, list);
      }
      if (p.requestIds) {
        for (const rid of p.requestIds) {
          if (rid !== p.requestId) {
            const list = proofsByLoan.get(rid) || [];
            list.push(p);
            proofsByLoan.set(rid, list);
          }
        }
      }
    }

    // Batch fetch linked request details for bulk proofs
    const proofIdsWithMultiple = allProofs
      .filter((p: any) => p.requestIds && p.requestIds.length > 1)
      .flatMap((p: any) => p.requestIds);
    const linkedRequestsMap = new Map<string, any>();
    if (proofIdsWithMultiple.length > 0) {
      const linkedReqDocs = await serviceRequestsCollection
        .find({ _id: { $in: proofIdsWithMultiple.map((id: string) => new ObjectId(id)) } })
        .project({ _id: 1, type: 1, amount: 1, totalRepayable: 1, remainingBalance: 1, carNumber: 1, driverName: 1 })
        .toArray();
      for (const r of linkedReqDocs) {
        linkedRequestsMap.set(r._id.toString(), r);
      }
    }

    const getServiceTypeLabel = (type: string) => {
      switch (type) {
        case "fuel": return "Fuel";
        case "airtime": return "Airtime";
        case "cash": return "Cash Loan";
        case "carwash": return "Car Wash";
        default: return type;
      }
    };

    const today = new Date();

    const repayments = loans.map((loan: any) => {
      const driver = userMap.get(loan.userId);

      const proofs = proofsByLoan.get(loan._id.toString()) || [];
      const pendingProofs = proofs
        .filter((p: any) => p.status === "pending")
        .map((p: any) => {
          const enriched: any = {
            id: p._id.toString(),
            requestIds: p.requestIds || undefined,
            approvedRequestIds: p.approvedRequestIds || undefined,
            amount: p.amount,
            status: p.status,
            submittedAt: p.submittedAt,
            proofUrl: p.proofUrl,
            remainingBalance: p.remainingBalance,
            isFullyPaid: p.isFullyPaid,
          };
          if (p.requestIds && p.requestIds.length > 1) {
            enriched.linkedRequests = p.requestIds
              .map((id: string) => {
                const r = linkedRequestsMap.get(id);
                if (!r) return null;
                return {
                  id: r._id.toString(),
                  type: r.type,
                  amount: r.amount,
                  totalRepayable: r.totalRepayable || r.amount,
                  remainingBalance: r.remainingBalance || r.totalRepayable || r.amount,
                  carNumber: r.carNumber,
                  driverName: r.driverName,
                };
              })
              .filter(Boolean);
          }
          return enriched;
        });

      const totalRepayable = loan.totalRepayable || toMoney(loan.amount * 1.13);
      const repaidAmount = loan.repaidAmount || 0;
      const remainingAmount = toMoney(totalRepayable - repaidAmount);

      const approvedDate = loan.approvedDate || loan.requestDate;
      const dueDate = approvedDate
        ? new Date(
            new Date(approvedDate).getTime() +
              (loan.repaymentDays ?? 7) * 24 * 60 * 60 * 1000,
          )
        : new Date();

      const isPaid = loan.isPaid === true || remainingAmount <= 0;
      let financialStatus = "pending";
      if (isPaid) financialStatus = "paid";
      else if (today > dueDate) financialStatus = "overdue";

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
        interestRate: loan.interestRate ?? 13,
        interest: loan.interest ?? toMoney((loan.actualAmount || loan.amount) * 0.13),
        totalRepayable,
        repaidAmount,
        remainingAmount,
        dueDate: dueDate.toISOString(),
        status: financialStatus,
        isPaid,
        isServiceCompleted: loan.status === "completed",
        dailyPayment: loan.dailyPayment ?? toMoney(totalRepayable / (loan.repaymentDays ?? 7)),
        repaymentDays: loan.repaymentDays ?? 7,
        nextPaymentDate: new Date().toISOString(),
        lastPaymentDate: loan.lastPaymentDate,
        approvedDate: loan.approvedDate,
        completedDate: loan.completedDate,
        requestDate: loan.requestDate,
        packageInfo: loan.type === "carwash" && loan.package
          ? { package: loan.package, description: loan.packageDescription }
          : null,
        fuelType: loan.fuelType,
        contactPhone: loan.contactPhone,
        otp: loan.otp,
        popUrl: loan.popUrl,
        popUploadedAt: loan.popUploadedAt,
        payments: loan.payments || [],
        pendingRepaymentProofs: pendingProofs,
        hasPendingProofs: pendingProofs.length > 0,
      };
    });

    return NextResponse.json(repayments);
  } catch (error) {
    console.error("Error fetching repayments:", error);
    return NextResponse.json(
      { error: "Failed to fetch repayments", details: String(error) },
      { status: 500 },
    );
  }
}
