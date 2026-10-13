// src/app/admin/repayments/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { compressImage } from "@/lib/utils/image-compression";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import {
  DollarSign, CheckCircle, Clock, XCircle, Search, RefreshCw,
  TrendingUp, Wallet, Calendar, User, Phone, Mail, Car,
  Loader2, CreditCard, Banknote, ArrowLeft, AlertCircle,
  History, Download, Receipt, Fuel, Smartphone, SprayCan,
  FileText, Hourglass, Layers, ArrowDown, Upload, X,
  Trash2, Save, AlertTriangle, ExternalLink, ZoomIn, Percent,

} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatMoney, toMoney } from "@/lib/money";

// ---- Types ----
interface Repayment {
  id: string; loanId: string; driverId: string; driverName: string;
  driverEmail: string; driverPhone: string; carRegistration: string;
  serviceType: string; serviceTypeLabel: string; amount: number;
  requestedAmount?: number; actualAmount?: number; interestRate: number;
  interest: number; totalRepayable: number; repaidAmount: number;
  remainingAmount: number; dueDate: string;
  status: "paid" | "pending" | "overdue" | "completed";
  dailyPayment: number; repaymentDays: number; isPaid?: boolean;
  nextPaymentDate: string; lastPaymentDate?: string;
  approvedDate?: string; completedDate?: string; requestDate?: string;
  packageInfo?: { package: string; description: string };
  fuelType?: string; contactPhone?: string; otp?: string;
  popUrl?: string; popUploadedAt?: string;
  payments?: PaymentHistory[];
  pendingRepaymentProofs?: RepaymentProof[];
  linkedChildren?: Repayment[];
  hasPendingProofs?: boolean;
  interestAdjustments?: InterestAdjustment[];
}

interface InterestAdjustment {
  id?: string; amount: number; rate?: number;
  previousRemainingBalance?: number; newRemainingBalance?: number;
  addedAt?: string;
}

interface PaymentHistory {
  id: string; amount: number; date: string; method: string;
  reference?: string; proofUrl?: string; proofPublicId?: string;
}

interface RepaymentProof {
  id: string; requestIds?: string[]; approvedRequestIds?: string[];
  amount: number; status: "pending" | "approved" | "rejected";
  submittedAt: string; proofUrl: string; remainingBalance?: number;
  isFullyPaid?: boolean; linkedRequests?: LinkedRequest[];
}

interface LinkedRequest {
  id: string; type: string; amount: number;
  totalRepayable: number; remainingBalance: number;
  carNumber: string; driverName?: string;
}

// ---- POP Viewer Modal ----
function PopViewerModal({
  url, onClose,
}: {
  url: string; onClose: () => void;
}) {
  useBodyScrollLock(true);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-t-2xl p-3">
          <span className="text-white text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" /> Proof of Payment
          </span>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4 text-white" />
            </a>
            <a
              href={url}
              download
              className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4 text-white" />
            </a>
            <button onClick={onClose} className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-black/40 rounded-b-2xl overflow-auto flex items-center justify-center p-2">
          <img
            src={url}
            alt="Proof of Payment"
            className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
}

// ---- Reusable proof image button ----
function ProofButton({ url, label }: { url: string; label?: string }) {
  const [showViewer, setShowViewer] = useState(false);
  return (
    <>
      <button
        onClick={() => setShowViewer(true)}
        className="text-xs font-bold text-[#3A7717] flex items-center gap-1.5 hover:bg-[#eafde7] px-2 py-1 rounded-lg transition-colors"
      >
        <FileText className="w-3.5 h-3.5" />
        {label || "View POP"}
      </button>
      {showViewer && <PopViewerModal url={url} onClose={() => setShowViewer(false)} />}
    </>
  );
}

// ---- Approve & Spread (bulk proof allocation, matches mobile) ----
function ApproveSpreadPanel({
  proof, linkedRemaining, processing, onApprove,
}: {
  proof: RepaymentProof;
  linkedRemaining: number;
  processing: boolean;
  onApprove: (proofId: string, amount: number) => void;
}) {
  const [amount, setAmount] = useState(String(proof.amount));
  const val = parseFloat(amount);
  const invalid = !val || val <= 0 || val > linkedRemaining;
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 space-y-2 mt-3">
      <p className="text-xs font-bold text-purple-700 flex items-center gap-1.5">
        <Layers className="w-3.5 h-3.5" /> Approve &amp; Spread — allocates across oldest debts first
      </p>
      <div className="flex gap-2 items-center flex-wrap">
        <input
          type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          className="flex-1 min-w-[100px] px-3 py-2 bg-white border border-purple-200 rounded-lg text-sm font-bold text-[#01312D] focus:outline-none focus:border-purple-400"
        />
        <button onClick={() => setAmount(String(proof.amount))}
          className="px-2.5 py-2 bg-white border border-purple-200 rounded-lg text-xs font-bold text-purple-700 hover:bg-purple-100">
          Proof ({formatMoney(proof.amount)})
        </button>
        <button onClick={() => setAmount(String(linkedRemaining))}
          className="px-2.5 py-2 bg-white border border-purple-200 rounded-lg text-xs font-bold text-purple-700 hover:bg-purple-100">
          Full ({formatMoney(linkedRemaining)})
        </button>
        <button onClick={() => onApprove(proof.id, val)} disabled={processing || invalid}
          className="px-3 py-2 bg-[#3A7717] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-[#2d5a12] disabled:opacity-50">
          {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Spread
        </button>
      </div>
      {invalid && <p className="text-[11px] text-red-500 font-semibold">Amount must be between 1 and {formatMoney(linkedRemaining)}</p>}
    </div>
  );
}

