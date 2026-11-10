import { Db, ObjectId } from "mongodb";
import {
  calculateConsecutiveOnTimeMonths,
  getDepositTierConfig,
  getDriverDepositSummary,
  type DepositProofDoc,
  type DepositUser,
} from "./deposit";
import { sendDriverDepositApprovalEmail } from "./email";
import { sendPushNotification } from "./notifications";
import { formatMoney, toMoney } from "./money";

interface ApprovalProfile {
  userId?: string;
  fullName?: string;
  driverEmail?: string;
  driverPhone?: string;
  carRegistrationNumber?: string;
  targetDepositAmount?: number;
  securityDepositBalance?: number;
  depositAcceptedAt?: Date | string;
}

export class DepositApprovalError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "DepositApprovalError";
    this.status = status;
  }
}

export interface DepositApprovalResult {
  creditedAmount: number;
  balanceAfter: number;
  depositComplete: boolean;
  targetDepositAmount: number;
  summary: Awaited<ReturnType<typeof getDriverDepositSummary>>;
}

export async function approveDepositProof(
  db: Db,
  proof: DepositProofDoc & { _id: ObjectId },
  now: Date = new Date(),
): Promise<DepositApprovalResult> {
  const proofs = db.collection<DepositProofDoc>("depositProofs");
  const profiles = db.collection<ApprovalProfile>("driverProfiles");

  const duplicate = await proofs.findOne({
    userId: proof.userId,
    weekStart: proof.weekStart,
    status: "approved",
    _id: { $ne: proof._id },
  });
  if (duplicate) {
    throw new DepositApprovalError(
      "An approved payment already exists for this week",
      409,
    );
  }

  const profile = await profiles.findOne({ userId: proof.userId });
  const tierConfig = getDepositTierConfig(proof.tier);
  const target = tierConfig
    ? tierConfig.targetAmount
    : toMoney(Number(profile?.targetDepositAmount) || 0);
  const currentBalance = toMoney(Number(profile?.securityDepositBalance) || 0);
  const proofAmount = toMoney(Number(proof.amount) || 0);

  const remaining = target > 0 ? Math.max(0, target - currentBalance) : 0;
  const creditedAmount =
    target > 0 ? toMoney(Math.min(proofAmount, remaining)) : proofAmount;
  const balanceAfter =
    target > 0
      ? toMoney(Math.min(target, currentBalance + creditedAmount))
      : toMoney(currentBalance + creditedAmount);
  const depositComplete = target > 0 && balanceAfter >= target;

  await proofs.updateOne(
    { _id: proof._id },
    {
      $set: {
        status: "approved",
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

  const user = await findDepositUser(db, proof.userId);
  const driverName = profile?.fullName || user?.name || "Driver";
  const driverEmail = user?.email || profile?.driverEmail || "";
  const carRegistration = profile?.carRegistrationNumber || "Unknown";
  const tierName = tierConfig?.name || proof.tier;

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

  return {
    creditedAmount,
    balanceAfter,
    depositComplete,
    targetDepositAmount: target,
    summary,
  };
}

export async function notifyDriver(
  user: DepositUser | null,
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

export async function findDepositUser(db: Db, userId: string) {
  const users = db.collection<DepositUser>("user");
  return users.findOne(
    ObjectId.isValid(userId)
      ? { _id: new ObjectId(userId) }
      : { _id: userId },
  );
}
