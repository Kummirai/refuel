// src/app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import {
  Users,
  ClipboardList,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  ArrowUp,
  ArrowDown,
  Search,
  Star,
  Phone,
  Mail,
  Car,
  Calendar,
  AlertTriangle,
  ThumbsUp,
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
  Upload,
  Download,
  Shield,
} from "lucide-react";

type RequestType = "fuel" | "airtime" | "cash" | "carwash";
type RequestStatus = "pending" | "approved" | "completed" | "rejected";

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  // Financial stats
  const [financialStats, setFinancialStats] = useState({
    moneyRequested: 0,
    interestGained: 0,
  });

  const [stats, setStats] = useState({
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
  });

  const [drivers, setDrivers] = useState<any[]>([]);
  const [recentVerifications, setRecentVerifications] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  // Function to refresh notification counts in the sidebar
  const refreshNotificationCounts = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("refreshAdminCounts"));
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await fetch("/api/admin/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      const driversRes = await fetch("/api/admin/drivers");
      if (driversRes.ok) {
        const driversData = await driversRes.json();

        console.log(driversData);

        setDrivers(driversData.drivers || []);
        setRecentVerifications(driversData.recent || []);
      }

      const requestsRes = await fetch("/api/admin/requests");
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        const allRequests = requestsData.requests || [];
        setRecentRequests(requestsData.recent || []);

        // Calculate financial stats from all requests
        let totalMoneyRequested = 0;
        let totalInterestGained = 0;

        allRequests.forEach((request: any) => {
          const amount = request.actualAmount || request.amount || 0;
          totalMoneyRequested += amount;
          if (request.interest) {
            totalInterestGained += request.interest;
          } else if (
            request.status === "completed" ||
            request.status === "approved"
          ) {
            totalInterestGained += amount * 0.13;
          }
        });

        setFinancialStats({
          moneyRequested: totalMoneyRequested,
          interestGained: totalInterestGained,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
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
        refreshNotificationCounts();
        const updatedRequest = {
          ...approvingRequest,
          otp: generatedOtp,
          status: "approved" as RequestStatus,
        };
        setApprovedRequest(updatedRequest);
        setShowApproveModal(false);
        setShowWhatsAppModal(true);
        await fetchDashboardData();
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
        refreshNotificationCounts();
        setSuccessMessage(
          `✅ Request ${rejectingRequest.id.slice(-6).toUpperCase()} rejected successfully`,
        );
        setShowSuccessModal(true);
        fetchDashboardData();
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
        refreshNotificationCounts();
        setSuccessMessage(
          `❌ Rejected ${rejectingVerification.name}'s verification`,
        );
        setShowSuccessModal(true);
        fetchDashboardData();
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
        fetchDashboardData();
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
        refreshNotificationCounts();
        setSuccessMessage(`✅ Approved ${verification.name}'s verification`);
        setShowSuccessModal(true);
        fetchDashboardData();
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
              className="flex-1 bg-gray-200 text-[#01312D] py-2 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRejection}
              disabled={rejectLoading}
              className="flex-1 bg-red-500 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
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
          <div className="sticky top-0 bg-white border-b border-[#bff202]/20 p-5 flex justify-between items-center">
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
              className="p-1 hover:bg-[#eafde7] rounded-lg"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Driver Info */}
            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[#3A7717]" /> Driver Information
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
            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#3A7717]" /> Request Details
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
                <div className="flex justify-between pt-2 border-t border-[#bff202]/20">
                  <span className="text-gray-500">Requested Amount:</span>
                  <span className="font-semibold text-[#01312D]">
                    R{request.amount?.toLocaleString()}
                  </span>
                </div>
                {hasActualAmount && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Actual Amount Paid:</span>
                    <span className="font-semibold text-[#3A7717]">
                      R{request.actualAmount?.toLocaleString()}
                    </span>
                  </div>
                )}
                {request.totalRepayable && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Repayable:</span>
                    <span className="font-semibold text-[#3A7717]">
                      R{request.totalRepayable?.toLocaleString()}
                    </span>
                  </div>
                )}
                {request.dailyPayment && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Daily Payment:</span>
                    <span className="font-semibold text-[#01312D]">
                      R{request.dailyPayment?.toLocaleString()}/day
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
                  <div className="flex justify-between pt-2 border-t border-[#bff202]/20">
                    <span className="text-gray-500">OTP:</span>
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-bold text-[#01312D]">
                        {request.otp}
                      </code>
                      <button
                        onClick={() => handleCopyOtp(request.otp)}
                        className="p-1 hover:bg-[#eafde7] rounded"
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
                  <div className="pt-2 border-t border-[#bff202]/20">
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
          </div>

          {/* Action Buttons */}
          {/* <div className="sticky bottom-0 bg-white border-t border-[#bff202]/20 p-5 flex gap-3">
            {request.status === "pending" && (
              <>
                <button
                  onClick={() => openApproveModal(request)}
                  className="flex-1 bg-[#3A7717] text-white py-2 rounded-xl font-semibold flex  items-center justify-center gap-2 hover:bg-[#2d5a12] transition-colors text-xs"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button
                  onClick={() => openRejectModal(request, "request")}
                  className="flex-1 bg-red-500 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors text-xs"
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
                  className="flex-1 bg-[#25D366] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 text-xs"
                >
                  <Send className="w-4 h-4" /> Send WhatsApp
                </button>
                <button
                  onClick={() => handleCompleteRequest(request)}
                  className="flex-1 bg-[#01312D] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 text-xs"
                >
                  <CheckCircle className="w-4 h-4" /> Mark Completed
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className={`${request.status === "pending" || request.status === "approved" ? "flex-1" : "w-full"} bg-gray-500 text-white py-2 rounded-xl font-semibold text-xs`}
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
          <div className="sticky top-0 bg-white border-b border-[#bff202]/20 p-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#eafde7] rounded-xl flex items-center justify-center">
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
              className="p-1 hover:bg-[#eafde7] rounded-lg"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Driver Info */}
            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[#3A7717]" /> Personal Information
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
              <div className="bg-[#eafde7] rounded-xl p-4">
                <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#3A7717]" /> Location
                  Information
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
            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <Car className="w-4 h-4 text-[#3A7717]" /> Vehicle Information
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
              </div>
            </div>

            {/* Documents Section */}
            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#3A7717]" /> Uploaded
                Documents
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
            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#3A7717]" /> Verification
                Status
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Current Status:</span>
                {getStatusBadge(mappedVerification.verificationStatus)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {/* <div className="sticky bottom-0 bg-white border-t border-[#bff202]/20 p-5 flex gap-3">
            {mappedVerification.verificationStatus === "pending" && (
              <>
                <button
                  onClick={() => handleApproveVerification(verification)}
                  className="flex-1 bg-[#3A7717] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#2d5a12] transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Approve Verification
                </button>
                <button
                  onClick={() => openRejectModal(verification, "verification")}
                  className="flex-1 bg-red-500 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
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
          </div> */}
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
          <div className="sticky top-0 bg-white border-b border-[#bff202]/20 p-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#eafde7] rounded-full flex items-center justify-center">
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
              className="p-1 hover:bg-[#eafde7] rounded-lg"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Personal Info */}
            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[#3A7717]" /> Personal Information
              </h3>
              <div className="grid gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Name</p>
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
                  <p className="text-gray-500">Phone</p>
                  <p className="font-semibold text-[#01312D]">
                    {driver.phone || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Member Since</p>
                  <p className="font-semibold text-[#01312D]">
                    {new Date(driver.joinedDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <Car className="w-4 h-4 text-[#3A7717]" /> Vehicle Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Registration Number</p>
                  <p className="font-semibold text-[#01312D]">
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
              </div>
            </div>

            {/* Stats */}
            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#3A7717]" /> Driver
                Statistics
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
                    R{(driver.totalSpent || 0).toLocaleString()}
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

            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#3A7717]" /> Verification
                Status
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Current Status:</span>
                {getStatusBadge(driver.verificationStatus)}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-[#bff202]/20 p-5">
            <button
              onClick={onClose}
              className="w-full bg-gray-500 text-white py-2 rounded-xl font-semibold"
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
    const message = `Hello ${approvedRequest.driverName},\n\nYour request for ${getTypeLabel(approvedRequest.type)} has been APPROVED! ✅\n\n🔐 OTP: ${approvedRequest.otp || generatedOtp}\n💰 Amount: R${displayAmount.toLocaleString()}\n🚗 Vehicle: ${approvedRequest.carRegistration}\n\nThank you for using Kapuka! 🚀`;

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
                className="flex-1 bg-gray-200 text-[#01312D] py-2 rounded-xl font-semibold"
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
                className="flex-1 bg-[#25D366] text-white py-2 rounded-xl font-semibold"
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
                className="flex-1 bg-gray-200 text-[#01312D] py-2 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApprove}
                disabled={approvalLoading}
                className="flex-1 bg-[#3A7717] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
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

  const StatCard = ({ title, value, icon: Icon, color, prefix = "" }: any) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/20 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-[#01312D] mt-1">
            {prefix}
            {value.toLocaleString()}
          </p>
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#3A7717] animate-spin mx-auto mb-4" />
          <p className="text-[#01312D]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.carRegistration?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#01312D]">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, Admin</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#eafde7] rounded-xl text-[#01312D] font-semibold hover:bg-[#bff202]/30"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />{" "}
          Refresh
        </button>
      </div>

      {/* Financial Stats Row - 2 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Money Requested"
          value={financialStats.moneyRequested}
          icon={Wallet}
          color="bg-[#01312D]"
          prefix="R"
        />
        <StatCard
          title="Interest Gained"
          value={financialStats.interestGained}
          icon={TrendingUp}
          color="bg-[#72bf00]"
          prefix="R"
        />
      </div>

      {/* Second Row - Other Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Drivers"
          value={stats.totalDrivers}
          icon={Users}
          color="bg-[#01312D]"
        />
        <StatCard
          title="Pending Verifications"
          value={stats.pendingVerifications}
          icon={Clock}
          color="bg-yellow-500"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon={ClipboardList}
          color="bg-[#72bf00]"
        />
        <StatCard
          title="Completed Requests"
          value={stats.completedRequests}
          icon={CheckCircle}
          color="bg-[#3A7717]"
        />
      </div>

      <div className="flex gap-2 border-b border-[#bff202]/20">
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
          <div className="bg-white rounded-2xl shadow-sm border border-[#bff202]/20">
            <div className="p-5 border-b border-[#bff202]/20">
              <h2 className="font-bold text-[#01312D]">
                Pending Verifications
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Drivers waiting for approval
              </p>
            </div>
            <div className="divide-y divide-[#bff202]/10">
              {recentVerifications.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 text-sm">
                    No pending verifications
                  </p>
                </div>
              ) : (
                recentVerifications.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex items-center justify-between hover:bg-[#eafde7] transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedVerification(item);
                      setShowVerificationModal(true);
                    }}
                  >
                    <div>
                      <p className="font-semibold text-[#01312D]">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.carRegistration}
                      </p>
                    </div>
                    <button className="px-3 py-1 bg-[#72bf00] text-white text-xs rounded-lg">
                      View Details
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-[#bff202]/20">
            <div className="p-5 border-b border-[#bff202]/20">
              <h2 className="font-bold text-[#01312D]">
                Pending Service Requests
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Requests awaiting approval
              </p>
            </div>
            <div className="divide-y divide-[#bff202]/10">
              {recentRequests.filter((r) => r.status === "pending").length ===
              0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 text-sm">No pending requests</p>
                </div>
              ) : (
                recentRequests
                  .filter((r) => r.status === "pending")
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex items-center justify-between hover:bg-[#eafde7] transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedRequest(item);
                        setShowRequestModal(true);
                      }}
                    >
                      <div>
                        <p className="font-semibold text-[#01312D] capitalize">
                          {getTypeLabel(item.type)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.driverName || item.driver}
                        </p>
                      </div>
                      <button className="px-3 py-1 bg-[#72bf00] text-white text-xs rounded-lg">
                        View Details
                      </button>
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or registration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-[#bff202]/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#eafde7] border-b border-[#bff202]/20">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-[#01312D]">
                      Driver
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-[#01312D]">
                      Vehicle
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-[#01312D]">
                      Status
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-[#01312D]">
                      Rating
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-[#01312D]">
                      Requests
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-[#01312D]">
                      Spent
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-[#01312D]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#bff202]/10">
                  {filteredDrivers.map((driver) => (
                    <tr
                      key={driver.id}
                      className="hover:bg-[#eafde7] transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedDriver(driver);
                        setShowDriverModal(true);
                      }}
                    >
                      <td className="p-4">
                        <p className="font-semibold text-[#01312D]">
                          {driver.name}
                        </p>
                        <p className="text-xs text-gray-500">{driver.email}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-[#01312D]">
                          {driver.carModel}
                        </p>
                        <p className="text-xs text-gray-500">
                          {driver.carRegistration}
                        </p>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(driver.verificationStatus)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold text-[#01312D]">
                            {driver.rating ? driver.rating.toFixed(1) : "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-[#01312D]">
                          {driver.totalRequests || 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-[#3A7717]">
                          R{(driver.totalSpent || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <button className="px-3 py-1.5 bg-[#eafde7] text-[#01312D] rounded-lg text-sm font-semibold flex items-center gap-1">
                          <Eye className="w-4 h-4" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
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
      <SuccessModal />
      <ErrorModal />
    </div>
  );
}