// ---- Main Page ----
export default function LoanRepaymentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pending" | "review" | "overdue" | "paid" | "all">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [apiCounts, setApiCounts] = useState<{ all: number; pending: number; review: number; overdue: number; paid: number } | null>(null);
  const [apiStats, setApiStats] = useState<{ outstanding: number; repaid: number; active: number; overdue: number } | null>(null);
  const [discountMap, setDiscountMap] = useState<Record<string, number>>({});
  const [selectedRepayment, setSelectedRepayment] = useState<Repayment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [processing, setProcessing] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [selectedProof, setSelectedProof] = useState<RepaymentProof | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRepaymentUploadModal, setShowRepaymentUploadModal] = useState(false);
  const [repaymentUploadRepayment, setRepaymentUploadRepayment] = useState<Repayment | null>(null);
  const [repaymentUploadAmount, setRepaymentUploadAmount] = useState("");
  const [repaymentUploadFile, setRepaymentUploadFile] = useState<File | null>(null);
  const [repaymentUploadProofUrl, setRepaymentUploadProofUrl] = useState("");
  const [repaymentUploadProofPublicId, setRepaymentUploadProofPublicId] = useState("");
  const [repaymentUploadLoading, setRepaymentUploadLoading] = useState(false);
  const [repaymentUploadMethod, setRepaymentUploadMethod] = useState("cash");
  const repaymentFileInputRef = useRef<HTMLInputElement>(null);
  const skipRef = useRef(0);
  const hasMoreRef = useRef(false);
  const PAGE_SIZE = 50;

  const isAnyModalOpen = showDetailsModal || showSuccessModal || showErrorModal || showRejectModal || showRepaymentUploadModal;
  useBodyScrollLock(isAnyModalOpen);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => { fetchRepayments(); }, [activeTab, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRepayments = async (opts?: { append?: boolean }) => {
    const append = opts?.append ?? false;
    try {
      if (!append) setLoading(true);
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), skip: String(append ? skipRef.current : 0) });
      if (activeTab !== "all") params.set("status", activeTab);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      const [res, discRes] = await Promise.all([
        fetch(`/api/admin/repayments?${params.toString()}`),
        fetch("/api/admin/invoices/discount"),
      ]);
      if (discRes.ok) {
        const discData = await discRes.json();
        setDiscountMap(discData.discounts || {});
      }
      if (res.ok) {
        const data = await res.json();
        const repaymentsList = data.repayments || [];
        if (data.counts) setApiCounts(data.counts);
        if (data.stats) setApiStats(data.stats);
        hasMoreRef.current = !!data.hasMore;
        setHasMore(!!data.hasMore);
        const bulkGroups = new Map<string, Repayment[]>();
        const standalone: Repayment[] = [];
        for (const r of repaymentsList) {
          const bulkProof = (r.pendingRepaymentProofs || []).find(
            (p: RepaymentProof) => p.requestIds && p.requestIds.length > 1,
          );
          if (bulkProof) {
            const existing = bulkGroups.get(bulkProof.id) || [];
            existing.push(r);
            bulkGroups.set(bulkProof.id, existing);
          } else {
            standalone.push(r);
          }
        }
        const grouped: Repayment[] = [];
        for (const [, group] of bulkGroups) {
          const paid = group.filter((r) => r.status === "paid" || r.status === "completed");
          const unpaid = group.filter((r) => r.status !== "paid" && r.status !== "completed");
          standalone.push(...paid);
          if (unpaid.length === 0) continue;
          const first = unpaid[0];
          const proof = first.pendingRepaymentProofs?.find(
            (p) => p.requestIds && p.requestIds.length > 1,
          );
          unpaid.sort((a, b) => a.serviceType.localeCompare(b.serviceType));
          grouped.push({
            ...first, id: proof?.id || first.id, serviceType: "bulk",
            serviceTypeLabel: `Bulk Repayment (${unpaid.length} request${unpaid.length > 1 ? "s" : ""})`,
            carRegistration: `${unpaid.length} request${unpaid.length > 1 ? "s" : ""} • ${unpaid[0].driverName}`,
            totalRepayable: unpaid.reduce((s, r) => s + r.totalRepayable, 0),
            repaidAmount: unpaid.reduce((s, r) => s + r.repaidAmount, 0),
            remainingAmount: unpaid.reduce((s, r) => s + r.remainingAmount, 0),
            dailyPayment: unpaid.reduce((s, r) => s + r.dailyPayment, 0),
            linkedChildren: unpaid,
          } as Repayment);
        }
        const built = [...grouped, ...standalone];
        skipRef.current = append ? skipRef.current + repaymentsList.length : repaymentsList.length;
        setRepayments((prev) => append ? [...prev, ...built] : built);
      }
    } catch (error) { console.error("Error fetching repayments:", error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMoreRef.current) return;
    setLoadingMore(true);
    try { await fetchRepayments({ append: true }); }
    finally { setLoadingMore(false); }
  };

  const handleRefresh = () => { setRefreshing(true); fetchRepayments(); };

  // ---- Actions ----
  const handleMarkAsPaid = async (repayment: Repayment, amount: number, method: string, reference?: string, date?: string) => {
    if (amount <= 0 || amount > repayment.remainingAmount) {
      setErrorMessage(`Amount must be between 1 and ${repayment.remainingAmount}`);
      setShowErrorModal(true); return;
    }
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/repayments/pay", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repaymentId: repayment.id, amount, method, reference: reference || undefined, date: date || undefined }),
      });
      if (res.ok) {
        const result = await res.json();
        setSuccessMessage(`✅ Payment of ${formatMoney(amount)} recorded! Remaining: ${formatMoney(result.remainingBalance)}`);
        setShowSuccessModal(true); fetchRepayments(); setShowDetailsModal(false); setSelectedRepayment(null);
      } else { const err = await res.json(); setErrorMessage(err.error || "Failed"); setShowErrorModal(true); }
    } catch { setErrorMessage("Failed"); setShowErrorModal(true); }
    finally { setProcessing(false); }
  };

  const handleMarkAsCompleted = async (repayment: Repayment) => {
    if (repayment.remainingAmount > 0) {
      if (!confirm(`⚠️ Force complete ${repayment.serviceTypeLabel}? ${formatMoney(repayment.remainingAmount)} will be written off.`)) return;
    } else {
      if (!confirm(`Mark ${repayment.serviceTypeLabel} as completed?`)) return;
    }
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/repayments/complete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repaymentId: repayment.id, completedAt: new Date().toISOString(), forceComplete: repayment.remainingAmount > 0 }),
      });
      if (res.ok) {
        setSuccessMessage(`✅ ${repayment.serviceTypeLabel} completed!`);
        setShowSuccessModal(true); fetchRepayments(); setShowDetailsModal(false); setSelectedRepayment(null);
      } else { const err = await res.json(); setErrorMessage(err.error || "Failed"); setShowErrorModal(true); }
    } catch { setErrorMessage("Failed"); setShowErrorModal(true); }
    finally { setProcessing(false); }
  };

  // ---- Proof approval / reject ----
  const handleApproveProof = async (proof: RepaymentProof) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/repayment-proofs", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofId: proof.id, status: "approved" }),
      });
      if (res.ok) { setSuccessMessage("✅ Proof approved"); setShowSuccessModal(true); fetchRepayments(); }
      else { const err = await res.json(); setErrorMessage(err.error || "Failed"); setShowErrorModal(true); }
    } catch { setErrorMessage("Failed"); setShowErrorModal(true); }
    finally { setProcessing(false); }
  };

  const handleApproveAndPay = async (proof: RepaymentProof, repayment: Repayment, amount: number) => {
    const isBulk = proof.requestIds && proof.requestIds.length > 1;
    let targetId = repayment.id;
    let targetRemaining = repayment.remainingAmount;
    if (repayment.linkedChildren && isBulk) {
      const approved = proof.approvedRequestIds || [];
      const unapproved = proof.requestIds!.filter((id) => !approved.includes(id));
      if (unapproved.length === 0) { setErrorMessage("All already approved"); setShowErrorModal(true); return; }
      const child = repayment.linkedChildren.find((c) => c.id === unapproved[0]);
      targetId = child?.id || unapproved[0];
      targetRemaining = child?.remainingAmount || repayment.remainingAmount;
    }
    if (amount <= 0 || amount > targetRemaining) { setErrorMessage(`Amount must be ≤ ${targetRemaining}`); setShowErrorModal(true); return; }
    setProcessing(true);
    try {
      const approveRes = await fetch("/api/admin/repayment-proofs", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofId: proof.id, status: "approved", ...(isBulk && { requestId: targetId }) }),
      });
      if (!approveRes.ok) { const err = await approveRes.json(); setErrorMessage(err.error || "Failed"); setShowErrorModal(true); setProcessing(false); return; }
      const payRes = await fetch("/api/admin/repayments/pay", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repaymentId: targetId, amount, method: "cash", date: new Date().toISOString().split("T")[0], ...(isBulk && { proofId: proof.id }) }),
      });
      if (payRes.ok) { const r = await payRes.json(); setSuccessMessage(`✅ Approved & paid ${formatMoney(amount)}! Remaining: ${formatMoney(r.remainingBalance)}`); setShowSuccessModal(true); fetchRepayments(); setShowDetailsModal(false); setSelectedRepayment(null); }
      else { const err = await payRes.json(); setErrorMessage(err.error || "Failed"); setShowErrorModal(true); }
    } catch { setErrorMessage("Failed"); setShowErrorModal(true); }
    finally { setProcessing(false); }
  };

  const handleApproveSingleRequest = async (proof: RepaymentProof, requestId: string, amount: number) => {
    setProcessingRequestId(requestId);
    try {
      const approveRes = await fetch("/api/admin/repayment-proofs", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofId: proof.id, status: "approved", requestId }),
      });
      if (!approveRes.ok) { const err = await approveRes.json(); setErrorMessage(err.error || "Failed"); setShowErrorModal(true); return; }
      const payRes = await fetch("/api/admin/repayments/pay", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repaymentId: requestId, amount, method: "cash", date: new Date().toISOString().split("T")[0], proofId: proof.id }),
      });
      if (payRes.ok) { setSuccessMessage(`✅ Approved & paid ${formatMoney(amount)}`); setShowSuccessModal(true); fetchRepayments(); }
      else { const err = await payRes.json(); setErrorMessage(err.error || "Failed"); setShowErrorModal(true); }
    } catch { setErrorMessage("Failed"); setShowErrorModal(true); }
    finally { setProcessingRequestId(null); }
  };

  const handleRejectRepaymentProof = async () => {
    if (!selectedProof || !rejectionReason.trim()) { setErrorMessage("Provide a reason"); setShowErrorModal(true); return; }
    const isBulk = selectedProof.requestIds && selectedProof.requestIds.length > 1;
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/repayment-proofs", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofId: selectedProof.id, status: "rejected", reason: rejectionReason, ...(isBulk && selectedRepayment && { requestId: selectedRepayment.id }) }),
      });
      if (res.ok) { setSuccessMessage(`❌ Repayment rejected`); setShowSuccessModal(true); fetchRepayments(); setShowRejectModal(false); setSelectedProof(null); setRejectionReason(""); }
      else { const err = await res.json(); setErrorMessage(err.error || "Failed"); setShowErrorModal(true); }
    } catch { setErrorMessage("Failed"); setShowErrorModal(true); }
    finally { setProcessing(false); }
  };

  const handleMoveToPending = async (repayment: Repayment) => {
    const proof = repayment.pendingRepaymentProofs?.find((p) => p.status === "pending");
    if (!proof) return;
    if (!confirm(`Move this repayment back to Pending? The pending proof will be rejected.`)) return;
    setProcessing(true);
    try {
      const isBulk = proof.requestIds && proof.requestIds.length > 1;
      const res = await fetch("/api/admin/repayment-proofs", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofId: proof.id, status: "rejected", reason: "Moved to pending — resubmit required", ...(isBulk && { requestId: repayment.id }) }),
      });
      if (res.ok) {
        setSuccessMessage("✅ Moved to Pending — driver can resubmit");
        setShowSuccessModal(true); fetchRepayments(); setShowDetailsModal(false); setSelectedRepayment(null);
      } else { const err = await res.json(); setErrorMessage(err.error || "Failed"); setShowErrorModal(true); }
    } catch { setErrorMessage("Failed"); setShowErrorModal(true); }
    finally { setProcessing(false); }
  };

  const handleApproveSpread = async (proofId: string, amount: number) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/repayment-proofs/approve-bulk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofId, amount }),
      });
      if (res.ok) {
        const r = await res.json();
        setSuccessMessage(
          `✅ ${formatMoney(r.totalAllocated ?? amount)} allocated across linked loans` +
          (r.unallocated > 0 ? `\n${formatMoney(r.unallocated)} could not be allocated.` : ""),
        );
        setShowSuccessModal(true); fetchRepayments(); setShowDetailsModal(false); setSelectedRepayment(null);
      } else { const err = await res.json(); setErrorMessage(err.error || "Failed"); setShowErrorModal(true); }
    } catch { setErrorMessage("Failed"); setShowErrorModal(true); }
    finally { setProcessing(false); }
  };

  const handleAddInterest = async (repayment: Repayment, amountStr: string, rateStr: string) => {
    const interestAmount = parseFloat(amountStr) || undefined;
    const interestRate = parseFloat(rateStr) || undefined;
    if (!interestAmount && !interestRate) { setErrorMessage("Enter an interest amount or rate"); setShowErrorModal(true); return; }
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/repayments/add-interest", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanId: repayment.id,
          ...(interestAmount ? { interestAmount } : {}),
          ...(interestRate ? { interestRate } : {}),
        }),
      });
      if (res.ok) {
        const r = await res.json();
        setSuccessMessage(`✅ Interest of ${formatMoney(r.interestAmount)} added at ${r.interestRate}%.\nNew remaining: ${formatMoney(r.newRemainingBalance)}`);
        setShowSuccessModal(true); fetchRepayments();
      } else { const err = await res.json(); setErrorMessage(err.error || "Failed"); setShowErrorModal(true); }
    } catch { setErrorMessage("Failed"); setShowErrorModal(true); }
    finally { setProcessing(false); }
  };

  // ---- Correction actions ----
  const handleDeletePayment = async (loanId: string, paymentId: string) => {
    if (!confirm("Delete this payment record? This cannot be undone.")) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/repayments/correct", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actions: [{ type: "delete_payment", loanId, paymentId }] }),
      });
      if (res.ok) {
        setSuccessMessage("✅ Payment deleted. Re-run 'Recalculate Loan' to update totals.");
        setShowSuccessModal(true); fetchRepayments();
      } else { const err = await res.json(); setErrorMessage(err.error || "Failed"); setShowErrorModal(true); }
    } catch { setErrorMessage("Failed"); setShowErrorModal(true); }
    finally { setProcessing(false); }
  };

  const handleCorrectPaymentAmount = async (loanId: string, paymentId: string, amount: number) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/repayments/correct", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actions: [{ type: "correct_payment", loanId, paymentId, data: { amount } }] }),
      });
      if (res.ok) { setSuccessMessage("✅ Payment amount corrected"); setShowSuccessModal(true); fetchRepayments(); }
      else { const err = await res.json(); setErrorMessage(err.error || "Failed"); setShowErrorModal(true); }
    } catch { setErrorMessage("Failed"); setShowErrorModal(true); }
    finally { setProcessing(false); }
  };

  const handleRecalcLoan = async (loanId: string, totalRepayable: number) => {
    if (!confirm("Recalculate this loan from its payment records?")) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/repayments/correct", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actions: [{ type: "recalc_loan", loanId, data: { totalRepayable } }] }),
      });
      if (res.ok) {
        const result = await res.json();
        const r = result.results?.[0];
        setSuccessMessage(`✅ Recalculated! repaidAmount: ${formatMoney(r?.repaidAmount || 0)}, remaining: ${formatMoney(r?.remainingBalance || 0)}`);
        setShowSuccessModal(true); fetchRepayments();
      } else { const err = await res.json(); setErrorMessage(err.error || "Failed"); setShowErrorModal(true); }
    } catch { setErrorMessage("Failed"); setShowErrorModal(true); }
    finally { setProcessing(false); }
  };

  const handleManualFix = async (loanId: string, repaidAmount: number, remainingBalance: number) => {
    if (!confirm(`Manually set repaidAmount=${formatMoney(repaidAmount)}, remaining=${formatMoney(remainingBalance)}?`)) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/repayments/correct", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actions: [{ type: "manual_fix", loanId, data: { repaidAmount, remainingBalance } }] }),
      });
      if (res.ok) { setSuccessMessage("✅ Loan corrected!"); setShowSuccessModal(true); fetchRepayments(); }
      else { const err = await res.json(); setErrorMessage(err.error || "Failed"); setShowErrorModal(true); }
    } catch { setErrorMessage("Failed"); setShowErrorModal(true); }
    finally { setProcessing(false); }
  };

  // ---- File upload ----
  const handleRepaymentFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErrorMessage("Upload an image"); setShowErrorModal(true); return; }
    if (file.size > 20 * 1024 * 1024) { setErrorMessage("Max 20MB"); setShowErrorModal(true); return; }
    setRepaymentUploadLoading(true);
    try {
      const compressedBlob = await compressImage(file);
      const compressedFile = new File([compressedBlob], file.name, { type: compressedBlob.type || file.type });
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("type", "repayment");
      formData.append("requestId", repaymentUploadRepayment?.id || "");
      const res = await fetch("/api/driver/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setRepaymentUploadProofUrl(data.url);
      setRepaymentUploadProofPublicId(data.publicId);
    } catch (err: any) { setErrorMessage(err.message || "Upload failed"); setShowErrorModal(true); }
    finally { setRepaymentUploadLoading(false); if (repaymentFileInputRef.current) repaymentFileInputRef.current.value = ""; }
  };

  const handleSubmitRepaymentForDriver = async () => {
    if (!repaymentUploadRepayment) return;
    const amount = parseFloat(repaymentUploadAmount);
    if (!amount || amount <= 0) { setErrorMessage("Enter valid amount"); setShowErrorModal(true); return; }
    if (amount > repaymentUploadRepayment.remainingAmount) { setErrorMessage(`Max ${formatMoney(repaymentUploadRepayment.remainingAmount)}`); setShowErrorModal(true); return; }
    if (!repaymentUploadProofUrl) { setErrorMessage("Upload proof"); setShowErrorModal(true); return; }
    setRepaymentUploadLoading(true);
    try {
      const res = await fetch("/api/admin/repayments/pay", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repaymentId: repaymentUploadRepayment.id, amount, method: repaymentUploadMethod, date: new Date().toISOString().split("T")[0], proofUrl: repaymentUploadProofUrl, proofPublicId: repaymentUploadProofPublicId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSuccessMessage(`✅ ${formatMoney(amount)} recorded for ${repaymentUploadRepayment.driverName}!`);
      setShowSuccessModal(true); fetchRepayments(); setShowRepaymentUploadModal(false);
      setRepaymentUploadRepayment(null); setRepaymentUploadAmount(""); setRepaymentUploadProofUrl(""); setRepaymentUploadProofPublicId("");
    } catch (err: any) { setErrorMessage(err.message || "Failed"); setShowErrorModal(true); }
    finally { setRepaymentUploadLoading(false); }
  };

  // ---- Filtering & Stats ----
  const hasPendingProofs = (r: Repayment) => r.pendingRepaymentProofs?.some(
    (p) => p.status === "pending" && (!p.approvedRequestIds || !p.approvedRequestIds.includes(r.id)),
  );

  const filteredRepayments = repayments.filter((r) => {
    if (activeTab === "pending") return r.status !== "paid" && r.status !== "completed" && !hasPendingProofs(r);
    if (activeTab === "review") return hasPendingProofs(r);
    if (activeTab === "overdue") return r.status === "overdue" && !hasPendingProofs(r);
    if (activeTab === "paid") return r.status === "paid" || r.status === "completed";
    return true;
  }).filter((r) =>
    r.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.carRegistration.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.driverEmail.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const localPendingCount = repayments.filter((r) => r.status !== "paid" && r.status !== "completed" && !hasPendingProofs(r)).length;
  const localReviewCount = repayments.filter((r) => hasPendingProofs(r)).length;
  const localOverdueCount = repayments.filter((r) => r.status === "overdue" && !hasPendingProofs(r)).length;
  const localPaidCount = repayments.filter((r) => r.status === "paid" || r.status === "completed").length;
  const pendingCount = apiCounts?.pending ?? localPendingCount;
  const reviewCount = apiCounts?.review ?? localReviewCount;
  const overdueTabCount = apiCounts?.overdue ?? localOverdueCount;
  const paidCount = apiCounts?.paid ?? localPaidCount;
  const allCount = apiCounts?.all ?? repayments.length;

  const discountedRemaining = (r: { driverEmail: string; remainingAmount: number }) => {
    const dp = discountMap[r.driverEmail] || 0;
    return dp > 0 ? toMoney(r.remainingAmount * (113 - dp) / 113) : r.remainingAmount;
  };
  const discountPct = (email: string) => discountMap[email] || 0;

  const DiscountDisplay = ({ repayment: r, className }: { repayment: { driverEmail: string; remainingAmount: number }; className?: string }) => {
    const dp = discountPct(r.driverEmail);
    if (dp <= 0) return <span className={className}>{formatMoney(r.remainingAmount)}</span>;
    return (
      <span className={className}>
        <span className="text-red-600">{formatMoney(discountedRemaining(r))}</span>
        <span className="text-gray-400 text-xs line-through ml-1">{formatMoney(r.remainingAmount)}</span>
      </span>
    );
  };

  const stats = {
    pendingProofs: apiCounts?.review ?? repayments.reduce((s, r) => s + (r.pendingRepaymentProofs?.filter((p) => p.status === "pending").length || 0), 0),
    totalOutstanding: apiStats?.outstanding ?? toMoney(repayments.filter((r) => r.status !== "paid" && r.status !== "completed").reduce((s, r) => s + discountedRemaining(r), 0)),
    totalPaid: apiStats?.repaid ?? toMoney(repayments.filter((r) => r.status === "paid" || r.status === "completed").reduce((s, r) => s + r.repaidAmount, 0)),
    activeLoans: apiStats?.active ?? repayments.filter((r) => r.status !== "paid" && r.status !== "completed").length,
    overdueCount: apiStats?.overdue ?? repayments.filter((r) => r.status === "overdue").length,
    totalLoans: repayments.length,
  };

  // ---- UI Helpers ----
  const getServiceTypeBadge = (type: string, serviceData?: any) => {
    const badges: Record<string, [string, string, any]> = {
      fuel: ["bg-green-100 text-green-700", "Fuel", <Fuel key="i" className="w-3 h-3" />],
      airtime: ["bg-blue-100 text-blue-700", "Airtime", <Smartphone key="i" className="w-3 h-3" />],
      cash: ["bg-yellow-100 text-yellow-700", "Cash Loan", <DollarSign key="i" className="w-3 h-3" />],
      carwash: ["bg-purple-100 text-purple-700", "Car Wash", <SprayCan key="i" className="w-3 h-3" />],
    };
    const [cls, label, icon] = badges[type] || ["bg-gray-100 text-gray-700", type, null];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${cls}`}>
        {icon} {label}
        {type === "fuel" && serviceData?.fuelType && <span className="ml-1 text-[10px] opacity-75">({serviceData.fuelType})</span>}
        {type === "carwash" && serviceData?.packageInfo?.package && <span className="ml-1 text-[10px] opacity-75">({serviceData.packageInfo.package})</span>}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, [string, string, any]> = {
      paid: ["bg-green-100 text-green-700", "Completed", <CheckCircle key="i" className="w-3 h-3" />],
      completed: ["bg-green-100 text-green-700", "Completed", <CheckCircle key="i" className="w-3 h-3" />],
      pending: ["bg-yellow-100 text-yellow-700", "Pending", <Clock key="i" className="w-3 h-3" />],
      overdue: ["bg-red-100 text-red-700", "Overdue", <XCircle key="i" className="w-3 h-3" />],
    };
    const [cls, label, icon] = map[status] || ["bg-gray-100 text-gray-700", status, null];
    return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${cls}`}>{icon} {label}</span>;
  };

  const getProofStatusBadge = (status: string) => {
    const map: Record<string, [string, string, any]> = {
      approved: ["bg-green-100 text-green-700", "Approved", <CheckCircle key="i" className="w-3 h-3" />],
      pending: ["bg-yellow-100 text-yellow-700", "Pending Review", <Hourglass key="i" className="w-3 h-3" />],
      rejected: ["bg-red-100 text-red-700", "Rejected", <XCircle key="i" className="w-3 h-3" />],
    };
    const [cls, label, icon] = map[status] || ["bg-gray-100 text-gray-700", status, null];
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{icon} {label}</span>;
  };

  // ---- Modals ----
  const SuccessModal = () => {
    if (!showSuccessModal) return null;
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)} />
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-t-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><CheckCircle className="w-6 h-6 text-white" /></div>
              <div><h2 className="text-xl font-bold text-white">Success!</h2><p className="text-white/80 text-sm">Operation completed</p></div>
            </div>
          </div>
          <div className="p-5 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-10 h-10 text-green-600" /></div>
            <p className="text-[#01312D] font-semibold mb-2 whitespace-pre-line">{successMessage}</p>
          </div>
          <div className="border-t border-gray-100 p-5">
            <button onClick={() => setShowSuccessModal(false)} className="w-full bg-[#01312D] text-white py-2 rounded-xl font-semibold hover:bg-[#3A7717] transition-colors">Close</button>
          </div>
        </div>
      </div>
    );
  };

  const ErrorModal = () => {
    if (!showErrorModal) return null;
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowErrorModal(false)} />
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><AlertCircle className="w-6 h-6 text-white" /></div>
              <div><h2 className="text-xl font-bold text-white">Error!</h2><p className="text-white/80 text-sm">Operation failed</p></div>
            </div>
          </div>
          <div className="p-5 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><XCircle className="w-10 h-10 text-red-600" /></div>
            <p className="text-[#01312D] font-semibold mb-2 whitespace-pre-line">{errorMessage}</p>
          </div>
          <div className="border-t border-gray-100 p-5">
            <button onClick={() => setShowErrorModal(false)} className="w-full bg-red-500 text-white py-2 rounded-xl font-semibold hover:bg-red-600 transition-colors">Close</button>
          </div>
        </div>
      </div>
    );
  };

  const renderRejectionModal = () => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowRejectModal(false); setRejectionReason(""); }} />
      <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><XCircle className="w-6 h-6 text-white" /></div>
            <div><h2 className="text-xl font-bold text-white">Reject Repayment</h2><p className="text-white/80 text-sm">Provide rejection reason</p></div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[#01312D] font-semibold mb-2 text-sm">Rejection Reason <span className="text-red-500">*</span></label>
            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Why is this being rejected?" className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl focus:outline-none focus:border-red-500 resize-none" rows={4} />
            <p className="text-xs text-gray-500 mt-1">This will be visible to the driver</p>
          </div>
        </div>
        <div className="border-t border-gray-100 p-5 flex gap-3">
          <button onClick={() => { setShowRejectModal(false); setRejectionReason(""); }} className="flex-1 bg-gray-200 text-[#01312D] py-2 rounded-xl font-semibold">Cancel</button>
          <button onClick={handleRejectRepaymentProof} disabled={processing} className="flex-1 bg-red-500 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2">
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );

  // ---- Details Modal ----
  const DetailsModal = ({ repayment, onClose }: { repayment: Repayment; onClose: () => void }) => {
    const payments = repayment.payments || [];
    const pendingProofs = repayment.pendingRepaymentProofs?.filter((p) => p.status === "pending") || [];
    const bulkProofs = pendingProofs.filter((p) => p.requestIds && p.requestIds.length > 1);
    const isThisRequestApproved = bulkProofs.some((p) => p.approvedRequestIds?.includes(repayment.id));
    const isCompleted = repayment.status === "paid" || repayment.status === "completed";
    const progress = Math.round((repayment.repaidAmount / repayment.totalRepayable) * 100);
    const [payAmount, setPayAmount] = useState(repayment.remainingAmount.toString());
    const [correctedAmounts, setCorrectedAmounts] = useState<Record<string, string>>({});
    const [showRepairTools, setShowRepairTools] = useState(false);
    const [fixRepaid, setFixRepaid] = useState(String(repayment.repaidAmount));
    const [fixRemaining, setFixRemaining] = useState(String(repayment.remainingAmount));
    const [interestAmountInput, setInterestAmountInput] = useState("");
    const [interestRateInput, setInterestRateInput] = useState("");

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl sm:rounded-[2rem] max-w-2xl w-full max-h-[95vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-white border-b border-[#bff202]/20 p-4 sm:p-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#eafde7] rounded-xl sm:rounded-2xl flex items-center justify-center">
                {repayment.serviceType === "fuel" && <Fuel className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />}
                {repayment.serviceType === "airtime" && <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />}
                {repayment.serviceType === "cash" && <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />}
                {repayment.serviceType === "carwash" && <SprayCan className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[#01312D] leading-tight">Repayment Details</h2>
                <p className="text-[10px] sm:text-sm text-gray-500">Manage loan status and history</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"><XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" /></button>
          </div>

          <div className="p-4 sm:p-8 space-y-6">
            {/* Progress Banner */}
            <div className="bg-gradient-to-br from-[#01312D] to-[#3A7717] rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#bff202]/10 rounded-full -mr-20 -mt-20 blur-3xl" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-white/60 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Outstanding Balance</p>
                    <p className="text-3xl sm:text-4xl font-black mt-1"><DiscountDisplay repayment={repayment} /></p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Progress</p>
                    <p className="text-2xl sm:text-3xl font-black mt-1">{progress}%</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] sm:text-xs font-bold uppercase">
                    <span className="text-white/60">Repaid: {formatMoney(repayment.repaidAmount)}</span>
                    <span className="text-white/60">Total: {formatMoney(repayment.totalRepayable)}</span>
                  </div>
                  <div className="w-full bg-black/20 rounded-full h-3 sm:h-4 overflow-hidden p-1">
                    <div className="bg-[#bff202] h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Proofs */}
            {pendingProofs.map((proof) => {
              const isBulk = proof.requestIds && proof.requestIds.length > 1;
              const approvedCount = proof.approvedRequestIds?.length || 0;
              const remainingCount = isBulk ? (proof.requestIds!.length - approvedCount) : 0;
              const isThisApproved = proof.approvedRequestIds?.includes(repayment.id);
              return (
                <div key={proof.id} className={`bg-yellow-50 border-2 rounded-2xl p-4 space-y-4 ${isBulk ? "border-purple-300" : "border-yellow-200"}`}>
                  {isBulk && (
                    <div className="space-y-2">
                      <div className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" /> Bulk Repayment — {proof.requestIds!.length} requests
                      </div>
                      <div className="flex gap-2 text-[11px] font-bold">
                        <span className="text-green-700 bg-green-100 px-2 py-1 rounded-lg">{approvedCount} approved</span>
                        {remainingCount > 0 && <span className="text-yellow-700 bg-yellow-100 px-2 py-1 rounded-lg">{remainingCount} remaining</span>}
                      </div>
                      {proof.linkedRequests?.map((lr) => {
                        const lrApproved = proof.approvedRequestIds?.includes(lr.id);
                        const lrProgress = lr.totalRepayable > 0 ? Math.round(((lr.totalRepayable - lr.remainingBalance) / lr.totalRepayable) * 100) : 0;
                        return (
                          <div key={lr.id} className={`rounded-xl p-4 ${lrApproved ? "bg-green-50 border border-green-200" : "bg-white border border-gray-200"}`}>
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                                  {lr.type === "fuel" && <Fuel className="w-3.5 h-3.5 text-green-600" />}
                                  {lr.type === "airtime" && <Smartphone className="w-3.5 h-3.5 text-blue-600" />}
                                  {lr.type === "cash" && <DollarSign className="w-3.5 h-3.5 text-yellow-600" />}
                                  {lr.type === "carwash" && <SprayCan className="w-3.5 h-3.5 text-purple-600" />}
                                </div>
                                <span className="font-black text-[#01312D] text-sm capitalize">{lr.type}</span>
                                <span className="text-[11px] text-gray-500">{lr.carNumber}</span>
                                <span className="text-[11px] font-bold text-[#01312D]">— {formatMoney(lr.amount || lr.totalRepayable)}</span>
                              </div>
                              {lrApproved && <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />}
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div><p className="text-[9px] text-gray-400 font-black uppercase">Total</p><p className="text-sm font-black text-[#01312D]">{formatMoney(lr.totalRepayable)}</p></div>
                              <div><p className="text-[9px] text-gray-400 font-black uppercase">Repaid</p><p className="text-sm font-black text-[#3A7717]">{formatMoney(lr.totalRepayable - lr.remainingBalance)}</p></div>
                              <div><p className="text-[9px] text-gray-400 font-black uppercase">Remaining</p><p className="text-sm font-black text-red-600">{formatMoney(lr.remainingBalance)}</p></div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden"><div className="bg-[#3A7717] h-1.5 rounded-full transition-all" style={{ width: `${lrProgress}%` }} /></div>
                            {!lrApproved && (
                              <div className="mt-3 space-y-2">
                                <label className="text-[9px] text-gray-400 font-black uppercase">Correct Amount</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[#01312D] text-xs">R</span>
                                  <input type="number" value={correctedAmounts[lr.id] ?? lr.remainingBalance} onChange={(e) => setCorrectedAmounts((p) => ({ ...p, [lr.id]: e.target.value }))}
                                    className="w-full pl-6 pr-3 py-2 bg-[#eafde7] border border-transparent rounded-xl focus:border-[#bff202] outline-none text-sm font-black text-[#01312D]" max={lr.remainingBalance} />
                                </div>
                                <div className="flex gap-2">
                                  {lr.remainingBalance > 0 ? (
                                    <button onClick={() => handleApproveSingleRequest(proof, lr.id, parseFloat(correctedAmounts[lr.id] ?? String(lr.remainingBalance)))}
                                      disabled={processingRequestId === lr.id || !(correctedAmounts[lr.id] ?? lr.remainingBalance) || parseFloat(correctedAmounts[lr.id] ?? String(lr.remainingBalance)) <= 0}
                                      className="flex-1 bg-[#3A7717] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#2d5a12] disabled:opacity-50 active:scale-[0.98]">
                                      {processingRequestId === lr.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                      Approve & Pay {formatMoney(parseFloat(correctedAmounts[lr.id] ?? String(lr.remainingBalance)))}
                                    </button>
                                  ) : (
                                    <button onClick={() => { fetch("/api/admin/repayment-proofs", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ proofId: proof.id, status: "approved", requestId: lr.id }) }).then(() => { fetchRepayments(); setSuccessMessage("✅ Approved"); setShowSuccessModal(true); }); }}
                                      className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-700 disabled:opacity-50">
                                      <CheckCircle className="w-3.5 h-3.5" /> Confirm Proof
                                    </button>
                                  )}
                                  <button onClick={() => { setSelectedProof(proof); setShowRejectModal(true); }}
                                    className="bg-red-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-red-600 disabled:opacity-50">
                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                  </button>
                                  <button onClick={() => { if (!confirm("Move to Pending? Driver can resubmit later.")) return; fetch("/api/admin/repayment-proofs", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ proofId: proof.id, status: "rejected", reason: "Moved to pending — resubmit required", requestId: lr.id }) }).then(() => { fetchRepayments(); setSuccessMessage("✅ Moved to Pending"); setShowSuccessModal(true); }); }}
                                    className="bg-gray-200 text-[#01312D] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-gray-300 disabled:opacity-50">
                                    <ArrowLeft className="w-3.5 h-3.5" /> Move to Pending
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="bg-white rounded-xl p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Repayment Amount:</span>
                      <span className="font-bold text-[#3A7717]">{formatMoney(proof.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Submitted:</span>
                      <span className="font-semibold">{new Date(proof.submittedAt).toLocaleString()}</span>
                    </div>
                    {isBulk && (
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="text-green-700 font-bold text-xs">{approvedCount} of {proof.requestIds!.length} approved</span>
                        {approvedCount === proof.requestIds!.length && <span className="font-bold text-green-700 text-xs">All Approved ✓</span>}
                      </div>
                    )}
                  </div>
                  {proof.proofUrl && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#3A7717]" />
                      <ProofButton url={proof.proofUrl} label="View Proof of Payment" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Driver & Service Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#eafde7] rounded-2xl sm:rounded-3xl p-5 space-y-4 border border-[#bff202]/20 shadow-sm">
                <h3 className="font-bold text-[#01312D] flex items-center gap-2 border-b border-[#bff202]/20 pb-2 text-sm sm:text-base"><User className="w-4 h-4 text-[#3A7717]" /> Driver Info</h3>
                <div className="space-y-3">
                  <div><p className="text-[10px] text-gray-400 font-bold uppercase">Name</p><p className="text-sm font-bold text-[#01312D]">{repayment.driverName}</p></div>
                  <div><p className="text-[10px] text-gray-400 font-bold uppercase">Contact</p><p className="text-sm font-semibold text-[#01312D]">{repayment.driverPhone}</p><p className="text-xs text-gray-500">{repayment.driverEmail}</p></div>
                  <div><p className="text-[10px] text-gray-400 font-bold uppercase">Vehicle</p><p className="text-sm font-bold text-[#01312D]">{repayment.carRegistration}</p></div>
                </div>
              </div>
              <div className="bg-[#eafde7] rounded-2xl sm:rounded-3xl p-5 space-y-4 border border-[#bff202]/20 shadow-sm">
                <h3 className="font-bold text-[#01312D] flex items-center gap-2 border-b border-[#bff202]/20 pb-2 text-sm sm:text-base"><FileText className="w-4 h-4 text-[#3A7717]" /> Service Details</h3>
                <div className="space-y-3">
                  <div><p className="text-[10px] text-gray-400 font-bold uppercase">Service</p><p className="text-sm font-bold text-[#01312D]">{repayment.serviceTypeLabel}</p></div>
                  <div className="flex justify-between gap-4">
                    <div><p className="text-[10px] text-gray-400 font-bold uppercase">Due Date</p><p className="text-sm font-bold text-red-600">{new Date(repayment.dueDate).toLocaleDateString()}</p></div>
                    <div><p className="text-[10px] text-gray-400 font-bold uppercase">Daily Pay</p><p className="text-sm font-bold text-[#01312D]">{formatMoney(repayment.dailyPayment)}</p></div>
                  </div>
                  <div><p className="text-[10px] text-gray-400 font-bold uppercase">Status</p>{getStatusBadge(repayment.status)}</div>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#01312D] flex items-center gap-2"><History className="w-5 h-5 text-[#3A7717]" /> Payment History</h3>
                <span className="bg-[#eafde7] text-[#3A7717] text-[10px] font-black px-2 py-0.5 rounded-full border border-[#bff202]/30">{payments.length} RECORDS</span>
              </div>
              {payments.length > 0 ? (
                <div className="space-y-2">
                  {[...payments].reverse().map((payment, idx) => (
                    <div key={payment.id || idx} className="flex flex-col p-3 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-[#bff202] transition-colors shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-green-600 font-bold text-xs"><ArrowDown className="w-4 h-4" /></div>
                          <div>
                            <p className="text-sm font-black text-[#01312D]">{formatMoney(payment.amount)}</p>
                            <p className="text-[10px] text-gray-400 font-bold">{new Date(payment.date).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-[10px] font-black text-[#3A7717] uppercase">{payment.method?.replace("_", " ")}</p>
                            {payment.reference && <p className="text-[10px] text-gray-400 truncate max-w-[80px]">{payment.reference}</p>}
                          </div>
                          {payment.proofUrl && <ProofButton url={payment.proofUrl} />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm"><Receipt className="w-6 h-6 text-gray-300" /></div>
                  <p className="text-sm text-gray-400 font-medium">No payments recorded yet</p>
                </div>
              )}
            </div>

            {/* Interest Adjustments */}
            {(repayment.interestAdjustments?.length || 0) > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-[#01312D] flex items-center gap-2"><Percent className="w-5 h-5 text-orange-500" /> Interest Adjustments</h3>
                <div className="space-y-2">
                  {repayment.interestAdjustments!.map((adj, idx) => (
                    <div key={adj.id || idx} className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-black text-[#01312D]">+{formatMoney(adj.amount)} <span className="text-xs font-bold text-orange-600">at {adj.rate}%</span></p>
                        <p className="text-[10px] text-gray-400 font-bold">{adj.addedAt ? new Date(adj.addedAt).toLocaleString() : ""}</p>
                      </div>
                      {adj.newRemainingBalance !== undefined && (
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 font-black uppercase">New Remaining</p>
                          <p className="text-sm font-black text-red-600">{formatMoney(adj.newRemainingBalance)}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Repair Tools */}
            <div className="border-t border-[#bff202]/20 pt-4">
              <button onClick={() => setShowRepairTools(!showRepairTools)} className="flex items-center gap-2 text-sm font-bold text-[#01312D] hover:text-[#3A7717] transition-colors">
                <AlertTriangle className="w-4 h-4 text-yellow-600" /> {showRepairTools ? "Hide" : "Show"} Correction Tools
              </button>
              {showRepairTools && (
                <div className="mt-4 space-y-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                  <p className="text-xs text-yellow-800 font-semibold flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> Use these tools to fix miscalculations like duplicate payment records or incorrect balances.</p>

                  {/* Add Interest */}
                  {!isCompleted && (
                    <div className="bg-white rounded-xl p-3 border border-[#bff202]/20 space-y-2">
                      <h4 className="text-sm font-bold text-[#01312D]">Add Interest</h4>
                      <div className="flex gap-2 items-end flex-wrap">
                        <div className="flex-1 min-w-[110px]">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Amount (R)</label>
                          <input type="number" value={interestAmountInput} onChange={(e) => setInterestAmountInput(e.target.value)} placeholder="e.g. 50"
                            className="w-full px-3 py-2 border border-[#bff202]/30 rounded-xl text-sm font-bold focus:outline-none focus:border-[#72bf00]" />
                        </div>
                        <div className="flex-1 min-w-[110px]">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Or Rate (%)</label>
                          <input type="number" value={interestRateInput} onChange={(e) => setInterestRateInput(e.target.value)} placeholder="e.g. 5"
                            className="w-full px-3 py-2 border border-[#bff202]/30 rounded-xl text-sm font-bold focus:outline-none focus:border-[#72bf00]" />
                        </div>
                        <button onClick={() => handleAddInterest(repayment, interestAmountInput, interestRateInput)} disabled={processing || (!interestAmountInput && !interestRateInput)}
                          className="bg-orange-500 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1.5 hover:bg-orange-600 disabled:opacity-50">
                          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Percent className="w-4 h-4" />} Add
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400">Fill one — the other is auto-calculated from the remaining balance.</p>
                    </div>
                  )}

                  {/* Delete duplicate payments */}
                  {payments.length > 1 && (
                    <div>
                      <h4 className="text-sm font-bold text-[#01312D] mb-2">Payment Records</h4>
                      <div className="space-y-2">
                        {payments.map((p) => (
                          <div key={p.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-[#bff202]/20">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{formatMoney(p.amount)}</span>
                              <span className="text-xs text-gray-500">{new Date(p.date).toLocaleDateString()} — {p.method}</span>
                              {p.proofUrl && <ProofButton url={p.proofUrl} />}
                            </div>
                            <button onClick={() => handleDeletePayment(repayment.id, p.id)} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors" title="Delete this payment">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Correct individual payment amounts */}
                  {payments.map((p) => (
                    <div key={p.id} className="bg-white rounded-xl p-3 border border-[#bff202]/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#01312D]">Payment: {p.id?.slice(0, 8)}...</span>
                        <span className="text-xs text-gray-500">{new Date(p.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-xs font-bold">Amount:</span>
                        <input type="number" defaultValue={p.amount} id={`fix-${p.id}`} className="w-28 px-2 py-1 border border-[#bff202]/30 rounded-lg text-sm font-bold focus:outline-none focus:border-[#72bf00]" />
                        <button onClick={() => {
                          const inp = document.getElementById(`fix-${p.id}`) as HTMLInputElement;
                          handleCorrectPaymentAmount(repayment.id, p.id, parseFloat(inp.value));
                        }} disabled={processing} className="text-xs bg-[#3A7717] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-[#2d5a12] disabled:opacity-50">
                          <Save className="w-3 h-3 inline mr-1" />Correct
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Recalculate */}
                  <button onClick={() => handleRecalcLoan(repayment.id, repayment.totalRepayable)} disabled={processing}
                    className="w-full bg-[#01312D] text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#3A7717] disabled:opacity-50">
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Recalculate Loan (from payment records)
                  </button>

                  {/* Manual fix */}
                  <div className="bg-white rounded-xl p-3 border border-[#bff202]/20">
                    <h4 className="text-sm font-bold text-[#01312D] mb-2">Manual Override</h4>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Repaid Amount</label>
                        <input type="number" value={fixRepaid} onChange={(e) => setFixRepaid(e.target.value)} className="w-full px-3 py-2 border border-[#bff202]/30 rounded-xl text-sm font-bold focus:outline-none focus:border-[#72bf00]" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Remaining Balance</label>
                        <input type="number" value={fixRemaining} onChange={(e) => setFixRemaining(e.target.value)} className="w-full px-3 py-2 border border-[#bff202]/30 rounded-xl text-sm font-bold focus:outline-none focus:border-[#72bf00]" />
                      </div>
                    </div>
                    <button onClick={() => handleManualFix(repayment.id, parseFloat(fixRepaid), parseFloat(fixRemaining))} disabled={processing}
                      className="w-full bg-[#3A7717] text-white py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#2d5a12] disabled:opacity-50">
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Apply Manual Values
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-white border-t border-[#bff202]/20 p-4 sm:p-6 flex flex-col gap-3">
            {pendingProofs.length > 0 ? (
              repayment.linkedChildren && bulkProofs.length > 0 ? (
                <div className="space-y-3">
                  {(() => {
                    const bulkProof = bulkProofs[0];
                    const linkedRemaining = repayment.linkedChildren!.reduce((s, c) => s + c.remainingAmount, 0);
                    return (
                      <ApproveSpreadPanel
                        proof={bulkProof}
                        linkedRemaining={linkedRemaining}
                        processing={processing}
                        onApprove={handleApproveSpread}
                      />
                    );
                  })()}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 text-sm text-yellow-800 font-bold text-center">
                    <Hourglass className="w-4 h-4 inline-block mr-1.5 text-yellow-600" /> Or approve each request individually above
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  {repayment.remainingAmount > 0 ? (
                    <button onClick={() => handleApproveAndPay(pendingProofs[0], repayment, parseFloat(payAmount))}
                      disabled={processing || !payAmount || parseFloat(payAmount) <= 0 || isThisRequestApproved}
                      className="flex-1 bg-[#3A7717] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#2d5a12] disabled:opacity-50">
                      {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                      {isThisRequestApproved ? "Already Approved" : `Approve & Pay — ${formatMoney(parseFloat(payAmount || "0"))}`}
                    </button>
                  ) : (
                    <button onClick={() => handleApproveProof(pendingProofs[0])} disabled={processing || isThisRequestApproved}
                      className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50">
                      {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                      {isThisRequestApproved ? "Already Approved" : "Confirm Proof"}
                    </button>
                  )}
                  <button onClick={() => { setSelectedProof(pendingProofs[0]); setShowRejectModal(true); }} disabled={processing || isThisRequestApproved}
                    className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 disabled:opacity-50">
                    <XCircle className="w-5 h-5" /> {isThisRequestApproved ? "Approved" : "Reject"}
                  </button>
                  {repayment.remainingAmount > 0 && !isThisRequestApproved && (
                    <button onClick={() => handleMoveToPending(repayment)} disabled={processing}
                      className="flex-1 bg-gray-200 text-[#01312D] py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-300 disabled:opacity-50">
                      {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowLeft className="w-5 h-5" />}
                      Move to Pending
                    </button>
                  )}
                  <button onClick={() => handleMarkAsCompleted(repayment)} disabled={processing}
                    className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${repayment.remainingAmount === 0 ? "bg-[#bff202] text-[#01312D] hover:bg-[#d4e84a]" : "bg-orange-50 text-orange-600 hover:bg-orange-100"}`}>
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    {repayment.remainingAmount === 0 ? "Settle" : "Settle & Write Off"}
                  </button>
                </div>
              )
            ) : !isCompleted ? (
              <>
                <button onClick={() => handleMarkAsPaid(repayment, parseFloat(payAmount), "cash", undefined, new Date().toISOString().split("T")[0])}
                  disabled={processing || !payAmount || parseFloat(payAmount) <= 0}
                  className="w-full bg-[#3A7717] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#2d5a12] disabled:opacity-50">
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  Confirm Payment — {formatMoney(parseFloat(payAmount || "0"))}
                </button>
                <button onClick={() => handleMarkAsCompleted(repayment)} disabled={processing}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${repayment.remainingAmount === 0 ? "bg-[#bff202] text-[#01312D] hover:bg-[#d4e84a]" : "bg-orange-50 text-orange-600 hover:bg-orange-100"}`}>
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  {repayment.remainingAmount === 0 ? "Mark as Complete" : "Settle & Write Off"}
                </button>
              </>
            ) : (
              <div className="bg-green-50 text-green-700 py-4 rounded-2xl font-black flex items-center justify-center gap-2 border border-green-200">
                <CheckCircle className="w-6 h-6" /> REPAYMENT FULLY SETTLED
              </div>
            )}
            <button onClick={onClose} className="w-full py-2 rounded-xl font-bold text-gray-400 hover:text-gray-600 transition-colors text-sm">Close Details</button>
          </div>
        </div>
      </div>
    );
  };

  // ---- Main Render ----
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#01312D]">Repayments</h1>
          <p className="text-gray-500 text-sm mt-1">Pending = awaiting driver repayment &bull; Review = POP uploaded, needs approval &bull; Overdue = past due date &bull; Paid = settled</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/repayments/history" className="flex items-center gap-2 px-4 py-2 bg-[#eafde7] rounded-xl text-[#01312D] font-semibold hover:bg-[#bff202]/30 transition-all">
            <History className="w-4 h-4" /> History
          </Link>
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-[#eafde7] rounded-xl text-[#01312D] font-semibold hover:bg-[#bff202]/30 transition-all">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Outstanding Amount</p>
              <div className="text-2xl font-bold text-[#01312D]">{loading ? <Skeleton className="h-8 w-28 inline-block" /> : formatMoney(stats.totalOutstanding)}</div>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center"><Wallet className="w-5 h-5 text-yellow-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Repaid</p>
              <div className="text-2xl font-bold text-[#3A7717]">{loading ? <Skeleton className="h-8 w-28 inline-block" /> : formatMoney(stats.totalPaid)}</div>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Active</p>
              <div className="text-2xl font-bold text-[#01312D]">{loading ? <Skeleton className="h-8 w-28 inline-block" /> : stats.activeLoans}</div>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Overdue</p>
              <div className="text-2xl font-bold text-red-600">{loading ? <Skeleton className="h-8 w-28 inline-block" /> : stats.overdueCount}</div>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><XCircle className="w-5 h-5 text-red-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">In Review</p>
              <div className="text-2xl font-bold text-yellow-600">{loading ? <Skeleton className="h-8 w-28 inline-block" /> : stats.pendingProofs}</div>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center"><FileText className="w-5 h-5 text-yellow-600" /></div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by driver name, email, or registration..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 border-b border-[#bff202]/20 overflow-x-auto">
        <button onClick={() => setActiveTab("pending")}
          className={`px-3 sm:px-4 py-2 font-semibold transition-all whitespace-nowrap shrink-0 ${activeTab === "pending" ? "text-yellow-600 border-b-2 border-yellow-600" : "text-gray-500"}`}>
          Pending
          <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">{pendingCount}</span>
        </button>
        <button onClick={() => setActiveTab("review")}
          className={`px-3 sm:px-4 py-2 font-semibold transition-all whitespace-nowrap shrink-0 ${activeTab === "review" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}>
          Review
          <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{reviewCount}</span>
        </button>
        <button onClick={() => setActiveTab("overdue")}
          className={`px-3 sm:px-4 py-2 font-semibold transition-all whitespace-nowrap shrink-0 ${activeTab === "overdue" ? "text-red-600 border-b-2 border-red-600" : "text-gray-500"}`}>
          Overdue
          <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">{overdueTabCount}</span>
        </button>
        <button onClick={() => setActiveTab("paid")}
          className={`px-3 sm:px-4 py-2 font-semibold transition-all whitespace-nowrap shrink-0 ${activeTab === "paid" ? "text-[#3A7717] border-b-2 border-[#3A7717]" : "text-gray-500"}`}>
          Paid
          <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">{paidCount}</span>
        </button>
        <button onClick={() => setActiveTab("all")}
          className={`px-3 sm:px-4 py-2 font-semibold transition-all whitespace-nowrap shrink-0 ${activeTab === "all" ? "text-[#3A7717] border-b-2 border-[#3A7717]" : "text-gray-500"}`}>
          All <span className="ml-1 px-1.5 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">{allCount}</span>
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <div className="flex items-start gap-3">
                <Skeleton className="w-4 h-4 mt-3 shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                      <div className="space-y-2">
                        <div className="flex gap-2"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-5 w-20 rounded-full" /></div>
                        <Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="text-right space-y-2"><Skeleton className="h-7 w-28" /><Skeleton className="h-3 w-20" /></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
                    {[1, 2, 3, 4].map((j) => <div key={j} className="space-y-1"><Skeleton className="h-3 w-16" /><Skeleton className="h-5 w-20" /></div>)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between"><Skeleton className="h-3 w-28" /><Skeleton className="h-3 w-8" /></div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                  <div className="flex gap-2"><Skeleton className="h-10 flex-1 rounded-lg" /><Skeleton className="h-10 flex-1 rounded-lg" /></div>
                </div>
              </div>
            </div>
          ))
        ) : filteredRepayments.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#bff202]/20">
            <div className="w-20 h-20 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-4"><Wallet className="w-10 h-10 text-gray-400" /></div>
            <p className="text-gray-500">No {activeTab} repayments found</p>
          </div>
        ) : (
          filteredRepayments.map((repayment) => {
            const isCompleted = repayment.status === "paid" || repayment.status === "completed";
            const hasPendingProofs = repayment.pendingRepaymentProofs?.some(
              (p) => p.status === "pending" && (!p.approvedRequestIds || !p.approvedRequestIds.includes(repayment.id)),
            );
            const hasActualAmount = repayment.actualAmount && repayment.actualAmount !== repayment.amount;
            return (
              <div key={repayment.id} className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    {repayment.linkedChildren ? (
                      <>
                        <div className="flex items-start justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center"><Layers className="w-6 h-6 text-purple-600" /></div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Bulk ({repayment.linkedChildren.length} requests)</span>
                                {hasPendingProofs && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Hourglass className="w-3 h-3" /> Pending Proof</span>}
                              </div>
                              <p className="font-semibold text-[#01312D]">{repayment.driverName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-[#3A7717]"><DiscountDisplay repayment={repayment} /></p>
                            <p className="text-xs text-gray-500">Total Outstanding</p>
                          </div>
                        </div>
                        {(() => {
                          const bulkProof = repayment.pendingRepaymentProofs?.find(
                            (p) => p.status === "pending" && p.requestIds && p.requestIds.length > 1,
                          );
                          if (!bulkProof) return null;
                          const linkedRemaining = repayment.linkedChildren!.reduce((s, c) => s + c.remainingAmount, 0);
                          return (
                            <ApproveSpreadPanel
                              proof={bulkProof}
                              linkedRemaining={linkedRemaining}
                              processing={processing}
                              onApprove={handleApproveSpread}
                            />
                          );
                        })()}
                        <div className="mt-3 space-y-2">
                          {repayment.linkedChildren.map((child) => (
                            <div key={child.id} className="space-y-1">
                              <button onClick={() => { setSelectedRepayment(child); setShowDetailsModal(true); }}
                                className="w-full text-left bg-gray-50 hover:bg-[#eafde7] rounded-xl p-3 flex items-center gap-3 border border-gray-100 hover:border-[#bff202]/30 transition-all cursor-pointer">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0">
                                  {child.serviceType === "fuel" && <Fuel className="w-4 h-4 text-green-600" />}
                                  {child.serviceType === "airtime" && <Smartphone className="w-4 h-4 text-blue-600" />}
                                  {child.serviceType === "cash" && <DollarSign className="w-4 h-4 text-yellow-600" />}
                                  {child.serviceType === "carwash" && <SprayCan className="w-4 h-4 text-purple-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-[#01312D]">{child.serviceTypeLabel}</span>
                                    {getStatusBadge(child.status)}
                                  </div>
                                  <p className="text-xs text-gray-500">{child.carRegistration}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-semibold text-[#01312D]"><DiscountDisplay repayment={child} /></p>
                                  <p className="text-xs text-gray-400">of {formatMoney(child.totalRepayable)}</p>
                                </div>
                              </button>
                              {child.pendingRepaymentProofs?.some((p) => p.status === "pending" && (!p.approvedRequestIds || !p.approvedRequestIds.includes(child.id))) && (
                                <button onClick={() => handleMoveToPending(child)} className="text-xs font-bold text-gray-500 hover:text-[#01312D] flex items-center gap-1 px-3 transition-colors">
                                  <ArrowLeft className="w-3 h-3" /> Move to Pending
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#eafde7] rounded-full flex items-center justify-center">
                              {repayment.serviceType === "fuel" && <Fuel className="w-6 h-6 text-green-600" />}
                              {repayment.serviceType === "airtime" && <Smartphone className="w-6 h-6 text-blue-600" />}
                              {repayment.serviceType === "cash" && <DollarSign className="w-6 h-6 text-yellow-600" />}
                              {repayment.serviceType === "carwash" && <SprayCan className="w-6 h-6 text-purple-600" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {getServiceTypeBadge(repayment.serviceType, repayment)}
                                {getStatusBadge(repayment.status)}
                                {hasActualAmount && <span className="text-xs bg-[#BFF202]/20 text-[#01312D] px-2 py-0.5 rounded-full">Amount Adjusted</span>}
                                {hasPendingProofs && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Hourglass className="w-3 h-3" /> Pending Proof</span>}
                              </div>
                              <p className="font-semibold text-[#01312D]">{repayment.driverName}</p>
                              <p className="text-xs text-gray-500">{repayment.carRegistration}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-[#3A7717]"><DiscountDisplay repayment={repayment} /></p>
                            <p className="text-xs text-gray-500">Due: {new Date(repayment.dueDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {hasActualAmount && (
                          <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                            <span className="text-gray-400">Requested: {formatMoney(repayment.amount)}</span>
                            <span>→</span><span className="text-[#3A7717] font-medium">Actual: {formatMoney(repayment.actualAmount!)}</span>
                          </div>
                        )}
                      </>
                    )}

                    {/* Financial summary bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-3 border-t border-gray-100">
                      <div><p className="text-xs text-gray-500">Total</p><p className="font-semibold text-[#01312D]">{formatMoney(repayment.totalRepayable)}</p></div>
                      <div><p className="text-xs text-gray-500">Repaid</p><p className="font-semibold text-[#3A7717]">{formatMoney(repayment.repaidAmount)}</p></div>
                      <div><p className="text-xs text-gray-500">Daily</p><p className="font-semibold text-[#01312D]">{formatMoney(repayment.dailyPayment)}</p></div>
                      <div><p className="text-xs text-gray-500">Period</p><p className="font-semibold text-[#01312D]">{repayment.repaymentDays} days</p></div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Repayment Progress</span>
                        <span className="font-semibold text-[#01312D]">{Math.round((repayment.repaidAmount / repayment.totalRepayable) * 100)}%</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-[#3A7717] h-2 rounded-full transition-all" style={{ width: `${(repayment.repaidAmount / repayment.totalRepayable) * 100}%` }} />
                      </div>
                    </div>

                    {/* Action buttons and POP links */}
                    <div className="flex gap-2 mt-4 flex-wrap">
                      <button onClick={() => { setSelectedRepayment(repayment); setShowDetailsModal(true); }}
                        className="flex-1 min-w-[120px] py-2 bg-[#3A7717] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#2d5a12] transition-colors">
                        <Banknote className="w-4 h-4" /> {!isCompleted ? "Record Payment" : "View Details"}
                      </button>
                      {!isCompleted && (
                        <button onClick={() => { setRepaymentUploadRepayment(repayment); setRepaymentUploadAmount(repayment.dailyPayment.toString()); setRepaymentUploadMethod("cash"); setRepaymentUploadFile(null); setRepaymentUploadProofUrl(""); setRepaymentUploadProofPublicId(""); setShowRepaymentUploadModal(true); }}
                          className="flex-1 min-w-[120px] py-2 bg-[#01312D] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#3A7717] transition-colors">
                          <Upload className="w-4 h-4" /> Upload for Driver
                        </button>
                      )}
                      {/* Move to Pending — for Review tab items, not bulk groups */}
                      {hasPendingProofs && !isCompleted && !repayment.linkedChildren && (
                        <button onClick={() => handleMoveToPending(repayment)} className="text-xs font-bold text-gray-600 flex items-center gap-1.5 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors">
                          <ArrowLeft className="w-3.5 h-3.5" /> Move to Pending
                        </button>
                      )}
                      {/* POP buttons in list view — only repayment POPs */}
                      {repayment.payments?.map((p) => p.proofUrl ? <ProofButton key={p.id} url={p.proofUrl} /> : null)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Load More */}
      {!loading && hasMore && (
        <div className="flex justify-center">
          <button onClick={handleLoadMore} disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-[#bff202]/30 rounded-xl text-[#01312D] font-semibold text-sm hover:bg-[#eafde7] transition-all disabled:opacity-50">
            {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {/* Upload for Driver Modal */}
      {showRepaymentUploadModal && repaymentUploadRepayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !repaymentUploadLoading && setShowRepaymentUploadModal(false)} />
          <div className="relative bg-white rounded-[2rem] max-w-lg w-full max-h-[95vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#01312D] to-[#3A7717] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><Upload className="w-6 h-6 text-white" /></div>
                  <div><h2 className="text-xl font-bold text-white">Submit Repayment for Driver</h2><p className="text-white/80 text-sm">For elderly or disabled drivers</p></div>
                </div>
                <button onClick={() => setShowRepaymentUploadModal(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5 text-white" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800">Use this to submit a repayment on behalf of a driver who cannot do so themselves.</p>
              </div>
              <div className="bg-[#eafde7] rounded-xl p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Driver:</span><span className="font-semibold text-[#01312D]">{repaymentUploadRepayment.driverName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Vehicle:</span><span className="font-semibold text-[#01312D]">{repaymentUploadRepayment.carRegistration}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Service:</span><span className="font-semibold text-[#01312D]">{repaymentUploadRepayment.serviceTypeLabel}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Outstanding:</span><span className="font-bold text-red-600">{formatMoney(repaymentUploadRepayment.remainingAmount)}</span></div>
                </div>
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">Repayment Amount (R) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#72bf00]" />
                  <input type="number" value={repaymentUploadAmount} onChange={(e) => setRepaymentUploadAmount(e.target.value)} placeholder="Enter amount"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] text-base" max={repaymentUploadRepayment.remainingAmount} />
                </div>
                <div className="flex gap-2 mt-2">
                  {[
                    { label: `Daily (${formatMoney(repaymentUploadRepayment.dailyPayment)})`, val: repaymentUploadRepayment.dailyPayment },
                    { label: "Weekly", val: repaymentUploadRepayment.dailyPayment * 7 },
                    { label: "Full Balance", val: repaymentUploadRepayment.remainingAmount },
                  ].map((opt) => (
                    <button key={opt.label} onClick={() => setRepaymentUploadAmount(opt.val.toString())}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${parseFloat(repaymentUploadAmount) === opt.val ? "bg-[#bff202] border-[#bff202] text-[#01312D]" : "bg-white border-gray-200 text-gray-500"}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">Payment Method</label>
                <select value={repaymentUploadMethod} onChange={(e) => setRepaymentUploadMethod(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] text-base">
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">Proof of Repayment <span className="text-red-500">*</span></label>
                <input ref={repaymentFileInputRef} type="file" accept="image/*" onChange={handleRepaymentFileSelect} className="hidden" />
                {!repaymentUploadProofUrl ? (
                  <button onClick={() => repaymentFileInputRef.current?.click()} disabled={repaymentUploadLoading}
                    className="w-full border-2 border-dashed border-[#bff202]/30 rounded-xl p-8 text-center hover:border-[#72bf00] transition-colors disabled:opacity-50">
                    {repaymentUploadLoading ? (
                      <><Loader2 className="w-12 h-12 text-[#72bf00] mx-auto mb-3 animate-spin" /><p className="text-sm text-[#01312D] font-semibold">Compressing & uploading...</p></>
                    ) : (
                      <><Upload className="w-12 h-12 text-[#72bf00] mx-auto mb-3" /><p className="text-sm text-[#01312D] font-semibold">Click to upload proof</p><p className="text-xs text-gray-500 mt-1">JPG or PNG</p></>
                    )}
                  </button>
                ) : (
                  <div className="relative bg-[#eafde7] rounded-xl p-4">
                    <img src={repaymentUploadProofUrl} alt="Proof" className="w-full h-40 object-cover rounded-lg cursor-pointer" onClick={() => window.open(repaymentUploadProofUrl, "_blank")} />
                    <button onClick={() => { setRepaymentUploadProofUrl(""); setRepaymentUploadProofPublicId(""); }} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"><XCircle className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            </div>
            <div className="border-t border-gray-100 p-6 flex gap-3">
              <button onClick={() => { if (!repaymentUploadLoading) setShowRepaymentUploadModal(false); }} disabled={repaymentUploadLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
              <button onClick={handleSubmitRepaymentForDriver} disabled={repaymentUploadLoading || !repaymentUploadProofUrl || !repaymentUploadAmount}
                className="flex-1 bg-gradient-to-r from-[#3A7717] to-[#72BF00] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50">
                {repaymentUploadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Submit Repayment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRepayment && (
        <DetailsModal repayment={selectedRepayment} onClose={() => { setShowDetailsModal(false); setSelectedRepayment(null); }} />
      )}
      {showRejectModal && renderRejectionModal()}
      <SuccessModal />
      <ErrorModal />
    </div>
  );
}
