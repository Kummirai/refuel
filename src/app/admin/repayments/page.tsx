// src/app/admin/repayments/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/utils/image-compression";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import {
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  RefreshCw,
  TrendingUp,
  Wallet,
  Calendar,
  User,
  Phone,
  Mail,
  Car,
  Loader2,
  CreditCard,
  Banknote,
  ArrowLeft,
  AlertCircle,
  History,
  Download,
  Receipt,
  Fuel,
  Smartphone,
  SprayCan,
  FileText,
  Hourglass,
  ArrowDown,
  Upload,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

interface Repayment {
  id: string;
  loanId: string;
  driverId: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  carRegistration: string;
  serviceType: string;
  serviceTypeLabel: string;
  amount: number;
  requestedAmount?: number;
  actualAmount?: number;
  interestRate: number;
  interest: number;
  totalRepayable: number;
  repaidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue" | "completed";
  dailyPayment: number;
  repaymentDays: number;
  nextPaymentDate: string;
  lastPaymentDate?: string;
  approvedDate?: string;
  completedDate?: string;
  requestDate?: string;
  packageInfo?: { package: string; description: string };
  fuelType?: string;
  contactPhone?: string;
  otp?: string;
  popUrl?: string;
  popUploadedAt?: string;
  payments?: PaymentHistory[];
  pendingRepaymentProofs?: RepaymentProof[];
}

interface PaymentHistory {
  id: string;
  amount: number;
  date: string;
  method: string;
  reference?: string;
  proofUrl?: string;
}

interface RepaymentProof {
  id: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  proofUrl: string;
  remainingBalance?: number;
  isFullyPaid?: boolean;
}

