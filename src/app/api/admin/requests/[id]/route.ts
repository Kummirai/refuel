import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");
    const usersCollection = db.collection("user");
    const driverProfilesCollection = db.collection("driverProfiles");

    const requestDoc = await serviceRequestsCollection.findOne({ _id: objectId });
    if (!requestDoc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    let user: any = null;
    let driverProfile: any = null;
    try {
      if (requestDoc.userId) {
        const userId = (() => { try { return new ObjectId(requestDoc.userId); } catch { return requestDoc.userId; } })();
        user = await usersCollection.findOne({ _id: userId });
        driverProfile = await driverProfilesCollection.findOne({ userId: requestDoc.userId });
      }
    } catch {}

    return NextResponse.json({
      id: requestDoc._id.toString(),
      _id: requestDoc._id.toString(),
      userId: requestDoc.userId,
      type: requestDoc.type,
      amount: requestDoc.amount,
      actualAmount: requestDoc.actualAmount || null,
      carNumber: requestDoc.carNumber,
      carModel: requestDoc.carModel,
      carRegistration: requestDoc.carRegistration,
      fuelType: requestDoc.fuelType,
      contactPhone: requestDoc.contactPhone,
      driverName: requestDoc.driverName || user?.name || driverProfile?.fullName || driverProfile?.name || "Unknown",
      driverPhone: requestDoc.driverPhone || user?.phone || driverProfile?.phone || "Unknown",
      driverEmail: requestDoc.driverEmail || user?.email || "Unknown",
      interest: requestDoc.interest,
      totalRepayable: requestDoc.totalRepayable,
      interestRate: requestDoc.interestRate,
      repaymentDays: requestDoc.repaymentDays,
      dailyPayment: requestDoc.dailyPayment,
      package: requestDoc.package,
      packageDescription: requestDoc.packageDescription,
      status: requestDoc.status,
      otp: requestDoc.otp,
      requestDate: requestDoc.requestDate,
      createdAt: requestDoc.createdAt,
      approvedDate: requestDoc.approvedDate,
      completedDate: requestDoc.completedDate,
      popUrl: requestDoc.popUrl,
      popPublicId: requestDoc.popPublicId,
      popUploadedAt: requestDoc.popUploadedAt,
      updatedAt: requestDoc.updatedAt,
      repaidAmount: requestDoc.repaidAmount || 0,
      remainingBalance: requestDoc.remainingBalance || 0,
      isPaid: requestDoc.isPaid || false,
      refueledByManager: requestDoc.refueledByManager || false,
      location: requestDoc.location || driverProfile?.address || "Not provided",
      phoneNumber: requestDoc.recipientPhoneNumber || requestDoc.contactPhone,
      collateral: requestDoc.collateral || null,
      hasReceipt: requestDoc.hasReceipt || false,
    });
  } catch (error) {
    console.error("Error fetching request:", error);
    return NextResponse.json(
      { error: "Failed to fetch request" },
      { status: 500 },
    );
  }
}
