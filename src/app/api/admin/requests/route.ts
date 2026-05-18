// src/app/api/admin/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { toMoney } from "@/lib/money";

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
      if (to) dateQuery.$lte = new Date(to);
      query.requestDate = dateQuery;
    }

    const serviceRequestsCollection = db.collection("serviceRequests");
    const usersCollection = db.collection("user");
    const driverProfilesCollection = db.collection("driverProfiles");

    // Get all service requests sorted by date
    const requests = await serviceRequestsCollection
      .find(query)
      .sort({ requestDate: -1 })
      .toArray();

    // console.log("Found requests:", requests.length);

    // Get driver details for each request
    const requestsWithDetails = await Promise.all(
      requests.map(async (request: any) => {
        // Convert userId to ObjectId if it's a string, otherwise use as is
        let userIdQuery;
        try {
          userIdQuery = new ObjectId(request.userId);
        } catch {
          userIdQuery = request.userId;
        }

        // Get user from users collection (try both ObjectId and string)
        let user = await usersCollection.findOne({ _id: userIdQuery });
        if (!user && typeof request.userId === "string") {
          user = await usersCollection.findOne({ _id: request.userId });
        }

        // Get driver profile (try both formats)
        let driverProfile = await driverProfilesCollection.findOne({
          userId: userIdQuery,
        });
        if (!driverProfile && typeof request.userId === "string") {
          driverProfile = await driverProfilesCollection.findOne({
            userId: request.userId,
          });
        }

        // Return ALL fields from the request document
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
          // Additional fields for display
          location:
            request.location || driverProfile?.address || "Not provided",
          phoneNumber: request.recipientPhoneNumber || request.contactPhone,
        };
      }),
    );

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
      (r) => r.status === "pending",
    ).length;
    const approved = requestsWithDetails.filter(
      (r) => r.status === "approved",
    ).length;
    const sent = requestsWithDetails.filter(
      (r) => r.status === "sent",
    ).length;
    const completed = requestsWithDetails.filter(
      (r) => r.status === "completed",
    ).length;
    const rejected = requestsWithDetails.filter(
      (r) => r.status === "rejected",
    ).length;

    // Calculate total revenue based on actualAmount if available, otherwise amount
    const totalRevenue = toMoney(
      requestsWithDetails
        .filter((r) => r.status === "completed")
        .reduce((sum, r) => sum + (r.actualAmount || r.amount || 0), 0)
    );

    // Calculate total repayable amount
    const totalRepayable = toMoney(
      requestsWithDetails
        .filter((r) => r.status === "completed")
        .reduce((sum, r) => sum + (r.totalRepayable || r.amount || 0), 0)
    );

    // Calculate total repaid amount
    const totalRepaid = toMoney(
      requestsWithDetails.reduce(
        (sum, r) => sum + (r.repaidAmount || 0),
        0,
      )
    );

    return NextResponse.json({
      requests: requestsWithDetails,
      recent: requestsWithDetails
        .filter((r) => r.status === "pending")
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
    }, {
      headers: { "Cache-Control": "public, max-age=15, s-maxage=30" },
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 },
    );
  }
}
