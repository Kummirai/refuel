// src/app/api/admin/requests/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    const serviceRequestsCollection = db.collection("serviceRequests");
    const usersCollection = db.collection("user");
    const driverProfilesCollection = db.collection("driverProfiles");

    // Get all service requests sorted by date
    const requests = await serviceRequestsCollection
      .find({})
      .sort({ requestDate: -1 })
      .toArray();

    console.log("Found requests:", requests.length);

    // Get driver details for each request
    const requestsWithDetails = await Promise.all(
      requests.map(async (request) => {
        // Convert userId to ObjectId if it's a string, otherwise use as is
        let userIdQuery;
        try {
          // Try to convert string to ObjectId
          userIdQuery = new ObjectId(request.userId);
        } catch {
          // If it's already an ObjectId or invalid, use as string
          userIdQuery = request.userId;
        }

        // Get user from users collection (try both ObjectId and string)
        let user = await usersCollection.findOne({ _id: userIdQuery });

        // If not found, try as string
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

        console.log(
          `Request ${request._id}: User found = ${!!user}, Profile found = ${!!driverProfile}`,
        );

        return {
          id: request._id.toString().slice(-6).toUpperCase(),
          type: request.type,
          amount: request.amount,
          driverName:
            request.driverName ||
            user?.name ||
            driverProfile?.fullName ||
            driverProfile?.name ||
            "Unknown",
          driverId: request.userId,
          driverEmail: request.driverEmail || user?.email || "Unknown",
          driverPhone:
            request.contactPhone ||
            request.driverPhone ||
            user?.phone ||
            driverProfile?.phone ||
            "Unknown",
          carRegistration:
            request.carNumber ||
            driverProfile?.carRegistrationNumber ||
            "Not provided",
          carModel:
            request.carModel || driverProfile?.carModel || "Not provided",
          location:
            request.location || driverProfile?.address || "Not provided",
          fuelType: request.fuelType,
          phoneNumber: request.recipientPhoneNumber || request.phoneNumber,
          interest: request.interest,
          totalRepayable: request.totalRepayable,
          repaymentDays: request.repaymentDays,
          interestRate: request.interestRate,
          date: request.requestDate,
          status: request.status,
          otp: request.otp,
        };
      }),
    );

    console.log("Requests with details:", requestsWithDetails.length);
    console.log("First request details:", requestsWithDetails[0]);

    // Calculate stats
    const total = requestsWithDetails.length;
    const pending = requestsWithDetails.filter(
      (r) => r.status === "pending",
    ).length;
    const approved = requestsWithDetails.filter(
      (r) => r.status === "approved",
    ).length;
    const completed = requestsWithDetails.filter(
      (r) => r.status === "completed",
    ).length;
    const rejected = requestsWithDetails.filter(
      (r) => r.status === "rejected",
    ).length;
    const totalRevenue = requestsWithDetails
      .filter((r) => r.status === "completed")
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    return NextResponse.json({
      requests: requestsWithDetails,
      recent: requestsWithDetails
        .filter((r) => r.status === "pending")
        .slice(0, 5),
      total,
      pending,
      approved,
      completed,
      rejected,
      totalRevenue,
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 },
    );
  }
}
