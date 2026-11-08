// src/app/admin/dashboard/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetch";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import { formatMoney, toMoney } from "@/lib/money";
import {
  Users,
  ClipboardList,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Search,
  Star,
  Car,
  Calendar,
  RefreshCw,
  Fuel,
  Smartphone,
  Copy,
  Send,
  X,
  User,
  FileText,
  MapPin,
  IndianRupee,
  Loader2,
  AlertCircle,
  MessageCircle,
  ImageIcon,
  Check,
  Wallet,
  TrendingDown,
  PiggyBank,
  Banknote,
  Shield,
  Receipt,
  CalendarDays,
  Settings,
  Flame,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

type RequestType = "fuel" | "airtime" | "cash" | "carwash";
type RequestStatus = "pending" | "approved" | "completed" | "rejected";

interface Collateral {
  category?: string;
  itemName?: string;
  brand?: string;
  model?: string;
  purchaseYear?: number;
  color?: string;
  condition?: string;
  serialNumber?: string;
  images?: string[];
}

interface ServiceRequest {
  id: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  carRegistration: string;
  carModel?: string;
  location: string;
  type: RequestType;
  amount: number;
  actualAmount?: number;
  fuelType?: "petrol" | "diesel";
  phoneNumber?: string;
  interest?: number;
  totalRepayable?: number;
  repaymentDays?: number;
  interestRate?: number;
  status: RequestStatus;
  otp?: string;
  requestDate: string;
  approvedDate?: string;
  completedDate?: string;
  popUrl?: string;
  dailyPayment?: number;
  collateral?: Collateral | null;
}

interface VerificationRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  carRegistration: string;
  carModel: string;
  carYear: string;
  carColor: string;
  drivingLicenseUrl?: string;
  carRegistrationUrl?: string;
  profilePhotoUrl?: string;
  verificationStatus: string;
  submittedAt: string;
}

const pendingActionTiles = [
  {
    key: "verifications",
    label: "Verifications",
    icon: FileText,
    color: "#ca8a04",
    href: "/admin/verifications",
  },
  {
    key: "requests",
    label: "Requests",
    icon: ClipboardList,
    color: "#2563eb",
    href: "/admin/service-requests",
  },
  {
    key: "repayments",
    label: "Repayments",
    icon: DollarSign,
    color: "#3A7717",
    href: "/admin/repayments",
  },
  {
    key: "receipts",
    label: "Receipts",
    icon: Receipt,
    color: "#7c3aed",
    href: "/admin/receipts",
  },
  {
    key: "deposits",
    label: "Deposits",
    icon: Wallet,
    color: "#0891b2",
    href: "/admin/deposit-proofs",
  },
] as const;

