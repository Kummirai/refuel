// src/lib/deposit.ts
import { Db, ObjectId } from "mongodb";
import { toMoney } from "./money";

export type DepositTier = "TIER_1" | "TIER_2";
export type DepositStatus = "ACTIVE" | "DEDUCTED" | "SUSPENDED";
export type DepositProofStatus = "pending" | "approved" | "rejected";

export interface DepositTierConfig {
  tier: DepositTier;
  name: string;
  targetAmount: number;
  weeklyInstallment: number;
  totalWeeks: number;
}

export const DEPOSIT_TIERS: Record<DepositTier, DepositTierConfig> = {
  TIER_1: {
    tier: "TIER_1",
    name: "Tier 1",
    targetAmount: 1500,
    weeklyInstallment: 375,
    totalWeeks: 4,
  },
  TIER_2: {
    tier: "TIER_2",
    name: "Tier 2",
    targetAmount: 2500,
    weeklyInstallment: 312.5,
    totalWeeks: 8,
  },
};

export function getDepositTierConfig(
  tier?: DepositTier | null,
): DepositTierConfig | null {
  if (!tier) return null;
  return DEPOSIT_TIERS[tier] ?? null;
}

export function getBaseCreditLimit(tier?: DepositTier | null): number {
  return getDepositTierConfig(tier)?.targetAmount ?? 0;
}

export const STANDARD_FUEL_FEE_RATE = 13;
export const PROMOTIONAL_FUEL_FEE_RATE = 10;

// Promotional 10% refueling rate: 1 Nov 2026 – 30 Jan 2027 (inclusive)
export const PROMO_START = new Date(2026, 10, 1, 0, 0, 0, 0);
export const PROMO_END = new Date(2027, 0, 30, 23, 59, 59, 999);

export function isPromotionalRateActive(now: Date = new Date()): boolean {
  return now >= PROMO_START && now <= PROMO_END;
}

export function getFuelInterestRate(
  configuredRate: number = STANDARD_FUEL_FEE_RATE,
  now: Date = new Date(),
): number {
  return isPromotionalRateActive(now)
    ? PROMOTIONAL_FUEL_FEE_RATE
    : configuredRate;
}

export interface DepositWeek {
  startDate: Date;
  endDate: Date;
}

/** Monday 00:00 → next Monday 00:00 (local time) */
export function getDepositWeek(now: Date = new Date()): DepositWeek {
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const start = new Date(now);
  start.setDate(now.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  end.setHours(0, 0, 0, 0);
  return { startDate: start, endDate: end };
}

export function toDateKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function calculateEffectiveCreditLimit(
  baseLimit: number,
  weeklyInstallment: number,
  isWeeklyDepositPaid: boolean,
): number {
  if (!isWeeklyDepositPaid) {
    return toMoney(Math.max(0, baseLimit - weeklyInstallment));
  }
  return toMoney(baseLimit);
}

export function getInstallmentAmount(
  remaining: number,
  weeklyInstallment: number,
): number {
  if (remaining <= 0) return 0;
  return toMoney(Math.min(remaining, weeklyInstallment));
}

export function addWorkingDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return result;
}

export function getDeductionRefillDeadline(
  deductionDate: Date | string,
): Date {
  const date =
    typeof deductionDate === "string" ? new Date(deductionDate) : deductionDate;
  return addWorkingDays(date, 14);
}

export interface DepositProofDoc {
  _id?: ObjectId;
  userId: string;
  tier: DepositTier;
  amount: number;
  weekStart: Date;
  weekEnd: Date;
  proofUrl: string;
  proofPublicId?: string;
  status: DepositProofStatus;
  submittedAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
  rejectionReason?: string | null;
  creditedAmount?: number;
  balanceAfter?: number;
  uploadedByAdmin?: boolean;
}

export interface DepositPayment {
  id: string;
  amount: number;
  weekStart: string;
  status: DepositProofStatus;
  proofUrl?: string;
  proofPublicId?: string;
  submittedAt: string;
  approvedAt?: string | null;
  rejectionReason?: string | null;
}

