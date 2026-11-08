// src/app/api/driver/deposit/proof/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { Db, ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import {
  getDepositTierConfig,
  getDepositWeek,
  getInstallmentAmount,
  type DepositProofDoc,
  type DepositTier,
  type DepositUser,
} from "@/lib/deposit";
import { sendAdminDepositProofEmail } from "@/lib/email";
import {
  sendAdminPushNotification,
  sendPushNotification,
} from "@/lib/notifications";
import { formatMoney, toMoney } from "@/lib/money";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const userId: string = body.userId || session.user.id;
    const { proofUrl, proofPublicId } = body;

    const isAdmin = (session.user as { role?: string }).role === "admin";
    if (!isAdmin && session.user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!proofUrl) {
      return NextResponse.json(
        { error: "Proof of payment is required" },
        { status: 400 },
      );
    }

    const { db: database } = await connectToDatabase();
    const db = database as Db;
    const profile = await db.collection("driverProfiles").findOne({ userId });

    const tier: DepositTier | null =
      profile?.depositTier === "TIER_1" || profile?.depositTier === "TIER_2"
        ? profile.depositTier
        : null;
    const config = getDepositTierConfig(tier);

    if (!tier || !config) {
      return NextResponse.json(
        {
          error: "Deposit contract required",
          message:
            "Accept your security deposit contract before uploading a payment.",
        },
        { status: 403 },
      );
    }

    const target = config.targetAmount;
    const balance = toMoney(Number(profile?.securityDepositBalance) || 0);
    if (balance >= target) {
      return NextResponse.json(
        { error: "Deposit already complete" },
        { status: 400 },
      );
    }

    const remaining = toMoney(Math.max(0, target - balance));
    const expectedAmount = getInstallmentAmount(
      remaining,
      config.weeklyInstallment,
    );

    if (body.amount !== undefined && toMoney(Number(body.amount)) !== expectedAmount) {
      return NextResponse.json(
        {
          error: "Incorrect installment amount",
          message: `Your installment for this week is ${formatMoney(
            expectedAmount,
          )}.`,
          expectedAmount,
        },
        { status: 400 },
      );
    }

    const week = getDepositWeek();

    const proofs = db.collection<DepositProofDoc>("depositProofs");
    const existing = await proofs.findOne({
      userId,
      weekStart: week.startDate,
      status: { $in: ["pending", "approved"] },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.status === "approved"
              ? "This week's deposit is already paid"
              : "This week's proof is already awaiting approval",
        },
        { status: existing.status === "approved" ? 400 : 409 },
      );
    }

    const now = new Date();
    const proof: DepositProofDoc = {
      userId,
      tier,
      amount: expectedAmount,
      weekStart: week.startDate,
      weekEnd: week.endDate,
      proofUrl,
      proofPublicId: proofPublicId || undefined,
      status: "pending",
      submittedAt: now,
      updatedAt: now,
    };

    const result = await proofs.insertOne(proof);

    const user = await findUser(db, userId);
    const driverName = profile?.fullName || user?.name || "A driver";
    const driverEmail = user?.email || profile?.driverEmail || "";
    const driverPhone = user?.phone || profile?.driverPhone || "Unknown";
    const carRegistration = profile?.carRegistrationNumber || "Unknown";

    if (user) {
      const pushTokens = getPushTokens(user);
      if (pushTokens.length) {
        await sendPushNotification(
          pushTokens,
          "Deposit Proof Submitted",
          `Your ${formatMoney(expectedAmount)} deposit payment is pending review.`,
          { screen: "Deposit" },
        ).catch((err) =>
          console.error("Failed to send deposit proof push:", err),
        );
      }
    }

    await sendAdminPushNotification(
      "Deposit Proof Submitted",
      `${driverName} submitted a deposit proof of ${formatMoney(
        expectedAmount,
      )}.`,
      { screen: "AdminDepositProofs" },
    ).catch((err) =>
      console.error("Failed to send admin deposit proof push:", err),
    );

    await sendAdminDepositProofEmail({
      driverName,
      driverEmail,
      driverPhone,
      carRegistration,
      tierName: config.name,
      amount: expectedAmount,
      securityDepositBalance: balance,
      targetDepositAmount: target,
      proofUrl,
      submittedAt: now.toISOString(),
      proofId: result.insertedId.toString(),
    }).catch((err) =>
      console.error("Failed to send admin deposit proof email:", err),
    );

    return NextResponse.json({
      success: true,
      message: "Deposit proof submitted. Awaiting admin approval.",
      proofId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Deposit proof error:", error);
    return NextResponse.json(
      { error: "Failed to submit deposit proof" },
      { status: 500 },
    );
  }
}

function getPushTokens(user: DepositUser): string[] {
  return user.pushTokens?.length
    ? user.pushTokens
    : user.expoPushToken
      ? [user.expoPushToken]
      : [];
}

async function findUser(db: Db, userId: string) {
  const users = db.collection<DepositUser>("user");
  return users.findOne(
    ObjectId.isValid(userId)
      ? { _id: new ObjectId(userId) }
      : { _id: userId },
  );
}
