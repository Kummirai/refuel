// src/app/api/admin/deposit-proofs/upload-for-driver/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { Db, ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import {
  getDepositTierConfig,
  getDepositWeek,
  getInstallmentAmount,
  toDateKey,
  type DepositProofDoc,
  type DepositTier,
} from "@/lib/deposit";
import {
  approveDepositProof,
  DepositApprovalError,
} from "@/lib/deposit-approval";
import { formatMoney, toMoney } from "@/lib/money";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if ((session.user as { role?: string }).role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

interface EligibleProfile {
  userId: string;
  fullName?: string;
  driverEmail?: string;
  driverPhone?: string;
  carRegistrationNumber?: string;
  targetDepositAmount?: number;
  weeklyDepositInstallment?: number;
  securityDepositBalance?: number;
  depositTier?: DepositTier;
}

interface EligibleUser {
  _id?: ObjectId | string;
  name?: string;
  email?: string;
  phone?: string;
}

/** Drivers with an active deposit plan and an outstanding balance. */
export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { db: database } = await connectToDatabase();
    const db = database as Db;

    const profiles = await db
      .collection<EligibleProfile>("driverProfiles")
      .find({ depositTier: { $in: ["TIER_1", "TIER_2"] } })
      .sort({ depositAcceptedAt: -1 })
      .limit(500)
      .toArray();

    const week = getDepositWeek();
    const weekProofs = await db
      .collection<DepositProofDoc>("depositProofs")
      .find({
        userId: { $in: profiles.map((p) => p.userId) },
        weekStart: week.startDate,
        status: { $in: ["pending", "approved"] },
      })
      .toArray();
    const weekStatusByUser = new Map(
      weekProofs.map((p) => [p.userId, p.status] as const),
    );

    const users = await findUsers(
      db,
      profiles.map((p) => p.userId),
    );
    const userById = new Map(users.map((u) => [String(u._id), u] as const));

    const eligible = profiles
      .map((profile) => {
        const config = getDepositTierConfig(profile.depositTier);
        const target = config
          ? config.targetAmount
          : toMoney(Number(profile.targetDepositAmount) || 0);
        const balance = toMoney(
          Number(profile.securityDepositBalance) || 0,
        );
        const remaining = toMoney(Math.max(0, target - balance));
        const weeklyInstallment = config
          ? config.weeklyInstallment
          : toMoney(Number(profile.weeklyDepositInstallment) || 0);
        const user = userById.get(profile.userId);
        return {
          userId: profile.userId,
          driverName: profile.fullName || user?.name || "Unknown",
          driverEmail: user?.email || profile.driverEmail || "",
          driverPhone: user?.phone || profile.driverPhone || "",
          carRegistration: profile.carRegistrationNumber || "Not provided",
          tier: profile.depositTier,
          tierName: config?.name || profile.depositTier,
          targetDepositAmount: target,
          securityDepositBalance: balance,
          weeklyInstallment,
          remainingAmount: remaining,
          expectedAmount: getInstallmentAmount(remaining, weeklyInstallment),
          currentWeekStart: toDateKey(week.startDate),
          currentWeekStatus: weekStatusByUser.get(profile.userId) ?? null,
        };
      })
      .filter(
        (driver) =>
          driver.remainingAmount > 0 && driver.currentWeekStatus === null,
      );

    return NextResponse.json(eligible);
  } catch (error) {
    console.error("Error fetching eligible deposit drivers:", error);
    return NextResponse.json(
      { error: "Failed to fetch eligible drivers" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const userId = typeof body.userId === "string" ? body.userId : "";
    const proofUrl = typeof body.proofUrl === "string" ? body.proofUrl : "";
    const proofPublicId =
      typeof body.proofPublicId === "string" ? body.proofPublicId : undefined;

    if (!userId) {
      return NextResponse.json(
        { error: "Select the driver this payment belongs to" },
        { status: 400 },
      );
    }
    if (!proofUrl) {
      return NextResponse.json(
        { error: "Proof of payment is required" },
        { status: 400 },
      );
    }

    const { db: database } = await connectToDatabase();
    const db = database as Db;
    const profiles = db.collection<EligibleProfile>("driverProfiles");
    const profile = await profiles.findOne({ userId });

    const tier: DepositTier | null =
      profile?.depositTier === "TIER_1" || profile?.depositTier === "TIER_2"
        ? profile.depositTier
        : null;
    const config = getDepositTierConfig(tier);
    if (!profile || !tier || !config) {
      return NextResponse.json(
        {
          error: "This driver has not accepted a deposit contract yet.",
        },
        { status: 403 },
      );
    }

    const target = config.targetAmount;
    const balance = toMoney(Number(profile.securityDepositBalance) || 0);
    const remaining = toMoney(Math.max(0, target - balance));
    if (remaining <= 0) {
      return NextResponse.json(
        { error: "This driver's security deposit is already complete." },
        { status: 400 },
      );
    }

    const requestedAmount =
      body.amount === undefined || body.amount === null || body.amount === ""
        ? getInstallmentAmount(remaining, config.weeklyInstallment)
        : toMoney(Number(body.amount));
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return NextResponse.json(
        { error: "Enter a payment amount greater than zero." },
        { status: 400 },
      );
    }
    if (requestedAmount > remaining) {
      return NextResponse.json(
        {
          error: `Amount exceeds the remaining deposit balance of ${formatMoney(
            remaining,
          )}.`,
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
              ? "This week's deposit is already paid."
              : "This week's proof is already awaiting approval.",
        },
        { status: existing.status === "approved" ? 400 : 409 },
      );
    }

    const now = new Date();
    const result = await proofs.insertOne({
      userId,
      tier,
      amount: requestedAmount,
      weekStart: week.startDate,
      weekEnd: week.endDate,
      proofUrl,
      proofPublicId,
      status: "pending",
      submittedAt: now,
      updatedAt: now,
      uploadedByAdmin: true,
    });

    try {
      const approval = await approveDepositProof(
        db,
        {
          _id: result.insertedId,
          userId,
          tier,
          amount: requestedAmount,
          weekStart: week.startDate,
          weekEnd: week.endDate,
          proofUrl,
          proofPublicId,
          status: "approved",
          submittedAt: now,
          updatedAt: now,
          uploadedByAdmin: true,
        },
        now,
      );

      return NextResponse.json({
        success: true,
        message: `Recorded ${formatMoney(
          approval.creditedAmount,
        )} for ${profile.fullName || "the driver"}. New balance: ${formatMoney(
          approval.balanceAfter,
        )} of ${formatMoney(target)}.`,
        proofId: result.insertedId.toString(),
        creditedAmount: approval.creditedAmount,
        balanceAfter: approval.balanceAfter,
        depositComplete: approval.depositComplete,
      });
    } catch (approvalError) {
      await proofs.deleteOne({ _id: result.insertedId });
      if (approvalError instanceof DepositApprovalError) {
        return NextResponse.json(
          { error: approvalError.message },
          { status: approvalError.status },
        );
      }
      throw approvalError;
    }
  } catch (error) {
    console.error("Error uploading deposit proof for driver:", error);
    return NextResponse.json(
      { error: "Failed to record deposit payment" },
      { status: 500 },
    );
  }
}

async function findUsers(db: Db, userIds: string[]) {
  if (userIds.length === 0) return [] as EligibleUser[];
  const users = db.collection<EligibleUser>("user");
  const ids = userIds.map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id));
  const found = await users.find({ _id: { $in: ids } }).toArray();
  const resolved = new Set(found.map((u) => String(u._id)));
  const missing = userIds.filter((id) => !resolved.has(id));
  if (missing.length > 0) {
    const extra = await users.find({ _id: { $in: missing } }).toArray();
    found.push(...extra);
  }
  return found;
}
