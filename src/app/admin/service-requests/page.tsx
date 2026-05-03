// src/app/admin/service-requests/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
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
  MessageCircle,
  FileText,
  ImageIcon,
  Truck,
} from "lucide-react";
import { toPng } from "html-to-image";

type RequestType = "fuel" | "airtime" | "cash" | "carwash";
type RequestStatus = "pending" | "approved" | "sent" | "completed" | "rejected";

interface ServiceRequest {
  id: string;
  _id?: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  carNumber: string;
  carModel?: string;
  location: string;
  type: RequestType;
  amount: number;
  actualAmount?: number;
  fuelType?: "petrol" | "diesel";
  contactPhone?: string;
  interest?: number;
  totalRepayable?: number;
  repaymentDays?: number;
  interestRate?: number;
  status: RequestStatus;
  otp?: string;
  requestDate: string;
  approvedDate?: string;
  sentDate?: string;
  completedDate?: string;
  popUrl?: string;
  popPublicId?: string;
  popUploadedAt?: string;
  dailyPayment?: number;
}

export default function AdminServiceRequestsPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<
    "all" | "pending" | "approved" | "sent" | "completed" | "rejected"
  >("pending");
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(
    null,
  );
  const [showModal, setShowModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showSentModal, setShowSentModal] = useState(false);
  const [approvingRequest, setApprovingRequest] =
    useState<ServiceRequest | null>(null);
  const [sentRequest, setSentRequest] = useState<ServiceRequest | null>(null);
  const [approvedRequest, setApprovedRequest] = useState<ServiceRequest | null>(
    null,
  );
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [sentLoading, setSentLoading] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
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
    sent: 0,
    completed: 0,
    rejected: 0,
    totalRequestedAmount: 0,
    totalActualAmount: 0,
    totalInterest: 0,
    totalRepayable: 0,
  });

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingRequest, setRejectingRequest] =
    useState<ServiceRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/admin/requests");
      if (response.ok) {
        const data = await response.json();
        const requestsWithId = (data.requests || []).map((req: any) => ({
          ...req,
          id: req.id || req._id?.toString(),
        }));
        setRequests(requestsWithId);

        // Calculate stats
        const totalRequestedAmount = requestsWithId.reduce(
          (sum: number, r: ServiceRequest) => sum + (r.amount || 0),
          0,
        );
        const totalActualAmount = requestsWithId.reduce(
          (sum: number, r: ServiceRequest) =>
            sum + (r.actualAmount || r.amount || 0),
          0,
        );
        const totalInterest = requestsWithId.reduce(
          (sum: number, r: ServiceRequest) => sum + (r.interest || 0),
          0,
        );
        const totalRepayable = requestsWithId.reduce(
          (sum: number, r: ServiceRequest) =>
            sum + (r.totalRepayable || r.amount || 0),
          0,
        );

        setStats({
          total: data.total || 0,
          pending: data.pending || 0,
          approved: data.approved || 0,
          sent: data.sent || 0,
          completed: data.completed || 0,
          rejected: data.rejected || 0,
          totalRequestedAmount,
          totalActualAmount,
          totalInterest,
          totalRepayable,
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
        const updatedRequest = {
          ...approvingRequest,
          otp: generatedOtp,
          status: "approved" as RequestStatus,
        };
        setApprovedRequest(updatedRequest);
        setShowApproveModal(false);
        setShowWhatsAppModal(true);
        await fetchRequests();
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

  const handleMarkAsSent = async (request: ServiceRequest) => {
    setSentLoading(true);
    try {
      const response = await fetch("/api/admin/requests/sent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
        }),
      });

      // First check if response is ok before trying to parse JSON
      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(
          `✅ Request ${request.id.slice(-6).toUpperCase()} marked as SENT! The driver has been notified.`,
        );
        setShowSuccessModal(true);
        await fetchRequests();
        setShowSentModal(false);
        setSentRequest(null);
        setShowModal(false);
      } else {
        // Try to get error message, but handle case where response is not JSON
        let errorMessage = "Failed to mark as sent";
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          console.error("Could not parse error response:", e);
          errorMessage = `Server responded with status ${response.status}`;
        }
        setErrorMessage(errorMessage);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error marking as sent:", error);
      setErrorMessage("Failed to mark as sent. Please check your connection.");
      setShowErrorModal(true);
    } finally {
      setSentLoading(false);
    }
  };

  const handleComplete = (request: ServiceRequest) => {
    // This is now handled by driver side, so just show info
    setSuccessMessage(
      `ℹ️ Request will be marked as completed when the driver confirms service delivery.`,
    );
    setShowSuccessModal(true);
  };

  const handleReject = (request: ServiceRequest) => {
    setRejectingRequest(request);
    setRejectionReason("");
    setShowRejectModal(true);
    setShowModal(false);
  };

  const handleConfirmReject = async () => {
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
        setSuccessMessage(
          `❌ Request ${rejectingRequest.id.slice(-6).toUpperCase()} rejected successfully`,
        );
        setShowSuccessModal(true);
        fetchRequests();
        setShowRejectModal(false);
        setRejectingRequest(null);
        setRejectionReason("");
        setShowModal(false);
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

  const handleCopyOtp = (otp: string) => {
    navigator.clipboard.writeText(otp);
    setCopiedOtp(otp);
    setTimeout(() => setCopiedOtp(null), 2000);
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
      sent: {
        icon: Truck,
        text: "Sent",
        color: "bg-purple-100 text-purple-700",
      },
      completed: {
        icon: CheckCircle,
        text: "Completed",
        color: "bg-[#3A7717]/10 text-[#3A7717]",
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
        return "bg-[#3A7717]/10 text-[#3A7717]";
      case "airtime":
        return "bg-[#72BF00]/10 text-[#72BF00]";
      case "cash":
        return "bg-[#BFF202]/20 text-[#01312D]";
      case "carwash":
        return "bg-[#EAFDE7] text-[#01312D]";
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

  const getTransactionLabel = (type: RequestType) => {
    if (type === "cash" || type === "airtime") {
      return "Transaction Number";
    }
    return "OTP Code";
  };

  const filteredRequests = requests
    .filter((r) => selectedTab === "all" || r.status === selectedTab)
    .filter((r) => selectedType === "all" || r.type === selectedType)
    .filter(
      (r) =>
        r.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.carNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  // Get current date and time
  const getCurrentDateTime = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };
    return now.toLocaleString("en-US", options);
  };

  const getCurrentDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return now.toLocaleString("en-US", options);
  };

  const getCurrentTime = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };
    return now.toLocaleString("en-US", options);
  };

  const getInstructionText = (type: RequestType) => {
    if (type === "cash") {
      return "This is your loan transaction number";
    }
    if (type === "airtime") {
      return "This is your airtime transaction number";
    }
    return "Show this code at the service center";
  };

  // View Details Modal Component
  const ViewDetailsModal = ({
    request,
    onClose,
  }: {
    request: ServiceRequest;
    onClose: () => void;
  }) => {
    const TypeIcon = getTypeIcon(request.type);
    const transactionLabel = getTransactionLabel(request.type);
    const hasActualAmount = !!request.actualAmount;
    const amountDifference = request.actualAmount
      ? request.actualAmount - request.amount
      : 0;
    const displayInterest = request.interest || 0;
    const displayTotal = request.totalRepayable || request.amount;
    const displayDailyPayment = request.dailyPayment || 0;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-[#BFF202]/20 p-5 flex justify-between items-center">
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
                <p className="text-xs text-gray-500">
                  ID: {request.id?.slice(-6).toUpperCase()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#EAFDE7] rounded-lg"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Driver Information */}
            <div className="bg-[#EAFDE7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[#3A7717]" /> Driver Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-semibold text-[#01312D]">
                    {request.driverName || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-semibold text-[#01312D]">
                    {request.driverEmail || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-semibold text-[#01312D]">
                    {request.driverPhone || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Car Registration:</span>
                  <span className="font-semibold text-[#01312D]">
                    {request.carNumber || "N/A"}
                  </span>
                </div>
                {request.carModel && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Car Model:</span>
                    <span className="font-semibold text-[#01312D]">
                      {request.carModel}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Request Details */}
            <div className="bg-[#EAFDE7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#3A7717]" /> Request Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Service:</span>
                  <span className="font-semibold text-[#01312D]">
                    {getTypeLabel(request.type)}
                  </span>
                </div>

                <div className="border-t border-[#BFF202]/20 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Requested Amount:</span>
                    <span className="font-semibold text-[#01312D]">
                      R{request.amount?.toLocaleString()}
                    </span>
                  </div>
                  {hasActualAmount && (
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-500">
                        Actual Amount Paid (POP):
                      </span>
                      <span
                        className={`font-bold ${amountDifference !== 0 ? "text-[#3A7717]" : "text-[#01312D]"}`}
                      >
                        R{request.actualAmount?.toLocaleString()}
                        {amountDifference !== 0 && (
                          <span className="text-xs ml-1 text-[#72BF00]">
                            (
                            {amountDifference > 0
                              ? `+R${amountDifference}`
                              : `-R${Math.abs(amountDifference)}`}
                            )
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-[#BFF202]/10 rounded-lg p-3 mt-2">
                  <p className="text-xs font-semibold text-[#01312D] mb-2">
                    📊 Financial Summary
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interest Rate:</span>
                      <span className="font-semibold text-[#01312D]">
                        {request.interestRate || 13}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interest Amount:</span>
                      <span className="font-semibold text-[#3A7717]">
                        + R{displayInterest.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-[#BFF202]/20">
                      <span className="font-semibold text-[#01312D]">
                        Total Repayable:
                      </span>
                      <span className="font-bold text-[#3A7717]">
                        R{displayTotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Daily Payment ({request.repaymentDays || 7} days):
                      </span>
                      <span className="font-semibold text-[#01312D]">
                        R{displayDailyPayment.toLocaleString()}/day
                      </span>
                    </div>
                  </div>
                </div>

                {request.fuelType && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fuel Type:</span>
                    <span className="font-semibold capitalize text-[#01312D]">
                      {request.fuelType}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Request Date:</span>
                  <span className="font-semibold text-[#01312D]">
                    {new Date(request.requestDate).toLocaleString()}
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
                {request.sentDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sent Date:</span>
                    <span className="font-semibold text-[#01312D]">
                      {new Date(request.sentDate).toLocaleString()}
                    </span>
                  </div>
                )}
                {request.completedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Completed Date:</span>
                    <span className="font-semibold text-[#01312D]">
                      {new Date(request.completedDate).toLocaleString()}
                    </span>
                  </div>
                )}
                {request.popUploadedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">POP Uploaded:</span>
                    <span className="font-semibold text-[#01312D]">
                      {new Date(request.popUploadedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* POP Document Section */}
            {request.popUrl && (
              <div className="bg-[#EAFDE7] rounded-xl p-4">
                <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#3A7717]" /> Proof of
                  Payment (POP)
                </h3>
                <div className="space-y-3">
                  <a
                    href={request.popUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#3A7717] font-semibold hover:underline"
                  >
                    <ImageIcon className="w-4 h-4" />
                    View Receipt
                  </a>
                  {request.popUrl && (
                    <div className="mt-2 border border-[#BFF202]/20 rounded-lg overflow-hidden bg-white p-2">
                      <img
                        src={request.popUrl}
                        alt="Proof of Payment"
                        className="max-w-full h-auto max-h-48 object-contain mx-auto"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.insertAdjacentHTML(
                              "beforeend",
                              '<p class="text-xs text-red-500 text-center p-2">Failed to load image. <a href="' +
                                request.popUrl +
                                '" target="_blank" class="underline">Click here to view</a></p>',
                            );
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* OTP Section */}
            {request.otp && (
              <div className="bg-[#BFF202]/20 border border-[#BFF202] rounded-xl p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#01312D]">
                      {transactionLabel}:
                    </p>
                    <code className="text-2xl md:text-3xl font-bold tracking-wider text-[#01312D] font-mono">
                      {request.otp}
                    </code>
                  </div>
                  <button
                    onClick={() => handleCopyOtp(request.otp!)}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-[#BFF202] hover:bg-[#EAFDE7]"
                  >
                    {copiedOtp === request.otp ? (
                      <Check className="w-4 h-4 text-[#3A7717]" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#01312D]" />
                    )}
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-white border-t border-[#BFF202]/20 p-5 flex flex-col gap-3">
            {request.status === "pending" && (
              <>
                <button
                  onClick={() => openApproveModal(request)}
                  className="w-full bg-[#3A7717] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#2d5a12] transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Approve Request
                </button>
                <button
                  onClick={() => handleReject(request)}
                  className="w-full bg-red-500 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </>
            )}
            {request.status === "approved" && (
              <>
                <button
                  onClick={() => {
                    setSentRequest(request);
                    setShowSentModal(true);
                    setShowModal(false);
                  }}
                  className="w-full bg-[#01312D] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#3A7717] transition-colors"
                >
                  <Truck className="w-4 h-4" /> Mark as Sent
                </button>
                <button
                  onClick={() => {
                    setApprovedRequest(request);
                    setShowWhatsAppModal(true);
                    setShowModal(false);
                  }}
                  className="w-full bg-[#25D366] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Send WhatsApp
                </button>
              </>
            )}
            {request.status === "sent" && (
              <div className="p-3 bg-purple-50 rounded-xl text-center">
                <p className="text-sm text-purple-700">
                  ⏳ Service has been sent. Waiting for driver to confirm
                  completion.
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  The driver will mark this as completed after receiving the
                  service.
                </p>
              </div>
            )}
            {request.status === "completed" && (
              <button
                onClick={onClose}
                className="w-full bg-gray-500 text-white py-2 rounded-xl font-semibold hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Sent Modal Component
  const SentModal = () => {
    if (!sentRequest) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowSentModal(false)}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl p-5">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-[#01312D] mb-2">
              Mark as Sent
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              Confirm that this service has been dispatched/sent to the driver.
            </p>
            <div className="bg-purple-50 rounded-xl p-3 mb-4 text-left">
              <p className="text-sm font-semibold text-purple-800 mb-2">
                Request Details:
              </p>
              <p className="text-sm">
                <strong>Driver:</strong> {sentRequest.driverName}
              </p>
              <p className="text-sm">
                <strong>Service:</strong> {getTypeLabel(sentRequest.type)}
              </p>
              <p className="text-sm">
                <strong>Amount:</strong> R{sentRequest.amount?.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Once marked as sent, the driver will receive the OTP and can
                complete the service on their end.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSentModal(false)}
                className="flex-1 bg-gray-200 text-[#01312D] py-2 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleMarkAsSent(sentRequest)}
                disabled={sentLoading}
                className="flex-1 bg-[#01312D] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                {sentLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Truck className="w-4 h-4" />
                )}
                Confirm Sent
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
          <div className="bg-gradient-to-r from-[#3A7717] to-[#72BF00] rounded-t-2xl p-5">
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
            <div className="w-20 h-20 bg-[#3A7717]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-[#3A7717]" />
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

  // Rejection Modal Component
  const RejectionModal = () => {
    if (!showRejectModal || !rejectingRequest) return null;

    const TypeIcon = getTypeIcon(rejectingRequest.type);
    const displayAmount =
      rejectingRequest.actualAmount || rejectingRequest.amount;

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => !rejectLoading && setShowRejectModal(false)}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Confirm Rejection
                </h2>
                <p className="text-white/80 text-sm">
                  Provide rejection reason
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="bg-[#EAFDE7] rounded-xl p-4">
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
                    {rejectingRequest.driverName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vehicle:</span>
                  <span className="font-semibold text-[#01312D]">
                    {rejectingRequest.carNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-semibold text-[#01312D]">
                    {getTypeLabel(rejectingRequest.type)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-[#3A7717] text-lg">
                    R{displayAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please explain why this request is being rejected..."
                className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl focus:outline-none focus:border-red-500 resize-none"
                rows={4}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will be sent to the driver via email
              </p>
            </div>

            <div className="bg-red-50 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-xs text-red-800">
                    Are you sure you want to reject this request?
                  </p>
                  <ul className="text-xs text-red-700 mt-1 space-y-0.5 list-disc list-inside">
                    <li>This action cannot be undone</li>
                    <li>The driver will be notified via email</li>
                    <li>The request will be moved to rejected tab</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 p-5 flex gap-3">
            <button
              onClick={() => {
                setShowRejectModal(false);
                setRejectingRequest(null);
                setRejectionReason("");
              }}
              disabled={rejectLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              disabled={rejectLoading}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
            >
              {rejectLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Confirm Rejection
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // WhatsApp Modal Component - Modern styling with prominent validity notice
  const WhatsAppModal = () => {
    if (!approvedRequest) return null;

    const receiptRef = useRef<HTMLDivElement>(null);
    const [imageGenerating, setImageGenerating] = useState(false);
    const [showDownloadSuccessModal, setShowDownloadSuccessModal] =
      useState(false);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
      null,
    );

    const displayAmount =
      approvedRequest.actualAmount || approvedRequest.amount;
    const displayTotal =
      approvedRequest.totalRepayable || approvedRequest.amount;
    const displayDailyPayment = approvedRequest.dailyPayment || 0;
    const hasActualAmount = !!approvedRequest.actualAmount;
    const transactionLabel = getTransactionLabel(approvedRequest.type);
    const currentDateTime = getCurrentDateTime();
    const currentDate = getCurrentDate();
    const currentTime = getCurrentTime();
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 1);
    const expiryFormatted = expiryTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const generateImage = async () => {
      if (!receiptRef.current) return null;

      setImageGenerating(true);

      try {
        const element = receiptRef.current;

        element.style.position = "fixed";
        element.style.left = "0";
        element.style.top = "0";
        element.style.zIndex = "9999";
        element.style.visibility = "visible";
        element.style.opacity = "1";

        const images = element.getElementsByTagName("img");
        await Promise.all(
          Array.from(images).map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          }),
        );

        await new Promise((resolve) => setTimeout(resolve, 100));

        const dataUrl = await toPng(element, {
          quality: 1,
          backgroundColor: "#ffffff",
          pixelRatio: 2,
          cacheBust: true,
        });

        element.style.position = "absolute";
        element.style.left = "-9999px";
        element.style.top = "-9999px";
        element.style.zIndex = "-1";
        element.style.visibility = "hidden";

        return dataUrl;
      } catch (error) {
        console.error("Error generating image:", error);
        const element = receiptRef.current;
        if (element) {
          element.style.position = "absolute";
          element.style.left = "-9999px";
          element.style.top = "-9999px";
          element.style.zIndex = "-1";
          element.style.visibility = "hidden";
        }
        return null;
      } finally {
        setImageGenerating(false);
      }
    };

    const handleDownloadImage = async () => {
      const dataUrl = await generateImage();
      if (dataUrl) {
        const link = document.createElement("a");
        link.download = `Kapuka_Receipt_${approvedRequest.id.slice(-6)}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setGeneratedImageUrl(dataUrl);
        setShowDownloadSuccessModal(true);
      } else {
        setErrorMessage("Failed to generate receipt image. Please try again.");
        setShowErrorModal(true);
      }
    };

    const handleSendViaWhatsApp = async () => {
      const dataUrl = await generateImage();
      if (!dataUrl) {
        setErrorMessage("Failed to generate receipt image. Please try again.");
        setShowErrorModal(true);
        return;
      }

      setWhatsappLoading(true);

      try {
        const finalOtp = approvedRequest.otp || generatedOtp;
        const baseAmount =
          approvedRequest.actualAmount || approvedRequest.amount;
        const totalRepayable = approvedRequest.totalRepayable || baseAmount;
        const dailyPayment =
          approvedRequest.dailyPayment ||
          Math.ceil(totalRepayable / (approvedRequest.repaymentDays || 7));

        const message = `*🏆 KAPUKA - SERVICE APPROVED* 🏆

✅ *Your request has been APPROVED!*

━━━━━━━━━━━━━━━━━━━
📋 *REQUEST DETAILS*
━━━━━━━━━━━━━━━━━━━
🆔 *ID:* ${approvedRequest.id.slice(-6).toUpperCase()}
🚗 *Vehicle:* ${approvedRequest.carNumber}
📱 *Service:* ${getTypeLabel(approvedRequest.type)}
${hasActualAmount ? `💰 *Requested:* R${approvedRequest.amount?.toLocaleString()}\n💵 *Actual:* R${baseAmount.toLocaleString()}\n` : `💰 *Amount:* R${baseAmount.toLocaleString()}\n`}
🔐 *${transactionLabel}:* ${finalOtp}
📅 *Date:* ${currentDate}
⏰ *Time:* ${currentTime}

━━━━━━━━━━━━━━━━━━━
💰 *REPAYMENT SUMMARY*
━━━━━━━━━━━━━━━━━━━
• Interest Rate: ${approvedRequest.interestRate || 13}%
• Interest Amount: R${approvedRequest.interest?.toLocaleString() || 0}
• Total Repayable: R${totalRepayable.toLocaleString()}
• Daily Payment: R${dailyPayment.toLocaleString()}/day
• Period: ${approvedRequest.repaymentDays || 7} days

━━━━━━━━━━━━━━━━━━━
⏰ *VALID FOR 1 HOUR*
━━━━━━━━━━━━━━━━━━━

Thank you for choosing Kapuka! 🚀`;

        const cleanPhone = approvedRequest.driverPhone.replace(/[^0-9]/g, "");
        let fullPhone = cleanPhone;
        if (!cleanPhone.startsWith("27") && cleanPhone.length === 9) {
          fullPhone = `27${cleanPhone}`;
        }

        const whatsappUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");

        const link = document.createElement("a");
        link.download = `Kapuka_Receipt_${approvedRequest.id.slice(-6)}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
          setWhatsappLoading(false);
          setShowWhatsAppModal(false);
          setApprovedRequest(null);
          setApprovingRequest(null);
        }, 1500);
      } catch (error) {
        console.error("Error sending via WhatsApp:", error);
        setErrorMessage(
          "Failed to send. The receipt has been downloaded to your device.",
        );
        setShowErrorModal(true);
        setWhatsappLoading(false);
      }
    };

    const DownloadSuccessModal = () => {
      if (!showDownloadSuccessModal) return null;

      return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDownloadSuccessModal(false)}
          ></div>
          <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-t-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Receipt Ready!
                  </h2>
                  <p className="text-white/80 text-sm">Image saved to device</p>
                </div>
              </div>
            </div>

            <div className="p-5 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-10 h-10 text-green-600" />
              </div>
              <p className="text-[#01312D] font-semibold mb-2">
                Receipt downloaded successfully!
              </p>
              <p className="text-gray-500 text-sm">
                The receipt has been saved to your device's downloads folder.
              </p>
            </div>

            <div className="border-t border-gray-100 p-5">
              <button
                onClick={() => setShowDownloadSuccessModal(false)}
                className="w-full bg-[#01312D] text-white py-2 rounded-xl font-semibold hover:bg-[#3A7717] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <>
        {/* Hidden receipt for image generation - Modern Styling */}
        <div
          ref={receiptRef}
          style={{
            position: "absolute",
            left: "-9999px",
            top: "-9999px",
            width: "450px",
            background: "linear-gradient(135deg, #ffffff 0%, #f8faf8 100%)",
            borderRadius: "24px",
            padding: "0",
            fontFamily:
              "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            zIndex: -1,
            visibility: "hidden",
            overflow: "hidden",
          }}
        >
          {/* Decorative Top Bar */}
          <div
            style={{
              background: "linear-gradient(135deg, #01312D 0%, #3A7717 100%)",
              padding: "20px 24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontSize: "32px" }}>🚗</span>
              <h1
                style={{
                  color: "white",
                  margin: 0,
                  fontSize: "28px",
                  fontWeight: "800",
                  letterSpacing: "-0.5px",
                }}
              >
                Kapuka
              </h1>
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.9)",
                margin: 0,
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              Service Confirmation Receipt
            </p>
          </div>

          {/* OTP/Promo Section */}
          <div style={{ padding: "24px", background: "white" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #FFF5E6 0%, #FFE5CC 100%)",
                borderRadius: "20px",
                padding: "24px",
                textAlign: "center",
                border: "1px solid rgba(191, 242, 2, 0.3)",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(58, 119, 23, 0.1)",
                  padding: "6px 16px",
                  borderRadius: "50px",
                  marginBottom: "16px",
                }}
              >
                <span style={{ fontSize: "16px" }}>🔐</span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#3A7717",
                  }}
                >
                  {transactionLabel}
                </span>
              </div>
              <div
                style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "20px",
                  marginBottom: "16px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                }}
              >
                <code
                  style={{
                    fontSize: "48px",
                    fontWeight: "800",
                    letterSpacing: "8px",
                    color: "#01312D",
                    fontFamily: "'Courier New', 'Fira Code', monospace",
                    display: "block",
                  }}
                >
                  {approvedRequest.otp || generatedOtp}
                </code>
              </div>
              <p
                style={{
                  color: "#78350F",
                  fontSize: "12px",
                  fontWeight: "500",
                  margin: 0,
                }}
              >
                {getInstructionText(approvedRequest.type)}
              </p>
            </div>
          </div>

          {/* Details Section */}
          <div style={{ padding: "0 24px 24px 24px", background: "white" }}>
            <div
              style={{
                background: "#EAFDE7",
                borderRadius: "20px",
                padding: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                  paddingBottom: "12px",
                  borderBottom: "1px dashed rgba(191, 242, 2, 0.5)",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#01312D",
                  }}
                >
                  DRIVER INFORMATION
                </span>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#666" }}>Name:</span>
                  <strong style={{ fontSize: "13px", color: "#01312D" }}>
                    {approvedRequest.driverName}
                  </strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#666" }}>
                    Vehicle:
                  </span>
                  <strong style={{ fontSize: "13px", color: "#01312D" }}>
                    {approvedRequest.carNumber}
                  </strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#666" }}>
                    Service:
                  </span>
                  <strong style={{ fontSize: "13px", color: "#3A7717" }}>
                    {getTypeLabel(approvedRequest.type)}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "16px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#666" }}>
                    Requested Amount:
                  </span>
                  <strong style={{ fontSize: "18px", color: "#01312D" }}>
                    R{displayAmount.toLocaleString()}
                  </strong>
                </div>
                <div
                  style={{
                    background: "#BFF20220",
                    borderRadius: "12px",
                    padding: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#666" }}>
                      Interest ({approvedRequest.interestRate || 13}%):
                    </span>
                    <strong style={{ fontSize: "12px", color: "#3A7717" }}>
                      + R{approvedRequest.interest?.toLocaleString() || 0}
                    </strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      paddingTop: "8px",
                      borderTop: "1px dashed rgba(191, 242, 2, 0.3)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#01312D",
                      }}
                    >
                      Total Repayable:
                    </span>
                    <strong style={{ fontSize: "16px", color: "#3A7717" }}>
                      R{displayTotal.toLocaleString()}
                    </strong>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ fontSize: "12px", color: "#666" }}>
                      Daily Payment:
                    </span>
                    <strong style={{ fontSize: "12px", color: "#01312D" }}>
                      R{displayDailyPayment.toLocaleString()}/day
                    </strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  color: "#666",
                }}
              >
                <span>📅 {currentDate}</span>
                <span>⏰ {currentTime}</span>
              </div>
            </div>
          </div>

          {/* Validity Banner - PROMINENT */}
          <div
            style={{
              background: "linear-gradient(135deg, #BFF202 0%, #72BF00 100%)",
              padding: "20px 24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontSize: "28px" }}>⏰</span>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: "800",
                  color: "#01312D",
                  letterSpacing: "-0.5px",
                }}
              >
                VALID FOR 1 HOUR
              </span>
              <span style={{ fontSize: "28px" }}>⏰</span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                color: "#01312D",
                opacity: 0.8,
                fontWeight: "500",
              }}
            >
              Expires at{" "}
              {expiryTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
            <div
              style={{
                marginTop: "12px",
                background: "#01312D20",
                borderRadius: "8px",
                padding: "6px 12px",
                display: "inline-block",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#01312D",
                }}
              >
                ✓ Keep this receipt for reference
              </span>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "16px 24px",
              textAlign: "center",
              background: "#f8faf8",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                color: "#999",
                letterSpacing: "0.5px",
              }}
            >
              Kapuka Services • Customer Support: 24/7
            </p>
            <p style={{ margin: "4px 0 0 0", fontSize: "9px", color: "#bbb" }}>
              Powered by Kapuka Driver Services
            </p>
          </div>
        </div>

        {/* Modal UI - Modern Design */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() =>
              !whatsappLoading &&
              !imageGenerating &&
              setShowWhatsAppModal(false)
            }
          ></div>
          <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-t-2xl p-5 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Share Receipt
                    </h2>
                    <p className="text-white/80 text-sm">
                      {approvedRequest.driverName}
                    </p>
                  </div>
                </div>
                {!whatsappLoading && !imageGenerating && (
                  <button
                    onClick={() => setShowWhatsAppModal(false)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Driver Info Card */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#3A7717] to-[#72BF00] rounded-full flex items-center justify-center shadow-md">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#01312D] text-lg">
                      {approvedRequest.driverName}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {approvedRequest.carNumber}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                    <Phone className="w-4 h-4 text-[#3A7717]" />
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-semibold text-[#01312D]">
                      {approvedRequest.driverPhone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                    <DollarSign className="w-4 h-4 text-[#3A7717]" />
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-[#3A7717] text-lg">
                      R{displayAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* OTP Display */}
              <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl p-5 text-center shadow-lg">
                <p className="text-white text-sm font-semibold mb-2 flex items-center justify-center gap-2">
                  <span>🔐</span> {transactionLabel}
                </p>
                <div className="bg-white rounded-xl p-4 mb-3 shadow-inner">
                  <code className="text-3xl md:text-4xl font-bold tracking-wider text-[#01312D] font-mono">
                    {approvedRequest.otp || generatedOtp}
                  </code>
                </div>
                <button
                  onClick={() =>
                    handleCopyOtp(approvedRequest.otp || generatedOtp)
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg text-white font-semibold hover:bg-white/30 transition-all"
                >
                  <Copy className="w-4 h-4" /> Copy Code
                </button>
              </div>

              {/* Validity Notice - PROMINENT */}
              <div className="bg-gradient-to-r from-[#BFF202] to-[#72BF00] rounded-xl p-4 text-center shadow-md">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-2xl">⏰</span>
                  <p className="font-extrabold text-[#01312D] text-lg">
                    VALID FOR 1 HOUR
                  </p>
                  <span className="text-2xl">⏰</span>
                </div>
                <p className="text-xs text-[#01312D] font-medium">
                  Expires at{" "}
                  {expiryTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              </div>

              {/* Date & Time */}
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600">Generated on:</span>
                  </div>
                  <span className="text-xs font-semibold text-[#01312D]">
                    {currentDateTime}
                  </span>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-blue-800">
                      Quick Tips:
                    </p>
                    <ul className="text-xs text-blue-700 mt-1 space-y-0.5 list-disc list-inside">
                      <li>Download receipt image for your records</li>
                      <li>Send via WhatsApp with pre-filled message</li>
                      <li>Receipt valid for 1 hour from generation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#bff202]/20 p-5 flex flex-col gap-3 sticky bottom-0 bg-white">
              <button
                onClick={handleDownloadImage}
                disabled={imageGenerating}
                className="w-full bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
              >
                {imageGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating
                    Receipt...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" /> Download Receipt Image
                  </>
                )}
              </button>
              <button
                onClick={handleSendViaWhatsApp}
                disabled={whatsappLoading || imageGenerating}
                className="w-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
              >
                {whatsappLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" /> Share via WhatsApp
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        <DownloadSuccessModal />
      </>
    );
  };

  // Approval Modal Component
  const ApprovalModal = () => {
    if (!approvingRequest) return null;

    const TypeIcon = getTypeIcon(approvingRequest.type);
    const transactionLabel = getTransactionLabel(approvingRequest.type);
    const displayAmount =
      approvingRequest.actualAmount || approvingRequest.amount;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => !approvalLoading && setShowApproveModal(false)}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-[#3A7717] to-[#72BF00] rounded-t-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Confirm Approval
                  </h2>
                  <p className="text-white/80 text-sm">
                    Review and confirm request approval
                  </p>
                </div>
              </div>
              {!approvalLoading && (
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="p-1 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="bg-[#EAFDE7] rounded-xl p-4">
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
                    {approvingRequest.carNumber}
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
                    R{displayAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#BFF202]/20 border border-[#BFF202] rounded-xl p-4">
              <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                🔐 {transactionLabel}
              </label>
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-white px-4 py-3 rounded-xl font-mono text-2xl font-bold text-center text-[#01312D] border border-[#BFF202]">
                  {generatedOtp}
                </code>
                <button
                  onClick={() => handleCopyOtp(generatedOtp)}
                  className="p-3 bg-white rounded-xl border border-[#BFF202] hover:bg-[#EAFDE7]"
                >
                  {copiedOtp === generatedOtp ? (
                    <Check className="w-5 h-5 text-[#3A7717]" />
                  ) : (
                    <Copy className="w-5 h-5 text-[#01312D]" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t p-5 flex flex-col gap-3">
            <button
              onClick={handleConfirmApprove}
              disabled={approvalLoading}
              className="flex-1 bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              {approvalLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Confirm Approval
                </>
              )}
            </button>
            <button
              onClick={() => setShowApproveModal(false)}
              disabled={approvalLoading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700"
            >
              Cancel
            </button>
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
          className="flex items-center gap-2 px-4 py-2 bg-[#EAFDE7] rounded-xl text-[#01312D] font-semibold hover:bg-[#BFF202]/30"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />{" "}
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#BFF202]/20">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-xl font-bold text-[#01312D]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#BFF202]/20">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#BFF202]/20">
          <p className="text-xs text-gray-500">Approved</p>
          <p className="text-xl font-bold text-blue-600">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#BFF202]/20">
          <p className="text-xs text-gray-500">Sent</p>
          <p className="text-xl font-bold text-purple-600">{stats.sent}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#BFF202]/20">
          <p className="text-xs text-gray-500">Completed</p>
          <p className="text-xl font-bold text-[#3A7717]">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#BFF202]/20">
          <p className="text-xs text-gray-500">Requested</p>
          <p className="text-xl font-bold text-[#01312D]">
            R{stats.totalRequestedAmount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#BFF202]/20">
          <p className="text-xs text-gray-500">Actual</p>
          <p className="text-xl font-bold text-[#3A7717]">
            R{stats.totalActualAmount.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, registration, or request ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#BFF202]/20 rounded-xl focus:outline-none focus:border-[#72BF00]"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as any)}
          className="px-4 py-2 bg-white border border-[#BFF202]/20 rounded-xl focus:outline-none focus:border-[#72BF00]"
        >
          <option value="all">All Types</option>
          <option value="fuel">Fuel</option>
          <option value="airtime">Airtime</option>
          <option value="cash">Cash Loan</option>
          <option value="carwash">Car Wash</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-[#BFF202]/20 overflow-x-auto pb-0">
        {["all", "pending", "approved", "sent", "completed", "rejected"].map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab as any)}
              className={`px-4 py-2 font-semibold capitalize transition-all whitespace-nowrap ${
                selectedTab === tab
                  ? "text-[#3A7717] border-b-2 border-[#3A7717]"
                  : "text-gray-500"
              }`}
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
              {tab === "sent" && stats.sent > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded-full">
                  {stats.sent}
                </span>
              )}
              {tab === "completed" && stats.completed > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-[#3A7717] text-white text-xs rounded-full">
                  {stats.completed}
                </span>
              )}
            </button>
          ),
        )}
      </div>

      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#BFF202]/20">
            <div className="w-20 h-20 bg-[#EAFDE7] rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500">No requests found</p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const TypeIcon = getTypeIcon(request.type);
            const displayAmount = request.actualAmount || request.amount;
            const hasActualAmount = !!request.actualAmount;
            const amountDifference = request.actualAmount
              ? request.actualAmount - request.amount
              : 0;

            return (
              <div
                key={request.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-[#BFF202]/20 hover:shadow-md transition-shadow"
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
                        {hasActualAmount && amountDifference !== 0 && (
                          <span className="text-xs bg-[#BFF202]/20 text-[#01312D] px-2 py-0.5 rounded-full">
                            Amount Adjusted
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-[#01312D] mt-1">
                        {request.driverName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {request.carNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {hasActualAmount ? (
                      <>
                        <p className="text-xl font-bold text-[#3A7717]">
                          R{displayAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400 line-through">
                          R{request.amount?.toLocaleString()}
                        </p>
                      </>
                    ) : (
                      <p className="text-xl font-bold text-[#01312D]">
                        R{request.amount?.toLocaleString()}
                      </p>
                    )}
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
                    className="flex-1 py-2 bg-[#EAFDE7] rounded-lg text-[#01312D] text-xs font-semibold flex items-center justify-center gap-1 hover:bg-[#BFF202]/30 transition-colors"
                  >
                    <Eye className="w-4 h-4" /> Details
                  </button>
                  {request.status === "pending" && (
                    <>
                      <button
                        onClick={() => openApproveModal(request)}
                        className="flex-1 py-2 bg-[#3A7717] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#2d5a12] transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(request)}
                        className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-red-600 transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}
                  {request.status === "approved" && (
                    <button
                      onClick={() => {
                        setSentRequest(request);
                        setShowSentModal(true);
                      }}
                      className="flex-1 py-2 bg-[#01312D] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#3A7717] transition-colors"
                    >
                      <Truck className="w-4 h-4" /> Mark as Sent
                    </button>
                  )}
                  {request.status === "sent" && (
                    <div className="flex-1 py-2 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1">
                      <Clock className="w-4 h-4" /> Awaiting Driver Confirmation
                    </div>
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
      {showWhatsAppModal && approvedRequest && <WhatsAppModal />}
      {showSentModal && sentRequest && <SentModal />}
      {showRejectModal && <RejectionModal />}
      <SuccessModal />
      <ErrorModal />
    </div>
  );
}
