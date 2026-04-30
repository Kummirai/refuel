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
} from "lucide-react";
import { toPng } from "html-to-image";
import { ImageIcon } from "lucide-react";

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
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [approvingRequest, setApprovingRequest] =
    useState<ServiceRequest | null>(null);
  const [approvedRequest, setApprovedRequest] = useState<ServiceRequest | null>(
    null,
  );
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [approvalLoading, setApprovalLoading] = useState(false);
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
    completed: 0,
    rejected: 0,
    totalAmount: 0,
  });

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showCompleteConfirmModal, setShowCompleteConfirmModal] =
    useState(false);
  const [completingRequest, setCompletingRequest] =
    useState<ServiceRequest | null>(null);
  const [completeLoading, setCompleteLoading] = useState(false);

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

  const handleComplete = (request: ServiceRequest) => {
    setCompletingRequest(request);
    setShowCompleteConfirmModal(true);
    setShowModal(false);
  };

  const handleConfirmComplete = async () => {
    if (!completingRequest) return;

    setCompleteLoading(true);
    try {
      const response = await fetch("/api/admin/requests/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: completingRequest.id,
        }),
      });
      if (response.ok) {
        setSuccessMessage(
          `✅ Request ${completingRequest.id.slice(-6).toUpperCase()} marked as completed`,
        );
        setShowSuccessModal(true);
        fetchRequests();
        setShowCompleteConfirmModal(false);
        setCompletingRequest(null);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to complete request");
        setShowErrorModal(true);
        setShowCompleteConfirmModal(false);
        setCompletingRequest(null);
      }
    } catch (error) {
      console.error("Error completing request:", error);
      setErrorMessage("Failed to complete request");
      setShowErrorModal(true);
      setShowCompleteConfirmModal(false);
      setCompletingRequest(null);
    } finally {
      setCompleteLoading(false);
    }
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
          setSuccessMessage(
            `❌ Request ${request.id.slice(-6).toUpperCase()} rejected successfully`,
          );
          setShowSuccessModal(true);
          fetchRequests();
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
      }
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

  // Get transaction label based on service type
  const getTransactionLabel = (type: RequestType) => {
    if (type === "cash" || type === "airtime") {
      return "Transaction Number";
    }
    return "OTP Code";
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

  // Complete Confirmation Modal
  const CompleteConfirmModal = () => {
    if (!showCompleteConfirmModal || !completingRequest) return null;

    const TypeIcon = getTypeIcon(completingRequest.type);

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => !completeLoading && setShowCompleteConfirmModal(false)}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-t-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Confirm Completion
                </h2>
                <p className="text-white/80 text-sm">
                  Mark request as completed
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
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
                    {completingRequest.driverName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vehicle:</span>
                  <span className="font-semibold text-[#01312D]">
                    {completingRequest.carRegistration}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-semibold text-[#01312D]">
                    {getTypeLabel(completingRequest.type)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-[#3A7717] text-lg">
                    ₹{completingRequest.amount?.toLocaleString()}
                  </span>
                </div>
                {completingRequest.otp && (
                  <div className="flex justify-between pt-2 border-t border-[#bff202]/20">
                    <span className="text-gray-600">
                      {getTransactionLabel(completingRequest.type)}:
                    </span>
                    <code className="font-mono font-bold text-[#01312D]">
                      {completingRequest.otp}
                    </code>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-xs text-blue-800">
                    Are you sure you want to mark this request as completed?
                  </p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-0.5 list-disc list-inside">
                    <li>This action cannot be undone</li>
                    <li>The request will be moved to completed tab</li>
                    <li>Driver will be notified of completion</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 p-5 flex gap-3">
            <button
              onClick={() => {
                setShowCompleteConfirmModal(false);
                setCompletingRequest(null);
              }}
              disabled={completeLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmComplete}
              disabled={completeLoading}
              className="flex-1 bg-gradient-to-r from-[#3A7717] to-[#72bf00] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
            >
              {completeLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirm Complete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // WhatsApp Modal Component
  const WhatsAppModal = () => {
    if (!approvedRequest) return null;

    const receiptRef = useRef<HTMLDivElement>(null);
    const [imageGenerating, setImageGenerating] = useState(false);
    const [showDownloadSuccessModal, setShowDownloadSuccessModal] =
      useState(false);
    const [downloadedImageUrl, setDownloadedImageUrl] = useState<string | null>(
      null,
    );

    const transactionLabel = getTransactionLabel(approvedRequest.type);
    const instructionText = getInstructionText(approvedRequest.type);
    const currentDate = getCurrentDate();
    const currentTime = getCurrentTime();

    const generateImageBlob = async (): Promise<Blob | null> => {
      if (!receiptRef.current) return null;

      try {
        const receiptElement = receiptRef.current;
        receiptElement.style.position = "fixed";
        receiptElement.style.left = "0";
        receiptElement.style.top = "0";
        receiptElement.style.zIndex = "-1";
        receiptElement.style.opacity = "1";

        await new Promise((resolve) => setTimeout(resolve, 100));

        const dataUrl = await toPng(receiptElement, {
          quality: 0.95,
          backgroundColor: "#ffffff",
          pixelRatio: 2,
        });

        receiptElement.style.position = "absolute";
        receiptElement.style.left = "-9999px";
        receiptElement.style.top = "-9999px";
        receiptElement.style.zIndex = "";

        const response = await fetch(dataUrl);
        const blob = await response.blob();
        return blob;
      } catch (error) {
        console.error("Error generating image:", error);
        if (receiptRef.current) {
          receiptRef.current.style.position = "absolute";
          receiptRef.current.style.left = "-9999px";
          receiptRef.current.style.top = "-9999px";
        }
        return null;
      }
    };

    const handleGenerateImage = async () => {
      setImageGenerating(true);
      try {
        const blob = await generateImageBlob();
        if (blob) {
          const imageUrl = URL.createObjectURL(blob);
          setDownloadedImageUrl(imageUrl);
          setShowDownloadSuccessModal(true);

          const link = document.createElement("a");
          link.download = `DriveHub_Receipt_${approvedRequest.id.slice(-6)}.png`;
          link.href = imageUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          throw new Error("Failed to generate image");
        }
      } catch (error) {
        console.error("Error generating image:", error);
        setErrorMessage(
          "Failed to generate receipt image: " + (error as Error).message,
        );
        setShowErrorModal(true);
      } finally {
        setImageGenerating(false);
      }
    };

    const handleSendImageViaWhatsApp = async () => {
      setWhatsappLoading(true);
      try {
        const blob = await generateImageBlob();
        if (!blob) throw new Error("Failed to generate image");

        const finalOtp = approvedRequest.otp || generatedOtp;
        const currentDateTime = getCurrentDateTime();

        const caption = `*DriveHub - Service Request Approved* 🎉

Hello ${approvedRequest.driverName},

Your service request has been *APPROVED*! ✅

📋 *Request Details:*
━━━━━━━━━━━━━━━━━━━
🆔 *Request ID:* ${approvedRequest.id.slice(-6).toUpperCase()}
🚗 *Vehicle:* ${approvedRequest.carRegistration}
📱 *Service:* ${getTypeLabel(approvedRequest.type)}
💰 *Amount:* ₹${approvedRequest.amount?.toLocaleString()}
🔐 *${transactionLabel}:* ${finalOtp}
📅 *Date:* ${currentDate}
⏰ *Time:* ${currentTime}
━━━━━━━━━━━━━━━━━━━

${
  approvedRequest.type === "cash"
    ? `📊 *Repayment Details:*
• Interest Rate: ${approvedRequest.interestRate || 13}%
• Interest Amount: ₹${approvedRequest.interest?.toLocaleString() || 0}
• Total Repayable: ₹${approvedRequest.totalRepayable?.toLocaleString() || 0}
• Period: ${approvedRequest.repaymentDays || 7} days

`
    : ""
}📍 *Instructions:*
1. ${approvedRequest.type === "cash" ? "Use this transaction number for loan reference" : approvedRequest.type === "airtime" ? "Use this transaction number to track your airtime purchase" : "Show this OTP to the cashier/attendant"}
2. The amount will be processed within 30 minutes
3. Keep this message for reference

Please find your receipt attached below.

Thank you for choosing DriveHub! 🚀

*This is a system generated message. Valid for 30 minutes.*`;

        const imageUrl = URL.createObjectURL(blob);
        const cleanPhone = approvedRequest.driverPhone.replace(/[^0-9]/g, "");
        let fullPhone = cleanPhone;
        if (!cleanPhone.startsWith("27") && cleanPhone.length === 9) {
          fullPhone = `27${cleanPhone}`;
        }

        const whatsappUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(caption + "\n\n📸 Please check your downloads folder for the receipt image attached above.")}`;
        window.open(whatsappUrl, "_blank");

        const link = document.createElement("a");
        link.download = `DriveHub_Receipt_${approvedRequest.id.slice(-6)}.png`;
        link.href = imageUrl;
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
        console.error("Error sending image via WhatsApp:", error);
        setErrorMessage(
          "Failed to send image. The receipt has been downloaded. You can manually attach it to your WhatsApp message.",
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
                    Ready to Share!
                  </h2>
                  <p className="text-white/80 text-sm">Receipt image ready</p>
                </div>
              </div>
            </div>

            <div className="p-5 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-10 h-10 text-green-600" />
              </div>
              <p className="text-[#01312D] font-semibold mb-2">
                Receipt image generated!
              </p>
              <p className="text-gray-500 text-sm mb-4">
                The receipt image has been saved to your device.
              </p>

              {downloadedImageUrl && (
                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                  <p className="text-xs text-gray-500 mb-2">Preview:</p>
                  <img
                    src={downloadedImageUrl}
                    alt="Receipt Preview"
                    className="max-w-full h-auto rounded-lg border border-gray-200 mx-auto"
                    style={{ maxHeight: "200px" }}
                  />
                </div>
              )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !whatsappLoading && setShowWhatsAppModal(false)}
          ></div>
          <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
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
                      Send image via WhatsApp
                    </p>
                  </div>
                </div>
                {!whatsappLoading && (
                  <button
                    onClick={() => setShowWhatsAppModal(false)}
                    className="p-1 hover:bg-white/10 rounded-lg"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Hidden receipt for image generation */}
              <div
                ref={receiptRef}
                style={{
                  position: "fixed",
                  left: "-9999px",
                  top: "0",
                  width: "400px",
                  background: "white",
                  borderRadius: "20px",
                  padding: "20px",
                  fontFamily:
                    "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  zIndex: -1,
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    borderBottom: "2px solid #3A7717",
                    paddingBottom: "15px",
                    marginBottom: "15px",
                  }}
                >
                  <h2
                    style={{
                      color: "#01312D",
                      margin: 0,
                      fontSize: "28px",
                      fontWeight: "bold",
                    }}
                  >
                    🚗 DriveHub
                  </h2>
                  <p
                    style={{
                      color: "#72bf00",
                      margin: "5px 0 0",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Service Receipt
                  </p>
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
                      borderRadius: "12px",
                      padding: "20px",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        color: "white",
                        margin: "0 0 8px 0",
                        fontSize: "14px",
                        fontWeight: "600",
                        opacity: 0.9,
                      }}
                    >
                      🔐 {transactionLabel}
                    </p>
                    <div
                      style={{
                        background: "white",
                        borderRadius: "12px",
                        padding: "16px",
                        marginBottom: "12px",
                      }}
                    >
                      <code
                        style={{
                          fontSize: "42px",
                          fontWeight: "bold",
                          letterSpacing: "6px",
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
                        color: "white",
                        fontSize: "12px",
                        margin: "0",
                        fontWeight: "500",
                        opacity: 0.95,
                      }}
                    >
                      {instructionText}
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <div
                    style={{
                      background: "#eafde7",
                      borderRadius: "12px",
                      padding: "15px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                        fontSize: "13px",
                      }}
                    >
                      <span style={{ color: "#666" }}>Driver:</span>
                      <strong style={{ color: "#01312D" }}>
                        {approvedRequest.driverName}
                      </strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                        fontSize: "13px",
                      }}
                    >
                      <span style={{ color: "#666" }}>Vehicle:</span>
                      <strong style={{ color: "#01312D" }}>
                        {approvedRequest.carRegistration}
                      </strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                        fontSize: "13px",
                      }}
                    >
                      <span style={{ color: "#666" }}>Service:</span>
                      <strong style={{ color: "#01312D" }}>
                        {getTypeLabel(approvedRequest.type)}
                      </strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                        fontSize: "13px",
                      }}
                    >
                      <span style={{ color: "#666" }}>Amount:</span>
                      <strong style={{ color: "#3A7717", fontSize: "16px" }}>
                        ₹{approvedRequest.amount?.toLocaleString()}
                      </strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                        fontSize: "13px",
                      }}
                    >
                      <span style={{ color: "#666" }}>Request ID:</span>
                      <strong
                        style={{ color: "#01312D", fontFamily: "monospace" }}
                      >
                        {approvedRequest.id.slice(-6).toUpperCase()}
                      </strong>
                    </div>

                    <div
                      style={{
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: "1px dashed #bff202",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                          fontSize: "12px",
                        }}
                      >
                        <span style={{ color: "#666" }}>📅 Date:</span>
                        <strong style={{ color: "#01312D" }}>
                          {currentDate}
                        </strong>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12px",
                        }}
                      >
                        <span style={{ color: "#666" }}>⏰ Time:</span>
                        <strong style={{ color: "#01312D" }}>
                          {currentTime}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {approvedRequest.type === "cash" && (
                  <div style={{ marginBottom: "15px" }}>
                    <div
                      style={{
                        background: "#fef3c7",
                        borderRadius: "12px",
                        padding: "12px",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#92400e",
                        }}
                      >
                        📊 Repayment Details
                      </p>
                      <div style={{ fontSize: "11px", color: "#78350f" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "5px",
                          }}
                        >
                          <span>Interest Rate:</span>
                          <strong>{approvedRequest.interestRate || 13}%</strong>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "5px",
                          }}
                        >
                          <span>Interest Amount:</span>
                          <strong>
                            ₹{approvedRequest.interest?.toLocaleString() || 0}
                          </strong>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "5px",
                          }}
                        >
                          <span>Total Repayable:</span>
                          <strong>
                            ₹
                            {approvedRequest.totalRepayable?.toLocaleString() ||
                              0}
                          </strong>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>Period:</span>
                          <strong>
                            {approvedRequest.repaymentDays || 7} days
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    background: "#bff20220",
                    borderRadius: "10px",
                    padding: "10px",
                    textAlign: "center",
                    fontSize: "11px",
                    color: "#666",
                    marginTop: "15px",
                  }}
                >
                  <p style={{ margin: "0 0 4px 0", fontWeight: "500" }}>
                    ✅ Valid for 30 minutes
                  </p>
                  <p style={{ margin: "0", fontSize: "10px", opacity: 0.7 }}>
                    DriveHub Services • powered by DriveHub
                  </p>
                </div>
              </div>

              {/* Driver Info */}
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#01312D]">
                      {approvedRequest.driverName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {approvedRequest.carRegistration}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-semibold">
                      {approvedRequest.driverPhone}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-green-600">
                      ₹{approvedRequest.amount?.toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>

              {/* Prominent Display */}
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-5 text-center">
                <p className="text-white text-sm font-semibold mb-2">
                  🔐 {transactionLabel}
                </p>
                <div className="bg-white rounded-xl p-4 mb-3">
                  <code className="text-4xl md:text-5xl font-bold tracking-wider text-[#01312D] font-mono">
                    {approvedRequest.otp || generatedOtp}
                  </code>
                </div>
                <button
                  onClick={() =>
                    handleCopyOtp(approvedRequest.otp || generatedOtp)
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg text-white font-semibold hover:bg-white/30"
                >
                  <Copy className="w-4 h-4" /> Copy {transactionLabel}
                </button>
              </div>

              {/* Date & Time */}
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600">Generated on:</span>
                  </div>
                  <span className="text-xs font-semibold text-[#01312D]">
                    {getCurrentDateTime()}
                  </span>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-blue-800">
                      Clicking "Send via WhatsApp" will:
                    </p>
                    <ul className="text-xs text-blue-700 mt-1 space-y-0.5 list-disc list-inside">
                      <li>Generate and download the receipt image</li>
                      <li>Open WhatsApp with a caption</li>
                      <li>
                        You can manually attach the downloaded image to the
                        message
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#bff202]/20 p-5 flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={handleGenerateImage}
                disabled={whatsappLoading || imageGenerating}
                className="flex-1 bg-[#01312D] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#3A7717] transition-colors disabled:opacity-50"
              >
                {imageGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" /> Generate Receipt
                  </>
                )}
              </button>
              <button
                onClick={handleSendImageViaWhatsApp}
                disabled={whatsappLoading}
                className="flex-1 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
              >
                {whatsappLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Preparing...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" /> Send Image via
                    WhatsApp
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
                  <span className="font-semibold">
                    {approvingRequest.driverName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vehicle:</span>
                  <span className="font-semibold">
                    {approvingRequest.carRegistration}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-semibold">
                    {getTypeLabel(approvingRequest.type)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-[#3A7717] text-lg">
                    ₹{approvingRequest.amount?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <label className="block text-yellow-800 font-semibold mb-2 text-sm">
                🔐 {transactionLabel}
              </label>
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-white px-4 py-3 rounded-xl font-mono text-2xl font-bold text-center text-[#01312D] border border-yellow-300">
                  {generatedOtp}
                </code>
                <button
                  onClick={() => handleCopyOtp(generatedOtp)}
                  className="p-3 bg-white rounded-xl border border-yellow-300 hover:bg-yellow-100"
                >
                  {copiedOtp === generatedOtp ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-yellow-700" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t p-5 flex gap-3">
            <button
              onClick={() => setShowApproveModal(false)}
              disabled={approvalLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmApprove}
              disabled={approvalLoading}
              className="flex-1 bg-gradient-to-r from-[#3A7717] to-[#72bf00] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
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
    const transactionLabel = getTransactionLabel(request.type);

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
                <p className="text-xs text-gray-500">
                  ID: {request.id.slice(-6).toUpperCase()}
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
            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[#3A7717]" /> Driver Information
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Name:</span>{" "}
                  <span className="font-semibold">
                    {request.driverName || "N/A"}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Email:</span>{" "}
                  <span className="font-semibold">
                    {request.driverEmail || "N/A"}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Phone:</span>{" "}
                  <span className="font-semibold">
                    {request.driverPhone || "N/A"}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Car Registration:</span>{" "}
                  <span className="font-semibold">
                    {request.carRegistration || "N/A"}
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#3A7717]" /> Request Details
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
                <p>
                  <span className="text-gray-500">Request Date:</span>{" "}
                  {new Date(request.requestDate).toLocaleString()}
                </p>
                {request.otp && (
                  <div className="mt-2 pt-2 border-t border-[#bff202]/20">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">{transactionLabel}:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-3 py-1 rounded-lg font-mono text-lg font-bold">
                          {request.otp}
                        </code>
                        <button
                          onClick={() => handleCopyOtp(request.otp!)}
                          className="p-1.5 bg-[#eafde7] rounded-lg hover:bg-[#bff202]/30"
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
                  <CheckCircle className="w-4 h-4" /> Approve Request
                </button>
                <button
                  onClick={() => handleReject(request)}
                  className="flex-1 bg-red-500 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
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
                  }}
                  className="flex-1 bg-[#25D366] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Send WhatsApp
                </button>
                <button
                  onClick={() => handleComplete(request)}
                  className="flex-1 bg-[#01312D] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Mark Completed
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
          className="flex items-center gap-2 px-4 py-2 bg-[#eafde7] rounded-xl text-[#01312D] font-semibold hover:bg-[#bff202]/30"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />{" "}
          Refresh
        </button>
      </div>

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
                    <Eye className="w-4 h-4" /> View Details
                  </button>
                  {request.status === "pending" && (
                    <>
                      <button
                        onClick={() => openApproveModal(request)}
                        className="flex-1 py-2 bg-[#3A7717] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(request)}
                        className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
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
                        }}
                        className="flex-1 py-2 bg-[#25D366] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" /> WhatsApp
                      </button>
                      <button
                        onClick={() => handleComplete(request)}
                        className="flex-1 py-2 bg-[#01312D] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Complete
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
      {showWhatsAppModal && approvedRequest && <WhatsAppModal />}
      {showCompleteConfirmModal && <CompleteConfirmModal />}
      <SuccessModal />
      <ErrorModal />
    </div>
  );
}
