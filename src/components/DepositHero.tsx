"use client";

import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  formatDepositMoney,
  getDepositTierConfig,
  getInstallmentAmount,
  isPromotionalRateActive,
  type DriverDepositSummary,
} from "@/lib/deposit-ui";

interface DepositHeroProps {
  deposit: DriverDepositSummary | null | undefined;
  loading?: boolean;
  onPress: () => void;
}

export default function DepositHero({
  deposit,
  loading,
  onPress,
}: DepositHeroProps) {
  if (loading && !deposit) {
    return (
      <div className="relative overflow-hidden rounded-3xl p-6 mb-5 bg-gradient-to-br from-[#01312D] to-[#3A7717] shadow-xl animate-pulse">
        <div className="h-4 w-32 rounded bg-white/15" />
        <div className="h-10 w-44 rounded bg-white/15 mt-4" />
        <div className="h-2 w-full rounded bg-white/15 mt-4" />
        <div className="h-20 w-full rounded-2xl bg-white/10 mt-4" />
      </div>
    );
  }

  const config = getDepositTierConfig(deposit?.tier);

  if (!deposit?.tier || !config) {
    return (
      <div className="relative overflow-hidden rounded-3xl p-6 mb-5 bg-gradient-to-br from-[#01312D] to-[#3A7717] shadow-xl">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#bff202]/10 pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 text-[#bff202]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[10px] font-extrabold tracking-widest">
              SECURITY DEPOSIT
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-3">
            Choose your fuel deposit plan
          </h2>
          <p className="text-xs text-white/70 leading-relaxed mt-2 max-w-[85%]">
            Pick a plan and pay it off weekly. Your fuel credit unlocks as each
            installment is approved.
          </p>
          <button
            type="button"
            onClick={onPress}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#bff202] px-6 py-3 text-xs font-extrabold text-[#01312D] shadow-lg active:scale-95 transition-all"
          >
            Choose a plan
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const percent = deposit.targetDepositAmount
    ? Math.min(
        100,
        (deposit.securityDepositBalance / deposit.targetDepositAmount) * 100,
      )
    : 0;
  const installment = getInstallmentAmount(
    deposit.remainingToDeposit,
    deposit.weeklyDepositInstallment,
  );
  const weekLabel = deposit.weeklyInstallmentPaid
    ? "Paid"
    : deposit.currentWeek?.pendingProofId
      ? "In review"
      : formatDepositMoney(installment);
  const loyalty = Math.min(3, deposit.consecutiveOnTimeMonths ?? 0);

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 mb-5 bg-gradient-to-br from-[#01312D] to-[#3A7717] shadow-xl">
      <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-[#bff202]/10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#bff202] px-2.5 py-1 text-[10px] font-extrabold text-[#01312D]">
            <ShieldCheck className="w-3 h-3" />
            {config.name}
          </span>
          <span
            className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold text-white ${
              deposit.depositStatus === "ACTIVE"
                ? "bg-[#bff202]/25"
                : deposit.depositStatus === "DEDUCTED"
                  ? "bg-amber-500/30"
                  : "bg-red-600/30"
            }`}
          >
            {deposit.depositStatus === "ACTIVE"
              ? "Active"
              : deposit.depositStatus === "DEDUCTED"
                ? "Deducted"
                : "Suspended"}
          </span>
        </div>

        <p className="text-xs text-white/70 mt-4">Security deposit balance</p>
        <div className="flex flex-wrap items-end gap-x-2">
          <p className="text-3xl font-extrabold text-white tracking-tight">
            {formatDepositMoney(deposit.securityDepositBalance)}
          </p>
          <p className="text-xs text-white/60 mb-1">
            of {formatDepositMoney(deposit.targetDepositAmount)}
          </p>
        </div>

        <div className="h-2 rounded-full bg-white/20 overflow-hidden mt-3">
          <div
            className={`h-full rounded-full ${
              deposit.depositComplete ? "bg-[#bff202]" : "bg-[#bff202]"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] font-semibold text-white/70">
          <span>
            {deposit.depositComplete
              ? "Deposit fully paid"
              : `${formatDepositMoney(deposit.remainingToDeposit)} left`}
          </span>
          <span>
            {deposit.weeksPaid} of {config.totalWeeks} weeks paid
          </span>
        </div>

        <div className="mt-4 rounded-2xl bg-[#bff202] p-3.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-extrabold tracking-widest text-[#01312D]/60">
              THIS WEEK
            </p>
            <p className="text-lg font-extrabold text-[#01312D]">{weekLabel}</p>
          </div>
          <button
            type="button"
            onClick={onPress}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#01312D] px-3.5 py-2 text-[10px] font-extrabold text-[#bff202] active:scale-95 transition-all"
          >
            {deposit.depositComplete ? "View plan" : "Manage"}
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#72bf00]" />
            <span className="text-[10px] font-semibold text-white/70">
              {loyalty}/3 loyalty months
            </span>
            <div className="flex gap-1 ml-1">
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className={`h-1.5 w-4 rounded-full ${
                    index < loyalty ? "bg-[#bff202]" : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>

          {isPromotionalRateActive() && (
            <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[9px] font-bold text-[#bff202]">
              <Sparkles className="w-3 h-3" />
              {deposit.fuelInterestRate}% refuel fee
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
