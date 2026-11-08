// src/app/api/admin/deposit-proofs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { Db, Filter, ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import {
  calculateConsecutiveOnTimeMonths,
  getDepositTierConfig,
  getDriverDepositSummary,
  type DepositProofDoc,
  type DepositProofStatus,
  type DepositTier,
} from "@/lib/deposit";
import {
  sendDriverDepositApprovalEmail,
  sendDriverDepositRejectionEmail,
} from "@/lib/email";
import { sendPushNotification } from "@/lib/notifications";
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

interface AdminUser {
  _id?: ObjectId | string;
  name?: string;
  email?: string;
  phone?: string;
  pushTokens?: string[];
  expoPushToken?: string | null;
}

interface AdminDriverProfile {
  userId?: string;
  fullName?: string;
  driverEmail?: string;
  driverPhone?: string;
  carRegistrationNumber?: string;
  targetDepositAmount?: number;
  securityDepositBalance?: number;
  depositAcceptedAt?: Date | string;
  depositTier?: DepositTier;
  consecutiveOnTimeMonths?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { db: database } = await connectToDatabase();
    const db = database as Db;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const query: Filter<DepositProofDoc> = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status as DepositProofStatus;
    }

    const proofs = await db
      .collection<DepositProofDoc>("depositProofs")
      .find(query)
      .sort({ submittedAt: -1 })
      .limit(200)
      .toArray();

    const userIds = [...new Set(proofs.map((p) => p.userId))];
    const [users, profiles] = await Promise.all([
      findUsers(db, userIds),
      db
        .collection<AdminDriverProfile>("driverProfiles")
        .find({ userId: { $in: userIds } })
        .toArray(),
    ]);

    const userById = new Map(
      users.map((u) => [String(u._id), u] as const),
    );
    const profileByUser = new Map(
      profiles.map((p) => [String(p.userId), p] as const),
    );

    const enriched = proofs.map((proof) => {
      const user = userById.get(proof.userId);
      const profile = profileByUser.get(proof.userId);
      const tierConfig = getDepositTierConfig(proof.tier);
      return {
        id: proof._id?.toString() ?? "",
        userId: proof.userId,
        driverName: profile?.fullName || user?.name || "Unknown",
        driverEmail: user?.email || profile?.driverEmail || "Unknown",
        driverPhone: user?.phone || profile?.driverPhone || "Unknown",
        carRegistration: profile?.carRegistrationNumber || "Not provided",
        tier: proof.tier,
        tierName: tierConfig?.name || proof.tier,
        targetDepositAmount:
          tierConfig?.targetAmount ??
          toMoney(Number(profile?.targetDepositAmount) || 0),
        securityDepositBalance: toMoney(
          Number(profile?.securityDepositBalance) || 0,
        ),
        amount: toMoney(Number(proof.amount) || 0),
        weekStart: proof.weekStart,
        weekEnd: proof.weekEnd,
        proofUrl: proof.proofUrl,
        proofPublicId: proof.proofPublicId,
        status: proof.status,
        submittedAt: proof.submittedAt,
        reviewedAt: proof.reviewedAt,
        approvedAt: proof.approvedAt,
        rejectionReason: proof.rejectionReason,
        creditedAmount: proof.creditedAmount,
        balanceAfter: proof.balanceAfter,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching deposit proofs:", error);
    return NextResponse.json(
      { error: "Failed to fetch deposit proofs" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { proofId, status, reason } = body as {
      proofId?: string;
      status?: "approved" | "rejected";
      reason?: string;
    };

    if (!proofId || !status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "proofId and status (approved or rejected) are required" },
        { status: 400 },
      );
    }

    if (!ObjectId.isValid(proofId)) {
      return NextResponse.json({ error: "Invalid proof id" }, { status: 400 });
    }

    const { db: database } = await connectToDatabase();
    const db = database as Db;
    const proofs = db.collection<DepositProofDoc>("depositProofs");
    const profiles = db.collection<AdminDriverProfile>("driverProfiles");

    const proof = await proofs.findOne({ _id: new ObjectId(proofId) });
    if (!proof) {
      return NextResponse.json({ error: "Proof not found" }, { status: 404 });
    }
    if (proof.status !== "pending") {
      return NextResponse.json(
        { error: `This proof is already ${proof.status}` },
        { status: 409 },
      );
    }

    const profile = await profiles.findOne({ userId: proof.userId });
    const tierConfig = getDepositTierConfig(proof.tier);
    const target = tierConfig
      ? tierConfig.targetAmount
      : toMoney(Number(profile?.targetDepositAmount) || 0);
    const currentBalance = toMoney(
      Number(profile?.securityDepositBalance) || 0,
    );

    const now = new Date();
    const user = await findUser(db, proof.userId);
    const driverName = profile?.fullName || user?.name || "Driver";
    const driverEmail = user?.email || profile?.driverEmail || "";
    const carRegistration = profile?.carRegistrationNumber || "Unknown";
    const tierName = tierConfig?.name || proof.tier;

    if (status === "rejected") {
      await proofs.updateOne(
        { _id: proof._id },
        {
          $set: {
            status: "rejected" as DepositProofStatus,
            rejectionReason:
              reason ||
              "No specific reason provided. Please contact support for more information.",
            reviewedAt: now,
            updatedAt: now,
          },
        },
      );

      await notifyDriver(user, {
        title: "Deposit Payment Rejected",
        body: `Your deposit proof of ${formatMoney(
          Number(proof.amount) || 0,
        )} was rejected. Reason: ${
          reason || "No specific reason provided."
        }`,
      });

      if (driverEmail) {
        await sendDriverDepositRejectionEmail({
          driverEmail,
          driverName,
          carRegistration,
          tierName,
          amount: toMoney(Number(proof.amount) || 0),
          reason:
            reason ||
            "No specific reason provided. Please contact support for more information.",
          weekStart: proof.weekStart.toISOString(),
        }).catch((err) =>
          console.error("Failed to send deposit rejection email:", err),
        );
      }

      return NextResponse.json({
        success: true,
        message: "Deposit proof rejected",
      });
    }

    // Guard against double-crediting the same week.
    const alreadyApproved = await proofs.findOne({
      userId: proof.userId,
      weekStart: proof.weekStart,
      status: "approved",
      _id: { $ne: proof._id },
    });
    if (alreadyApproved) {
      return NextResponse.json(
        { error: "An approved payment already exists for this week" },
        { status: 409 },
      );
    }

    const remaining = target > 0 ? Math.max(0, target - currentBalance) : 0;
    const proofAmount = toMoney(Number(proof.amount) || 0);
    const creditedAmount =
      target > 0
        ? toMoney(Math.min(proofAmount, remaining))
        : proofAmount;
    const balanceAfter =
      target > 0
        ? toMoney(Math.min(target, currentBalance + creditedAmount))
        : toMoney(currentBalance + creditedAmount);
    const depositComplete = target > 0 && balanceAfter >= target;

    await proofs.updateOne(
      { _id: proof._id },
      {
        $set: {
          status: "approved" as DepositProofStatus,
          approvedAt: now,
          reviewedAt: now,
          creditedAmount,
          balanceAfter,
          updatedAt: now,
        },
      },
    );

    const profileUpdate: Record<string, unknown> = {
      securityDepositBalance: balanceAfter,
      updatedAt: now,
    };
    if (depositComplete) {
      profileUpdate.depositStatus = "ACTIVE";
      profileUpdate.deductionDate = null;
    }
    await profiles.updateOne({ userId: proof.userId }, { $set: profileUpdate });

    // Recompute the loyalty streak from all approved weeks.
    const approvedWeeks = await proofs
      .find({ userId: proof.userId, status: "approved" })
      .project({ weekStart: 1 })
      .toArray();
    const acceptedAt = profile?.depositAcceptedAt
      ? new Date(profile.depositAcceptedAt)
      : null;
    const consecutiveOnTimeMonths = calculateConsecutiveOnTimeMonths({
      acceptedAt:
        acceptedAt && !Number.isNaN(acceptedAt.getTime()) ? acceptedAt : null,
      approvedWeekStarts: approvedWeeks.map((p) => new Date(p.weekStart)),
      totalWeeks: tierConfig?.totalWeeks ?? 0,
      now,
    });
    await profiles.updateOne(
      { userId: proof.userId },
      { $set: { consecutiveOnTimeMonths } },
    );

    await notifyDriver(user, {
      title: "Deposit Payment Approved",
      body: depositComplete
        ? `Your ${formatMoney(
            creditedAmount,
          )} deposit payment was approved. Your security deposit is now complete.`
        : `Your ${formatMoney(
            creditedAmount,
          )} deposit payment was approved. Balance: ${formatMoney(
            balanceAfter,
          )} of ${formatMoney(target)}.`,
    });

    if (driverEmail) {
      await sendDriverDepositApprovalEmail({
        driverEmail,
        driverName,
        carRegistration,
        tierName,
        amount: creditedAmount,
        securityDepositBalance: balanceAfter,
        targetDepositAmount: target,
        depositComplete,
        weekStart: proof.weekStart.toISOString(),
      }).catch((err) =>
        console.error("Failed to send deposit approval email:", err),
      );
    }

    const summary = await getDriverDepositSummary(db, proof.userId, now);

    return NextResponse.json({
      success: true,
      message: "Deposit proof approved",
      creditedAmount,
      balanceAfter,
      depositComplete,
      deposit: summary,
    });
  } catch (error) {
    console.error("Error processing deposit proof:", error);
    return NextResponse.json(
      { error: "Failed to process deposit proof" },
      { status: 500 },
    );
  }
}

async function notifyDriver(
  user: AdminUser | null,
  payload: { title: string; body: string },
) {
  if (!user) return;
  const pushTokens = user.pushTokens?.length
    ? user.pushTokens
    : user.expoPushToken
      ? [user.expoPushToken]
      : [];
  if (!pushTokens.length) return;
  await sendPushNotification(pushTokens, payload.title, payload.body, {
    screen: "Deposit",
  }).catch((err) => console.error("Failed to send deposit push:", err));
}

async function findUser(db: Db, userId: string) {
  const users = db.collection<AdminUser>("user");
  return users.findOne(
    ObjectId.isValid(userId)
      ? { _id: new ObjectId(userId) }
      : { _id: userId },
  );
}

async function findUsers(db: Db, userIds: string[]) {
  if (userIds.length === 0) return [];
  const users = db.collection<AdminUser>("user");
  const ids = userIds.map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id));
  const found = await users.find({ _id: { $in: ids } }).toArray();
  // Ensure every requested id resolves, including legacy string ids.
  const resolved = new Set(found.map((u) => String(u._id)));
  const missing = userIds.filter((id) => !resolved.has(id));
  if (missing.length > 0) {
    const extra = await users.find({ _id: { $in: missing } }).toArray();
    found.push(...extra);
  }
  return found;
}