const managementLinks = [
  {
    label: "Fuel",
    sub: "Track fuel budget & usage",
    icon: Flame,
    color: "#3A7717",
    bg: "#f0fdf4",
    href: "/admin/fuel",
  },
  {
    label: "Drivers",
    sub: "Manage drivers & verifications",
    icon: Users,
    color: "#01312D",
    bg: "#eafde7",
    href: "/admin/verifications",
  },
  {
    label: "Managers",
    sub: "Promote or demote managers",
    icon: Users,
    color: "#0d9488",
    bg: "#f0fdfa",
    href: "/admin/managers",
  },
  {
    label: "Requests",
    sub: "View & manage service requests",
    icon: ClipboardList,
    color: "#3A7717",
    bg: "#f0fdf4",
    href: "/admin/service-requests",
  },
  {
    label: "Repayments",
    sub: "Track loan repayments",
    icon: DollarSign,
    color: "#7c3aed",
    bg: "#f5f3ff",
    href: "/admin/repayments",
  },
  {
    label: "Receipts",
    sub: "Verify payment receipts",
    icon: Receipt,
    color: "#ca8a04",
    bg: "#fef9c3",
    href: "/admin/receipts",
  },
  {
    label: "Deposit Proofs",
    sub: "Approve security deposit payments",
    icon: Wallet,
    color: "#0891b2",
    bg: "#ecfeff",
    href: "/admin/deposit-proofs",
  },
  {
    label: "Verifications",
    sub: "Review driver documents",
    icon: ShieldCheck,
    color: "#2563eb",
    bg: "#eff6ff",
    href: "/admin/verifications",
  },
  {
    label: "Invoices",
    sub: "Send & view weekly invoices",
    icon: FileText,
    color: "#0d9488",
    bg: "#f0fdfa",
    href: "/admin/invoices",
  },
  {
    label: "Driver View",
    sub: "See driver dashboards & loans",
    icon: Eye,
    color: "#7c3aed",
    bg: "#f5f3ff",
    href: "/admin/driver-view",
  },
  {
    label: "Payment Plans",
    sub: "Manage driver payment plans",
    icon: CalendarDays,
    color: "#0d9488",
    bg: "#f0fdfa",
    href: "/admin/payment-plans",
  },
  {
    label: "Settings",
    sub: "Configure app settings",
    icon: Settings,
    color: "#4b5563",
    bg: "#f3f4f6",
    href: "/admin/settings",
  },
] as const;

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "drivers">(
    "overview",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [approvingRequest, setApprovingRequest] = useState<any>(null);
  const [approvedRequest, setApprovedRequest] = useState<any>(null);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState<any>(null);
  const [rejectingVerification, setRejectingVerification] = useState<any>(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectType, setRejectType] = useState<"request" | "verification">(
    "request",
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingDriver, setDeletingDriver] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isAnyModalOpen = showSuccessModal || showErrorModal || showRejectModal || showDeleteConfirm;
  useBodyScrollLock(isAnyModalOpen);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const defaultStats = {
    totalDrivers: 0,
    pendingVerifications: 0,
    verifiedDrivers: 0,
    rejectedVerifications: 0,
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalRevenue: 0,
    revenueGrowth: 0,
    averageRating: 0,
    activeLoans: 0,
    totalLoanAmount: 0,
  };

  const defaultFinancialStats = {
    moneyRequested: 0,
    actualInterest: 0,
    potentialInterest: 0,
    totalRepaid: 0,
    principalRepaid: 0,
  };

  // Optimistically decrement a notification count field, then revalidate from server
  const optimisticDecrement = (field: string) => {
    mutate(
      "/api/admin/notifications/count",
      (current: any) => current ? { ...current, [field]: Math.max(0, current[field] - 1) } : current,
      false,
    );
    mutate("/api/admin/notifications/count");
  };

  const refreshNotificationCounts = () => {
    mutate("/api/admin/notifications/count");
  };

  // SWR with shared cache deduplication
  const { data: statsData, isLoading: statsLoading, isValidating: statsValidating, mutate: mutateStats, error: statsError } = useSWR(
    "/api/admin/stats",
    fetcher,
    { refreshInterval: 60_000, dedupingInterval: 60_000 },
  );
  const { data: driversData, isLoading: driversLoading, mutate: mutateDrivers, error: driversError } = useSWR(
    "/api/admin/drivers",
    fetcher,
    { refreshInterval: 120_000, dedupingInterval: 120_000 },
  );
  const requestsUrl = appliedFrom || appliedTo
    ? `/api/admin/requests?from=${appliedFrom}&to=${appliedTo}`
    : "/api/admin/requests";

  const { data: requestsData, isLoading: requestsLoading, isValidating: requestsValidating, mutate: mutateRequests, error: requestsError } = useSWR(
    requestsUrl,
    fetcher,
    { refreshInterval: 120_000, dedupingInterval: 60_000 },
  );
  const { data: notifCounts } = useSWR(
    "/api/admin/notifications/count",
    fetcher,
    { refreshInterval: 60_000, dedupingInterval: 60_000 },
  );

  const loading = statsLoading || driversLoading || requestsLoading;
  const refreshing = (statsValidating || requestsValidating) && !loading;

  const stats = useMemo(() => statsData || defaultStats, [statsData]);

  const drivers = useMemo(() => driversData?.drivers || [], [driversData]);
  const recentVerifications = useMemo(() => driversData?.recent || [], [driversData]);

  const recentRequests = useMemo(() => requestsData?.recent || [], [requestsData]);

  const financialStats = useMemo(() => {
    if (!statsData) return defaultFinancialStats;

    return {
      moneyRequested: statsData.moneyRequested || 0,
      actualInterest: 0,
      potentialInterest: 0,
      totalRepaid: statsData.totalRepaid || 0,
      principalRepaid: toMoney(statsData.totalRepaid || 0),
    };
  }, [statsData]);

  const handleApplyDateRange = () => {
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
  };

  const revalidateAll = () => {
    return Promise.all([mutateStats(), mutateDrivers(), mutateRequests()]);
  };

  const handleRefresh = async () => {
    await revalidateAll();
    refreshNotificationCounts();
  };

  const openApproveModal = (request: any) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setApprovingRequest(request);
    setShowApproveModal(true);
  };

  const openRejectModal = (item: any, type: "request" | "verification") => {
    if (type === "request") {
      setRejectingRequest(item);
      setRejectingVerification(null);
    } else {
      setRejectingVerification(item);
      setRejectingRequest(null);
    }
    setRejectType(type);
    setShowRejectModal(true);

    // Close the details modal if open
    if (type === "request") {
      setShowRequestModal(false);
    } else {
      setShowVerificationModal(false);
    }
  };

  const handleConfirmApprove = async () => {
    if (!approvingRequest) return;

    setApprovalLoading(true);
    try {
      const response = await fetch("/api/admin/requests/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: approvingRequest.id,
          otp: generatedOtp,
        }),
      });

      if (response.ok) {
        optimisticDecrement("requests");
        window.dispatchEvent(new Event("refreshAdminCounts"));
        const updatedRequest = {
          ...approvingRequest,
          otp: generatedOtp,
          status: "approved" as RequestStatus,
        };
        setApprovedRequest(updatedRequest);
        setShowApproveModal(false);
        setShowWhatsAppModal(true);
        await revalidateAll();
        setShowRequestModal(false);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to approve request");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error approving request:", error);
      setErrorMessage("Failed to approve request");
      setShowErrorModal(true);
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!rejectingRequest) return;

    if (!rejectionReason.trim()) {
      setErrorMessage("Please enter a reason for rejection");
      setShowErrorModal(true);
      return;
    }

    setRejectLoading(true);
    try {
      const response = await fetch("/api/admin/requests/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: rejectingRequest.id,
          reason: rejectionReason,
        }),
      });

      if (response.ok) {
        optimisticDecrement("requests");
        window.dispatchEvent(new Event("refreshAdminCounts"));
        setSuccessMessage(
          `✅ Request ${rejectingRequest.id.slice(-6).toUpperCase()} rejected successfully`,
        );
        setShowSuccessModal(true);
        revalidateAll();
        setShowRejectModal(false);
        setShowRequestModal(false);
        setRejectionReason("");
        setRejectingRequest(null);
        setRejectType("request");
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to reject request");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      setErrorMessage("Failed to reject request");
      setShowErrorModal(true);
    } finally {
      setRejectLoading(false);
    }
  };

  const handleRejectVerification = async () => {
    if (!rejectingVerification) return;

    if (!rejectionReason.trim()) {
      setErrorMessage("Please enter a reason for rejection");
      setShowErrorModal(true);
      return;
    }

    setRejectLoading(true);
    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId: rejectingVerification.id,
          action: "reject",
          reason: rejectionReason,
        }),
      });

      if (response.ok) {
        optimisticDecrement("verifications");
        window.dispatchEvent(new Event("refreshAdminCounts"));
        setSuccessMessage(
          `❌ Rejected ${rejectingVerification.name}'s verification`,
        );
        setShowSuccessModal(true);
        revalidateAll();
        setShowVerificationModal(false);
        setShowRejectModal(false);
        setRejectionReason("");
        setRejectingVerification(null);
        setRejectType("request");
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to reject verification");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error rejecting verification:", error);
      setErrorMessage("Failed to reject verification");
      setShowErrorModal(true);
    } finally {
      setRejectLoading(false);
    }
  };

  const handleDeleteDriver = async () => {
    if (!deletingDriver) return;

    setDeleteLoading(true);
    try {
      const response = await fetch("/api/admin/drivers/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deletingDriver.userId }),
      });

      if (response.ok) {
        setSuccessMessage(`Deleted ${deletingDriver.name}'s account`);
        setShowSuccessModal(true);
        setShowDeleteConfirm(false);
        setDeletingDriver(null);
        setShowDriverModal(false);
        revalidateAll();
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to delete user");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setErrorMessage("Failed to delete user");
      setShowErrorModal(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleConfirmRejection = () => {
    if (rejectType === "request") {
      handleRejectRequest();
    } else {
      handleRejectVerification();
    }
  };

  const handleCompleteRequest = async (request: any) => {
    try {
      const response = await fetch("/api/admin/requests/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
        }),
      });
      if (response.ok) {
        refreshNotificationCounts();
        setSuccessMessage(
          `✅ Request ${request.id.slice(-6).toUpperCase()} marked as completed`,
        );
        setShowSuccessModal(true);
        revalidateAll();
        setShowRequestModal(false);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to complete request");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error completing request:", error);
      setErrorMessage("Failed to complete request");
      setShowErrorModal(true);
    }
  };

  const handleApproveVerification = async (verification: any) => {
    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId: verification.id,
          action: "approve",
        }),
      });

      if (response.ok) {
        optimisticDecrement("verifications");
        window.dispatchEvent(new Event("refreshAdminCounts"));
        setSuccessMessage(`✅ Approved ${verification.name}'s verification`);
        setShowSuccessModal(true);
        revalidateAll();
        setShowVerificationModal(false);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to approve verification");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error approving verification:", error);
      setErrorMessage("Failed to approve verification");
      setShowErrorModal(true);
    }
  };

  const handleCopyOtp = (otp: string) => {
    navigator.clipboard.writeText(otp);
    setCopiedOtp(otp);
    setTimeout(() => setCopiedOtp(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || "pending";

    switch (normalizedStatus) {
      case "approved":
      case "verified":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case "not_submitted":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">
            <AlertCircle className="w-3 h-3" /> Not Submitted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">
            {normalizedStatus || "Unknown"}
          </span>
        );
    }
  };

  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" /> Completed
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "fuel":
        return "Fuel";
      case "airtime":
        return "Airtime";
      case "cash":
        return "Cash Loan";
      case "carwash":
        return "Car Wash";
      default:
        return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "fuel":
        return Fuel;
      case "airtime":
        return Smartphone;
      case "cash":
        return DollarSign;
      default:
        return Car;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "fuel":
        return "bg-green-100 text-green-700";
      case "airtime":
        return "bg-blue-100 text-blue-700";
      case "cash":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-purple-100 text-purple-700";
    }
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
            <p className="text-[#01312D] font-semibold mb-2">
              {successMessage}
            </p>
          </div>

          <div className="border-t border-gray-100 p-5">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full px-4 bg-[#01312D] text-white py-2 rounded-xl font-semibold hover:bg-[#3A7717] transition-colors"
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
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Error!</h2>
                <p className="text-white/80 text-sm">Operation failed</p>
              </div>
            </div>
          </div>

          <div className="p-5 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <p className="text-[#01312D] font-semibold mb-2">{errorMessage}</p>
          </div>

          <div className="border-t border-gray-100 p-5">
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full px-4 bg-red-500 text-white py-2 rounded-xl font-semibold hover:bg-red-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Delete Confirmation Modal
  const DeleteConfirmModal = () => {
    if (!showDeleteConfirm || !deletingDriver) return null;

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => {
            setShowDeleteConfirm(false);
            setDeletingDriver(null);
          }}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Delete Driver</h2>
                <p className="text-white/80 text-sm">This action cannot be undone</p>
              </div>
            </div>
          </div>

          <div className="p-5 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <p className="text-[#01312D] font-semibold mb-2">
              Are you sure you want to delete {deletingDriver.name}?
            </p>
            <p className="text-sm text-gray-500">
              This will permanently remove their account, profile, and all associated data.
            </p>
          </div>

          <div className="border-t border-gray-100 p-5 flex gap-3">
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeletingDriver(null);
              }}
              className="flex-1 px-4 bg-gray-200 text-[#01312D] py-2 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteDriver}
              disabled={deleteLoading}
              className="flex-1 px-4 bg-red-500 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              {deleteLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Rejection Modal
  const renderRejectionModal = () => {
    const itemName =
      rejectType === "request"
        ? rejectingRequest?.driverName || "this request"
        : rejectingVerification?.name || "this verification";

    const itemType = rejectType === "request" ? "Request" : "Verification";

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => {
            setShowRejectModal(false);
            setRejectionReason("");
          }}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Reject {itemType}
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
                placeholder={`Why is ${itemName} being rejected?`}
                className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl focus:outline-none focus:border-red-500 resize-none"
                rows={4}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will be visible to the{" "}
                {rejectType === "request" ? "driver" : "user"}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 p-5 flex gap-3">
            <button
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason("");
              }}
              className="flex-1 px-4 bg-gray-200 text-[#01312D] py-2 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRejection}
              disabled={rejectLoading}
              className="flex-1 px-4 bg-red-500 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              {rejectLoading ? (
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

  // Request Details Modal
  const RequestDetailsModal = ({
    request,
    onClose,
  }: {
    request: any;
    onClose: () => void;
  }) => {
    const TypeIcon = getTypeIcon(request.type);
    const date = new Date(request.requestDate);
    const hasActualAmount =
      request.actualAmount && request.actualAmount !== request.amount;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeColor(request.type)}`}
              >
                <TypeIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#01312D]">
                  {getTypeLabel(request.type)} Request
                </h2>
                <p className="text-xs text-gray-500">
                  ID: {request.id?.slice(-6).toUpperCase()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-50 rounded-lg"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Driver Info */}
            <div className="rounded-xl p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 border-l-2 border-[#01312D] pl-3">
                Driver Information
              </h3>
              <div className="grid gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="font-semibold text-[#01312D]">
                    {request.driverName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-semibold text-[#01312D]">
                    {request.driverEmail || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-semibold text-[#01312D]">
                    {request.driverPhone || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Car Registration</p>
                  <p className="font-semibold text-[#01312D]">
                    {request.carNumber || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="rounded-xl p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 border-l-2 border-[#01312D] pl-3">
                Request Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Service Type:</span>
                  <span className="font-semibold text-[#01312D]">
                    {getTypeLabel(request.type)}
                  </span>
                </div>
                {request.fuelType && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fuel Type:</span>
                    <span className="font-semibold capitalize text-[#01312D]">
                      {request.fuelType}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-500">Requested Amount:</span>
                  <span className="font-semibold text-[#01312D]">
                    {formatMoney(request.amount ?? 0)}
                  </span>
                </div>
                {hasActualAmount && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Actual Amount Paid:</span>
                    <span className="font-semibold text-[#3A7717]">
                      {formatMoney(request.actualAmount ?? 0)}
                    </span>
                  </div>
                )}
                {request.totalRepayable && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Repayable:</span>
                    <span className="font-semibold text-[#3A7717]">
                      {formatMoney(request.totalRepayable ?? 0)}
                    </span>
                  </div>
                )}
                {request.dailyPayment && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Daily Payment:</span>
                    <span className="font-semibold text-[#01312D]">
                      {formatMoney(request.dailyPayment ?? 0)}/day
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Request Date:</span>
                  <span className="font-semibold text-[#01312D]">
                    {date.toLocaleString()}
                  </span>
                </div>
                {request.approvedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Approved Date:</span>
                    <span className="font-semibold text-[#01312D]">
                      {new Date(request.approvedDate).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  {getRequestStatusBadge(request.status)}
                </div>
                {request.otp && (
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-500">OTP:</span>
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-bold text-[#01312D]">
                        {request.otp}
                      </code>
                      <button
                        onClick={() => handleCopyOtp(request.otp)}
                        className="p-1 hover:bg-gray-50 rounded"
                      >
                        {copiedOtp === request.otp ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                {request.popUrl && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-gray-500 mb-2">Proof of Payment:</p>
                    <a
                      href={request.popUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[#3A7717] font-semibold hover:underline"
                    >
                      <ImageIcon className="w-4 h-4" />
                      View POP
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Collateral Section (cash loans only) */}
            {request.type === "cash" && (
              <div className="rounded-xl p-4">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 border-l-2 border-[#01312D] pl-3">
                  Collateral Details
                </h3>
                {!request.collateral ? (
                  <p className="text-sm text-gray-500 italic">No collateral data provided with this request.</p>
                ) : (
                  <>
                    {request.collateral.images && request.collateral.images.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-2">Photos ({request.collateral.images.length})</p>
                        <div className="flex gap-2 flex-wrap">
                          {request.collateral.images.map((url: string, idx: number) => (
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                              className="block w-20 h-20 rounded-lg overflow-hidden border border-[#BFF202]/20 bg-white">
                              <img src={url} alt={`Collateral ${idx + 1}`} className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = "none"; }} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-2 text-sm">
                      {request.collateral.itemName && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Item:</span>
                          <span className="font-semibold text-[#01312D]">{request.collateral.itemName}</span>
                        </div>
                      )}
                      {request.collateral.category && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Category:</span>
                          <span className="font-semibold text-[#01312D]">{request.collateral.category}</span>
                        </div>
                      )}
                      {request.collateral.condition && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Condition:</span>
                          <span className="font-semibold capitalize text-[#01312D]">{request.collateral.condition.replace(/_/g, ' ')}</span>
                        </div>
                      )}
                      {request.collateral.brand && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Brand:</span>
                          <span className="font-semibold text-[#01312D]">{request.collateral.brand}</span>
                        </div>
                      )}
                      {request.collateral.model && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Model:</span>
                          <span className="font-semibold text-[#01312D]">{request.collateral.model}</span>
                        </div>
                      )}
                      {request.collateral.purchaseYear && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Year:</span>
                          <span className="font-semibold text-[#01312D]">{request.collateral.purchaseYear}</span>
                        </div>
                      )}
                      {request.collateral.color && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Color:</span>
                          <span className="font-semibold text-[#01312D]">{request.collateral.color}</span>
                        </div>
                      )}
                      {request.collateral.serialNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Serial / IMEI:</span>
                          <span className="font-semibold text-[#01312D]">{request.collateral.serialNumber}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {/* <div className="sticky bottom-0 bg-white border-t border-gray-200 p-5 flex gap-3">
            {request.status === "pending" && (
              <>
                <button
                  onClick={() => openApproveModal(request)}
                  className="flex-1 px-3 bg-[#3A7717] text-white py-2 rounded-xl font-semibold flex  items-center justify-center gap-2 hover:bg-[#2d5a12] transition-colors text-xs"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button
                  onClick={() => openRejectModal(request, "request")}
                  className="flex-1 px-4 bg-red-500 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors text-xs"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </>
            )}
            {request.status === "approved" && (
              <>
                <button
                  onClick={() => {
                    setApprovedRequest(request);
                    setShowWhatsAppModal(true);
                    setShowRequestModal(false);
                  }}
                  className="flex-1 px-3 bg-[#25D366] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 text-xs"
                >
                  <Send className="w-4 h-4" /> Send WhatsApp
                </button>
                <button
                  onClick={() => handleCompleteRequest(request)}
                  className="flex-1 px-3 bg-[#01312D] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 text-xs"
                >
                  <CheckCircle className="w-4 h-4" /> Mark Completed
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className={`${request.status === "pending" || request.status === "approved" ? "flex-1" : "w-full"} px-3 bg-gray-500 text-white py-2 rounded-xl font-semibold text-xs`}
            >
              Close
            </button>
          </div> */}
        </div>
      </div>
    );
  };

  // Verification Details Modal
  const VerificationDetailsModal = ({
    verification,
    onClose,
  }: {
    verification: any;
    onClose: () => void;
  }) => {
    const mappedVerification = {
      name:
        verification.fullName ||
        verification.name ||
        verification.driverName ||
        "Not provided",
      email: verification.email || "Not provided",
      phone: verification.phone || "Not provided",
      carRegistration:
        verification.carRegistration ||
        verification.carRegistrationNumber ||
        "Not provided",
      carModel: verification.carModel || "Not provided",
      carYear: verification.carYear || "Not provided",
      carColor: verification.carColor || "Not provided",
      verificationStatus:
        verification.verificationStatus || verification.status || "pending",
      submittedAt:
        verification.submittedAt || verification.date || verification.createdAt,
      address: verification.address || "Not provided",
      city: verification.city || "Not provided",
      pincode: verification.pincode || "Not provided",
      dateOfBirth: verification.dateOfBirth || "Not provided",
      ownershipStatus: verification.ownershipStatus || "own",
      referenceName: verification.referenceName || "Not provided",
      referencePhone: verification.referencePhone || "Not provided",
      carOwnerName: verification.carOwnerName || "Not provided",
      carOwnerPhone: verification.carOwnerPhone || "Not provided",
      carOwnerAddress: verification.carOwnerAddress || "Not provided",
      agreeAccuracy: verification.agreeAccuracy || false,
      agreeRefTenure: verification.agreeRefTenure || false,
      agreeOwnerContact: verification.agreeOwnerContact || false,
      agreeRepayment: verification.agreeRepayment || false,
      agreeEscalation: verification.agreeEscalation || false,
      drivingLicenseUrl: verification.drivingLicenseUrl,
      carRegistrationUrl: verification.carRegistrationUrl,
      profilePhotoUrl: verification.profilePhotoUrl,
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#3A7717]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#01312D]">
                  Driver Verification
                </h2>
                <p className="text-xs text-gray-500">
                  {mappedVerification.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-50 rounded-lg"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Driver Info */}
            <div className="rounded-xl p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 border-l-2 border-[#01312D] pl-3">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Full Name</p>
                  <p className="font-semibold text-[#01312D]">
                    {mappedVerification.name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-semibold text-[#01312D]">
                    {mappedVerification.email}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Phone Number</p>
                  <p className="font-semibold text-[#01312D]">
                    {mappedVerification.phone}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Date of Birth</p>
                  <p className="font-semibold text-[#01312D]">
                    {mappedVerification.dateOfBirth !== "Not provided"
                      ? new Date(
                          mappedVerification.dateOfBirth,
                        ).toLocaleDateString()
                      : "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Submitted</p>
                  <p className="font-semibold text-[#01312D]">
                    {mappedVerification.submittedAt
                      ? new Date(
                          mappedVerification.submittedAt,
                        ).toLocaleString()
                      : "Unknown date"}
                  </p>
                </div>
              </div>
            </div>

            {/* Location Info */}
            {(mappedVerification.address !== "Not provided" ||
              mappedVerification.city !== "Not provided" ||
              mappedVerification.pincode !== "Not provided") && (
              <div className="rounded-xl p-4">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 border-l-2 border-[#01312D] pl-3">
                  Location Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Address</p>
                    <p className="font-semibold text-[#01312D]">
                      {mappedVerification.address}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">City</p>
                    <p className="font-semibold text-[#01312D]">
                      {mappedVerification.city}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Postal Code</p>
                    <p className="font-semibold text-[#01312D]">
                      {mappedVerification.pincode}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle Info */}
            <div className="rounded-xl p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 border-l-2 border-[#01312D] pl-3">
                Vehicle Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Registration Number</p>
                  <p className="font-semibold text-[#01312D] uppercase">
                    {mappedVerification.carRegistration}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Car Model</p>
                  <p className="font-semibold text-[#01312D] capitalize">
                    {mappedVerification.carModel}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Year</p>
                  <p className="font-semibold text-[#01312D]">
                    {mappedVerification.carYear}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Color</p>
                  <div className="flex items-center gap-2">
                    {mappedVerification.carColor !== "Not provided" && (
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{
                          backgroundColor:
                            mappedVerification.carColor.toLowerCase(),
                        }}
                      />
                    )}
                    <p className="font-semibold text-[#01312D] capitalize">
                      {mappedVerification.carColor}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Ownership Status</p>
                  <p className="font-semibold text-[#01312D] capitalize">
                    {mappedVerification.ownershipStatus === "rent" ? "Renting" : "Owner"}
                  </p>
                </div>
              </div>
            </div>

            {/* Reference & Owner Info */}
            <div className="rounded-xl p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 border-l-2 border-[#01312D] pl-3">
                Reference & Owner Info
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p className="font-bold text-[#3A7717] border-b border-[#3A7717]/10 pb-1">Kapuka Member Reference</p>
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="font-semibold text-[#01312D]">{mappedVerification.referenceName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-semibold text-[#01312D]">{mappedVerification.referencePhone}</p>
                  </div>
                </div>
                {mappedVerification.ownershipStatus === "rent" && (
                  <div className="space-y-2">
                    <p className="font-bold text-[#3A7717] border-b border-[#3A7717]/10 pb-1">Car Owner Details</p>
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-semibold text-[#01312D]">{mappedVerification.carOwnerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="font-semibold text-[#01312D]">{mappedVerification.carOwnerPhone}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Address</p>
                      <p className="font-semibold text-[#01312D] text-xs">{mappedVerification.carOwnerAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Policy Agreements */}
            <div className="rounded-xl p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 border-l-2 border-[#01312D] pl-3">
                Policy Agreements
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: "Information Accuracy", checked: mappedVerification.agreeAccuracy },
                  { label: "Ref Tenure (1+ month)", checked: mappedVerification.agreeRefTenure },
                  { label: "Owner Consent", checked: mappedVerification.agreeOwnerContact, hide: mappedVerification.ownershipStatus !== "rent" },
                  { label: "Repayment Schedule", checked: mappedVerification.agreeRepayment },
                  { label: "Escalation Policy", checked: mappedVerification.agreeEscalation },
                ].map((item, i) => !item.hide && (
                  <div key={i} className="flex items-center gap-2 bg-white/50 p-2 rounded-lg border border-[#3A7717]/5">
                    {item.checked ? (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    <span className="text-xs font-medium text-[#01312D]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents Section */}
            <div className="rounded-xl p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 border-l-2 border-[#01312D] pl-3">
                Uploaded Documents
              </h3>

              {mappedVerification.drivingLicenseUrl ||
              mappedVerification.carRegistrationUrl ||
              mappedVerification.profilePhotoUrl ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {mappedVerification.drivingLicenseUrl && (
                    <div className="bg-white rounded-lg p-3 text-center">
                      <FileText className="w-8 h-8 text-[#3A7717] mx-auto mb-2" />
                      <p className="text-xs text-gray-500 mb-1">
                        Driver's License
                      </p>
                      <a
                        href={mappedVerification.drivingLicenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3A7717] text-xs hover:underline inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View Document
                      </a>
                    </div>
                  )}
                  {mappedVerification.carRegistrationUrl && (
                    <div className="bg-white rounded-lg p-3 text-center">
                      <FileText className="w-8 h-8 text-[#3A7717] mx-auto mb-2" />
                      <p className="text-xs text-gray-500 mb-1">
                        Car Registration
                      </p>
                      <a
                        href={mappedVerification.carRegistrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3A7717] text-xs hover:underline inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View Document
                      </a>
                    </div>
                  )}
                  {mappedVerification.profilePhotoUrl && (
                    <div className="bg-white rounded-lg p-3 text-center">
                      <img
                        src={mappedVerification.profilePhotoUrl}
                        alt="Profile"
                        className="w-16 h-16 rounded-full mx-auto mb-2 object-cover"
                      />
                      <p className="text-xs text-gray-500 mb-1">
                        Profile Photo
                      </p>
                      <a
                        href={mappedVerification.profilePhotoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3A7717] text-xs hover:underline inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View Full Size
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No documents uploaded yet
                </p>
              )}
            </div>

            {/* Verification Status */}
            <div className="rounded-xl p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 border-l-2 border-[#01312D] pl-3">
                Verification Status
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Current Status:</span>
                {getStatusBadge(mappedVerification.verificationStatus)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-5 flex gap-3">
            {mappedVerification.verificationStatus === "pending" && (
              <>
                <button
                  onClick={() => handleApproveVerification(verification)}
                  className="flex-1 px-4 bg-[#3A7717] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#2d5a12] transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Approve Verification
                </button>
                <button
                  onClick={() => openRejectModal(verification, "verification")}
                  className="flex-1 px-4 bg-red-500 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className={`${mappedVerification.verificationStatus === "pending" ? "flex-1" : "w-full"} bg-gray-500 text-white py-2 rounded-xl font-semibold`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Driver Details Modal
  const DriverDetailsModal = ({
    driver,
    onClose,
  }: {
    driver: any;
    onClose: () => void;
  }) => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-[#3A7717]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#01312D]">
                  Driver Details
                </h2>
                <p className="text-xs text-gray-500">{driver.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-50 rounded-lg"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Personal Info */}
            <div className="rounded-xl p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 border-l-2 border-[#01312D] pl-3">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Full Name</p>
                  <p className="font-semibold text-[#01312D]">
                    {driver.name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-semibold text-[#01312D]">
                    {driver.email || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Phone Number</p>
                  <p className="font-semibold text-[#01312D]">
                    {driver.phone || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Date of Birth</p>
                  <p className="font-semibold text-[#01312D]">
                    {driver.dateOfBirth !== "Not provided"
                      ? new Date(driver.dateOfBirth).toLocaleDateString()
                      : "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Member Since</p>
                  <p className="font-semibold text-[#01312D]">
                    {driver.joinedDate
                      ? new Date(driver.joinedDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Location Info */}
            {(driver.address !== "Not provided" ||
              driver.city !== "Not provided" ||
              driver.pincode !== "Not provided") && (
              <div className="rounded-xl p-4">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 border-l-2 border-[#01312D] pl-3">
                  Location Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Address</p>
                    <p className="font-semibold text-[#01312D]">
                      {driver.address}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">City</p>
                    <p className="font-semibold text-[#01312D]">
                      {driver.city}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Postal Code</p>
                    <p className="font-semibold text-[#01312D]">
                      {driver.pincode}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle Info */}
            <div className="rounded-xl p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 border-l-2 border-[#01312D] pl-3">
                Vehicle Information
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Registration Number</p>
                  <p className="font-semibold text-[#01312D] uppercase">
                    {driver.carRegistration || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Car Model</p>
                  <p className="font-semibold text-[#01312D]">
                    {driver.carModel || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Year</p>
                  <p className="font-semibold text-[#01312D]">
                    {driver.carYear || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Color</p>
                  <p className="font-semibold text-[#01312D]">
                    {driver.carColor || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Ownership Status</p>
                  <p className="font-semibold text-[#01312D] capitalize">
                    {driver.ownershipStatus === "rent" ? "Renting" : "Owner"}
                  </p>
                </div>
              </div>
            </div>

            {/* Reference & Owner Info */}
            <div className="rounded-xl p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 border-l-2 border-[#01312D] pl-3">
                Reference & Owner Info
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p className="font-bold text-[#3A7717] border-b border-[#3A7717]/10 pb-1">Kapuka Member Reference</p>
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="font-semibold text-[#01312D]">{driver.referenceName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-semibold text-[#01312D]">{driver.referencePhone}</p>
                  </div>
                </div>
                {driver.ownershipStatus === "rent" && (
                  <div className="space-y-2">
                    <p className="font-bold text-[#3A7717] border-b border-[#3A7717]/10 pb-1">Car Owner Details</p>
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-semibold text-[#01312D]">{driver.carOwnerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="font-semibold text-[#01312D]">{driver.carOwnerPhone}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Address</p>
                      <p className="font-semibold text-[#01312D] text-xs">{driver.carOwnerAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Policy Agreements */}
            <div className="rounded-xl p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 border-l-2 border-[#01312D] pl-3">
                Policy Agreements
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: "Information Accuracy", checked: driver.agreeAccuracy },
                  { label: "Ref Tenure (1+ month)", checked: driver.agreeRefTenure },
                  { label: "Owner Consent", checked: driver.agreeOwnerContact, hide: driver.ownershipStatus !== "rent" },
                  { label: "Repayment Schedule", checked: driver.agreeRepayment },
                  { label: "Escalation Policy", checked: driver.agreeEscalation },
                ].map((item, i) => !item.hide && (
                  <div key={i} className="flex items-center gap-2 bg-white/50 p-2 rounded-lg border border-[#3A7717]/5">
                    {item.checked ? (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    <span className="text-xs font-medium text-[#01312D]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-xl p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 border-l-2 border-[#01312D] pl-3">
                Driver Statistics
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-[#3A7717]">
                    {driver.totalRequests || 0}
                  </p>
                  <p className="text-xs text-gray-500">Total Requests</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#3A7717]">
                    {formatMoney(driver.totalSpent || 0)}
                  </p>
                  <p className="text-xs text-gray-500">Total Spent</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#3A7717]">
                    {driver.rating || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">Rating</p>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="rounded-xl p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 border-l-2 border-[#01312D] pl-3">
                Uploaded Documents
              </h3>
              {driver.drivingLicenseUrl || driver.carRegistrationUrl || driver.profilePhotoUrl ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {driver.drivingLicenseUrl && (
                    <div className="bg-white rounded-lg p-3 text-center">
                      <FileText className="w-8 h-8 text-[#3A7717] mx-auto mb-2" />
                      <p className="text-xs text-gray-500 mb-1">Driver's License</p>
                      <a href={driver.drivingLicenseUrl} target="_blank" rel="noopener noreferrer" className="text-[#3A7717] text-xs hover:underline inline-flex items-center gap-1">
                        <Eye className="w-3 h-3" /> View
                      </a>
                    </div>
                  )}
                  {driver.carRegistrationUrl && (
                    <div className="bg-white rounded-lg p-3 text-center">
                      <FileText className="w-8 h-8 text-[#3A7717] mx-auto mb-2" />
                      <p className="text-xs text-gray-500 mb-1">Car Registration</p>
                      <a href={driver.carRegistrationUrl} target="_blank" rel="noopener noreferrer" className="text-[#3A7717] text-xs hover:underline inline-flex items-center gap-1">
                        <Eye className="w-3 h-3" /> View
                      </a>
                    </div>
                  )}
                  {driver.profilePhotoUrl && (
                    <div className="bg-white rounded-lg p-3 text-center">
                      <img src={driver.profilePhotoUrl} alt="Profile" className="w-16 h-16 rounded-full mx-auto mb-2 object-cover" />
                      <p className="text-xs text-gray-500 mb-1">Profile Photo</p>
                      <a href={driver.profilePhotoUrl} target="_blank" rel="noopener noreferrer" className="text-[#3A7717] text-xs hover:underline inline-flex items-center gap-1">
                        <Eye className="w-3 h-3" /> View
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">No documents uploaded</p>
              )}
            </div>

            <div className="rounded-xl p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 border-l-2 border-[#01312D] pl-3">
                Verification Status
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Current Status:</span>
                {getStatusBadge(driver.verificationStatus)}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-5 flex gap-3">
            <button
              onClick={() => {
                setDeletingDriver(driver);
                setShowDeleteConfirm(true);
              }}
              className="flex-1 px-4 bg-red-500 text-white py-2 rounded-xl font-semibold hover:bg-red-600 transition-colors"
            >
              Delete Driver
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 bg-gray-500 text-white py-2 rounded-xl font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // WhatsApp Modal Component
  const WhatsAppModal = () => {
    if (!approvedRequest) return null;

    const displayAmount =
      approvedRequest.actualAmount || approvedRequest.amount;
    const message = `Hello ${approvedRequest.driverName},\n\nYour request for ${getTypeLabel(approvedRequest.type)} has been APPROVED! ✅\n\n🔐 OTP: ${approvedRequest.otp || generatedOtp}\n💰 Amount: ${formatMoney(displayAmount)}\n🚗 Vehicle: ${approvedRequest.carRegistration}\n\nThank you for using Kapuka! 🚀`;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowWhatsAppModal(false)}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl p-5">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-[#25D366] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#01312D] mb-2">
              Send WhatsApp
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              Send approval notification to {approvedRequest.driverName}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="flex-1 px-4 bg-gray-200 text-[#01312D] py-2 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const phone = approvedRequest.driverPhone?.replace(/\D/g, "");
                  window.open(
                    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
                    "_blank",
                  );
                  setShowWhatsAppModal(false);
                }}
                className="flex-1 px-4 bg-[#25D366] text-white py-2 rounded-xl font-semibold"
              >
                Send via WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Approval Modal Component
  const ApprovalModal = () => {
    if (!approvingRequest) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowApproveModal(false)}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl p-5">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-[#3A7717] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#01312D] mb-2">
              Confirm Approval
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              Approve {getTypeLabel(approvingRequest.type)} request for{" "}
              {approvingRequest.driverName}?
            </p>
            <div className="bg-yellow-50 rounded-xl p-3 mb-4">
              <p className="text-sm font-semibold text-yellow-800">OTP Code:</p>
              <code className="text-2xl font-bold tracking-wider text-[#01312D]">
                {generatedOtp}
              </code>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 px-4 bg-gray-200 text-[#01312D] py-2 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApprove}
                disabled={approvalLoading}
                className="flex-1 px-4 bg-[#3A7717] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                {approvalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    accent = "#01312D",
    prefix = "",
    loading,
    subtitle,
  }: {
    title: string;
    value: number;
    icon: React.ComponentType<any>;
    accent?: string;
    prefix?: string;
    loading?: boolean;
    subtitle?: string;
  }) => (
    <div
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <Icon className="w-4 h-4 text-slate-400 mb-3" />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
        {title}
      </p>
      {loading ? (
        <Skeleton className="h-9 w-36 mt-1" />
      ) : (
        <p className="text-3xl font-extrabold text-[#0f172a] tabular-nums tracking-tight">
          {prefix === "R"
            ? formatMoney(value)
            : prefix + value.toLocaleString()}
        </p>
      )}
      {subtitle && (
        <p className="text-[12px] text-slate-400 mt-1.5">{subtitle}</p>
      )}
    </div>
  );

  const isLoading = loading || refreshing;
  const filteredDrivers = drivers.filter(
    (driver: any) =>
      driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.carRegistration?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#01312D]">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Kapuka Tradings</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-[#01312D] font-semibold shadow-sm hover:bg-gray-50 transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* ===== PRIMARY METRICS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Drivers"
          value={stats.totalDrivers}
          icon={Users}
          accent="#01312D"
          loading={isLoading}
        />
        <StatCard
          title="Pending Verifications"
          value={stats.pendingVerifications}
          icon={Clock}
          accent="#dc2626"
          loading={isLoading}
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon={ClipboardList}
          accent="#f59e0b"
          loading={isLoading}
        />
        <StatCard
          title="Completed Requests"
          value={stats.completedRequests}
          icon={CheckCircle}
          accent="#3A7717"
          loading={isLoading}
        />
      </div>

      {statsError || driversError || requestsError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">
            Failed to load some data.{" "}
            <button onClick={handleRefresh} className="underline font-semibold">
              Tap to retry
            </button>
          </p>
        </div>
      ) : null}

      {/* ===== FINANCIAL SNAPSHOT ===== */}
      <details className="group bg-white rounded-xl shadow-sm border border-gray-100 open:shadow-md transition-shadow">
        <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#3A7717]" />
            <span className="text-sm font-semibold text-[#01312D]">
              Financial Snapshot
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 group-open:text-[#01312D] transition-colors">
            {(appliedFrom || appliedTo) && (
              <span className="text-[11px] font-medium text-slate-500">
                {appliedFrom || "..."} – {appliedTo || "..."}
              </span>
            )}
            <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </summary>

        {/* Date Range Filter */}
        <div className="px-5 pb-5">
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex justify-between sm:flex-row flex-col sm:items-end gap-5">
              <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
                <div className="w-full sm:flex-1 sm:min-w-[150px]">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#01312D] bg-white"
                  />
                </div>
                <div className="w-full sm:flex-1 sm:min-w-[150px]">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    To
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#01312D] bg-white"
                  />
                </div>
              </div>
              <div className="flex w-full sm:w-auto gap-3">
                <button
                  onClick={handleApplyDateRange}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-[#01312D] text-white rounded-lg text-[13px] font-medium hover:bg-[#3A7717] transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                    setAppliedFrom("");
                    setAppliedTo("");
                  }}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-gray-200 text-[#01312D] rounded-lg text-[13px] font-medium hover:bg-gray-300 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Financial Stats Row - 4 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Requests"
              value={financialStats.moneyRequested}
              icon={Wallet}
              accent="#01312D"
              prefix="R"
              loading={isLoading}
            />
            <StatCard
              title="Requests Paid"
              value={financialStats.principalRepaid}
              icon={PiggyBank}
              accent="#3A7717"
              prefix="R"
              loading={isLoading}
            />
            <StatCard
              title="Profits Received So Far"
              value={financialStats.actualInterest}
              icon={TrendingUp}
              accent="#16a34a"
              prefix="R"
              loading={isLoading}
            />
            <StatCard
              title="Expected Total Profits"
              value={
                financialStats.actualInterest + financialStats.potentialInterest
              }
              icon={TrendingDown}
              accent="#f59e0b"
              prefix="R"
              loading={isLoading}
            />
          </div>
        </div>
      </details>

      {/* Pending Actions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[#3A7717]" />
          <h2 className="text-sm font-bold text-[#01312D]">Pending Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {pendingActionTiles.map((tile) => {
            const count =
              notifCounts?.[
                tile.key as keyof typeof notifCounts
              ] ?? 0;
            const Icon = tile.icon;
            return (
              <button
                key={tile.key}
                onClick={() => router.push(tile.href)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/15 hover:border-[#bff202]/40 hover:shadow-md transition-all flex flex-col items-center gap-1 text-center"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-1"
                  style={{ backgroundColor: `${tile.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: tile.color }} />
                </div>
                <span
                  className="text-lg font-black"
                  style={{ color: tile.color }}
                >
                  {count}
                </span>
                <span className="text-[10px] font-semibold uppercase text-gray-500">
                  {tile.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Management */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[#3A7717]" />
          <h2 className="text-sm font-bold text-[#01312D]">Management</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {managementLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.label}
                onClick={() => router.push(link.href)}
                className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm border border-[#bff202]/20 hover:border-[#bff202]/40 hover:shadow-md transition-all text-left"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: link.bg }}
                >
                  <Icon className="w-5 h-5" style={{ color: link.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#01312D]">
                    {link.label}
                  </p>
                  <p className="text-xs text-gray-500">{link.sub}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 font-semibold transition-all ${activeTab === "overview" ? "text-[#3A7717] border-b-2 border-[#3A7717]" : "text-gray-500"}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("drivers")}
          className={`px-4 py-2 font-semibold transition-all flex items-center gap-2 ${activeTab === "drivers" ? "text-[#3A7717] border-b-2 border-[#3A7717]" : "text-gray-500"}`}
        >
          <Users className="w-4 h-4" /> All Drivers{" "}
          <span className="px-1.5 py-0.5 bg-gray-200 rounded-full text-xs">
            {drivers.length}
          </span>
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-[#01312D]">
                Pending Verifications
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Drivers waiting for approval
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 flex items-center justify-between"
                  >
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded" />
                  </div>
                ))
              ) : recentVerifications.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-slate-500 text-sm">
                    No pending verifications
                  </p>
                </div>
              ) : (
                recentVerifications.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => {
                      setSelectedVerification(item);
                      setShowVerificationModal(true);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-[#0f172a]">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.carRegistration}
                        </p>
                      </div>
                    </div>
                    <span className="text-slate-400 text-xs font-medium group-hover:text-[#01312D] transition-colors">
                      Review
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-[#01312D]">
                Pending Service Requests
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Requests awaiting approval
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 flex items-center justify-between"
                  >
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                ))
              ) : recentRequests.filter((r: any) => r.status === "pending")
                  .length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-slate-500 text-sm">No pending requests</p>
                </div>
              ) : (
                recentRequests
                  .filter((r: any) => r.status === "pending")
                  .map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedRequest(item);
                        setShowRequestModal(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.type === "fuel" ? "bg-green-500" : item.type === "airtime" ? "bg-blue-400" : item.type === "cash" ? "bg-amber-400" : "bg-purple-400"}`} />
                        <div>
                          <p className="font-semibold text-[#0f172a] capitalize">
                            {getTypeLabel(item.type)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.driverName || item.driver}
                          </p>
                        </div>
                      </div>
                      <span className="text-slate-400 text-xs font-medium group-hover:text-[#01312D] transition-colors">
                        Review
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "drivers" && (
        <>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or registration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl focus:outline-none focus:border-[#01312D] shadow-sm"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Driver
                    </th>
                    <th className="text-left p-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Vehicle
                    </th>
                    <th className="text-left p-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="text-left p-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Rating
                    </th>
                    <th className="text-left p-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Requests
                    </th>
                    <th className="text-left p-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Spent
                    </th>
                    <th className="text-left p-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td className="p-4">
                            <Skeleton className="h-4 w-32" />
                          </td>
                          <td className="p-4">
                            <Skeleton className="h-4 w-24" />
                          </td>
                          <td className="p-4">
                            <Skeleton className="h-6 w-20 rounded-lg" />
                          </td>
                          <td className="p-4">
                            <Skeleton className="h-4 w-12" />
                          </td>
                          <td className="p-4">
                            <Skeleton className="h-4 w-8" />
                          </td>
                          <td className="p-4">
                            <Skeleton className="h-4 w-16" />
                          </td>
                          <td className="p-4">
                            <Skeleton className="h-8 w-16 rounded-lg" />
                          </td>
                        </tr>
                      ))
                    : filteredDrivers.map((driver: any, idx: number) => {
                        const initial = (driver.name || "?").charAt(0).toUpperCase();
                        return (
                        <tr
                          key={driver.id}
                          className={`${idx % 2 === 1 ? "bg-gray-50/50" : ""} hover:bg-gray-50 transition-colors cursor-pointer`}
                          onClick={() => {
                            setSelectedDriver(driver);
                            setShowDriverModal(true);
                          }}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#01312D] flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">{initial}</span>
                              </div>
                              <div>
                                <p className="font-semibold text-[#0f172a]">
                                  {driver.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {driver.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="text-sm font-medium text-[#0f172a]">
                              {driver.carModel}
                            </p>
                            <p className="text-xs text-slate-500">
                              {driver.carRegistration}
                            </p>
                          </td>
                          <td className="p-4">
                            {getStatusBadge(driver.verificationStatus)}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-semibold text-[#0f172a] tabular-nums">
                                {driver.rating
                                  ? driver.rating.toFixed(1)
                                  : "—"}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-[#0f172a] tabular-nums">
                              {driver.totalRequests || 0}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-[#0f172a] tabular-nums">
                              {formatMoney(driver.totalSpent || 0)}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button className="px-2.5 py-1.5 text-slate-400 hover:text-[#01312D] rounded-lg text-sm font-medium transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingDriver(driver);
                                  setShowDeleteConfirm(true);
                                }}
                                className="px-2.5 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )})}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {showVerificationModal && selectedVerification && (
        <VerificationDetailsModal
          verification={selectedVerification}
          onClose={() => setShowVerificationModal(false)}
        />
      )}
      {showRequestModal && selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => setShowRequestModal(false)}
        />
      )}
      {showDriverModal && selectedDriver && (
        <DriverDetailsModal
          driver={selectedDriver}
          onClose={() => setShowDriverModal(false)}
        />
      )}
      {showApproveModal && <ApprovalModal />}
      {showWhatsAppModal && approvedRequest && <WhatsAppModal />}
      {showRejectModal && renderRejectionModal()}
      <DeleteConfirmModal />
      <SuccessModal />
      <ErrorModal />
    </div>
  );
}
