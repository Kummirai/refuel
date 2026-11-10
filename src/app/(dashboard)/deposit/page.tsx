"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { authClient } from "@/lib/auth-client";
import { fetcher } from "@/lib/fetch";
import BottomNavigation from "@/components/BottomNavigation";
import { CloudinaryUpload } from "@/components/CloudinaryUpload";
import { Skeleton } from "@/components/ui/Skeleton";
import ConnectingScreen from "@/components/ConnectingScreen";
import { useSessionPending } from "@/lib/hooks/useSessionPending";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  CloudUpload,
  Fuel,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import {
  DEPOSIT_TIER_LIST,
  formatDepositDate,
  formatDepositMoney,
  getDeductionRefillDeadline,
  getDepositTierConfig,
  getInstallmentAmount,
  getPlanEndDate,
  isPromotionalRateActive,
  type DepositPayment,
  type DepositTier,
  type DriverDepositSummary,
} from "@/lib/deposit-ui";

function paymentStatusConfig(status: DepositPayment["status"]) {
  switch (status) {
    case "approved":
      return {
        label: "Approved",
        color: "text-green-700",
        bg: "bg-green-50",
        icon: CheckCircle2,
      };
    case "rejected":
      return {
        label: "Rejected",
        color: "text-red-600",
        bg: "bg-red-50",
        icon: XCircle,
      };
    default:
      return {
        label: "Awaiting approval",
        color: "text-yellow-700",
        bg: "bg-yellow-50",
        icon: Clock,
      };
  }
}

