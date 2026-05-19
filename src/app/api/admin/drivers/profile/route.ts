import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { toMoney } from "@/lib/money";
import { calculateDriverRating } from "@/lib/utils/rating";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId || userId === "undefined" || userId === "null") {
      return NextResponse.json(
        { error: "Valid User ID is required" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection("user");
    const driverProfilesCollection = db.collection("driverProfiles");
    const serviceRequestsCollection = db.collection("serviceRequests");
    const repaymentProofsCollection = db.collection("repaymentProofs");

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = await driverProfilesCollection.findOne({ userId });
    if (!profile) {
      return NextResponse.json(
        { error: "Driver profile not found" },
        { status: 404 },
      );
    }

    // Batch fetch all requests and repayment proofs
    const requests = await serviceRequestsCollection
      .find({ userId })
      .toArray();

    const requestIds = requests.map((r: any) => r._id.toString());
    const proofs = await repaymentProofsCollection
      .find({ requestId: { $in: requestIds } })
      .toArray();
    const proofsByRequest = new Map<string, any[]>();
    for (const p of proofs) {
      const list = proofsByRequest.get(p.requestId) || [];
      list.push(p);
      proofsByRequest.set(p.requestId, list);
    }

    const enhancedRequests = requests.map((req: any) => {
      const requestId = req._id.toString();
      const repaymentProofs = proofsByRequest.get(requestId) || [];
      const totalRepaid = repaymentProofs
        .filter((r: any) => r.status === "approved")
        .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
      const totalRepayable = req.totalRepayable || req.amount;
      const remainingBalance = toMoney(Math.max(0, totalRepayable - totalRepaid));
      return { ...req, repayments: repaymentProofs, remainingBalance, isPaid: remainingBalance <= 0 };
    });

    const rating = calculateDriverRating(profile, enhancedRequests);

    // Persist rating to profile so subsequent reads avoid recalculation
    await driverProfilesCollection.updateOne(
      { _id: profile._id },
      { $set: { rating } },
    );

    const fullProfile = {
      fullName: profile.fullName || "",
      dateOfBirth: profile.dateOfBirth || "",
      address: profile.address || "",
      city: profile.city || "",
      pincode: profile.pincode || "",
      carRegistration: profile.carRegistrationNumber || "",
      carRegistrationNumber: profile.carRegistrationNumber || "",
      carModel: profile.carModel || "",
      carYear: profile.carYear || "",
      carColor: profile.carColor || "",
      drivingLicenseUrl: profile.drivingLicenseUrl || "",
      carRegistrationUrl: profile.carRegistrationUrl || "",
      profilePhotoUrl: profile.profilePhotoUrl || "",
      verificationStatus: profile.verificationStatus || "pending",
      rejectionReason: profile.rejectionReason || null,
      submittedDate: profile.createdAt,
      verifiedAt: profile.verifiedAt || null,
      totalRequests: requests.length,
      totalSpent: requests.reduce((sum: number, r: any) => sum + (r.amount || 0), 0),
      rating,
      email: user.email || "",
      phone: user.phone || "",
      name: profile.fullName || user.name || "",
    };

    return NextResponse.json({ success: true, profile: fullProfile });
  } catch (error) {
    console.error("Error fetching driver profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch driver profile" },
      { status: 500 },
    );
  }
}
