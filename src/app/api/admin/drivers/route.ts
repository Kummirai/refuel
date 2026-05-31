// src/app/api/admin/drivers/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { toMoney } from "@/lib/money";

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    const usersCollection = db.collection("user");
    const driverProfilesCollection = db.collection("driverProfiles");
    const serviceRequestsCollection = db.collection("serviceRequests");
    const repaymentProofsCollection = db.collection("repaymentProofs");

    // 1. Fetch all drivers
    const drivers = await usersCollection
      .find({ role: "driver" })
      .project({ _id: 1, name: 1, email: 1, phone: 1, createdAt: 1, updatedAt: 1 })
      .toArray();
    const driverIds = drivers.map((d: any) => d._id.toString());

    // 2. Fetch all profiles in batch
    const profiles = await driverProfilesCollection
      .find({ userId: { $in: driverIds } })
      .toArray();
    const profileMap = new Map(profiles.map((p: any) => [p.userId, p]));

    // 3. Fetch all requests in batch
    const requests = await serviceRequestsCollection
      .find({ userId: { $in: driverIds } })
      .project({ userId: 1, amount: 1 })
      .toArray();
    const requestsByUser = new Map<string, any[]>();
    const allRequestIds: string[] = [];
    for (const req of requests) {
      const list = requestsByUser.get(req.userId) || [];
      list.push(req);
      requestsByUser.set(req.userId, list);
      allRequestIds.push(req._id.toString());
    }

    // 4. Fetch all repayment proofs in batch
    const proofs = await repaymentProofsCollection
      .find({ requestId: { $in: allRequestIds }, status: "approved" })
      .project({ requestId: 1, amount: 1 })
      .toArray();
    const proofsByRequest = new Map<string, any[]>();
    for (const proof of proofs) {
      const list = proofsByRequest.get(proof.requestId) || [];
      list.push(proof);
      proofsByRequest.set(proof.requestId, list);
    }

    // Assemble response
    const driversWithData = drivers.map((driver: any) => {
      const userId = driver._id.toString();
      const profile: any = profileMap.get(userId);
      const userRequests = requestsByUser.get(userId) || [];
      const totalRequests = userRequests.length;
      const totalSpent = toMoney(
        userRequests.reduce((sum: number, r: any) => sum + (r.amount || 0), 0),
      );

      return {
        id: driver._id,
        userId,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        carRegistration: profile?.carRegistrationNumber || "Not provided",
        carModel: profile?.carModel || "Not provided",
        carYear: profile?.carYear || "Not provided",
        carColor: profile?.carColor || "Not provided",
        verificationStatus: profile?.verificationStatus || "not_submitted",
        rating: profile?.rating || 0,
        totalRequests,
        totalSpent,
        activeLoan: profile?.activeLoan || null,
        joinedDate: driver.createdAt,
        lastActive: driver.updatedAt,
        address: profile?.address || "Not provided",
        city: profile?.city || "Not provided",
        pincode: profile?.pincode || "Not provided",
        dateOfBirth: profile?.dateOfBirth || "Not provided",
        ownershipStatus: profile?.ownershipStatus || "own",
        referenceName: profile?.referenceName || "Not provided",
        referencePhone: profile?.referencePhone || "Not provided",
        carOwnerName: profile?.carOwnerName || "Not provided",
        carOwnerPhone: profile?.carOwnerPhone || "Not provided",
        carOwnerAddress: profile?.carOwnerAddress || "Not provided",
        agreeAccuracy: profile?.agreeAccuracy || false,
        agreeRefTenure: profile?.agreeRefTenure || false,
        agreeOwnerContact: profile?.agreeOwnerContact || false,
        agreeRepayment: profile?.agreeRepayment || false,
        agreeEscalation: profile?.agreeEscalation || false,
        drivingLicenseUrl: profile?.drivingLicenseUrl,
        carRegistrationUrl: profile?.carRegistrationUrl,
        profilePhotoUrl: profile?.profilePhotoUrl,
      };
    });

    // 5. Recent pending verifications (batch lookup)
    const recentVerificationsRaw = await driverProfilesCollection
      .find({ verificationStatus: "pending" })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    const recentVerificationUserIds = recentVerificationsRaw
      .map((v: any) => {
        try { return new ObjectId(v.userId); } catch { return v.userId; }
      });
    const recentUsers = await usersCollection
      .find({ _id: { $in: recentVerificationUserIds } })
      .project({ name: 1, email: 1, phone: 1 })
      .toArray();
    const userMap = new Map(recentUsers.map((u: any) => [u._id.toString(), u]));

    const recentVerifications = recentVerificationsRaw.map((v: any) => {
      const user: any = userMap.get(v.userId) || userMap.get(v.userId.toString());
      return {
        id: v._id,
        name: v.fullName || user?.name || "Unknown",
        email: user?.email || "Unknown",
        phone: user?.phone || "Unknown",
        date: v.createdAt,
        submittedAt: v.createdAt,
        verificationStatus: v.verificationStatus,
        carRegistration: v.carRegistrationNumber,
        carModel: v.carModel,
        carColor: v.carColor,
        carYear: v.carYear,
        address: v.address,
        city: v.city,
        pincode: v.pincode,
        dateOfBirth: v.dateOfBirth,
        drivingLicenseUrl: v.drivingLicenseUrl,
        carRegistrationUrl: v.carRegistrationUrl,
        profilePhotoUrl: v.profilePhotoUrl,
        ownershipStatus: v.ownershipStatus,
        referenceName: v.referenceName,
        referencePhone: v.referencePhone,
        carOwnerName: v.carOwnerName,
        carOwnerPhone: v.carOwnerPhone,
        carOwnerAddress: v.carOwnerAddress,
        agreeAccuracy: v.agreeAccuracy,
        agreeRefTenure: v.agreeRefTenure,
        agreeOwnerContact: v.agreeOwnerContact,
        agreeRepayment: v.agreeRepayment,
        agreeEscalation: v.agreeEscalation,
      };
    });

    // Calculate stats
    const verifiedCount = driversWithData.filter(
      (d: any) => d.verificationStatus === "approved",
    ).length;
    const pendingCount = driversWithData.filter(
      (d: any) => d.verificationStatus === "pending",
    ).length;
    const rejectedCount = driversWithData.filter(
      (d: any) => d.verificationStatus === "rejected",
    ).length;

    return NextResponse.json({
      drivers: driversWithData,
      recent: recentVerifications,
      total: driversWithData.length,
      verified: verifiedCount,
      pending: pendingCount,
      rejected: rejectedCount,
    });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return NextResponse.json(
      { error: "Failed to fetch drivers" },
      { status: 500 },
    );
  }
}
