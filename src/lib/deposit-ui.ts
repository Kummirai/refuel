export type DepositTier = "TIER_1" | "TIER_2";
export type DepositStatus = "ACTIVE" | "DEDUCTED" | "SUSPENDED";
export type DepositPaymentStatus = "pending" | "approved" | "rejected";

export interface DepositTierConfig {
  tier: DepositTier;
  name: string;
  targetAmount: number;
  weeklyInstallment: number;
  totalWeeks: number;
  summary: string;
}

export const DEPOSIT_TIERS: Record<DepositTier, DepositTierConfig> = {
  TIER_1: {
    tier: "TIER_1",
    name: "Tier 1",
    targetAmount: 1500,
    weeklyInstallment: 375,
    totalWeeks: 4,
    summary: "R1,500 deposit over 4 weeks",
  },
  TIER_2: {
    tier: "TIER_2",
    name: "Tier 2",
    targetAmount: 2500,
    weeklyInstallment: 312.5,
    totalWeeks: 8,
    summary: "R2,500 deposit over 8 weeks",
  },
};

export const DEPOSIT_TIER_LIST: DepositTierConfig[] = [
  DEPOSIT_TIERS.TIER_1,
  DEPOSIT_TIERS.TIER_2,
];

export const STANDARD_FUEL_FEE_RATE = 13;
export const PROMOTIONAL_FUEL_FEE_RATE = 10;

const PROMO_START = new Date(2026, 10, 1, 0, 0, 0, 0);
const PROMO_END = new Date(2027, 0, 30, 23, 59, 59, 999);

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

export function getDepositTierConfig(
  tier?: DepositTier | null,
): DepositTierConfig | null {
  return tier ? DEPOSIT_TIERS[tier] ?? null : null;
}

export interface DepositPayment {
  id: string;
  amount: number;
  weekStart: string;
  status: DepositPaymentStatus;
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

function getWeekStart(now: Date): Date {
  const start = new Date(now);
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  return start;
}

function addWorkingDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return result;
}

export function getDeductionRefillDeadline(deductionDate: string | Date): Date {
  const date =
    typeof deductionDate === "string" ? new Date(deductionDate) : deductionDate;
  return addWorkingDays(date, 14);
}

export function getPlanEndDate(
  acceptedAt: string | Date,
  totalWeeks: number,
): Date {
  const start = getWeekStart(
    typeof acceptedAt === "string" ? new Date(acceptedAt) : acceptedAt,
  );
  const end = new Date(start);
  end.setDate(end.getDate() + totalWeeks * 7);
  return end;
}

export function getInstallmentAmount(
  remaining: number,
  weeklyInstallment: number,
): number {
  if (remaining <= 0) return 0;
  return Math.min(remaining, weeklyInstallment);
}

export function formatDepositMoney(amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return `R${value.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDepositDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
