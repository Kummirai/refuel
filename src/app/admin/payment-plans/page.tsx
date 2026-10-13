"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetch";
import { formatMoney } from "@/lib/money";
import {
  CalendarDays,
  Plus,
  Search,
  X,
  Loader2,
  User,
  Wallet,
  TrendingUp,
  DollarSign,
  Send,
  History,
  Trash2,
  Mail,
  MessageCircle,
  CheckCircle,
  Clock,
  ChevronRight,
} from "lucide-react";

type PaymentEntry = {
  amount: number;
  date: string;
  method: string;
  note?: string;
};

type PaymentPlan = {
  id: string;
  userId: string;
  driverName: string;
  driverEmail: string;
  driverPhone?: string;
  carRegistration?: string;
  outstandingBalance: number;
  installmentAmount: number;
  installmentDate: string;
  totalPaid: number;
  isActive: boolean;
  payments: PaymentEntry[];
};

type DriverViewRow = {
  userId: string;
  driverName: string;
  driverEmail: string;
  driverPhone?: string;
  outstanding: number;
  loans: { id: string }[];
};

type InvoiceLog = {
  id: string;
  channel: string;
  mode: string;
  installmentAmount: number;
  outstandingBalance: number;
  sentAt: string;
};

const inputCls =
  "w-full px-3 py-2 border border-[#bff202]/30 rounded-xl text-sm focus:outline-none focus:border-[#72bf00]";
const labelCls = "block text-xs font-medium text-gray-500 mb-1";

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const normalizePhone = (phone: string) => {
  let digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "27" + digits.slice(1);
  return digits;
};

const buildWaMessage = (plan: PaymentPlan, mode: "installment" | "full") => {
  const amount =
    mode === "installment" ? plan.installmentAmount : plan.outstandingBalance;
  const label =
    mode === "installment" ? "monthly installment" : "outstanding balance";
  return `Dear ${plan.driverName},

Your ${label} invoice from Kapuka Tradings is now available.

Amount Due: ${formatMoney(amount)}

Please ensure payment is made promptly to keep your account up to date.

Thank you for your continued business.

Kind regards,
Kapuka Tradings Team`;
};

