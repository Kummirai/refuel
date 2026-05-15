import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { calculateDriverRating } from "@/lib/utils/rating";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const driverProfiles = db.collection("driverProfiles");
    const serviceRequestsCollection = db.collection("serviceRequests");
    const repaymentProofsCollection = db.collection("repaymentProofs");

    const profile = await driverProfiles.findOne({ userId });

    // Fetch all requests and repayments to calculate accurate rating
    const requests = await serviceRequestsCollection
      .find({ userId })
      .toArray();
    
    const enhancedRequests = await Promise.all(
      requests.map(async (request: any) => {
        const requestId = request._id.toString();
        const repaymentProofs = await repaymentProofsCollection
          .find({ requestId: requestId })
          .toArray();
        
        const totalRepaid = repaymentProofs
          .filter((r: any) => r.status === "approved")
          .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

        const totalRepayable = request.totalRepayable || request.amount;
        const remainingBalance = Math.max(0, totalRepayable - totalRepaid);

        return {
          ...request,
          repayments: repaymentProofs,
          remainingBalance,
          isPaid: remainingBalance <= 0
        };
      })
    );

    const rating = calculateDriverRating(profile, enhancedRequests);

    return NextResponse.json({
      ...profile,
      rating: rating,
      rejectionReason: profile?.rejectionReason || null,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}
