// src/app/admin/service-requests/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Fuel,
  Smartphone,
  DollarSign,
  Car,
  ChevronLeft,
  ChevronRight,
  Download,
  Send,
  MessageCircle,
  TrendingUp,
  Calendar,
  User,
  MapPin,
  Phone,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  X,
  AlertCircle,
} from "lucide-react";

type RequestType = "fuel" | "airtime" | "cash" | "carwash";
type RequestStatus = "pending" | "approved" | "completed" | "rejected";

interface ServiceRequest {
  id: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  carRegistration: string;
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

export default function AdminServiceRequestsPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<
    "all" | "pending" | "approved" | "completed" | "rejected"
  >("pending");
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(
    null,
  );
  const [showModal, setShowModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvingRequest, setApprovingRequest] =
    useState<ServiceRequest | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<RequestType | "all">("all");
  const [copiedOtp, setCopiedOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/admin/requests");
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
        setStats({
          total: data.total || 0,
          pending: data.pending || 0,
          approved: data.approved || 0,
          completed: data.completed || 0,
          rejected: data.rejected || 0,
          totalAmount: data.totalRevenue || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
  };

  const openApproveModal = (request: ServiceRequest) => {
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
        await fetchRequests();
        setShowApproveModal(false);
        setApprovingRequest(null);
        setShowModal(false);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Failed to approve request");
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleSendWhatsApp = (request: ServiceRequest, otp?: string) => {
    const finalOtp = otp || request.otp || "N/A";
    const message = `*DriveHub - Service Request Approved* 🎉\n\nHello ${request.driverName},\n\nYour service request has been *APPROVED*! ✅\n\n📋 *Request Details:*
━━━━━━━━━━━━━━━━━━━
🆔 *Request ID:* ${request.id}
🚗 *Vehicle:* ${request.carRegistration}
📱 *Service:* ${getTypeLabel(request.type)}
💰 *Amount:* ₹${request.amount?.toLocaleString()}
🔐 *OTP:* ${finalOtp}
━━━━━━━━━━━━━━━━━━━

${
  request.type === "cash"
    ? `📊 *Repayment Details:*
• Interest Rate: ${request.interestRate || 13}%
• Interest Amount: ₹${request.interest?.toLocaleString() || 0}
• Total Repayable: ₹${request.totalRepayable?.toLocaleString() || 0}
• Period: ${request.repaymentDays || 7} days
• Daily Payment: ₹${Math.ceil((request.totalRepayable || request.amount) / (request.repaymentDays || 7)).toLocaleString()}

`
    : ""
}
📍 *Instructions:*
1. Show this OTP to the cashier/attendant
2. The amount will be processed within 30 minutes
3. Keep this message for reference

Need help? Contact support.

Thank you for choosing DriveHub! 🚀`;

    const whatsappUrl = `https://wa.me/${request.driverPhone?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCopyOtp = (otp: string) => {
    navigator.clipboard.writeText(otp);
    setCopiedOtp(otp);
    setTimeout(() => setCopiedOtp(null), 2000);
  };

  const handleReject = async (request: ServiceRequest) => {
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
          fetchRequests();
          setShowModal(false);
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

  const handleComplete = async (request: ServiceRequest) => {
    try {
      const response = await fetch("/api/admin/requests/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
        }),
      });
      if (response.ok) {
        alert(`✅ Marked ${request.id} as completed`);
        fetchRequests();
        setShowModal(false);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to complete request");
      }
    } catch (error) {
      console.error("Error completing request:", error);
      alert("Failed to complete request");
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    const config = {
      pending: {
        icon: Clock,
        text: "Pending",
        color: "bg-yellow-100 text-yellow-700",
      },
      approved: {
        icon: CheckCircle,
        text: "Approved",
        color: "bg-blue-100 text-blue-700",
      },
      completed: {
        icon: CheckCircle,
        text: "Completed",
        color: "bg-green-100 text-green-700",
      },
      rejected: {
        icon: XCircle,
        text: "Rejected",
        color: "bg-red-100 text-red-700",
      },
    };
    const { icon: Icon, text, color } = config[status];
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${color}`}
      >
        <Icon className="w-3 h-3" />
        {text}
      </span>
    );
  };

  const getTypeIcon = (type: RequestType) => {
    switch (type) {
      case "fuel":
        return Fuel;
      case "airtime":
        return Smartphone;
      case "cash":
        return DollarSign;
      case "carwash":
        return Car;
    }
  };

  const getTypeColor = (type: RequestType) => {
    switch (type) {
      case "fuel":
        return "bg-green-100 text-green-700";
      case "airtime":
        return "bg-blue-100 text-blue-700";
      case "cash":
        return "bg-yellow-100 text-yellow-700";
      case "carwash":
        return "bg-purple-100 text-purple-700";
    }
  };

  const getTypeLabel = (type: RequestType) => {
    switch (type) {
      case "fuel":
        return "Fuel";
      case "airtime":
        return "Airtime";
      case "cash":
        return "Cash Loan";
      case "carwash":
        return "Car Wash";
    }
  };

  const filteredRequests = requests
    .filter((r) => selectedTab === "all" || r.status === selectedTab)
    .filter((r) => selectedType === "all" || r.type === selectedType)
    .filter(
      (r) =>
        r.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.carRegistration?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  // Approval Modal Component
  const ApprovalModal = () => {
    if (!approvingRequest) return null;

    const TypeIcon = getTypeIcon(approvingRequest.type);
    const whatsappNumber = approvingRequest.driverPhone?.replace(/[^0-9]/g, "");

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => !approvalLoading && setShowApproveModal(false)}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-[#3A7717] to-[#72bf00] rounded-t-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Approve Request
                  </h2>
                  <p className="text-white/80 text-sm">
                    Review and confirm approval
                  </p>
                </div>
              </div>
              {!approvalLoading && (
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </div>

          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Request Summary */}
            <div className="bg-[#eafde7] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TypeIcon className="w-4 h-4 text-[#3A7717]" />
                <h3 className="font-semibold text-[#01312D]">
                  Request Summary
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Driver:</span>
                  <span className="font-semibold text-[#01312D]">
                    {approvingRequest.driverName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vehicle:</span>
                  <span className="font-semibold text-[#01312D]">
                    {approvingRequest.carRegistration}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-semibold text-[#01312D]">
                    {getTypeLabel(approvingRequest.type)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-[#3A7717] text-lg">
                    ₹{approvingRequest.amount?.toLocaleString()}
                  </span>
                </div>
                {approvingRequest.type === "cash" && (
                  <>
                    <div className="flex justify-between pt-2 border-t border-[#bff202]/20">
                      <span className="text-gray-600">Interest Rate:</span>
                      <span className="font-semibold text-[#01312D]">
                        {approvingRequest.interestRate || 13}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interest Amount:</span>
                      <span className="font-semibold text-[#01312D]">
                        ₹{approvingRequest.interest?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Repayable:</span>
                      <span className="font-bold text-[#01312D]">
                        ₹{approvingRequest.totalRepayable?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Repayment Period:</span>
                      <span className="font-semibold text-[#01312D]">
                        {approvingRequest.repaymentDays} days
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* OTP Section */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <label className="block text-yellow-800 font-semibold mb-2 text-sm">
                🔐 One-Time Password (OTP)
              </label>
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-white px-4 py-3 rounded-xl font-mono text-2xl font-bold text-center tracking-wider text-[#01312D] border border-yellow-300">
                  {generatedOtp}
                </code>
                <button
                  onClick={() => handleCopyOtp(generatedOtp)}
                  className="p-3 bg-white rounded-xl border border-yellow-300 hover:bg-yellow-100 transition-colors"
                  title="Copy OTP"
                >
                  {copiedOtp === generatedOtp ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-yellow-700" />
                  )}
                </button>
              </div>
              <p className="text-xs text-yellow-700 mt-2">
                This OTP will be sent to the driver and required for service
                fulfillment
              </p>
            </div>

            {/* Driver Contact Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-2 text-sm flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Driver Contact
              </h3>
              <p className="text-sm text-gray-600">
                {approvingRequest.driverPhone}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {approvingRequest.driverEmail}
              </p>
            </div>

            {/* Confirmation Note */}
            <div className="bg-blue-50 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-xs text-blue-800">
                    Approving this request will:
                  </p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-0.5 list-disc list-inside">
                    <li>Generate the OTP shown above</li>
                    <li>Mark the request as "Approved"</li>
                    <li>Allow driver to use the OTP for service</li>
                    <li>You can send the OTP via WhatsApp after approval</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#bff202]/20 p-5 flex gap-3">
            <button
              onClick={() => setShowApproveModal(false)}
              disabled={approvalLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmApprove}
              disabled={approvalLoading}
              className="flex-1 bg-gradient-to-r from-[#3A7717] to-[#72bf00] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
            >
              {approvalLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirm Approval
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ViewDetailsModal = ({
    request,
    onClose,
  }: {
    request: ServiceRequest;
    onClose: () => void;
  }) => {
    const TypeIcon = getTypeIcon(request.type);

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
                  Request Details
                </h2>
                <p className="text-xs text-gray-500">ID: {request.id}</p>
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
                <User className="w-4 h-4 text-[#3A7717]" />
                Driver Information
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Name:</span>{" "}
                  {request.driverName}
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
                  <span className="text-gray-500">Car Reg:</span>{" "}
                  {request.carRegistration}
                </p>
                <p>
                  <span className="text-gray-500">Location:</span>{" "}
                  {request.location}
                </p>
              </div>
            </div>

            {/* Request Details */}
            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#3A7717]" />
                Request Details
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Service:</span>{" "}
                  {getTypeLabel(request.type)}
                </p>
                <p>
                  <span className="text-gray-500">Amount:</span> ₹
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
                      <span className="text-gray-500">Interest Amount:</span> ₹
                      {request.interest?.toLocaleString()}
                    </p>
                    <p>
                      <span className="text-gray-500">Total Repayable:</span> ₹
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
                  {new Date(request.requestDate).toLocaleString()}
                </p>
                {request.approvedDate && (
                  <p>
                    <span className="text-gray-500">Approved Date:</span>{" "}
                    {new Date(request.approvedDate).toLocaleString()}
                  </p>
                )}
                {request.otp && (
                  <div className="mt-2 pt-2 border-t border-[#bff202]/20">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">OTP:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-3 py-1 rounded-lg font-mono text-lg font-bold text-[#01312D]">
                          {request.otp}
                        </code>
                        <button
                          onClick={() => handleCopyOtp(request.otp!)}
                          className="p-1.5 bg-[#eafde7] rounded-lg hover:bg-[#bff202]/30 transition-colors"
                        >
                          {copiedOtp === request.otp ? (
                            <Check className="w-4 h-4 text-[#3A7717]" />
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
                  onClick={() => openApproveModal(request)}
                  className="flex-1 bg-[#3A7717] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Request
                </button>
                <button
                  onClick={() => handleReject(request)}
                  className="flex-1 bg-red-500 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}
            {request.status === "approved" && (
              <>
                <button
                  onClick={() => handleSendWhatsApp(request, request.otp)}
                  className="flex-1 bg-[#25D366] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send WhatsApp
                </button>
                <button
                  onClick={() => handleComplete(request)}
                  className="flex-1 bg-[#01312D] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Completed
                </button>
              </>
            )}
            {request.status === "completed" && (
              <button
                onClick={onClose}
                className="w-full bg-gray-500 text-white py-2 rounded-xl font-semibold"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#3A7717] animate-spin mx-auto mb-4" />
          <p className="text-[#01312D]">Loading service requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#01312D]">
            Service Requests
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage and approve driver service requests
          </p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-xl font-bold text-[#01312D]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Approved</p>
          <p className="text-xl font-bold text-blue-600">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Completed</p>
          <p className="text-xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Total Value</p>
          <p className="text-xl font-bold text-[#3A7717]">
            ₹{stats.totalAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, registration, or request ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as any)}
          className="px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
        >
          <option value="all">All Types</option>
          <option value="fuel">Fuel</option>
          <option value="airtime">Airtime</option>
          <option value="cash">Cash Loan</option>
          <option value="carwash">Car Wash</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#bff202]/20 overflow-x-auto pb-0">
        {["all", "pending", "approved", "completed", "rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab as any)}
            className={`px-4 py-2 font-semibold capitalize transition-all whitespace-nowrap ${selectedTab === tab ? "text-[#3A7717] border-b-2 border-[#3A7717]" : "text-gray-500"}`}
          >
            {tab}
            {tab === "pending" && stats.pending > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {stats.pending}
              </span>
            )}
            {tab === "approved" && stats.approved > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                {stats.approved}
              </span>
            )}
            {tab === "completed" && stats.completed > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">
                {stats.completed}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#bff202]/20">
            <div className="w-20 h-20 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500">No requests found</p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const TypeIcon = getTypeIcon(request.type);
            return (
              <div
                key={request.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTypeColor(request.type)}`}
                    >
                      <TypeIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-[#01312D]">
                          {getTypeLabel(request.type)}
                        </p>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm font-semibold text-[#01312D] mt-1">
                        {request.driverName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {request.carRegistration}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-[#01312D]">
                      ₹{request.amount?.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(request.requestDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowModal(true);
                    }}
                    className="flex-1 py-2 bg-[#eafde7] rounded-lg text-[#01312D] text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  {request.status === "pending" && (
                    <>
                      <button
                        onClick={() => openApproveModal(request)}
                        className="flex-1 py-2 bg-[#3A7717] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(request)}
                        className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                  {request.status === "approved" && (
                    <>
                      <button
                        onClick={() => handleSendWhatsApp(request, request.otp)}
                        className="flex-1 py-2 bg-[#25D366] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        WhatsApp
                      </button>
                      <button
                        onClick={() => handleComplete(request)}
                        className="flex-1 py-2 bg-[#01312D] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Complete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {showModal && selectedRequest && (
        <ViewDetailsModal
          request={selectedRequest}
          onClose={() => setShowModal(false)}
        />
      )}
      {showApproveModal && <ApprovalModal />}
    </div>
  );
}