export default function PaymentPlansPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [notice, setNotice] = useState<{ type: "ok" | "err"; msg: string } | null>(
    null,
  );

  const [showAdd, setShowAdd] = useState(false);
  const [driverSearch, setDriverSearch] = useState("");
  const [drivers, setDrivers] = useState<DriverViewRow[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverViewRow | null>(
    null,
  );
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [installmentDate, setInstallmentDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState("");

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showRecord, setShowRecord] = useState(false);
  const [recordAmount, setRecordAmount] = useState("");
  const [recordMethod, setRecordMethod] = useState("cash");
  const [recordSubmitting, setRecordSubmitting] = useState(false);
  const [recordError, setRecordError] = useState("");

  const [showSend, setShowSend] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<InvoiceLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const listUrl = `/api/admin/payment-plans?search=${encodeURIComponent(debouncedSearch)}`;
  const { data, isLoading, mutate } = useSWR<{
    plans: PaymentPlan[];
    total: number;
    hasMore: boolean;
  }>(listUrl, fetcher);

  const plans = useMemo(() => data?.plans ?? [], [data]);
  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );

  const stats = useMemo(
    () => ({
      active: plans.length,
      outstanding: plans.reduce((s, p) => s + p.outstandingBalance, 0),
      collected: plans.reduce((s, p) => s + p.totalPaid, 0),
    }),
    [plans],
  );

  const planDriverIds = useMemo(
    () => new Set(plans.map((p) => p.userId)),
    [plans],
  );

  const filteredDrivers = useMemo(() => {
    const q = driverSearch.trim().toLowerCase();
    return drivers.filter((d) => {
      if (d.outstanding <= 0 || planDriverIds.has(d.userId)) return false;
      if (!q) return true;
      return (
        d.driverName.toLowerCase().includes(q) ||
        d.driverEmail.toLowerCase().includes(q)
      );
    });
  }, [drivers, driverSearch, planDriverIds]);

  useEffect(() => {
    if (!showAdd) return;
    fetch("/api/admin/driver-view?limit=500")
      .then((res) => (res.ok ? res.json() : { drivers: [] }))
      .then((data) => setDrivers(data.drivers ?? []))
      .catch(() => setDrivers([]))
      .finally(() => setDriversLoading(false));
  }, [showAdd]);

  const openAdd = () => {
    setDriverSearch("");
    setSelectedDriver(null);
    setInstallmentAmount("");
    setInstallmentDate("");
    setAddError("");
    setDriversLoading(true);
    setShowAdd(true);
  };

  const handleCreate = async () => {
    if (!selectedDriver) {
      setAddError("Select a driver first");
      return;
    }
    const amount = parseFloat(installmentAmount);
    if (!installmentAmount || isNaN(amount) || amount <= 0) {
      setAddError("Invalid amount");
      return;
    }
    if (!installmentDate) {
      setAddError("Choose a payment due date");
      return;
    }
    setSubmitting(true);
    setAddError("");
    try {
      const res = await fetch("/api/admin/payment-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedDriver.userId,
          driverName: selectedDriver.driverName,
          driverEmail: selectedDriver.driverEmail,
          driverPhone: selectedDriver.driverPhone,
          outstandingBalance: selectedDriver.outstanding,
          installmentAmount: amount,
          installmentDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add driver");
      setShowAdd(false);
      setNotice({ type: "ok", msg: `${selectedDriver.driverName} added to payment plan` });
      mutate();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add driver");
    } finally {
      setSubmitting(false);
    }
  };

  const openRecord = () => {
    if (!selectedPlan) return;
    setRecordAmount(String(selectedPlan.installmentAmount));
    setRecordMethod("cash");
    setRecordError("");
    setShowRecord(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedPlan) return;
    const amount = parseFloat(recordAmount);
    if (!recordAmount || isNaN(amount) || amount <= 0) {
      setRecordError("Invalid payment amount");
      return;
    }
    if (amount > selectedPlan.outstandingBalance) {
      setRecordError(
        `Maximum payment is ${formatMoney(selectedPlan.outstandingBalance)}`,
      );
      return;
    }
    setRecordSubmitting(true);
    setRecordError("");
    try {
      const res = await fetch("/api/admin/payment-plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          action: "record-payment",
          amount,
          method: recordMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record payment");
      setShowRecord(false);
      setNotice({
        type: "ok",
        msg: data.isFullyPaid
          ? "Plan fully paid"
          : `${data.message} — remaining ${formatMoney(data.outstandingBalance)}`,
      });
      mutate();
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setRecordSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!selectedPlan) return;
    if (!confirm(`Remove ${selectedPlan.driverName} from this payment plan?`))
      return;
    try {
      const res = await fetch("/api/admin/payment-plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan.id, action: "remove" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove plan");
      setSelectedPlanId(null);
      setNotice({ type: "ok", msg: data.message || "Driver removed from payment plan" });
      mutate();
    } catch (err) {
      setNotice({
        type: "err",
        msg: err instanceof Error ? err.message : "Failed to remove plan",
      });
    }
  };

  const logInvoice = async (plan: PaymentPlan, mode: "installment" | "full") => {
    await fetch("/api/admin/payment-plans/log-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driverName: plan.driverName,
        driverEmail: plan.driverEmail,
        driverPhone: plan.driverPhone,
        installmentAmount: plan.installmentAmount,
        outstandingBalance: plan.outstandingBalance,
        mode,
      }),
    }).catch(() => {});
  };

  const sendInvoiceEmail = async (
    plan: PaymentPlan,
    mode: "installment" | "full",
  ) => {
    setSending(`${mode}-email`);
    try {
      const res = await fetch("/api/admin/invoices/send-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: plan.driverEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invoice");
      await logInvoice(plan, mode);
      setNotice({ type: "ok", msg: `Invoice emailed to ${plan.driverName}` });
    } catch (err) {
      setNotice({
        type: "err",
        msg: err instanceof Error ? err.message : "Failed to send invoice",
      });
    } finally {
      setSending(null);
    }
  };

  const sendInvoiceWhatsapp = async (
    plan: PaymentPlan,
    mode: "installment" | "full",
  ) => {
    setSending(`${mode}-whatsapp`);
    try {
      const phone = normalizePhone(plan.driverPhone || "");
      const message = buildWaMessage(plan, mode);
      if (phone) {
        window.open(
          `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
          "_blank",
        );
      } else {
        throw new Error("Driver has no phone number");
      }
      await logInvoice(plan, mode);
      setNotice({ type: "ok", msg: `Opening WhatsApp for ${plan.driverName}` });
    } catch (err) {
      setNotice({
        type: "err",
        msg: err instanceof Error ? err.message : "Failed to open WhatsApp",
      });
    } finally {
      setSending(null);
    }
  };

  const openHistory = async (plan: PaymentPlan) => {
    setShowHistory(true);
    setHistoryLoading(true);
    setHistory([]);
    try {
      const res = await fetch(
        `/api/admin/payment-plans/invoice-history?driverEmail=${encodeURIComponent(plan.driverEmail)}`,
      );
      const data = await res.json();
      if (res.ok) setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#01312D]">Payment Plans</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isLoading ? "Loading..." : `${stats.active} active plans`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#01312D] text-white rounded-xl font-semibold text-sm hover:bg-[#3A7717] transition-all"
        >
          <Plus className="w-4 h-4" /> Add Driver
        </button>
      </div>

      {notice && (
        <p
          className={`text-sm rounded-xl px-4 py-2.5 ${notice.type === "ok" ? "text-[#3A7717] bg-[#eafde7] border border-[#bff202]/30" : "text-red-600 bg-red-50 border border-red-200"}`}
        >
          {notice.msg}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#bff202]/20">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-4 h-4 text-[#3A7717]" />
            <p className="text-xs text-gray-500">Active Plans</p>
          </div>
          <p className="text-xl font-bold text-[#01312D]">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#bff202]/20">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-red-500" />
            <p className="text-xs text-gray-500">Outstanding</p>
          </div>
          <p className="text-xl font-bold text-red-600">
            {formatMoney(stats.outstanding)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#bff202]/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-[#3A7717]" />
            <p className="text-xs text-gray-500">Collected</p>
          </div>
          <p className="text-xl font-bold text-[#3A7717]">
            {formatMoney(stats.collected)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-9 pr-9 py-2.5 bg-white rounded-xl border border-[#bff202]/20 text-sm text-[#01312D] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#bff202]/40"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Plan list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/10 animate-pulse"
            >
              <div className="h-5 bg-gray-200 rounded w-48 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-32 mb-3" />
              <div className="h-2 bg-gray-200 rounded-full w-full" />
            </div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#bff202]/20">
          <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#01312D]">No payment plans</h3>
          <p className="text-sm text-gray-500 mt-1">
            {search
              ? "Try a different search"
              : "Tap Add Driver to put a driver on a payment plan"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const total = plan.outstandingBalance + plan.totalPaid;
            const pct =
              total > 0
                ? Math.min(100, Math.round((plan.totalPaid / total) * 100))
                : 100;
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/10 hover:border-[#bff202]/40 hover:shadow-sm transition-all text-left"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-[#01312D] rounded-full flex items-center justify-center shrink-0">
                      <CalendarDays className="w-5 h-5 text-[#bff202]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#01312D] truncate">
                        {plan.driverName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {plan.driverEmail}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#3A7717]/10 text-[#3A7717] shrink-0">
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-red-600">
                    Outstanding: {formatMoney(plan.outstandingBalance)}
                  </span>
                  <span className="text-sm font-semibold text-[#01312D]">
                    Installment: {formatMoney(plan.installmentAmount)}
                  </span>
                </div>

                <div className="bg-[#eafde7] rounded-full h-2 overflow-hidden mb-1">
                  <div
                    className="h-2 rounded-full bg-[#3A7717] transition-all"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-gray-400 text-right mb-2">
                  {pct}% paid
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Due:{" "}
                    {formatDate(plan.installmentDate)}
                  </span>
                  <span>Paid: {formatMoney(plan.totalPaid)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAdd(false)}
          ></div>
          <div className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#bff202]/20 p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#01312D]">
                Add to Payment Plan
              </h2>
              <button
                onClick={() => setShowAdd(false)}
                className="p-1 hover:bg-[#eafde7] rounded-lg"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {!selectedDriver ? (
                <>
                  <p className="text-xs font-bold text-gray-500 uppercase">
                    Select a driver with an outstanding balance
                  </p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={driverSearch}
                      onChange={(e) => setDriverSearch(e.target.value)}
                      placeholder="Search by name or email..."
                      className={`${inputCls} pl-9`}
                    />
                  </div>

                  {driversLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="bg-gray-50 rounded-xl p-3 animate-pulse"
                        >
                          <div className="h-4 bg-gray-200 rounded w-40" />
                        </div>
                      ))}
                    </div>
                  ) : filteredDrivers.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-6">
                      {drivers.length === 0 ||
                      drivers.every(
                        (d) => d.outstanding <= 0 || planDriverIds.has(d.userId),
                      )
                        ? "All drivers with outstanding balances are on payment plans"
                        : `No drivers match "${driverSearch}"`}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredDrivers.map((d) => (
                        <button
                          key={d.userId}
                          onClick={() => setSelectedDriver(d)}
                          className="w-full flex items-center justify-between gap-3 p-3 border border-[#bff202]/20 rounded-xl hover:border-[#72bf00] hover:bg-[#f0fdf4] transition-all text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 bg-[#eafde7] rounded-full flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-[#3A7717]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#01312D] truncate">
                                {d.driverName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {d.loans.length} active loan
                                {d.loans.length === 1 ? "" : "s"}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-red-600 shrink-0">
                            {formatMoney(d.outstanding)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 p-3 bg-[#f0fdf4] border border-[#72bf00]/40 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-[#eafde7] rounded-full flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-[#3A7717]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#01312D] truncate">
                          {selectedDriver.driverName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {selectedDriver.driverEmail}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedDriver(null)}
                      className="p-1 text-gray-400 hover:text-gray-600 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className={labelCls}>Installment Amount (R)</label>
                    <input
                      type="number"
                      value={installmentAmount}
                      onChange={(e) => setInstallmentAmount(e.target.value)}
                      placeholder="e.g. 500"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Payment Due Date</label>
                    <input
                      type="date"
                      value={installmentDate}
                      min={today}
                      onChange={(e) => setInstallmentDate(e.target.value)}
                      className={inputCls}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Choose the date the next installment is due
                    </p>
                  </div>

                  {addError && (
                    <p className="text-xs text-red-600 font-semibold">{addError}</p>
                  )}
                </>
              )}
            </div>

            {selectedDriver && (
              <div className="border-t border-gray-100 p-5 flex gap-3">
                <button
                  onClick={() => setShowAdd(false)}
                  className="flex-1 px-4 bg-gray-200 text-[#01312D] py-2 rounded-xl font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={
                    submitting ||
                    !installmentAmount ||
                    !installmentDate
                  }
                  className="flex-1 px-4 bg-[#01312D] text-white py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#3A7717] disabled:opacity-50"
                >
                  {submitting && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Add to Plan
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedPlanId(null)}
          ></div>
          <div className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#bff202]/20 p-5 flex justify-between items-center">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-[#eafde7] rounded-full flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-[#3A7717]" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[#01312D] truncate">
                    {selectedPlan.driverName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {selectedPlan.driverEmail}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlanId(null)}
                className="p-1 hover:bg-[#eafde7] rounded-lg shrink-0"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Balance banner */}
              <div className="bg-linear-to-r from-[#01312D] to-[#3A7717] rounded-2xl p-5 text-white">
                <p className="text-2xl font-black">
                  {formatMoney(selectedPlan.outstandingBalance)}
                </p>
                <p className="text-xs text-white/70 mb-4">
                  Outstanding Balance
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-white/60 uppercase">Installment</p>
                    <p className="text-sm font-bold">
                      {formatMoney(selectedPlan.installmentAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/60 uppercase">Paid</p>
                    <p className="text-sm font-bold">
                      {formatMoney(selectedPlan.totalPaid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/60 uppercase">Next Due</p>
                    <p className="text-sm font-bold">
                      {formatDate(selectedPlan.installmentDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment history */}
              {selectedPlan.payments.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-[#01312D] mb-2">
                    Payment History
                  </p>
                  <div className="space-y-2">
                    {selectedPlan.payments.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-bold text-[#3A7717]">
                            {formatMoney(p.amount)}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {formatDate(p.date)} ·{" "}
                            {p.method.charAt(0).toUpperCase() + p.method.slice(1)}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={openRecord}
                  disabled={selectedPlan.outstandingBalance <= 0}
                  className="w-full px-4 bg-[#01312D] text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#3A7717] disabled:opacity-50"
                >
                  <Wallet className="w-4 h-4" /> Record Payment
                </button>
                <button
                  onClick={() => setShowSend(true)}
                  className="w-full px-4 py-3 border-2 border-[#3A7717] text-[#3A7717] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#eafde7]"
                >
                  <Send className="w-4 h-4" /> Send Invoice
                </button>
                <button
                  onClick={() => openHistory(selectedPlan)}
                  className="w-full px-4 py-3 border-2 border-blue-200 text-blue-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-50"
                >
                  <History className="w-4 h-4" /> Invoice History
                </button>
                <button
                  onClick={handleRemove}
                  className="w-full px-4 bg-red-500 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" /> Remove from Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record payment modal */}
      {showRecord && selectedPlan && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRecord(false)}
          ></div>
          <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-[#bff202]/20 p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#01312D]">Record Payment</h2>
              <button
                onClick={() => setShowRecord(false)}
                className="p-1 hover:bg-[#eafde7] rounded-lg"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#eafde7] rounded-xl p-3">
                <p className="text-sm font-bold text-[#01312D]">
                  {selectedPlan.driverName}
                </p>
                <p className="text-xs text-gray-500">
                  Outstanding: {formatMoney(selectedPlan.outstandingBalance)}
                </p>
              </div>
              <div>
                <label className={labelCls}>Payment Amount (R)</label>
                <input
                  type="number"
                  value={recordAmount}
                  onChange={(e) => setRecordAmount(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Payment Method</label>
                <div className="flex gap-2">
                  {["cash", "bank", "e-wallet"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setRecordMethod(m)}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                        recordMethod === m
                          ? "bg-[#bff202] border-[#bff202] text-[#01312D]"
                          : "bg-white border-gray-200 text-gray-500"
                      }`}
                    >
                      {m === "e-wallet"
                        ? "E-Wallet"
                        : m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {recordError && (
                <p className="text-xs text-red-600 font-semibold">{recordError}</p>
              )}
            </div>
            <div className="border-t border-gray-100 p-5 flex gap-3">
              <button
                onClick={() => setShowRecord(false)}
                className="flex-1 px-4 bg-gray-200 text-[#01312D] py-2 rounded-xl font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={recordSubmitting}
                className="flex-1 px-4 bg-[#01312D] text-white py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#3A7717] disabled:opacity-50"
              >
                {recordSubmitting && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send invoice modal */}
      {showSend && selectedPlan && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSend(false)}
          ></div>
          <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-[#bff202]/20 p-5 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-[#01312D]">Send Invoice</h2>
                <p className="text-xs text-gray-500">
                  Sending to {selectedPlan.driverName}
                </p>
              </div>
              <button
                onClick={() => setShowSend(false)}
                className="p-1 hover:bg-[#eafde7] rounded-lg"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="border border-[#bff202]/30 rounded-xl p-4">
                <p className="font-bold text-[#01312D] text-sm mb-1">
                  Installment Invoice
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Due on the {formatDate(selectedPlan.installmentDate)}
                </p>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-600">Installment</span>
                  <span className="font-bold text-[#01312D]">
                    {formatMoney(selectedPlan.installmentAmount)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => sendInvoiceEmail(selectedPlan, "installment")}
                    disabled={sending !== null}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sending === "installment-email" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Mail className="w-3.5 h-3.5" />
                    )}
                    Email
                  </button>
                  <button
                    onClick={() => sendInvoiceWhatsapp(selectedPlan, "installment")}
                    disabled={sending !== null}
                    className="flex-1 px-3 py-2 bg-[#25D366] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:brightness-95 disabled:opacity-50"
                  >
                    {sending === "installment-whatsapp" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <MessageCircle className="w-3.5 h-3.5" />
                    )}
                    WhatsApp
                  </button>
                </div>
              </div>

              <div className="border border-red-200 rounded-xl p-4">
                <p className="font-bold text-red-600 text-sm mb-1">
                  Full Outstanding Balance
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Entire outstanding balance
                </p>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-600">Total Outstanding</span>
                  <span className="font-bold text-red-600">
                    {formatMoney(selectedPlan.outstandingBalance)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => sendInvoiceEmail(selectedPlan, "full")}
                    disabled={sending !== null}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sending === "full-email" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Mail className="w-3.5 h-3.5" />
                    )}
                    Email
                  </button>
                  <button
                    onClick={() => sendInvoiceWhatsapp(selectedPlan, "full")}
                    disabled={sending !== null}
                    className="flex-1 px-3 py-2 bg-[#25D366] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:brightness-95 disabled:opacity-50"
                  >
                    {sending === "full-whatsapp" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <MessageCircle className="w-3.5 h-3.5" />
                    )}
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice history modal */}
      {showHistory && selectedPlan && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowHistory(false)}
          ></div>
          <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-[#bff202]/20 p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#01312D]">
                Invoice History ({history.length})
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 hover:bg-[#eafde7] rounded-lg"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-5">
              {historyLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-gray-50 rounded-xl p-3 animate-pulse"
                    >
                      <div className="h-4 bg-gray-200 rounded w-40" />
                    </div>
                  ))}
                </div>
              ) : history.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">
                  No invoices sent yet
                </p>
              ) : (
                <div className="space-y-2">
                  {history.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        {log.channel === "whatsapp" ? (
                          <MessageCircle className="w-4 h-4 text-[#25D366]" />
                        ) : (
                          <Mail className="w-4 h-4 text-blue-600" />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-[#01312D]">
                            {log.mode === "full" ? "Full Balance" : "Installment"}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {log.channel === "whatsapp" ? "WhatsApp" : "Email"} ·{" "}
                            {formatDate(log.sentAt)}
                          </p>
                        </div>
                      </div>
                      <CheckCircle className="w-4 h-4 text-[#3A7717]" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
