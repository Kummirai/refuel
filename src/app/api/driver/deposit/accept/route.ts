// src/app/api/driver/deposit/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { Db, ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import {
  DEPOSIT_TIERS,
  getDriverDepositSummary,
  type DepositTier,
  type DepositUser,
} from "@/lib/deposit";
import { sendAdminDepositContractEmail } from "@/lib/email";
import {
  sendAdminPushNotification,
  sendPushNotification,
} from "@/lib/notifications";
import { formatMoney } from "@/lib/money";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const userId: string = body.userId || session.user.id;
    const tier = body.tier as DepositTier;

    const isAdmin = (session.user as { role?: string }).role === "admin";
    if (!isAdmin && session.user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const config = DEPOSIT_TIERS[tier];
    if (!config) {
      return NextResponse.json(
        { error: "Choose either the R1,500 or R2,500 deposit tier" },
        { status: 400 },
      );
    }

    const { db: database } = await connectToDatabase();
    const db = database as Db;
    const profiles = db.collection("driverProfiles");
    const profile = await profiles.findOne({ userId });

    // Tier is fixed once chosen, because the base credit limit and installment
    // schedule depend on it.
    if (profile?.depositTier && profile.depositTier !== tier) {
      return NextResponse.json(
        {
          error: "Deposit contract already accepted",
          message: `You have already accepted the ${
            DEPOSIT_TIERS[profile.depositTier as DepositTier]?.name ?? ""
          } deposit contract.`,
        },
        { status: 409 },
      );
    }

    if (profile?.depositTier === tier) {
      const deposit = await getDriverDepositSummary(db, userId);
      return NextResponse.json({
        success: true,
        message: "Deposit contract already active",
        deposit,
      });
    }

    const now = new Date();
    const existingBalance = Number(profile?.securityDepositBalance) || 0;

    await profiles.updateOne(
      { userId },
      {
        $set: {
          depositTier: tier,
          depositAcceptedAt: profile?.depositAcceptedAt ?? now,
          targetDepositAmount: config.targetAmount,
          weeklyDepositInstallment: config.weeklyInstallment,
          securityDepositBalance: existingBalance,
          depositStatus: profile?.depositStatus ?? "ACTIVE",
          updatedAt: now,
        },
        $setOnInsert: {
          userId,
          consecutiveOnTimeMonths: 0,
          createdAt: now,
        },
      },
      { upsert: true },
    );

    const user = await findUser(db, userId);
    const driverName = profile?.fullName || user?.name || "Driver";
    const driverEmail = user?.email || profile?.driverEmail || "";
    const driverPhone = user?.phone || profile?.driverPhone || "Unknown";
    const carRegistration = profile?.carRegistrationNumber || "Unknown";

    if (user) {
      const pushTokens = getPushTokens(user);
      if (pushTokens.length) {
        await sendPushNotification(
          pushTokens,
          "Deposit Contract Accepted",
          `${config.name} accepted: ${formatMoney(config.targetAmount)} over ${
            config.totalWeeks
          } weeks at ${formatMoney(config.weeklyInstallment)} per week.`,
          { screen: "Deposit" },
        ).catch((err) =>
          console.error("Failed to send deposit acceptance push:", err),
        );
      }
    }

    await sendAdminPushNotification(
      "Deposit Contract Accepted",
      `${driverName} accepted the ${config.name} deposit contract (${formatMoney(
        config.targetAmount,
      )}).`,
      { screen: "AdminDepositProofs" },
    ).catch((err) =>
      console.error("Failed to send admin deposit acceptance push:", err),
    );

    await sendAdminDepositContractEmail({
      driverName,
      driverEmail,
      driverPhone,
      carRegistration,
      tierName: config.name,
      targetAmount: config.targetAmount,
      weeklyInstallment: config.weeklyInstallment,
      totalWeeks: config.totalWeeks,
      acceptedAt: now.toISOString(),
    }).catch((err) =>
      console.error("Failed to send admin deposit contract email:", err),
    );

    const deposit = await getDriverDepositSummary(db, userId);
    return NextResponse.json({
      success: true,
      message: `${config.name} contract accepted`,
      deposit,
    });
  } catch (error) {
    console.error("Deposit acceptance error:", error);
    return NextResponse.json(
      { error: "Failed to accept deposit contract" },
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