export interface DriverDepositSummary {
  tier: DepositTier | null;
  acceptedAt: string | null;
  targetDepositAmount: number;
  weeklyDepositInstallment: number;
  securityDepositBalance: number;
  depositStatus: DepositStatus;
  deductionDate: string | null;
  consecutiveOnTimeMonths: number;
  promotionalRateActive: boolean;
  fuelInterestRate: number;
  baseCreditLimit: number;
  effectiveCreditLimit: number;
  weeklyInstallmentPaid: boolean;
  depositComplete: boolean;
  weeksPaid: number;
  weeksRemaining: number;
  remainingToDeposit: number;
  currentWeek: {
    start: string;
    end: string;
    paid: boolean;
    pendingProofId?: string | null;
  };
  payments: DepositPayment[];
}

export interface DriverProfileDepositFields {
  userId?: string;
  depositTier?: DepositTier | null;
  depositAcceptedAt?: Date | string | null;
  targetDepositAmount?: number;
  weeklyDepositInstallment?: number;
  securityDepositBalance?: number;
  depositStatus?: DepositStatus;
  deductionDate?: Date | string | null;
  consecutiveOnTimeMonths?: number;
  fuelCreditLimit?: number;
}

export interface DepositUser {
  _id?: ObjectId | string;
  name?: string;
  email?: string;
  phone?: string;
  pushTokens?: string[];
  expoPushToken?: string | null;
}

function asDate(value?: Date | string | null): Date | null {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Consecutive full months in which every weekly installment that came due was
 * approved on time. Used for the 3% loyalty bonus.
 */
export function calculateConsecutiveOnTimeMonths(params: {
  acceptedAt: Date | null;
  approvedWeekStarts: Date[];
  totalWeeks: number;
  now?: Date;
}): number {
  const { acceptedAt, approvedWeekStarts, totalWeeks } = params;
  const now = params.now ?? new Date();
  if (!acceptedAt || totalWeeks <= 0) return 0;

  const paidKeys = new Set(approvedWeekStarts.map((d) => toDateKey(d)));
  const acceptedWeek = getDepositWeek(acceptedAt).startDate;
  const planEnd = new Date(acceptedWeek);
  planEnd.setDate(planEnd.getDate() + totalWeeks * 7);

  const acceptedMonth = new Date(
    acceptedAt.getFullYear(),
    acceptedAt.getMonth(),
    1,
  );
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let streak = 0;
  let month = new Date(currentMonth);

  while (month >= acceptedMonth) {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    let dueWeeks = 0;
    let missedWeeks = 0;

    let weekStart = new Date(
      Math.max(month.getTime(), acceptedWeek.getTime()),
    );
    // Align to the Monday-anchored plan grid.
    const offset =
      (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1) % 7;
    weekStart.setDate(weekStart.getDate() - offset);
    weekStart.setHours(0, 0, 0, 0);

    while (weekStart < nextMonth && weekStart < planEnd) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      // Only count weeks that started in this month, have fully elapsed, and
      // belong to the plan.
      if (
        weekStart >= month &&
        weekEnd <= now &&
        weekStart >= acceptedWeek
      ) {
        dueWeeks += 1;
        if (!paidKeys.has(toDateKey(weekStart))) missedWeeks += 1;
      }
      weekStart = new Date(weekStart);
      weekStart.setDate(weekStart.getDate() + 7);
    }

    if (dueWeeks > 0) {
      if (missedWeeks > 0) break;
      streak += 1;
    }

    month = new Date(month.getFullYear(), month.getMonth() - 1, 1);
  }

  return streak;
}

