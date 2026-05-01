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
          totalMoneyRequested += request.amount || 0;
          // For cash loans, interest is stored in the request
          if (request.type === "cash" && request.interest) {
            totalInterestGained += request.interest || 0;
          }
          // For other services, calculate 13% interest on completed/completed requests
          else if (
            request.type !== "cash" &&
            (request.status === "completed" || request.status === "approved")
          ) {
            totalInterestGained += (request.amount || 0) * 0.13;
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
  };

  const openApproveModal = (request: any) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setApprovingRequest(request);
    setShowApproveModal(true);
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

  const handleRejectRequest = async (request: any) => {
    const reason = prompt("Please enter rejection reason:");
    if (reason) {
      try {
        const response = await fetch("/api/admin/requests/reject", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: request.id,
            reason,
          }),
        });
        if (response.ok) {
          setSuccessMessage(
            `✅ Request ${request.id.slice(-6).toUpperCase()} rejected successfully`,
          );
          setShowSuccessModal(true);
          fetchDashboardData();
          setShowRequestModal(false);
        } else {
          const error = await response.json();
          setErrorMessage(error.error || "Failed to reject request");
          setShowErrorModal(true);
        }
      } catch (error) {
        console.error("Error rejecting request:", error);
        setErrorMessage("Failed to reject request");
        setShowErrorModal(true);
      }
    }
  };

  const handleComplete = async (request: any) => {
    try {
      const response = await fetch("/api/admin/requests/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
        }),
      });
      if (response.ok) {
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
          verification: verification,
          action: "approve",
        }),
      });
      if (response.ok) {
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

  const handleRejectVerification = async (verification: any) => {
    const reason = prompt("Please enter rejection reason:");
    if (reason) {
      try {
        const response = await fetch("/api/admin/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verificationId: verification.id,
            action: "reject",
            reason,
          }),
        });
        if (response.ok) {
          setSuccessMessage(`❌ Rejected ${verification.name}'s verification`);
          setShowSuccessModal(true);
          fetchDashboardData();
          setShowVerificationModal(false);
        } else {
          const error = await response.json();
          setErrorMessage(error.error || "Failed to reject verification");
          setShowErrorModal(true);
        }
      } catch (error) {
        console.error("Error rejecting verification:", error);
        setErrorMessage("Failed to reject verification");
        setShowErrorModal(true);
      }
    }
  };

  const handleCopyOtp = (otp: string) => {
    navigator.clipboard.writeText(otp);
    setCopiedOtp(otp);
    setTimeout(() => setCopiedOtp(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" /> Verified
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">
            Not Started
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

  // WhatsApp Modal Component (same as before, keep as is)
  const WhatsAppModal = () => {
    // ... (keep the existing WhatsAppModal code)
    return null; // Placeholder - keep your existing implementation
  };

  // Approval Modal Component (same as before)
  const ApprovalModal = () => {
    // ... (keep the existing ApprovalModal code)
    return null; // Placeholder - keep your existing implementation
  };

  // Request Details Modal (same as before)
  const RequestDetailsModal = ({
    request,
    onClose,
  }: {
    request: any;
    onClose: () => void;
  }) => {
    // ... (keep the existing RequestDetailsModal code)
    return null; // Placeholder - keep your existing implementation
  };

  // Verification Details Modal (same as before)
  const VerificationDetailsModal = ({
    verification,
    onClose,
  }: {
    verification: any;
    onClose: () => void;
  }) => {
    // ... (keep the existing VerificationDetailsModal code)
    return null; // Placeholder - keep your existing implementation
  };

  // Driver Details Modal (same as before)
  const DriverDetailsModal = ({
    driver,
    onClose,
  }: {
    driver: any;
    onClose: () => void;
  }) => {
    // ... (keep the existing DriverDetailsModal code)
    return null; // Placeholder - keep your existing implementation
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
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 bg-[#3A7717] text-white text-xs rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveVerification(item);
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectVerification(item);
                        }}
                      >
                        Reject
                      </button>
                    </div>
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

      {/* Modals - Placeholder comments for your existing modals */}
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
      <SuccessModal />
      <ErrorModal />
    </div>
  );
}
