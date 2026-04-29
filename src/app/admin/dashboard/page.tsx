// src/app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState<string | null>(null);

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
      // Fetch stats
      const statsRes = await fetch("/api/admin/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch drivers
      const driversRes = await fetch("/api/admin/drivers");
      if (driversRes.ok) {
        const driversData = await driversRes.json();
        setDrivers(driversData.drivers || []);
        setRecentVerifications(driversData.recent || []);
      }

      // Fetch requests
      const requestsRes = await fetch("/api/admin/requests");
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setRecentRequests(requestsData.recent || []);
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

  const handleApproveVerification = async (verification: any) => {
    console.log(verification);

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
        alert(`✅ Approved ${verification.name}'s verification`);
        fetchDashboardData();
        setShowVerificationModal(false);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to approve verification");
      }
    } catch (error) {
      console.error("Error approving verification:", error);
      alert("Failed to approve verification");
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
          alert(`❌ Rejected ${verification.name}'s verification`);
          fetchDashboardData();
          setShowVerificationModal(false);
        } else {
          const error = await response.json();
          alert(error.error || "Failed to reject verification");
        }
      } catch (error) {
        console.error("Error rejecting verification:", error);
        alert("Failed to reject verification");
      }
    }
  };

  const handleApproveRequest = async (request: any) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const response = await fetch("/api/admin/requests/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          otp,
        }),
      });
      if (response.ok) {
        alert(`✅ Approved ${request.id} with OTP: ${otp}`);
        fetchDashboardData();
        setShowRequestModal(false);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Failed to approve request");
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
          alert(`❌ Rejected ${request.id}`);
          fetchDashboardData();
          setShowRequestModal(false);
        } else {
          const error = await response.json();
          alert(error.error || "Failed to reject request");
        }
      } catch (error) {
        console.error("Error rejecting request:", error);
        alert("Failed to reject request");
      }
    }
  };

  const handleSendWhatsApp = (request: any) => {
    const message = `DriveHub Service Request Confirmation\n\nRequest ID: ${request.id}\nDriver: ${request.driver}\nCar: ${request.carRegistration}\nService: ${request.type}\nAmount: R${request.amount}\nOTP: ${request.otp || "N/A"}\n\nPlease show this OTP to the cashier/attendant.`;
    const whatsappUrl = `https://wa.me/${request.driverPhone?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
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

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/20 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-[#01312D] mt-1">{value}</p>
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  // Verification Details Modal
  const VerificationDetailsModal = ({
    verification,
    onClose,
  }: {
    verification: any;
    onClose: () => void;
  }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#bff202]/20 p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#eafde7] rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-[#01312D]">
                {verification.name?.charAt(0) || "U"}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#01312D]">
                Verification Details
              </h2>
              <p className="text-sm text-gray-500">{verification.name}</p>
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
          {/* Personal Information */}
          <div className="bg-[#eafde7] rounded-xl p-4">
            <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-[#3A7717]" />
              Personal Information
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-500">Full Name:</span>{" "}
                {verification.name}
              </p>
              <p>
                <span className="text-gray-500">Email:</span>{" "}
                {verification.email}
              </p>
              <p>
                <span className="text-gray-500">Phone:</span>{" "}
                {verification.phone}
              </p>
              <p>
                <span className="text-gray-500">Address:</span>{" "}
                {verification.address || "Not provided"}
              </p>
              <p>
                <span className="text-gray-500">Submitted:</span>{" "}
                {new Date(verification.date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="bg-[#eafde7] rounded-xl p-4">
            <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
              <Car className="w-4 h-4 text-[#3A7717]" />
              Vehicle Information
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p>
                <span className="text-gray-500">Registration:</span>{" "}
                {verification.carRegistration || "Not provided"}
              </p>
              <p>
                <span className="text-gray-500">Model:</span>{" "}
                {verification.carModel || "Not provided"}
              </p>
              <p>
                <span className="text-gray-500">Year:</span>{" "}
                {verification.carYear || "Not provided"}
              </p>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-[#eafde7] rounded-xl p-4">
            <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#3A7717]" />
              Uploaded Documents
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                <span className="text-sm">Driver's License</span>
                {verification.documents?.license ? (
                  <a
                    href={verification.documents.license}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#72bf00] text-sm font-semibold"
                  >
                    View
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">Not uploaded</span>
                )}
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                <span className="text-sm">RC Document</span>
                {verification.documents?.registration ? (
                  <a
                    href={verification.documents.registration}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#72bf00] text-sm font-semibold"
                  >
                    View
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">Not uploaded</span>
                )}
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                <span className="text-sm">Profile Photo</span>
                {verification.documents?.profilePhoto ? (
                  <a
                    href={verification.documents.profilePhoto}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#72bf00] text-sm font-semibold"
                  >
                    View
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">Not uploaded</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[#bff202]/20 p-5 flex gap-3">
          <button
            onClick={() => handleApproveVerification(verification)}
            className="flex-1 bg-[#3A7717] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Approve Verification
          </button>
          <button
            onClick={() => handleRejectVerification(verification)}
            className="flex-1 bg-red-500 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        </div>
      </div>
    </div>
  );

  // Service Request Details Modal
  const RequestDetailsModal = ({
    request,
    onClose,
  }: {
    request: any;
    onClose: () => void;
  }) => {
    const getTypeIcon = () => {
      switch (request.type) {
        case "fuel":
          return <Fuel className="w-5 h-5" />;
        case "airtime":
          return <Smartphone className="w-5 h-5" />;
        case "cash":
          return <DollarSign className="w-5 h-5" />;
        default:
          return <Car className="w-5 h-5" />;
      }
    };

    const getTypeColor = () => {
      switch (request.type) {
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
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTypeColor()}`}
              >
                {getTypeIcon()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#01312D]">
                  {getTypeLabel(request.type)} Request
                </h2>
                <p className="text-sm text-gray-500">ID: {request.id}</p>
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
            {/* Driver Information */}
            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[#3A7717]" />
                Driver Information
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Name:</span> {request.driver}
                </p>
                <p>
                  <span className="text-gray-500">Email:</span>{" "}
                  {request.driverEmail}
                </p>
                <p>
                  <span className="text-gray-500">Phone:</span>{" "}
                  {request.driverPhone}
                </p>
                <p>
                  <span className="text-gray-500">Car Registration:</span>{" "}
                  {request.carRegistration}
                </p>
                {request.location && (
                  <p>
                    <span className="text-gray-500">Location:</span>{" "}
                    {request.location}
                  </p>
                )}
              </div>
            </div>

            {/* Request Details */}
            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#3A7717]" />
                Request Details
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Service Type:</span>{" "}
                  {getTypeLabel(request.type)}
                </p>
                <p>
                  <span className="text-gray-500">Amount:</span> R
                  {request.amount?.toLocaleString()}
                </p>
                {request.fuelType && (
                  <p>
                    <span className="text-gray-500">Fuel Type:</span>{" "}
                    {request.fuelType}
                  </p>
                )}
                {request.phoneNumber && (
                  <p>
                    <span className="text-gray-500">Mobile Number:</span>{" "}
                    {request.phoneNumber}
                  </p>
                )}
                {request.type === "cash" && (
                  <>
                    <p>
                      <span className="text-gray-500">Interest Rate:</span>{" "}
                      {request.interestRate || 13}%
                    </p>
                    <p>
                      <span className="text-gray-500">Interest Amount:</span> R
                      {request.interest?.toLocaleString()}
                    </p>
                    <p>
                      <span className="text-gray-500">Total Repayable:</span> R
                      {request.totalRepayable?.toLocaleString()}
                    </p>
                    <p>
                      <span className="text-gray-500">Repayment Period:</span>{" "}
                      {request.repaymentDays} days
                    </p>
                  </>
                )}
                <p>
                  <span className="text-gray-500">Request Date:</span>{" "}
                  {new Date(request.date).toLocaleString()}
                </p>
                {request.otp && (
                  <div className="mt-3 pt-3 border-t border-[#bff202]/20">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">OTP:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-3 py-1 rounded-lg font-mono text-lg font-bold text-[#01312D]">
                          {request.otp}
                        </code>
                        <button
                          onClick={() => handleCopyOtp(request.otp)}
                          className="p-1.5 bg-[#eafde7] rounded-lg hover:bg-[#bff202]/30 transition-colors"
                        >
                          {copiedOtp === request.otp ? (
                            <CheckCircle className="w-4 h-4 text-[#3A7717]" />
                          ) : (
                            <Copy className="w-4 h-4 text-[#3A7717]" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-[#bff202]/20 p-5 flex gap-3">
            {request.status === "pending" && (
              <>
                <button
                  onClick={() => handleApproveRequest(request)}
                  className="flex-1 bg-[#3A7717] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Request
                </button>
                <button
                  onClick={() => handleRejectRequest(request)}
                  className="flex-1 bg-red-500 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}
            {request.otp && (
              <button
                onClick={() => handleSendWhatsApp(request)}
                className="flex-1 bg-[#25D366] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send WhatsApp
              </button>
            )}
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
  }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#bff202]/20 p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#eafde7] rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-[#01312D]">
                {driver.name?.charAt(0) || "U"}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#01312D]">
                {driver.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(driver.verificationStatus)}
              </div>
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
          <div className="bg-[#eafde7] rounded-xl p-4">
            <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#3A7717]" />
              Contact Information
            </h3>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" /> {driver.email}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" /> {driver.phone}
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" /> Joined:{" "}
                {new Date(driver.joinedDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="bg-[#eafde7] rounded-xl p-4">
            <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
              <Car className="w-4 h-4 text-[#3A7717]" />
              Vehicle Information
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p>
                <span className="text-gray-500">Registration:</span>{" "}
                {driver.carRegistration}
              </p>
              <p>
                <span className="text-gray-500">Model:</span> {driver.carModel}
              </p>
              <p>
                <span className="text-gray-500">Year:</span> {driver.carYear}
              </p>
            </div>
          </div>

          <div className="bg-[#eafde7] rounded-xl p-4">
            <h3 className="font-semibold text-[#01312D] mb-3">Statistics</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#01312D]">
                  {driver.totalRequests}
                </p>
                <p className="text-xs text-gray-500">Total Requests</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#01312D]">
                  R{driver.totalSpent?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500">Total Spent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#01312D]">
                  {driver.rating || "N/A"}
                </p>
                <p className="text-xs text-gray-500">Rating</p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[#bff202]/20 p-5 flex gap-3">
          <button className="flex-1 bg-[#eafde7] text-[#01312D] py-2 rounded-xl font-semibold">
            View Full Details
          </button>
          <button className="flex-1 bg-[#72bf00] text-white py-2 rounded-xl font-semibold">
            View Requests
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3A7717] border-t-transparent mx-auto mb-4"></div>
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
      {/* Page Header */}
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
          className="flex items-center gap-2 px-4 py-2 bg-[#eafde7] rounded-xl text-[#01312D] font-semibold hover:bg-[#bff202]/30 transition-all"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#bff202]/20">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 font-semibold transition-all ${activeTab === "overview" ? "text-[#3A7717] border-b-2 border-[#3A7717]" : "text-gray-500 hover:text-[#01312D]"}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("drivers")}
          className={`px-4 py-2 font-semibold transition-all flex items-center gap-2 ${activeTab === "drivers" ? "text-[#3A7717] border-b-2 border-[#3A7717]" : "text-gray-500 hover:text-[#01312D]"}`}
        >
          <Users className="w-4 h-4" /> All Drivers{" "}
          <span className="px-1.5 py-0.5 bg-gray-200 rounded-full text-xs">
            {drivers.length}
          </span>
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
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
              title="Total Revenue"
              value={`R${stats.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              color="bg-[#3A7717]"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Verifications */}
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

            {/* Pending Service Requests */}
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
                {recentRequests.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 text-sm">No pending requests</p>
                  </div>
                ) : (
                  recentRequests.map((item) => (
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
                        <p className="text-xs text-gray-500">{item.driver}</p>
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
        </>
      )}

      {/* Drivers Tab */}
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
                          {driver.totalRequests}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-[#3A7717]">
                          R{driver.totalSpent?.toLocaleString() || 0}
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
    </div>
  );
}