export default function DepositPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const sessionPending = useSessionPending(isPending);
  const userId = session?.user?.id;

  const {
    data: deposit,
    isLoading,
    mutate,
  } = useSWR<DriverDepositSummary>(
    userId ? `/api/driver/deposit?userId=${userId}` : null,
    fetcher,
    { refreshInterval: 60_000, dedupingInterval: 30_000 },
  );

  const [selectedTier, setSelectedTier] = useState<DepositTier>("TIER_1");
  const [agreed, setAgreed] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState("");

  const [payOpen, setPayOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [proofPublicId, setProofPublicId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!isPending && !session) router.push("/auth/sign-in");
  }, [isPending, session, router]);

  const tierConfig = getDepositTierConfig(deposit?.tier);
  const installmentAmount = deposit
    ? getInstallmentAmount(
        deposit.remainingToDeposit,
        deposit.weeklyDepositInstallment,
      )
    : 0;
  const hasPendingThisWeek = !!deposit?.currentWeek?.pendingProofId;
  const weeklyPaid = !!deposit?.weeklyInstallmentPaid;
  const percent = deposit?.targetDepositAmount
    ? Math.min(
        100,
        (deposit.securityDepositBalance / deposit.targetDepositAmount) * 100,
      )
    : 0;

  const payments = useMemo(
    () =>
      [...(deposit?.payments ?? [])].sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      ),
    [deposit?.payments],
  );

  const selected = DEPOSIT_TIER_LIST.find((tier) => tier.tier === selectedTier)!;

  const handleAccept = async () => {
    if (!userId || !agreed) return;
    setAccepting(true);
    setAcceptError("");
    try {
      const res = await fetch("/api/driver/deposit/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, tier: selectedTier }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAcceptError(body.message || body.error || "Could not accept the contract.");
        return;
      }
      await mutate();
      setNotice("Deposit contract accepted. Your weekly plan is active.");
    } finally {
      setAccepting(false);
    }
  };

  const openPayModal = () => {
    setProofUrl("");
    setProofPublicId("");
    setSubmitError("");
    setPayOpen(true);
  };

  const handleSubmitProof = async () => {
    if (!userId || !deposit) return;
    if (!proofUrl) {
      setSubmitError("Please upload your proof of payment.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/driver/deposit/proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount: installmentAmount,
          weekStart: deposit.currentWeek.start,
          proofUrl,
          proofPublicId,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(body.message || body.error || "Could not submit your proof.");
        return;
      }
      setPayOpen(false);
      setNotice(
        "Proof submitted. Kapuka will review your payment and update your balance once approved.",
      );
      await mutate();
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionPending) {
    return (
      <div className="min-h-screen bg-[#eafde7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3A7717] border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return isPending ? <ConnectingScreen message="Still loading your deposit…" /> : null;
  }

  return (
    <div className="min-h-screen bg-[#eafde7] relative overflow-x-clip pb-28">
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#bff202]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#3A7717]/5 rounded-full blur-3xl pointer-events-none" />

      <main className="relative z-10 px-5 pt-6 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white border border-[#bff202]/30 flex items-center justify-center text-[#01312D] shadow-sm active:scale-95 transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-[#01312D]">
              Security Deposit
            </h1>
            <p className="text-xs text-gray-500">
              Contract, installments and credit
            </p>
          </div>
          <button
            type="button"
            onClick={() => mutate()}
            className="w-10 h-10 rounded-xl bg-white border border-[#bff202]/30 flex items-center justify-center text-[#3A7717] shadow-sm active:scale-95 transition-all"
            aria-label="Refresh deposit"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {notice && (
          <div className="mb-4 rounded-2xl bg-green-50 border border-green-200 px-4 py-3 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <p className="text-xs text-green-800 leading-relaxed">{notice}</p>
          </div>
        )}

        {isLoading && !deposit ? (
          <div className="space-y-3">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        ) : !deposit?.tier ? (
          <>
            <div className="bg-white rounded-3xl p-6 border border-[#bff202]/30 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-[#eafde7] flex items-center justify-center mb-4">
                <ShieldCheck className="w-7 h-7 text-[#3A7717]" />
              </div>
              <h2 className="text-lg font-extrabold text-[#01312D]">
                Set up your security deposit
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mt-1">
                Your deposit unlocks your weekly fuel credit. Choose a plan and
                pay it off in weekly installments.
              </p>

              <div className="mt-5 space-y-3">
                {DEPOSIT_TIER_LIST.map((tier) => {
                  const active = tier.tier === selectedTier;
                  return (
                    <button
                      key={tier.tier}
                      type="button"
                      onClick={() => setSelectedTier(tier.tier)}
                      className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                        active
                          ? "border-[#3A7717] bg-[#f7fff1]"
                          : "border-[#01312D]/10 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            active ? "border-[#3A7717]" : "border-gray-400"
                          }`}
                        >
                          {active && (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#3A7717]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-extrabold text-[#01312D]">
                              {tier.name}
                            </p>
                            <p className="font-extrabold text-[#01312D]">
                              {formatDepositMoney(tier.targetAmount)}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {tier.summary}
                          </p>
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
                                Weekly
                              </p>
                              <p className="text-xs font-bold text-[#01312D]">
                                {formatDepositMoney(tier.weeklyInstallment)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
                                Duration
                              </p>
                              <p className="text-xs font-bold text-[#01312D]">
                                {tier.totalWeeks} weeks
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
                                Fuel credit
                              </p>
                              <p className="text-xs font-bold text-[#01312D]">
                                {formatDepositMoney(tier.targetAmount)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {isPromotionalRateActive() && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#bff202]/30 px-3 py-2">
                  <Sparkles className="w-4 h-4 text-[#01312D]" />
                  <p className="text-xs font-bold text-[#01312D]">
                    10% refueling rate until 30 Jan 2027
                  </p>
                </div>
              )}

              <div className="mt-5 rounded-2xl bg-[#eafde7] p-4">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#3A7717] mb-2">
                  How it works
                </p>
                <ul className="space-y-2 text-xs text-[#01312D]/80 leading-relaxed">
                  <li>
                    Pay {formatDepositMoney(selected.weeklyInstallment)} every
                    week for {selected.totalWeeks} weeks.
                  </li>
                  <li>
                    Upload proof of payment (POP) for each installment. Your
                    balance updates after Kapuka approves it.
                  </li>
                  <li>
                    If the weekly installment is unpaid, your{" "}
                    {formatDepositMoney(selected.targetAmount)} credit is
                    reduced by {formatDepositMoney(selected.weeklyInstallment)}{" "}
                    that week.
                  </li>
                  <li>You keep using your credit once the installment is approved.</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setAgreed((value) => !value)}
                className="mt-4 flex items-start gap-3 text-left w-full"
              >
                <span
                  className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                    agreed
                      ? "bg-[#3A7717] border-[#3A7717]"
                      : "border-gray-400 bg-white"
                  }`}
                >
                  {agreed && <Check className="w-3.5 h-3.5 text-white" />}
                </span>
                <span className="text-xs text-[#01312D]/80 leading-relaxed">
                  I accept the security deposit contract and the weekly
                  installment schedule.
                </span>
              </button>

              {acceptError && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700">{acceptError}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleAccept}
                disabled={!agreed || accepting}
                className="mt-4 w-full rounded-full bg-[#01312D] text-white font-bold text-sm py-3.5 disabled:opacity-50 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {accepting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Accept · {formatDepositMoney(selected.weeklyInstallment)}{" "}
                    weekly
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#01312D] to-[#3A7717] shadow-xl">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#bff202]/10 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#bff202] px-2.5 py-1 text-[10px] font-extrabold text-[#01312D]">
                    <ShieldCheck className="w-3 h-3" />
                    {tierConfig?.name ?? "Deposit"}
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

                <p className="text-xs text-white/70 mt-5">
                  Security deposit balance
                </p>
                <p className="text-3xl font-extrabold text-white mt-0.5">
                  {formatDepositMoney(deposit.securityDepositBalance)}
                </p>
                <p className="text-xs text-white/60 mt-0.5">
                  of {formatDepositMoney(deposit.targetDepositAmount)} target
                </p>

                <div className="h-2 rounded-full bg-white/20 overflow-hidden mt-4">
                  <div
                    className="h-full rounded-full bg-[#bff202]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-semibold text-white/70">
                  <span>
                    {deposit.depositComplete
                      ? "Deposit fully paid"
                      : `${formatDepositMoney(deposit.remainingToDeposit)} left`}
                  </span>
                  <span>
                    {deposit.weeksPaid} of {tierConfig?.totalWeeks ?? 0} weeks
                    paid
                  </span>
                </div>
              </div>
            </div>

            {deposit.depositStatus === "DEDUCTED" && deposit.deductionDate && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    Part of your deposit was deducted
                  </p>
                  <p className="text-xs text-amber-900/80 mt-0.5 leading-relaxed">
                    Refill within 14 working days. Deadline:{" "}
                    {formatDepositDate(
                      getDeductionRefillDeadline(deposit.deductionDate),
                    )}
                    .
                  </p>
                </div>
              </div>
            )}

            {!deposit.depositComplete ? (
              <div className="bg-white rounded-2xl p-4 border border-[#bff202]/20 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-4 h-4 text-[#3A7717]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-[#01312D]">
                      This week&apos;s installment
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Due Monday, {formatDepositDate(deposit.currentWeek.start)}
                    </p>
                  </div>
                  <p className="text-xl font-extrabold text-[#01312D]">
                    {formatDepositMoney(installmentAmount)}
                  </p>
                </div>

                <div
                  className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 ${
                    weeklyPaid
                      ? "bg-green-50"
                      : hasPendingThisWeek
                        ? "bg-yellow-50"
                        : "bg-red-50"
                  }`}
                >
                  {weeklyPaid ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  ) : hasPendingThisWeek ? (
                    <Clock className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  )}
                  <p
                    className={`text-xs font-semibold leading-relaxed ${
                      weeklyPaid
                        ? "text-green-700"
                        : hasPendingThisWeek
                          ? "text-yellow-700"
                          : "text-red-600"
                    }`}
                  >
                    {weeklyPaid
                      ? "Paid and approved for this week"
                      : hasPendingThisWeek
                        ? "Proof submitted — awaiting admin approval"
                        : `Unpaid — your credit is reduced by ${formatDepositMoney(
                            deposit.weeklyDepositInstallment,
                          )} this week`}
                  </p>
                </div>

                {!weeklyPaid && !hasPendingThisWeek && (
                  <button
                    type="button"
                    onClick={openPayModal}
                    className="mt-3 w-full rounded-xl bg-[#3A7717] text-white text-sm font-bold py-3 flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
                  >
                    <CloudUpload className="w-4 h-4" />
                    Upload proof of payment
                  </button>
                )}

                {hasPendingThisWeek && (
                  <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                    You will be able to upload the next installment once this
                    proof is reviewed.
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-green-50 rounded-2xl p-4 border border-green-200 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-extrabold text-green-700">
                    Deposit complete
                  </p>
                  <p className="text-xs text-[#01312D]/80 mt-0.5 leading-relaxed">
                    No more weekly installments. Your full{" "}
                    {formatDepositMoney(deposit.targetDepositAmount)} credit is
                    available each week.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-4 border border-[#bff202]/20 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#bff202]/30 flex items-center justify-center shrink-0">
                  <Fuel className="w-4 h-4 text-[#01312D]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold text-[#01312D]">
                    Weekly fuel credit
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {deposit.promotionalRateActive
                      ? `${deposit.fuelInterestRate}% promotional refueling rate`
                      : "Standard refueling rate"}
                  </p>
                </div>
                <p className="text-xl font-extrabold text-[#01312D]">
                  {formatDepositMoney(deposit.effectiveCreditLimit)}
                </p>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Deposit-based limit</span>
                  <span className="font-bold text-[#01312D]">
                    {formatDepositMoney(deposit.baseCreditLimit)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">
                    This week&apos;s adjustment
                  </span>
                  <span
                    className={`font-bold ${
                      deposit.effectiveCreditLimit < deposit.baseCreditLimit
                        ? "text-red-600"
                        : "text-[#3A7717]"
                    }`}
                  >
                    {deposit.effectiveCreditLimit < deposit.baseCreditLimit
                      ? `− ${formatDepositMoney(
                          deposit.baseCreditLimit - deposit.effectiveCreditLimit,
                        )}`
                      : "None"}
                  </span>
                </div>
              </div>

              {deposit.effectiveCreditLimit < deposit.baseCreditLimit && (
                <p className="text-[10px] text-red-600 mt-2 leading-relaxed">
                  Pay this week&apos;s{" "}
                  {formatDepositMoney(deposit.weeklyDepositInstallment)}{" "}
                  installment to restore your full limit.
                </p>
              )}

              {deposit.promotionalRateActive && (
                <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#bff202]/25 px-2.5 py-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#3A7717]" />
                  <p className="text-[10px] font-bold text-[#01312D]">
                    10% refueling rate instead of 13% until 30 Jan 2027.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#bff202]/20 shadow-sm">
              <p className="text-sm font-extrabold text-[#01312D] mb-1">
                Your plan
              </p>
              {[
                [
                  "Weekly installment",
                  formatDepositMoney(deposit.weeklyDepositInstallment),
                ],
                ["Total weeks", `${tierConfig?.totalWeeks ?? 0} weeks`],
                ["Weeks paid", String(deposit.weeksPaid)],
                ["Weeks remaining", String(deposit.weeksRemaining)],
                [
                  "Started",
                  deposit.acceptedAt
                    ? formatDepositDate(deposit.acceptedAt)
                    : "—",
                ],
                [
                  "Final payment week",
                  deposit.acceptedAt && tierConfig
                    ? formatDepositDate(
                        getPlanEndDate(
                          deposit.acceptedAt,
                          tierConfig.totalWeeks,
                        ),
                      )
                    : "—",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between py-2 border-b border-[#01312D]/5 last:border-0"
                >
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-xs font-bold text-[#01312D]">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#bff202]/20 shadow-sm">
              <p className="text-sm font-extrabold text-[#01312D]">
                Payment history
              </p>
              {payments.length === 0 ? (
                <div className="flex flex-col items-center gap-1.5 py-6">
                  <Receipt className="w-6 h-6 text-gray-400" />
                  <p className="text-[11px] text-gray-500">
                    No installment proofs submitted yet.
                  </p>
                </div>
              ) : (
                payments.map((payment) => {
                  const status = paymentStatusConfig(payment.status);
                  const StatusIcon = status.icon;
                  return (
                    <div
                      key={payment.id}
                      className="flex items-start gap-3 py-3 border-b border-[#01312D]/5 last:border-0"
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${status.bg}`}
                      >
                        <StatusIcon className={`w-4 h-4 ${status.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold text-[#01312D]">
                          {formatDepositMoney(payment.amount)}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          Week of {formatDepositDate(payment.weekStart)} ·
                          submitted {formatDepositDate(payment.submittedAt)}
                        </p>
                        {payment.status === "rejected" &&
                          payment.rejectionReason && (
                            <p className="text-[10px] text-red-600 mt-1">
                              {payment.rejectionReason}
                            </p>
                          )}
                      </div>
                      <span
                        className={`rounded-md px-2 py-1 text-[9px] font-extrabold whitespace-nowrap ${status.bg} ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {payOpen && deposit && (
        <div className="fixed inset-0 z-[80] bg-[#01312D]/60 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="w-full sm:max-w-md bg-[#eafde7] rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-lg font-extrabold text-[#01312D]">
                Upload proof of payment
              </p>
              <button
                type="button"
                onClick={() => setPayOpen(false)}
                disabled={submitting}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-500"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-[#01312D] p-4 text-center">
              <p className="text-[11px] text-white/70">Installment amount</p>
              <p className="text-3xl font-extrabold text-[#bff202] mt-0.5">
                {formatDepositMoney(installmentAmount)}
              </p>
              <p className="text-[10px] text-white/60 mt-0.5">
                Week of {formatDepositDate(deposit.currentWeek.start)}
              </p>
            </div>

            <p className="text-[11px] text-gray-600 leading-relaxed mt-3">
              Pay the amount above to Kapuka Tradings, then upload a clear photo
              or screenshot of your receipt. Your deposit balance updates after
              an admin approves it.
            </p>

            <div className="mt-4 bg-white rounded-2xl p-4">
              <CloudinaryUpload
                key={payOpen ? "open" : "closed"}
                label="Proof of payment"
                type="deposit-proofs"
                currentUrl={proofUrl || undefined}
                onUploadComplete={(url, publicId) => {
                  setProofUrl(url);
                  setProofPublicId(publicId);
                  setSubmitError("");
                }}
                onDelete={() => {
                  setProofUrl("");
                  setProofPublicId("");
                }}
              />
            </div>

            {submitError && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700">{submitError}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmitProof}
              disabled={!proofUrl || submitting}
              className="mt-3 w-full rounded-full bg-[#01312D] text-white font-bold text-sm py-3.5 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  Submit for approval
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}
