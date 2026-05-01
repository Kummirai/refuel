// src/app/api/drivers/repayment-proof/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/db";

export async function POST(request: NextRequest) {
  console.log("you reanched this point");

  try {
    // Verify user is authenticated
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      requestId,
      amount,
      remainingBalance,
      isFullyPaid,
      proofUrl,
      proofPublicId,
    } = body;

    if (!requestId || !amount || !proofUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const repaymentsCollection = db.collection("repaymentProofs");
    const serviceRequestsCollection = db.collection("serviceRequests");

    // Create repayment proof record
    const repaymentProof = {
      requestId,
      userId: session.user.id,
      amount,
      remainingBalance,
      isFullyPaid,
      proofUrl,
      proofPublicId,
      status: "pending", // pending, approved, rejected
      submittedAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await repaymentsCollection.insertOne(repaymentProof);

    // Update the service request with pending repayment flag
    await serviceRequestsCollection.updateOne(
      { id: requestId, userId: session.user.id },
      {
        $set: {
          hasPendingRepayment: true,
          pendingRepaymentAmount: amount,
          pendingRepaymentId: result.insertedId.toString(),
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({
      success: true,
      message:
        "Repayment proof submitted successfully. Awaiting admin verification.",
      repaymentId: result.insertedId,
    });
  } catch (error) {
    console.error("Repayment proof error:", error);
    return NextResponse.json(
      { error: "Failed to submit repayment proof" },
      { status: 500 },
    );
  }
}
