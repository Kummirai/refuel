// src/app/api/admin/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { toMoney } from "@/lib/money";

function tryObjectIdStr(id: string): string {
  try { return new ObjectId(id).toString(); } catch { return id; }
}

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const query: any = {};
    if (from || to) {
      const dateQuery: any = {};
      if (from) dateQuery.$gte = new Date(from);
      if (to) {
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        dateQuery.$lte = endDate;
      }
      query.requestDate = dateQuery;
    }

    const serviceRequestsCollection = db.collection("serviceRequests");
    const usersCollection = db.collection("user");
    const driverProfilesCollection = db.collection("driverProfiles");

    // Get all service requests sorted by date
    const requests = await serviceRequestsCollection
      .find(query)
      .sort({ requestDate: -1 })
      .project({
        userId: 1, type: 1, amount: 1, actualAmount: 1, carNumber: 1, carModel: 1,
        carRegistration: 1, fuelType: 1, contactPhone: 1, driverName: 1, driverPhone: 1,
        driverEmail: 1, interest: 1, totalRepayable: 1, interestRate: 1, repaymentDays: 1,
        dailyPayment: 1, package: 1, packageDescription: 1, status: 1, otp: 1,
        requestDate: 1, createdAt: 1, approvedDate: 1, completedDate: 1, popUrl: 1,
        popPublicId: 1, popUploadedAt: 1, updatedAt: 1, repaidAmount: 1, remainingBalance: 1,
        isPaid: 1, refueledByManager: 1, location: 1, recipientPhoneNumber: 1,
        collateral: 1, hasReceipt: 1,
      })
      .toArray();

    // Batch user lookups — fetch all unique users at once
    const userIds = [...new Set(requests.map((r: any) => r.userId))] as string[];
    const userObjectIds = userIds.map((id: string) => {
      try { return new ObjectId(id); } catch { return id; }
    });
    const users: any[] = await usersCollection
      .find({ _id: { $in: userObjectIds } })
      .project({ name: 1, email: 1, phone: 1 })
      .toArray();
    const userMap = new Map<string, any>(users.map((u: any) => [u._id.toString(), u]));

    const profiles: any[] = await driverProfilesCollection
      .find({ userId: { $in: userIds } })
      .project({ userId: 1, fullName: 1, name: 1, phone: 1, address: 1 })
      .toArray();
    const profileMap = new Map<string, any>(profiles.map((p: any) => [p.userId, p]));

    // Map driver details for each request
    const requestsWithDetails = requests.map((request: any) => {
      const user = userMap.get(request.userId) || userMap.get(tryObjectIdStr(request.userId));
      const driverProfile = profileMap.get(request.userId);

      return {
        id: request._id.toString(),
        _id: request._id.toString(),
        userId: request.userId,
        type: request.type,
        amount: request.amount,
        actualAmount: request.actualAmount || null,
        carNumber: request.carNumber,
        carModel: request.carModel,
        carRegistration: request.carRegistration,
        fuelType: request.fuelType,
        contactPhone: request.contactPhone,
        driverName:
          request.driverName ||
          user?.name ||
          driverProfile?.fullName ||
          driverProfile?.name ||
          "Unknown",
        driverPhone:
          request.driverPhone ||
          user?.phone ||
          driverProfile?.phone ||
          "Unknown",
        driverEmail: request.driverEmail || user?.email || "Unknown",
        interest: request.interest,
        totalRepayable: request.totalRepayable,
        interestRate: request.interestRate,
        repaymentDays: request.repaymentDays,
        dailyPayment: request.dailyPayment,
        package: request.package,
        packageDescription: request.packageDescription,
        status: request.status,
        otp: request.otp,
        requestDate: request.requestDate,
        createdAt: request.createdAt,
        approvedDate: request.approvedDate,
        completedDate: request.completedDate,
        popUrl: request.popUrl,
        popPublicId: request.popPublicId,
        popUploadedAt: request.popUploadedAt,
        updatedAt: request.updatedAt,
        repaidAmount: request.repaidAmount || 0,
        remainingBalance: request.remainingBalance || 0,
        isPaid: request.isPaid || false,
        refueledByManager: request.refueledByManager || false,
        location:
          request.location || driverProfile?.address || "Not provided",
        phoneNumber: request.recipientPhoneNumber || request.contactPhone,
        collateral: request.collateral || null,
      };
    });

    // console.log("Requests with details:", requestsWithDetails.length);
    // if (requestsWithDetails.length > 0) {
    //   console.log(
    //     "First request details:",
    //     JSON.stringify(requestsWithDetails[0], null, 2),
    //   );
    // }

    // Calculate stats
    const total = requestsWithDetails.length;
    const pending = requestsWithDetails.filter(
      (r: any) => r.status === "pending",
    ).length;
    const approved = requestsWithDetails.filter(
      (r: any) => r.status === "approved",
    ).length;
    const sent = requestsWithDetails.filter(
      (r: any) => r.status === "sent",
    ).length;
    const completed = requestsWithDetails.filter(
      (r: any) => r.status === "completed" && !r.refueledByManager,
    ).length;
    const rejected = requestsWithDetails.filter(
      (r: any) => r.status === "rejected",
    ).length;
    const refueled = requestsWithDetails.filter(
      (r: any) => r.status === "completed" && r.refueledByManager,
    ).length;

    // Calculate total revenue based on actualAmount if available, otherwise amount
    const totalRevenue = toMoney(
      requestsWithDetails
        .filter((r: any) => r.status === "completed")
        .reduce((sum: number, r: any) => sum + (r.actualAmount || r.amount || 0), 0)
    );

    // Calculate total repayable amount
    const totalRepayable = toMoney(
      requestsWithDetails
        .filter((r: any) => r.status === "completed")
        .reduce((sum: number, r: any) => sum + (r.totalRepayable || r.amount || 0), 0)
    );

    // Calculate total repaid amount
    const totalRepaid = toMoney(
      requestsWithDetails.reduce(
        (sum: number, r: any) => sum + (r.repaidAmount || 0),
        0,
      )
    );

    return NextResponse.json({
      requests: requestsWithDetails,
      recent: requestsWithDetails
        .filter((r: any) => r.status === "pending")
        .slice(0, 5),
      total,
      pending,
      approved,
      sent,
      completed,
      rejected,
      totalRevenue,
      totalRepayable,
      totalRepaid,
      refueled,
    },);
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 },
    );
  }
}
