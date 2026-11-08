"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetch";
import { formatMoney } from "@/lib/money";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Wallet,
  Search,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

type DepositProofStatus = "pending" | "approved" | "rejected";

interface DepositProof {
  id: string;
  userId: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  carRegistration: string;
  tier: string;
  tierName: string;
  targetDepositAmount: number;
  securityDepositBalance: number;
  amount: number;
  weekStart: string;
  weekEnd: string;
  proofUrl: string;
  status: DepositProofStatus;
  submittedAt: string;
  reviewedAt?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  creditedAmount?: number | null;
  balanceAfter?: number | null;
}

type FilterTab = "all" | "pending" | "approved" | "rejected";

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const statusStyle = (status: DepositProofStatus) => {
  switch (status) {
    case "approved":
      return {
        text: "text-green-700",
        bg: "bg-green-100",
        icon: CheckCircle,
      };
    case "rejected":
      return {
        text: "text-red-700",
        bg: "bg-red-100",
        icon: XCircle,
      };
    default:
      return {
        text: "text-yellow-700",
        bg: "bg-yellow-100",
        icon: Clock,
      };
  }
};

export default function AdminDepositProofsPage() {
  const {
    data,
    isLoading,
    mutate,
    isValidating,
  } = useSWR<DepositProof[] | { error?: string }>(
    "/api/admin/deposit-proofs",
    fetcher,
    { refreshInterval: 30_000, dedupingInterval: 10_000 },
  );

  const proofs = useMemo(
    () => (Array.isArray(data) ? data : []),
    [data],
  );

  const [filter, setFilter] = useState<FilterTab>("pending");
  const [search, setSearch] = useState("");

  const [approving, setApproving] = useState<DepositProof | null>(null);
  const [rejecting, setRejecting] = useState<DepositProof | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [viewing, setViewing] = useState<DepositProof | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useBodyScrollLock(!!approving || !!rejecting || !!viewing);

  const counts = useMemo(
    () => ({
      all: proofs.length,
      pending: proofs.filter((p) => p.status === "pending").length,
      approved: proofs.filter((p) => p.status === "approved").length,
      rejected: proofs.filter((p) => p.status === "rejected").length,
    }),
    [proofs],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return proofs.filter((proof) => {
      if (filter !== "all" && proof.status !== filter) return false;
      if (!term) return true;
      return [proof.driverName, proof.driverEmail, proof.carRegistration]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [proofs, filter, search]);

  const refresh = () => {
    mutate();
    window.dispatchEvent(new Event("refreshAdminCounts"));
  };

  const handleApprove = async () => {
    if (!approving) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/deposit-proofs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofId: approving.id, status: "approved" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to approve deposit proof");
        return;
      }
      setApproving(null);
      setNotice(
        json.depositComplete
          ? `Deposit approved. ${approving.driverName}'s security deposit is now fully funded.`
          : `${formatMoney(json.creditedAmount ?? approving.amount)} approved for ${
              approving.driverName
            }. Balance: ${formatMoney(json.balanceAfter ?? 0)}.`,
      );
      refresh();
    } catch {
      setError("Failed to approve deposit proof");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/deposit-proofs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proofId: rejecting.id,
          status: "rejected",
          reason: rejectReason.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to reject deposit proof");
        return;
      }
      setRejecting(null);
      setRejectReason("");
      setNotice(`${rejecting.driverName}'s deposit proof was rejected.`);
      refresh();
    } catch {
      setError("Failed to reject deposit proof");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#01312D]">Deposit Proofs</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isLoading
              ? "Loading..."
              : `${counts.pending} awaiting review`}
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#01312D] rounded-xl font-semibold text-sm border border-[#bff202]/30 hover:bg-[#eafde7] transition-all"
        >
          <RefreshCw
            className={`w-4 h-4 ${isValidating ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {notice && (
        <div className="flex items-start gap-2 text-sm rounded-xl px-4 py-3 text-[#3A7717] bg-[#eafde7] border border-[#bff202]/30">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{notice}</span>
          <button
            onClick={() => setNotice("")}
            className="ml-auto text-[#3A7717]/60 hover:text-[#3A7717]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && !approving && !rejecting && (
        <div className="flex items-start gap-2 text-sm rounded-xl px-4 py-3 text-red-600 bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                filter === tab.key
                  ? "bg-[#01312D] text-white border-[#01312D]"
                  : "bg-white text-[#01312D] border-[#bff202]/30 hover:bg-[#eafde7]"
              }`}
            >
              {tab.label}
              <span
                className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                  filter === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-[#eafde7] text-[#01312D]"
                }`}
              >
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or registration"
            className="w-full pl-9 pr-9 py-2.5 bg-white border border-[#bff202]/30 rounded-xl text-sm focus:outline-none focus:border-[#72bf00]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#bff202]/20 shadow-sm p-12 text-center">
          <Wallet className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-[#01312D] font-semibold mt-3">
            No deposit proofs
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {filter === "pending"
              ? "All security deposit proofs have been reviewed."
              : "Nothing to show for this filter."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((proof) => {
            const style = statusStyle(proof.status);
            const StatusIcon = style.icon;
            const target = proof.targetDepositAmount || 0;
            const projected =
              proof.status === "approved" && proof.balanceAfter != null
                ? proof.balanceAfter
                : Math.min(
                    target || Infinity,
                    (proof.securityDepositBalance || 0) + (proof.amount || 0),
                  );
            const progress = target > 0 ? (projected / target) * 100 : 0;

            return (
              <div
                key={proof.id}
                className="bg-white rounded-2xl border border-[#bff202]/20 shadow-sm p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-[#01312D] truncate">
                        {proof.driverName}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${style.bg} ${style.text}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {proof.status.charAt(0).toUpperCase() +
                          proof.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {proof.carRegistration} · {proof.tierName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {proof.driverEmail}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">Weekly installment</p>
                    <p className="text-lg font-bold text-[#01312D]">
                      {formatMoney(proof.amount)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Week of {formatDate(proof.weekStart)}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-500">
                      {proof.status === "approved"
                        ? "Balance after approval"
                        : "Projected balance"}
                    </span>
                    <span className="font-semibold text-[#01312D]">
                      {formatMoney(projected)} / {formatMoney(target)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#eafde7] overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${
                        proof.status === "approved"
                          ? "bg-green-500"
                          : proof.status === "rejected"
                            ? "bg-red-500"
                            : "bg-yellow-500"
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setViewing(proof)}
                  className="mt-4 w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#eafde7] text-[#01312D] text-sm font-semibold hover:bg-[#dff7da] transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span className="flex-1 text-left">View proof of payment</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {proof.status === "rejected" && proof.rejectionReason && (
                  <div className="mt-3 rounded-xl bg-red-50 p-3">
                    <p className="text-xs font-semibold text-red-600">
                      Rejection reason
                    </p>
                    <p className="text-xs text-red-800 mt-0.5">
                      {proof.rejectionReason}
                    </p>
                  </div>
                )}

                {proof.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        setRejecting(proof);
                        setRejectReason("");
                        setError("");
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 font-semibold text-sm hover:bg-red-100 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        setApproving(proof);
                        setError("");
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#3A7717] text-white font-semibold text-sm hover:bg-[#01312D] transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Approve confirm */}
      {approving && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !submitting && setApproving(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-[#01312D]">
                Approve deposit payment
              </h2>
              <button
                onClick={() => !submitting && setApproving(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 leading-6">
              Credit <strong>{formatMoney(approving.amount)}</strong> to{" "}
              <strong>{approving.driverName}</strong>&apos;s security deposit?
              The driver and admin dashboards update immediately.
            </p>
            <div className="mt-4 rounded-xl bg-[#eafde7] p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Current balance</span>
                <span className="font-semibold text-[#01312D]">
                  {formatMoney(approving.securityDepositBalance || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-gray-500">New balance</span>
                <span className="font-bold text-[#3A7717]">
                  {formatMoney(
                    Math.min(
                      approving.targetDepositAmount || Infinity,
                      (approving.securityDepositBalance || 0) +
                        (approving.amount || 0),
                    ),
                  )}
                </span>
              </div>
            </div>
            {error && (
              <p className="mt-3 text-sm text-red-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </p>
            )}
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setApproving(null)}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-[#eafde7] text-[#01312D] font-semibold text-sm hover:bg-[#dff7da] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-[#3A7717] text-white font-semibold text-sm hover:bg-[#01312D] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejecting && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !submitting && setRejecting(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-[#01312D]">
                Reject deposit proof
              </h2>
              <button
                onClick={() => !submitting && setRejecting(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 leading-6">
              Reject <strong>{rejecting.driverName}</strong>&apos;s{" "}
              {formatMoney(rejecting.amount)} deposit proof? The driver is
              notified with the reason below.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Why is this proof being rejected?"
              rows={4}
              className="mt-4 w-full px-3 py-2.5 bg-[#eafde7] rounded-xl text-sm text-[#01312D] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#bff202] resize-none"
            />
            {error && (
              <p className="mt-3 text-sm text-red-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </p>
            )}
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setRejecting(null)}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-[#eafde7] text-[#01312D] font-semibold text-sm hover:bg-[#dff7da] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof viewer */}
      {viewing && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setViewing(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3">
              <div className="text-white">
                <p className="font-semibold">{viewing.driverName}</p>
                <p className="text-xs text-white/60">
                  {formatMoney(viewing.amount)} · Week of{" "}
                  {formatDate(viewing.weekStart)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={viewing.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in new tab
                </a>
                <button
                  onClick={() => setViewing(null)}
                  className="p-2 text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center">
              {viewing.proofUrl?.match(
                /\.(jpg|jpeg|png|gif|webp)(\?|$)/i,
              ) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={viewing.proofUrl}
                  alt={`Proof of payment from ${viewing.driverName}`}
                  className="max-h-[76vh] w-auto object-contain"
                />
              ) : (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 text-white/50 mx-auto" />
                  <p className="text-white font-semibold mt-3">
                    Proof of payment
                  </p>
                  <a
                    href={viewing.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#bff202] underline break-all mt-1 inline-block"
                  >
                    {viewing.proofUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