export default function LoanRepaymentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "outstanding" | "paid" | "all" | "pendingProofs"
  >("outstanding");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [selectedRepayment, setSelectedRepayment] = useState<Repayment | null>(
    null,
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  // Bulk selection states
  const [selectedRepayments, setSelectedRepayments] = useState<string[]>([]);

  // Repayment Proof approval states
  const [selectedProof, setSelectedProof] = useState<RepaymentProof | null>(
    null,
  );
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Admin submits repayment for driver states
  const [showRepaymentUploadModal, setShowRepaymentUploadModal] = useState(false);
  const [repaymentUploadRepayment, setRepaymentUploadRepayment] = useState<Repayment | null>(null);
  const [repaymentUploadAmount, setRepaymentUploadAmount] = useState("");
  const [repaymentUploadFile, setRepaymentUploadFile] = useState<File | null>(null);
  const [repaymentUploadProofUrl, setRepaymentUploadProofUrl] = useState("");
  const [repaymentUploadProofPublicId, setRepaymentUploadProofPublicId] = useState("");
  const [repaymentUploadLoading, setRepaymentUploadLoading] = useState(false);
  const [repaymentUploadMethod, setRepaymentUploadMethod] = useState("cash");
  const repaymentFileInputRef = useRef<HTMLInputElement>(null);

  const isAnyModalOpen = showDetailsModal || showSuccessModal || showErrorModal || showRejectModal || showRepaymentUploadModal;
  useBodyScrollLock(isAnyModalOpen);

  const handleRepaymentFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload an image file");
      setShowErrorModal(true);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File size must be less than 10MB");
      setShowErrorModal(true);
      return;
    }

    setRepaymentUploadLoading(true);

    try {
      const compressedBlob = await compressImage(file);
      const compressedFile = new File([compressedBlob], file.name, {
        type: compressedBlob.type || file.type,
      });

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("type", "repayment");
      formData.append("requestId", repaymentUploadRepayment?.id || "");

      const response = await fetch("/api/driver/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setRepaymentUploadProofUrl(data.url);
      setRepaymentUploadProofPublicId(data.publicId);
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMessage(err.message || "Upload failed. Please try again.");
      setShowErrorModal(true);
    } finally {
      setRepaymentUploadLoading(false);
      if (repaymentFileInputRef.current) {
        repaymentFileInputRef.current.value = "";
      }
    }
  };

  const handleSubmitRepaymentForDriver = async () => {
    if (!repaymentUploadRepayment) return;

    const amount = parseFloat(repaymentUploadAmount);
    if (!amount || amount <= 0) {
      setErrorMessage("Please enter a valid repayment amount");
      setShowErrorModal(true);
      return;
    }

    if (amount > repaymentUploadRepayment.remainingAmount) {
      setErrorMessage(`Amount cannot exceed remaining balance of R${repaymentUploadRepayment.remainingAmount.toLocaleString()}`);
      setShowErrorModal(true);
      return;
    }

    if (!repaymentUploadProofUrl) {
      setErrorMessage("Please upload proof of repayment");
      setShowErrorModal(true);
      return;
    }

    setRepaymentUploadLoading(true);

    try {
      const response = await fetch("/api/admin/repayments/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repaymentId: repaymentUploadRepayment.id,
          amount,
          method: repaymentUploadMethod,
          date: new Date().toISOString().split("T")[0],
          proofUrl: repaymentUploadProofUrl,
          proofPublicId: repaymentUploadProofPublicId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to record repayment");
      }

      setSuccessMessage(
        `✅ Repayment of R${amount.toLocaleString()} recorded successfully for ${repaymentUploadRepayment.driverName}! Remaining: R${data.remainingBalance.toLocaleString()}`,
      );
      setShowSuccessModal(true);
      fetchRepayments();
      setShowRepaymentUploadModal(false);
      setRepaymentUploadRepayment(null);
      setRepaymentUploadAmount("");
      setRepaymentUploadFile(null);
      setRepaymentUploadProofUrl("");
      setRepaymentUploadProofPublicId("");
    } catch (err: any) {
      console.error("Repayment error:", err);
      setErrorMessage(err.message || "Failed to record repayment");
      setShowErrorModal(true);
    } finally {
      setRepaymentUploadLoading(false);
    }
  };

  useEffect(() => {
    fetchRepayments();
  }, []);

  const fetchRepayments = async () => {
    try {
      const response = await fetch("/api/admin/repayments");
      if (response.ok) {
        const data = await response.json();
        setRepayments(data);
      }
    } catch (error) {
      console.error("Error fetching repayments:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRepayments();
  };

  const handleMarkAsPaid = async (
    repayment: Repayment,
    amount: number,
    method: string,
    reference?: string,
    date?: string,
  ) => {
    if (amount <= 0 || amount > repayment.remainingAmount) {
      setErrorMessage(
        `Amount must be between 1 and ${repayment.remainingAmount}`,
      );
      setShowErrorModal(true);
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/admin/repayments/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repaymentId: repayment.id,
          amount: amount,
          method: method,
          reference: reference || undefined,
          date: date || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccessMessage(
          `✅ Payment of R${amount.toLocaleString()} recorded successfully! Remaining: R${result.remainingBalance.toLocaleString()}`,
        );
        setShowSuccessModal(true);
        fetchRepayments();
        setShowDetailsModal(false);
        setSelectedRepayment(null);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to record payment");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      setErrorMessage("Failed to record payment");
      setShowErrorModal(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkAsCompleted = async (repayment: Repayment) => {
    // Check if there's any remaining balance
    if (repayment.remainingAmount > 0) {
      if (
        !confirm(
          `⚠️ WARNING: This ${repayment.serviceTypeLabel} still has a remaining balance of R${repayment.remainingAmount.toLocaleString()}.\n\n` +
            `Force completing will mark it as closed despite the outstanding balance.\n\n` +
            `Driver: ${repayment.driverName}\n` +
            `Vehicle: ${repayment.carRegistration}\n\n` +
            `Are you sure you want to force complete this repayment?`,
        )
      ) {
        return;
      }
    } else {
      if (
        !confirm(
          `Are you sure you want to mark this ${repayment.serviceTypeLabel} as COMPLETED?\n\n` +
            `Driver: ${repayment.driverName}\n` +
            `Vehicle: ${repayment.carRegistration}\n` +
            `Total Repaid: R${repayment.repaidAmount.toLocaleString()}\n\n` +
            `This action will close the repayment and mark it as fully completed.`,
        )
      ) {
        return;
      }
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/admin/repayments/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repaymentId: repayment.id,
          completedAt: new Date().toISOString(),
          forceComplete: repayment.remainingAmount > 0,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccessMessage(
          `✅ ${repayment.serviceTypeLabel} marked as COMPLETED successfully!\n\n` +
            `Driver: ${repayment.driverName}\n` +
            `Total Repaid: R${repayment.repaidAmount.toLocaleString()}` +
            (repayment.remainingAmount > 0
              ? `\n\nNote: Remaining balance of R${repayment.remainingAmount.toLocaleString()} was written off.`
              : ""),
        );
        setShowSuccessModal(true);
        await fetchRepayments();
        setShowDetailsModal(false);
        setSelectedRepayment(null);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to mark repayment as completed");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error marking repayment as completed:", error);
      setErrorMessage("Failed to mark repayment as completed");
      setShowErrorModal(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkComplete = async () => {
    if (selectedRepayments.length === 0) return;

    const selectedRepaymentObjects = repayments.filter((r) =>
      selectedRepayments.includes(r.id),
    );
    const hasOutstandingBalance = selectedRepaymentObjects.some(
      (r) => r.remainingAmount > 0,
    );

    let confirmMessage = `Are you sure you want to mark ${selectedRepayments.length} repayment(s) as COMPLETED?\n\n`;

    if (hasOutstandingBalance) {
      confirmMessage +=
        `⚠️ WARNING: Some selected repayments have outstanding balances.\n` +
        `These will be force completed and the remaining balances will be written off.\n\n`;
    }

    confirmMessage += `This action cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    setProcessing(true);
    try {
      const response = await fetch("/api/admin/repayments/bulk-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repaymentIds: selectedRepayments,
          completedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccessMessage(
          `✅ Successfully marked ${result.completedCount} repayment(s) as completed!` +
            (result.writeOffCount > 0
              ? `\n\n${result.writeOffCount} had outstanding balances that were written off.`
              : ""),
        );
        setShowSuccessModal(true);
        await fetchRepayments();
        setSelectedRepayments([]);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to complete repayments");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error in bulk complete:", error);
      setErrorMessage("Failed to complete repayments");
      setShowErrorModal(true);
    } finally {
      setProcessing(false);
    }
  };

  const toggleRepaymentSelection = (repaymentId: string) => {
    setSelectedRepayments((prev) =>
      prev.includes(repaymentId)
        ? prev.filter((id) => id !== repaymentId)
        : [...prev, repaymentId],
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredRepayments
      .filter((r) => r.status !== "paid" && r.status !== "completed")
      .map((r) => r.id);
    setSelectedRepayments(visibleIds);
  };

  const clearSelections = () => {
    setSelectedRepayments([]);
  };

  const handleMarkLoanAsFullyPaid = async (repayment: Repayment) => {
    if (
      !confirm(
        `Are you sure you want to mark this ${repayment.serviceTypeLabel} as fully paid?\n\nThis will close the repayment and mark it as completed.`,
      )
    )
      return;

    setProcessing(true);
    try {
      const response = await fetch("/api/admin/repayments/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repaymentId: repayment.id,
          completedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccessMessage(
          `✅ ${repayment.serviceTypeLabel} marked as fully paid and closed!`,
        );
        setShowSuccessModal(true);
        fetchRepayments();
        setShowDetailsModal(false);
        setSelectedRepayment(null);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to mark as paid");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error marking as paid:", error);
      setErrorMessage("Failed to mark as paid");
      setShowErrorModal(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveRepaymentProof = async (
    proof: RepaymentProof,
    requestId: string,
  ) => {
    setProcessing(true);
    try {
      const response = await fetch("/api/admin/repayment-proofs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proofId: proof.id,
          status: "approved",
        }),
      });

      if (response.ok) {
        setSuccessMessage(
          `✅ Repayment of R${proof.amount.toLocaleString()} approved!`,
        );
        setShowSuccessModal(true);
        fetchRepayments();
        setShowDetailsModal(false);
        setSelectedRepayment(null);
        setSelectedProof(null);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to approve repayment");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error approving repayment:", error);
      setErrorMessage("Failed to approve repayment");
      setShowErrorModal(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveAndPay = async (
    proof: RepaymentProof,
    repayment: Repayment,
    amount: number,
  ) => {
    if (amount <= 0 || amount > repayment.remainingAmount) {
      setErrorMessage(
        `Amount must be between 1 and ${repayment.remainingAmount}`,
      );
      setShowErrorModal(true);
      return;
    }

    setProcessing(true);
    try {
      const approveRes = await fetch("/api/admin/repayment-proofs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proofId: proof.id,
          status: "approved",
        }),
      });

      if (!approveRes.ok) {
        const err = await approveRes.json();
        setErrorMessage(err.error || "Failed to approve proof");
        setShowErrorModal(true);
        setProcessing(false);
        return;
      }

      const payRes = await fetch("/api/admin/repayments/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repaymentId: repayment.id,
          amount: amount,
          method: "cash",
          date: new Date().toISOString().split("T")[0],
        }),
      });

      if (payRes.ok) {
        const result = await payRes.json();
        setSuccessMessage(
          `✅ Approved & paid R${amount.toLocaleString()}! Remaining: R${result.remainingBalance.toLocaleString()}`,
        );
        setShowSuccessModal(true);
        fetchRepayments();
        setShowDetailsModal(false);
        setSelectedRepayment(null);
        setSelectedProof(null);
      } else {
        const error = await payRes.json();
        setErrorMessage(error.error || "Failed to record payment");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error in approve and pay:", error);
      setErrorMessage("Failed to approve and pay");
      setShowErrorModal(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectRepaymentProof = async () => {
    if (!selectedProof) return;

    if (!rejectionReason.trim()) {
      setErrorMessage("Please provide a reason for rejection");
      setShowErrorModal(true);
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/admin/repayment-proofs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proofId: selectedProof.id,
          status: "rejected",
          reason: rejectionReason,
        }),
      });

      if (response.ok) {
        setSuccessMessage(
          `❌ Repayment of R${selectedProof.amount.toLocaleString()} rejected.`,
        );
        setShowSuccessModal(true);
        fetchRepayments();
        setShowRejectModal(false);
        setShowDetailsModal(false);
        setSelectedRepayment(null);
        setSelectedProof(null);
        setRejectionReason("");
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to reject repayment");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error rejecting repayment:", error);
      setErrorMessage("Failed to reject repayment");
      setShowErrorModal(true);
    } finally {
      setProcessing(false);
    }
  };

  const getServiceTypeBadge = (type: string, serviceData?: any) => {
    switch (type) {
      case "fuel":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700">
            <Fuel className="w-3 h-3" /> Fuel
            {serviceData?.fuelType && (
              <span className="ml-1 text-[10px] opacity-75">
                ({serviceData.fuelType})
              </span>
            )}
          </span>
        );
      case "airtime":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">
            <Smartphone className="w-3 h-3" /> Airtime
          </span>
        );
      case "cash":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-yellow-100 text-yellow-700">
            <DollarSign className="w-3 h-3" /> Cash Loan
          </span>
        );
      case "carwash":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-700">
            <SprayCan className="w-3 h-3" /> Car Wash
            {serviceData?.packageInfo?.package && (
              <span className="ml-1 text-[10px] opacity-75">
                ({serviceData.packageInfo.package})
              </span>
            )}
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" /> Completed
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" /> Overdue
          </span>
        );
      default:
        return null;
    }
  };

  const getProofStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
            <Hourglass className="w-3 h-3" />
            Pending Review
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const filteredRepayments = repayments
    .filter((r) => {
      const hasPendingProofs = r.pendingRepaymentProofs?.some(
        (p) => p.status === "pending",
      );
      if (activeTab === "outstanding")
        return (
          r.status !== "paid" && r.status !== "completed" && !hasPendingProofs
        );
      if (activeTab === "paid")
        return r.status === "paid" || r.status === "completed";
      if (activeTab === "pendingProofs") return !!hasPendingProofs;
      return true;
    })
    .filter(
      (r) =>
        r.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.carRegistration.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.driverEmail.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  const stats = {
    totalOutstanding: repayments
      .filter((r) => r.status !== "paid" && r.status !== "completed")
      .reduce((sum, r) => sum + r.remainingAmount, 0),
    totalPaid: repayments
      .filter((r) => r.status === "paid" || r.status === "completed")
      .reduce((sum, r) => sum + r.repaidAmount, 0),
    totalLoans: repayments.length,
    activeLoans: repayments.filter(
      (r) => r.status !== "paid" && r.status !== "completed",
    ).length,
    overdueCount: repayments.filter((r) => r.status === "overdue").length,
    pendingProofs: repayments.reduce(
      (sum, r) =>
        sum +
        (r.pendingRepaymentProofs?.filter((p) => p.status === "pending")
          .length || 0),
      0,
    ),
  };

  // Success Modal Component
  const SuccessModal = () => {
    if (!showSuccessModal) return null;

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowSuccessModal(false)}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-t-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Success!</h2>
                <p className="text-white/80 text-sm">Operation completed</p>
              </div>
            </div>
          </div>

          <div className="p-5 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <p className="text-[#01312D] font-semibold mb-2 whitespace-pre-line">
              {successMessage}
            </p>
          </div>

          <div className="border-t border-gray-100 p-5">
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-[#01312D] text-white py-2 rounded-xl font-semibold hover:bg-[#3A7717] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Error Modal Component
  const ErrorModal = () => {
    if (!showErrorModal) return null;

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowErrorModal(false)}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Error!</h2>
                <p className="text-white/80 text-sm">Operation failed</p>
              </div>
            </div>
          </div>

          <div className="p-5 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <p className="text-[#01312D] font-semibold mb-2 whitespace-pre-line">
              {errorMessage}
            </p>
          </div>

          <div className="border-t border-gray-100 p-5">
            <button
              type="button"
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-red-500 text-white py-2 rounded-xl font-semibold hover:bg-red-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Rejection Modal
  const renderRejectionModal = () => {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowRejectModal(false)}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Reject Repayment
                </h2>
                <p className="text-white/80 text-sm">
                  Provide rejection reason
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please explain why this repayment is being rejected..."
                className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl focus:outline-none focus:border-red-500 resize-none"
                rows={4}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will be visible to the driver
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 p-5 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason("");
              }}
              className="flex-1 bg-gray-200 text-[#01312D] py-2 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRejectRepaymentProof}
              disabled={processing}
              className="flex-1 bg-red-500 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Confirm Rejection
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DetailsModal = ({
    repayment,
    onClose,
  }: {
    repayment: Repayment;
    onClose: () => void;
  }) => {
    const payments = repayment.payments || [];
    const hasActualAmount =
      repayment.actualAmount && repayment.actualAmount !== repayment.amount;
    const pendingProofs =
      repayment.pendingRepaymentProofs?.filter((p) => p.status === "pending") ||
      [];
    const isCompleted =
      repayment.status === "paid" || repayment.status === "completed";
    const progress = Math.round(
      (repayment.repaidAmount / repayment.totalRepayable) * 100,
    );
    const [payAmount, setPayAmount] = useState(repayment.dailyPayment.toString());
    const payMax = repayment.remainingAmount;
    const paySuggestions = [
      { label: "Daily", amount: repayment.dailyPayment },
      { label: "Weekly", amount: repayment.dailyPayment * 7 },
      { label: "Monthly", amount: repayment.dailyPayment * 30 },
      { label: "Full", amount: repayment.remainingAmount },
    ].filter((s) => s.amount > 0 && s.amount <= payMax);
    const balanceAfter = Math.max(0, payMax - (parseFloat(payAmount) || 0));

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        ></div>
        <div className="relative bg-white rounded-2xl sm:rounded-[2rem] max-w-2xl w-full max-h-[95vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-white border-b border-[#bff202]/20 p-4 sm:p-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#eafde7] rounded-xl sm:rounded-2xl flex items-center justify-center">
                {repayment.serviceType === "fuel" && (
                  <Fuel className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                )}
                {repayment.serviceType === "airtime" && (
                  <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                )}
                {repayment.serviceType === "cash" && (
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                )}
                {repayment.serviceType === "carwash" && (
                  <SprayCan className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                )}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[#01312D] leading-tight">
                  Repayment Details
                </h2>
                <p className="text-[10px] sm:text-sm text-gray-500">
                  Manage loan status and history
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
            </button>
          </div>

          <div className="p-4 sm:p-8 space-y-6">
            {/* Summary Banner */}
            <div className="bg-gradient-to-br from-[#01312D] to-[#3A7717] rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#bff202]/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-white/60 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                      Outstanding Balance
                    </p>
                    <p className="text-3xl sm:text-4xl font-black mt-1">
                      R{repayment.remainingAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                      Progress
                    </p>
                    <p className="text-2xl sm:text-3xl font-black mt-1">
                      {progress}%
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] sm:text-xs font-bold uppercase">
                    <span className="text-white/60">
                      Repaid: R{repayment.repaidAmount.toLocaleString()}
                    </span>
                    <span className="text-white/60">
                      Total: R{repayment.totalRepayable.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-black/20 rounded-full h-3 sm:h-4 overflow-hidden p-1">
                    <div
                      className="bg-[#bff202] h-full rounded-full transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Proofs Section - Inline Review */}
            {pendingProofs.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-bold text-[#01312D] flex items-center gap-2">
                  <Hourglass className="w-5 h-5 text-yellow-600" /> Pending Proof Review
                </h3>
                {pendingProofs.map((proof) => (
                  <div key={proof.id} className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 space-y-4">
                    {/* Amount Info */}
                    <div className="bg-white rounded-xl p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Repayment Amount:</span>
                        <span className="font-bold text-[#3A7717]">
                          R{proof.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Submitted:</span>
                        <span className="font-semibold">
                          {new Date(proof.submittedAt).toLocaleString()}
                        </span>
                      </div>
                      {proof.remainingBalance !== undefined && (
                        <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                          <span className="text-gray-600">Remaining Balance:</span>
                          <span className="font-semibold text-red-600">
                            R{proof.remainingBalance.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Proof of Payment Link */}
                    {proof.proofUrl && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#3A7717]" />
                        <a
                          href={proof.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-[#3A7717] hover:underline"
                        >
                          View Proof of Payment
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Driver Card */}
              <div className="bg-[#eafde7] rounded-2xl sm:rounded-3xl p-5 space-y-4 border border-[#bff202]/20 shadow-sm">
                <h3 className="font-bold text-[#01312D] flex items-center gap-2 border-b border-[#bff202]/20 pb-2 text-sm sm:text-base">
                  <User className="w-4 h-4 text-[#3A7717]" /> Driver Info
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Name</p>
                    <p className="text-sm font-bold text-[#01312D]">{repayment.driverName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Contact</p>
                    <p className="text-sm font-semibold text-[#01312D]">{repayment.driverPhone}</p>
                    <p className="text-xs text-gray-500">{repayment.driverEmail}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Vehicle</p>
                    <p className="text-sm font-bold text-[#01312D]">{repayment.carRegistration}</p>
                  </div>
                </div>
              </div>

              {/* Service Card */}
              <div className="bg-[#eafde7] rounded-2xl sm:rounded-3xl p-5 space-y-4 border border-[#bff202]/20 shadow-sm">
                <h3 className="font-bold text-[#01312D] flex items-center gap-2 border-b border-[#bff202]/20 pb-2 text-sm sm:text-base">
                  <FileText className="w-4 h-4 text-[#3A7717]" /> Service Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Service</p>
                    <p className="text-sm font-bold text-[#01312D]">{repayment.serviceTypeLabel}</p>
                  </div>
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Due Date</p>
                      <p className="text-sm font-bold text-red-600">
                        {new Date(repayment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Daily Pay</p>
                      <p className="text-sm font-bold text-[#01312D]">R{repayment.dailyPayment}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Status</p>
                    {getStatusBadge(repayment.status)}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment History Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#01312D] flex items-center gap-2">
                  <History className="w-5 h-5 text-[#3A7717]" /> Payment History
                </h3>
                <span className="bg-[#eafde7] text-[#3A7717] text-[10px] font-black px-2 py-0.5 rounded-full border border-[#bff202]/30">
                  {payments.length} RECORDS
                </span>
              </div>

              {payments.length > 0 ? (
                <div className="space-y-2">
                  {payments
                    .slice()
                    .reverse()
                    .map((payment, index) => (
                      <div
                        key={index}
                        className="flex flex-col p-3 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-[#bff202] transition-colors shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-green-600 font-bold text-xs">
                              <ArrowDown className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-[#01312D]">
                                R{payment.amount.toLocaleString()}
                              </p>
                              <p className="text-[10px] text-gray-400 font-bold">
                                {new Date(payment.date).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-[#3A7717] uppercase tracking-tighter">
                              {payment.method?.replace("_", " ")}
                            </p>
                            {payment.reference && (
                              <p className="text-[10px] text-gray-400 truncate max-w-[80px]">
                                {payment.reference}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Transaction-specific POP link */}
                        {payment.proofUrl && (
                          <div className="mt-2 pt-2 border-t border-dashed border-gray-200 flex justify-end">
                            <a
                              href={payment.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold text-[#3A7717] flex items-center gap-1.5 hover:bg-[#eafde7] px-2 py-1 rounded-lg transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              View Payment Proof
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                    <Receipt className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">
                    No payments recorded yet
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border-t border-[#bff202]/20 p-4 sm:p-6 flex flex-col gap-3">
            {!isCompleted ? (
              <>
                {/* Payment Input */}
                <div className="flex items-center gap-3 mb-1">
                  <div className="bg-[#01312D] text-white rounded-xl px-4 py-2 flex-1">
                    <p className="text-white/60 text-[10px] font-bold uppercase">Outstanding</p>
                    <p className="text-xl font-black">R{payMax.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">After</p>
                    <p className={`text-lg font-black ${balanceAfter === 0 ? "text-[#3A7717]" : "text-[#01312D]"}`}>
                      R{balanceAfter.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="relative mb-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[#01312D]">R</span>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 bg-[#eafde7] border-2 border-transparent rounded-xl focus:border-[#bff202] outline-none transition-all text-base font-black text-[#01312D]"
                    placeholder="0.00"
                    max={payMax}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {paySuggestions.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => setPayAmount(s.amount.toString())}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                        parseFloat(payAmount) === s.amount
                          ? "bg-[#bff202] border-[#bff202] text-[#01312D]"
                          : "bg-white border-gray-200 text-gray-500 hover:border-[#bff202]/30"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {pendingProofs.length > 0 ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() =>
                        handleApproveAndPay(pendingProofs[0], repayment, parseFloat(payAmount))
                      }
                      disabled={processing || !payAmount || parseFloat(payAmount) <= 0}
                      className="flex-1 bg-[#3A7717] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#2d5a12] transition-all disabled:opacity-50"
                    >
                      {processing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      Approve & Pay — R{parseFloat(payAmount || "0").toLocaleString()}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProof(pendingProofs[0]);
                        setShowRejectModal(true);
                      }}
                      disabled={processing}
                      className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-all"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleMarkAsCompleted(repayment)}
                      disabled={processing}
                      className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                        repayment.remainingAmount === 0
                          ? "bg-[#bff202] text-[#01312D] hover:bg-[#d4e84a]"
                          : "bg-orange-50 text-orange-600 hover:bg-orange-100"
                      }`}
                    >
                      {processing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      {repayment.remainingAmount === 0 ? "Settle" : "Settle & Write Off"}
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        handleMarkAsPaid(
                          repayment,
                          parseFloat(payAmount),
                          "cash",
                          undefined,
                          new Date().toISOString().split("T")[0],
                        )
                      }
                      disabled={processing || !payAmount || parseFloat(payAmount) <= 0}
                      className="w-full bg-[#3A7717] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#2d5a12] transition-all disabled:opacity-50"
                    >
                      {processing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      Confirm Payment — R{parseFloat(payAmount || "0").toLocaleString()}
                    </button>
                    <button
                      onClick={() => handleMarkAsCompleted(repayment)}
                      disabled={processing}
                      className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                        repayment.remainingAmount === 0
                          ? "bg-[#bff202] text-[#01312D] hover:bg-[#d4e84a]"
                          : "bg-orange-50 text-orange-600 hover:bg-orange-100"
                      }`}
                    >
                      {processing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      {repayment.remainingAmount === 0 ? "Mark as Complete" : "Settle & Write Off"}
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="bg-green-50 text-green-700 py-4 rounded-2xl font-black flex items-center justify-center gap-2 border border-green-200">
                <CheckCircle className="w-6 h-6" />
                REPAYMENT FULLY SETTLED
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-2 rounded-xl font-bold text-gray-400 hover:text-gray-600 transition-colors text-sm"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#01312D]">Repayments</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track and manage all service repayments
          </p>
        </div>
        <div className="flex gap-2">
          {filteredRepayments.some(
            (r) => r.status !== "paid" && r.status !== "completed",
          ) && (
            <button
              onClick={selectAllVisible}
              className="flex items-center gap-2 px-4 py-2 bg-[#eafde7] rounded-xl text-[#01312D] font-semibold hover:bg-[#bff202]/30 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              Select All
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#eafde7] rounded-xl text-[#01312D] font-semibold hover:bg-[#bff202]/30 transition-all"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Outstanding Amount</p>
              <div className="text-2xl font-bold text-[#01312D]">
                {loading || refreshing ? (
                  <Skeleton className="h-8 w-28 inline-block" />
                ) : (
                  <>R{stats.totalOutstanding.toLocaleString()}</>
                )}
              </div>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Repaid</p>
              <div className="text-2xl font-bold text-[#3A7717]">
                {loading || refreshing ? (
                  <Skeleton className="h-8 w-28 inline-block" />
                ) : (
                  <>R{stats.totalPaid.toLocaleString()}</>
                )}
              </div>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Active Repayments</p>
              <div className="text-2xl font-bold text-[#01312D]">
                {loading || refreshing ? (
                  <Skeleton className="h-8 w-28 inline-block" />
                ) : (
                  <>{stats.activeLoans}</>
                )}
              </div>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Overdue</p>
              <div className="text-2xl font-bold text-red-600">
                {loading || refreshing ? (
                  <Skeleton className="h-8 w-28 inline-block" />
                ) : (
                  <>{stats.overdueCount}</>
                )}
              </div>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Pending Proofs</p>
              <div className="text-2xl font-bold text-yellow-600">
                {loading || refreshing ? (
                  <Skeleton className="h-8 w-28 inline-block" />
                ) : (
                  <>{stats.pendingProofs}</>
                )}
              </div>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedRepayments.length > 0 && (
        <div className="bg-[#eafde7] rounded-xl p-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#3A7717]" />
            <span className="font-semibold text-[#01312D]">
              {selectedRepayments.length} repayment(s) selected
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearSelections}
              className="px-3 py-1.5 bg-gray-200 text-[#01312D] rounded-lg text-sm font-semibold hover:bg-gray-300"
            >
              Clear
            </button>
            <button
              onClick={handleBulkComplete}
              disabled={processing}
              className="px-3 py-1.5 bg-[#3A7717] text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-[#2d5a12]"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Mark Selected as Completed
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by driver name, email, or registration..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#bff202]/20">
        <button
          onClick={() => setActiveTab("outstanding")}
          className={`px-4 py-2 font-semibold transition-all ${
            activeTab === "outstanding"
              ? "text-[#3A7717] border-b-2 border-[#3A7717]"
              : "text-gray-500"
          }`}
        >
          UnPaid
          <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
            {
              repayments.filter(
                (r) =>
                  r.status !== "paid" &&
                  r.status !== "completed" &&
                  !r.pendingRepaymentProofs?.some((p) => p.status === "pending"),
              ).length
            }
          </span>
        </button>
        <button
          onClick={() => setActiveTab("pendingProofs")}
          className={`px-4 py-2 font-semibold transition-all ${
            activeTab === "pendingProofs"
              ? "text-[#3A7717] border-b-2 border-[#3A7717]"
              : "text-yellow-600"
          }`}
        >
          Review
          <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
            {stats.pendingProofs}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("paid")}
          className={`px-4 py-2 font-semibold transition-all ${
            activeTab === "paid"
              ? "text-[#3A7717] border-b-2 border-[#3A7717]"
              : "text-gray-500"
          }`}
        >
          Paid
          <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
            {
              repayments.filter(
                (r) => r.status === "paid" || r.status === "completed",
              ).length
            }
          </span>
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 font-semibold transition-all ${
            activeTab === "all"
              ? "text-[#3A7717] border-b-2 border-[#3A7717]"
              : "text-gray-500"
          }`}
        >
          All
        </button>
      </div>

      {/* Repayments List */}
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20"
            >
              <div className="flex items-start gap-3">
                <Skeleton className="w-4 h-4 mt-3 shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Skeleton className="h-7 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-10 flex-1 rounded-lg" />
                    <Skeleton className="h-10 flex-1 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : filteredRepayments.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#bff202]/20">
            <div className="w-20 h-20 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500">No {activeTab} repayments found</p>
          </div>
        ) : (
          filteredRepayments.map((repayment) => {
            const hasActualAmount =
              repayment.actualAmount &&
              repayment.actualAmount !== repayment.amount;
            const hasPendingProofs = repayment.pendingRepaymentProofs?.some(
              (p) => p.status === "pending",
            );
            const isCompleted =
              repayment.status === "paid" || repayment.status === "completed";

            return (
              <div
                key={repayment.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox for bulk actions - only show for non-completed repayments */}
                  {!isCompleted && (
                    <input
                      type="checkbox"
                      checked={selectedRepayments.includes(repayment.id)}
                      onChange={() => toggleRepaymentSelection(repayment.id)}
                      className="mt-3 w-4 h-4 text-[#3A7717] rounded border-gray-300 focus:ring-[#3A7717]"
                    />
                  )}

                  <div className="flex-1">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#eafde7] rounded-full flex items-center justify-center">
                          {repayment.serviceType === "fuel" && (
                            <Fuel className="w-6 h-6 text-green-600" />
                          )}
                          {repayment.serviceType === "airtime" && (
                            <Smartphone className="w-6 h-6 text-blue-600" />
                          )}
                          {repayment.serviceType === "cash" && (
                            <DollarSign className="w-6 h-6 text-yellow-600" />
                          )}
                          {repayment.serviceType === "carwash" && (
                            <SprayCan className="w-6 h-6 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {getServiceTypeBadge(
                              repayment.serviceType,
                              repayment,
                            )}
                            {getStatusBadge(repayment.status)}
                            {hasActualAmount && (
                              <span className="text-xs bg-[#BFF202]/20 text-[#01312D] px-2 py-0.5 rounded-full">
                                Amount Adjusted
                              </span>
                            )}
                            {hasPendingProofs && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Hourglass className="w-3 h-3" />
                                Pending Repayment Proof
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-[#01312D]">
                            {repayment.driverName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {repayment.carRegistration}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#3A7717]">
                          R{repayment.remainingAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Due:{" "}
                          {new Date(repayment.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500">Total Amount</p>
                        <p className="font-semibold text-[#01312D]">
                          R{repayment.totalRepayable.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Repaid</p>
                        <p className="font-semibold text-[#3A7717]">
                          R{repayment.repaidAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Daily Payment</p>
                        <p className="font-semibold text-[#01312D]">
                          R{repayment.dailyPayment.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Period</p>
                        <p className="font-semibold text-[#01312D]">
                          {repayment.repaymentDays} days
                        </p>
                      </div>
                    </div>

                    {/* Show actual amount if different */}
                    {hasActualAmount && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                        <span className="text-gray-400">
                          Requested: R{repayment.amount.toLocaleString()}
                        </span>
                        <span>→</span>
                        <span className="text-[#3A7717] font-medium">
                          Actual: R{repayment.actualAmount?.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">
                          Repayment Progress
                        </span>
                        <span className="font-semibold text-[#01312D]">
                          {Math.round(
                            (repayment.repaidAmount /
                              repayment.totalRepayable) *
                              100,
                          )}
                          %
                        </span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#3A7717] h-2 rounded-full transition-all"
                          style={{
                            width: `${(repayment.repaidAmount / repayment.totalRepayable) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => {
                          setSelectedRepayment(repayment);
                          setShowDetailsModal(true);
                        }}
                        className="flex-1 py-2 bg-[#3A7717] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#2d5a12] transition-colors"
                      >
                        <Banknote className="w-4 h-4" />
                        {!isCompleted ? "Record Payment" : "View Details"}
                      </button>
                      {!isCompleted && (
                        <button
                          onClick={() => {
                            setRepaymentUploadRepayment(repayment);
                            setRepaymentUploadAmount(repayment.dailyPayment.toString());
                            setRepaymentUploadMethod("cash");
                            setRepaymentUploadFile(null);
                            setRepaymentUploadProofUrl("");
                            setRepaymentUploadProofPublicId("");
                            setShowRepaymentUploadModal(true);
                          }}
                          className="flex-1 py-2 bg-[#01312D] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#3A7717] transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          Upload for Driver
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Submit Repayment for Driver Modal */}
      {showRepaymentUploadModal && repaymentUploadRepayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !repaymentUploadLoading && setShowRepaymentUploadModal(false)} />
          <div className="relative bg-white rounded-[2rem] max-w-lg w-full max-h-[95vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#01312D] to-[#3A7717] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Submit Repayment for Driver</h2>
                    <p className="text-white/80 text-sm">For elderly or disabled drivers</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRepaymentUploadModal(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800">Use this form to submit a repayment on behalf of a driver who is unable to do so themselves (e.g., elderly or disabled drivers). The repayment proof will be recorded as admin-verified.</p>
              </div>

              {/* Driver Info */}
              <div className="bg-[#eafde7] rounded-xl p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Driver:</span>
                    <span className="font-semibold text-[#01312D]">{repaymentUploadRepayment.driverName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vehicle:</span>
                    <span className="font-semibold text-[#01312D]">{repaymentUploadRepayment.carRegistration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Service:</span>
                    <span className="font-semibold text-[#01312D]">{repaymentUploadRepayment.serviceTypeLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Outstanding:</span>
                    <span className="font-bold text-red-600">R{repaymentUploadRepayment.remainingAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Repayment Amount */}
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Repayment Amount (R) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#72bf00]" />
                  <input
                    type="number"
                    value={repaymentUploadAmount}
                    onChange={(e) => setRepaymentUploadAmount(e.target.value)}
                    placeholder="Enter repayment amount"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] text-base"
                    max={repaymentUploadRepayment.remainingAmount}
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setRepaymentUploadAmount(repaymentUploadRepayment.dailyPayment.toString())}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      parseFloat(repaymentUploadAmount) === repaymentUploadRepayment.dailyPayment
                        ? "bg-[#bff202] border-[#bff202] text-[#01312D]"
                        : "bg-white border-gray-200 text-gray-500"
                    }`}
                  >
                    Daily (R{repaymentUploadRepayment.dailyPayment})
                  </button>
                  <button
                    onClick={() => setRepaymentUploadAmount((repaymentUploadRepayment.dailyPayment * 7).toString())}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      parseFloat(repaymentUploadAmount) === repaymentUploadRepayment.dailyPayment * 7
                        ? "bg-[#bff202] border-[#bff202] text-[#01312D]"
                        : "bg-white border-gray-200 text-gray-500"
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setRepaymentUploadAmount(repaymentUploadRepayment.remainingAmount.toString())}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      parseFloat(repaymentUploadAmount) === repaymentUploadRepayment.remainingAmount
                        ? "bg-[#bff202] border-[#bff202] text-[#01312D]"
                        : "bg-white border-gray-200 text-gray-500"
                    }`}
                  >
                    Full Balance
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">Payment Method</label>
                <select
                  value={repaymentUploadMethod}
                  onChange={(e) => setRepaymentUploadMethod(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] text-base"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="card">Card</option>
                </select>
              </div>

              {/* Proof Upload */}
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Proof of Repayment <span className="text-red-500">*</span>
                </label>

                <input
                  ref={repaymentFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleRepaymentFileSelect}
                  className="hidden"
                />

                {!repaymentUploadProofUrl ? (
                  <button
                    type="button"
                    onClick={() => repaymentFileInputRef.current?.click()}
                    disabled={repaymentUploadLoading}
                    className="w-full border-2 border-dashed border-[#bff202]/30 rounded-xl p-8 text-center hover:border-[#72bf00] transition-colors disabled:opacity-50"
                  >
                    {repaymentUploadLoading ? (
                      <>
                        <Loader2 className="w-12 h-12 text-[#72bf00] mx-auto mb-3 animate-spin" />
                        <p className="text-sm text-[#01312D] font-semibold">Compressing & uploading...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-[#72bf00] mx-auto mb-3" />
                        <p className="text-sm text-[#01312D] font-semibold">Click to upload proof of repayment</p>
                        <p className="text-xs text-gray-500 mt-1">JPG or PNG (automatically compressed)</p>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="relative bg-[#eafde7] rounded-xl p-4">
                    <img
                      src={repaymentUploadProofUrl}
                      alt="Proof Preview"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => {
                        setRepaymentUploadProofUrl("");
                        setRepaymentUploadProofPublicId("");
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 p-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => !repaymentUploadLoading && setShowRepaymentUploadModal(false)}
                  disabled={repaymentUploadLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitRepaymentForDriver}
                  disabled={repaymentUploadLoading || !repaymentUploadProofUrl || !repaymentUploadAmount}
                  className="flex-1 bg-gradient-to-r from-[#3A7717] to-[#72BF00] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {repaymentUploadLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Submit Repayment
                </button>
              <button
                onClick={handleSubmitRepaymentForDriver}
                disabled={repaymentUploadLoading || !repaymentUploadProofUrl || !repaymentUploadAmount}
                className="flex-1 bg-gradient-to-r from-[#3A7717] to-[#72BF00] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
              >
                {repaymentUploadLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Submit Repayment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showDetailsModal && selectedRepayment && (
        <DetailsModal
          repayment={selectedRepayment}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRepayment(null);
          }}
        />
      )}
      {showRejectModal && renderRejectionModal()}
      <SuccessModal />
      <ErrorModal />
    </div>
  );
}