export async function buildDriverDepositSummary(
  db: Db,
  userId: string,
  profile: DriverProfileDepositFields | null,
  now: Date = new Date(),
): Promise<DriverDepositSummary> {
  const tier =
    profile?.depositTier === "TIER_1" || profile?.depositTier === "TIER_2"
      ? profile.depositTier
      : null;
  const config = getDepositTierConfig(tier);

  const targetDepositAmount = config
    ? config.targetAmount
    : toMoney(Number(profile?.targetDepositAmount) || 0);
  const weeklyDepositInstallment = config
    ? config.weeklyInstallment
    : toMoney(Number(profile?.weeklyDepositInstallment) || 0);

  const rawBalance = toMoney(Number(profile?.securityDepositBalance) || 0);
  const securityDepositBalance =
    targetDepositAmount > 0
      ? Math.min(rawBalance, targetDepositAmount)
      : rawBalance;

  const acceptedAt = asDate(profile?.depositAcceptedAt);
  const deductionDate = asDate(profile?.deductionDate);
  const depositComplete =
    targetDepositAmount > 0 && securityDepositBalance >= targetDepositAmount;
  const remainingToDeposit = toMoney(
    Math.max(0, targetDepositAmount - securityDepositBalance),
  );

  const proofs = await db
    .collection<DepositProofDoc>("depositProofs")
    .find({ userId })
    .sort({ submittedAt: -1 })
    .limit(60)
    .toArray();

  const approvedProofs = proofs.filter((p) => p.status === "approved");
  const approvedWeeks = new Set(
    approvedProofs.map((p) => toDateKey(p.weekStart)),
  );

  const currentWeek = getDepositWeek(now);
  const currentWeekKey = toDateKey(currentWeek.startDate);
  const currentWeekProof = proofs.find(
    (p) => toDateKey(p.weekStart) === currentWeekKey,
  );
  const weeklyInstallmentPaid =
    depositComplete || approvedWeeks.has(currentWeekKey);

  const totalWeeks = config?.totalWeeks ?? 0;
  const weeksPaid =
    totalWeeks > 0
      ? Math.min(approvedWeeks.size, totalWeeks)
      : approvedWeeks.size;

  // Admin per-driver override still wins over the tier base; otherwise the
  // chosen deposit tier determines the weekly credit limit.
  const override = Number(profile?.fuelCreditLimit);
  const hasOverride = Number.isFinite(override) && override >= 0;
  const baseCreditLimit = hasOverride
    ? toMoney(override)
    : getBaseCreditLimit(tier);
  const effectiveCreditLimit = tier
    ? depositComplete
      ? toMoney(baseCreditLimit)
      : calculateEffectiveCreditLimit(
          baseCreditLimit,
          weeklyDepositInstallment,
          weeklyInstallmentPaid,
        )
    : 0;

  const nowRate = getFuelInterestRate(STANDARD_FUEL_FEE_RATE, now);

  return {
    tier,
    acceptedAt: acceptedAt ? acceptedAt.toISOString() : null,
    targetDepositAmount,
    weeklyDepositInstallment,
    securityDepositBalance,
    depositStatus:
      (profile?.depositStatus as DepositStatus | undefined) ?? "ACTIVE",
    deductionDate: deductionDate ? deductionDate.toISOString() : null,
    consecutiveOnTimeMonths: Number(profile?.consecutiveOnTimeMonths) || 0,
    promotionalRateActive: isPromotionalRateActive(now),
    fuelInterestRate: nowRate,
    baseCreditLimit,
    effectiveCreditLimit,
    weeklyInstallmentPaid,
    depositComplete,
    weeksPaid,
    weeksRemaining: Math.max(0, totalWeeks - weeksPaid),
    remainingToDeposit,
    currentWeek: {
      start: currentWeek.startDate.toISOString(),
      end: currentWeek.endDate.toISOString(),
      paid: weeklyInstallmentPaid,
      pendingProofId:
        currentWeekProof?.status === "pending"
          ? currentWeekProof._id?.toString() ?? null
          : null,
    },
    payments: proofs.map((p) => ({
      id: p._id?.toString() ?? "",
      amount: toMoney(Number(p.amount) || 0),
      weekStart: new Date(p.weekStart).toISOString(),
      status: p.status,
      proofUrl: p.proofUrl,
      proofPublicId: p.proofPublicId,
      submittedAt: new Date(p.submittedAt).toISOString(),
      approvedAt: p.approvedAt ? new Date(p.approvedAt).toISOString() : null,
      rejectionReason: p.rejectionReason ?? null,
    })),
  };
}

export async function getDriverDepositSummary(
  db: Db,
  userId: string,
  now: Date = new Date(),
): Promise<DriverDepositSummary> {
  const profile = await db
    .collection<DriverProfileDepositFields & { _id?: ObjectId }>(
      "driverProfiles",
    )
    .findOne({ userId });
  return buildDriverDepositSummary(db, userId, profile, now);
}
