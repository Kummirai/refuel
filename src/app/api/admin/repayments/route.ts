// src/app/api/admin/repayments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { toMoney } from "@/lib/money";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const skip = parseInt(searchParams.get("skip") || "0");
    const countsOnly = searchParams.get("countsOnly") === "true";

    const serviceRequestsCollection = db.collection("serviceRequests");
    const usersCollection = db.collection("user");
    const repaymentProofsCollection = db.collection("repaymentProofs");

    const baseQuery: any = { status: { $in: ["approved", "completed"] } };

    // Aggregation for counts + stats
    const countPipeline: any[] = [
      { $match: { status: { $in: ["approved", "completed"] } } },
      {
        $lookup: {
          from: "repaymentProofs",
          let: { loanId: { $toString: "$_id" } },
          pipeline: [
            { $match: { $expr: { $or: [
              { $eq: ["$requestId", "$$loanId"] },
              { $in: ["$$loanId", { $ifNull: ["$requestIds", []] }] },
            ]}}},
            { $project: { status: 1 } },
          ],
          as: "_proofs",
        },
      },
      {
        $addFields: {
          _totalRepayable: { $ifNull: ["$totalRepayable", { $multiply: ["$amount", 1.13] }] },
          _repaidAmount: { $ifNull: ["$repaidAmount", 0] },
          _isPaid: {
            $or: [
              { $eq: ["$isPaid", true] },
              { $lte: [{ $subtract: [
                { $ifNull: ["$totalRepayable", { $multiply: ["$amount", 1.13] }] },
                { $ifNull: ["$repaidAmount", 0] },
              ]}, 0] },
            ],
          },
          _hasPendingProofs: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$_proofs",
                    cond: { $eq: ["$$this.status", "pending"] },
                  },
                },
              },
              0,
            ],
          },
          _dueDate: {
            $add: [
              { $ifNull: ["$approvedDate", "$requestDate"] },
              { $multiply: [{ $ifNull: ["$repaymentDays", 7] }, 86400000] },
            ],
          },
        },
      },
      {
        $addFields: {
          _financialStatus: {
            $cond: [
              "$_isPaid",
              "paid",
              { $cond: [{ $gt: [new Date(), "$_dueDate"] }, "overdue", "pending"] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          outstanding: {
            $sum: { $cond: [{ $ne: ["$_financialStatus", "paid"] }, "$_repaidAmount", 0] },
          },
          outstandingRemaining: {
            $sum: { $cond: [{ $ne: ["$_financialStatus", "paid"] }, { $subtract: ["$_totalRepayable", "$_repaidAmount"] }, 0] },
          },
          repaid: { $sum: "$_repaidAmount" },
          active: { $sum: { $cond: [{ $eq: ["$_financialStatus", "pending"] }, 1, 0] } },
          overdue: { $sum: { $cond: [{ $eq: ["$_financialStatus", "overdue"] }, 1, 0] } },
          paid: { $sum: { $cond: [{ $eq: ["$_financialStatus", "paid"] }, 1, 0] } },
          review: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ["$_financialStatus", "paid"] }, "$_hasPendingProofs"] },
                1, 0,
              ],
            },
          },
          pendingNoProof: {
            $sum: {
              $cond: [
                { $and: [
                  { $ne: ["$_financialStatus", "paid"] },
                  { $ne: ["$_financialStatus", "overdue"] },
                  { $not: "$_hasPendingProofs" },
                ]},
                1, 0,
              ],
            },
          },
        },
      },
    ];

    const countResult = await serviceRequestsCollection.aggregate(countPipeline).toArray();
    const counts = countResult[0] || {
      total: 0, outstanding: 0, outstandingRemaining: 0, repaid: 0,
      active: 0, overdue: 0, paid: 0, review: 0, pendingNoProof: 0,
    };

    if (countsOnly) {
      return NextResponse.json({
        repayments: [],
        stats: {
          outstanding: toMoney(counts.outstandingRemaining),
          repaid: toMoney(counts.repaid),
          active: counts.active,
          overdue: counts.overdue,
        },
        counts: {
          all: counts.total,
          pending: counts.pendingNoProof,
          review: counts.review,
          overdue: counts.overdue,
          paid: counts.paid,
        },
      });
    }

    // Determine DB-level filter for status
    const dbQuery: any = { ...baseQuery };
    const needsPostFilter = status === "review" || status === "overdue";
    if (status && status !== "all") {
      if (status === "paid") {
        dbQuery.$or = [
          { isPaid: true },
          { remainingBalance: { $lte: 0 } },
        ];
      } else if (status === "pending") {
        dbQuery.isPaid = { $ne: true };
        dbQuery.remainingBalance = { $gt: 0 };
      }
      // overdue and review require post-processing, so we fetch all non-paid
    }

    // For review/overdue: fetch all (no skip/limit at DB level) since post-filter removes items
    // Review is always <10 items so no pagination needed
    const loansQuery = serviceRequestsCollection
      .find(dbQuery)
      .sort({ requestDate: -1 })
      .project({
        userId: 1, type: 1, amount: 1, actualAmount: 1, carNumber: 1,
        driverName: 1, driverEmail: 1, driverPhone: 1, totalRepayable: 1,
        repaidAmount: 1, remainingBalance: 1, isPaid: 1, status: 1,
        requestDate: 1, approvedDate: 1, completedDate: 1, repaymentDays: 1,
        dailyPayment: 1, interest: 1, interestRate: 1, package: 1,
        packageDescription: 1, fuelType: 1, contactPhone: 1, otp: 1,
        popUrl: 1, popUploadedAt: 1, payments: 1, interestAdjustments: 1,
        lastPaymentDate: 1,
      });
    if (!needsPostFilter) {
      loansQuery.skip(skip).limit(limit);
    }
    const loans = await loansQuery.toArray();

    // Batch user lookups
    const userIds = [...new Set(loans.map((l: any) => l.userId))] as string[];
    const userObjectIds = userIds.map((id: string) => {
      try { return new ObjectId(id); } catch { return id; }
    });
    const users: any[] = await usersCollection
      .find({ _id: { $in: userObjectIds } })
      .project({ name: 1, email: 1, phone: 1 })
      .toArray();
    const userMap = new Map<string, any>(users.map((u: any) => [u._id.toString(), u]));

    // Batch proof lookups
    const loanIds = loans.map((l: any) => l._id.toString());
    const allProofs = await repaymentProofsCollection
      .find({
        $or: [
          { requestId: { $in: loanIds } },
          { requestIds: { $in: loanIds } },
        ],
      })
      .sort({ submittedAt: -1 })
      .project({
        requestId: 1, requestIds: 1, approvedRequestIds: 1, amount: 1,
        status: 1, submittedAt: 1, proofUrl: 1, remainingBalance: 1,
        isFullyPaid: 1,
      })
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

      // Client-side filter for overdue/review (post-processing)
      if (status === "overdue" && financialStatus !== "overdue") return null;
      if (status === "pending" && (financialStatus === "paid" || financialStatus === "overdue" || pendingProofs.length > 0)) return null;
      if (status === "review" && (financialStatus === "paid" || pendingProofs.length === 0)) return null;

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
        interestAdjustments: loan.interestAdjustments || [],
        pendingRepaymentProofs: pendingProofs,
        hasPendingProofs: pendingProofs.length > 0,
      };
    }).filter(Boolean);

    // For review: no pagination needed (<10 items). For others: use counts.total.
    const hasMore = needsPostFilter ? false : skip + limit < counts.total;

    return NextResponse.json({
      repayments,
      stats: {
        outstanding: toMoney(counts.outstandingRemaining),
        repaid: toMoney(counts.repaid),
        active: counts.active,
        overdue: counts.overdue,
      },
      counts: {
        all: counts.total,
        pending: counts.pendingNoProof,
        review: counts.review,
        overdue: counts.overdue,
        paid: counts.paid,
      },
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching repayments:", error);
    return NextResponse.json(
      { error: "Failed to fetch repayments", details: String(error) },
      { status: 500 },
    );
  }
}
