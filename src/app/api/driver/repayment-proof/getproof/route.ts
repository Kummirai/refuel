// src/app/api/driver/repayment-proofs/getprrof/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const requestId = searchParams.get("requestId");

    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const repaymentProofsCollection = db.collection("repaymentProofs");

    // Find all repayment proofs for this request (single or bulk)
    const proofs = await repaymentProofsCollection
      .find({
        userId: session.user.id,
        $or: [
          { requestId: requestId },
          { requestIds: requestId },
        ],
      })
      .sort({ submittedAt: -1 })
      .toArray();

    // Format the response
    const formattedProofs = proofs.map((proof: any) => ({
      id: proof._id.toString(),
      requestIds: proof.requestIds || undefined,
      amount: proof.amount,
      status: proof.status,
      submittedAt: proof.submittedAt,
      approvedAt: proof.approvedAt,
      proofUrl: proof.proofUrl,
      proofPublicId: proof.proofPublicId,
      remainingBalance: proof.remainingBalance,
      isFullyPaid: proof.isFullyPaid,
    }));

    return NextResponse.json(formattedProofs);
  } catch (error) {
    console.error("Error fetching repayment proofs:", error);
    return NextResponse.json(
      { error: "Failed to fetch repayment proofs" },
      { status: 500 },
    );
  }
}
