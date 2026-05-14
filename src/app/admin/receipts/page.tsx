// src/app/admin/receipts/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/utils/image-compression";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import {
  FileText,
  CheckCircle,
  Clock,
  Search,
  Eye,
  RefreshCw,
  User,
  Phone,
  Mail,
  Car,
  Loader2,
  AlertCircle,
  Fuel,
  Smartphone,
  SprayCan,
  DollarSign,
  Calendar,
  ImageIcon,
  ArrowRight,
  XCircle,
  Edit3,
  Upload,
  X,
  Save,
  Send,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

interface ReceiptRequest {
  id: string;
  userId: string;
  type: string;
  amount: number;
  actualAmount: number | null;
  carNumber: string;
  carRegistration: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  serviceType: string;
  status: string;
  requestDate: string;
  completedDate: string;
  popUrl: string | null;
  popUploadedAt: string | null;
  hasReceipt: boolean;
  receiptVerifiedAt: string | null;
  totalRepayable: number;
  remainingBalance: number;
  dueDate: string;
}

export default function AdminReceiptsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "pending" | "verified" | "all" | "noreceipt"
  >("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [receipts, setReceipts] = useState<ReceiptRequest[]>([]);
  const [noReceiptRequests, setNoReceiptRequests] = useState<any[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRequest | null>(
    null,
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  // Reject state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  // Correct state
  const [showCorrectModal, setShowCorrectModal] = useState(false);
  const [correctedAmount, setCorrectedAmount] = useState("");
  const [correctedDriverName, setCorrectedDriverName] = useState("");
  const [correctedDriverEmail, setCorrectedDriverEmail] = useState("");
  const [correctedDriverPhone, setCorrectedDriverPhone] = useState("");
  const [correctedCarNumber, setCorrectedCarNumber] = useState("");
  const [correctLoading, setCorrectLoading] = useState(false);

  // Upload for driver state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [uploadDriverName, setUploadDriverName] = useState("");
  const [uploadDriverEmail, setUploadDriverEmail] = useState("");
  const [uploadDriverPhone, setUploadDriverPhone] = useState("");
  const [uploadCarNumber, setUploadCarNumber] = useState("");
  const [uploadAmount, setUploadAmount] = useState("");
  const [uploadType, setUploadType] = useState("fuel");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showUploadSuccessModal, setShowUploadSuccessModal] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState("");
  const [drivers, setDrivers] = useState<any[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [driverSearch, setDriverSearch] = useState("");
  const [availableRequests, setAvailableRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState("");

  const isAnyModalOpen =
    showDetailsModal ||
    showSuccessModal ||
    showErrorModal ||
    showRejectModal ||
    showCorrectModal ||
    showUploadModal ||
    showUploadSuccessModal;
  useBodyScrollLock(isAnyModalOpen);

  useEffect(() => {
    fetchReceipts();
  }, [activeTab]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);

      if (activeTab === "noreceipt") {
        const response = await fetch("/api/admin/receipts?status=noreceipt");
        if (response.ok) {
          const data = await response.json();
          setNoReceiptRequests(data.data || []);
          setNoReceiptStats({
            count: data.data?.length || 0,
            totalAmount: (data.data || []).reduce(
              (sum: number, r: any) => sum + (r.amount || 0),
              0,
            ),
          });
        }
      } else {
        const response = await fetch(
          `/api/admin/receipts?status=${activeTab === "all" ? "" : activeTab}`,
        );
        if (response.ok) {
          const data = await response.json();
          setReceipts(data.data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching receipts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReceipts();
  };

  const handleVerifyReceipt = async (requestId: string) => {
    setProcessing(true);
    try {
      const response = await fetch("/api/admin/receipts/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action: "verify",
        }),
      });

      if (response.ok) {
        setSuccessMessage("✅ Receipt verified successfully!");
        setShowSuccessModal(true);
        fetchReceipts();
        setShowDetailsModal(false);
        setSelectedReceipt(null);

        // Refresh counts in the sidebar
        window.dispatchEvent(new CustomEvent("refreshAdminCounts"));
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to verify receipt");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error verifying receipt:", error);
      setErrorMessage("Failed to verify receipt");
      setShowErrorModal(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectReceipt = async () => {
    if (!selectedReceipt || !rejectionReason.trim()) {
      setErrorMessage("Please enter a reason for rejection");
      setShowErrorModal(true);
      return;
    }

    setRejectLoading(true);
    try {
      const response = await fetch("/api/admin/receipts/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedReceipt.id,
          reason: rejectionReason,
        }),
      });

      if (response.ok) {
        setSuccessMessage("Receipt rejected successfully");
        setShowSuccessModal(true);
        fetchReceipts();
        setShowRejectModal(false);
        setShowDetailsModal(false);
        setSelectedReceipt(null);
        setRejectionReason("");
        window.dispatchEvent(new Event("refreshAdminCounts"));
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to reject receipt");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error rejecting receipt:", error);
      setErrorMessage("Failed to reject receipt");
      setShowErrorModal(true);
    } finally {
      setRejectLoading(false);
    }
  };

  const handleCorrectReceipt = async () => {
    if (!selectedReceipt) return;

    setCorrectLoading(true);
    try {
      const updates: Record<string, any> = {};
      if (
        correctedAmount &&
        parseFloat(correctedAmount) !== selectedReceipt.actualAmount
      ) {
        updates.actualAmount = parseFloat(correctedAmount);
      }
      if (
        correctedDriverName &&
        correctedDriverName !== selectedReceipt.driverName
      ) {
        updates.driverName = correctedDriverName;
      }
      if (
        correctedDriverEmail &&
        correctedDriverEmail !== selectedReceipt.driverEmail
      ) {
        updates.driverEmail = correctedDriverEmail;
      }
      if (
        correctedDriverPhone &&
        correctedDriverPhone !== selectedReceipt.driverPhone
      ) {
        updates.driverPhone = correctedDriverPhone;
      }
      if (
        correctedCarNumber &&
        correctedCarNumber !== selectedReceipt.carRegistration
      ) {
        updates.carNumber = correctedCarNumber;
      }

      if (Object.keys(updates).length === 0) {
        setErrorMessage("No changes were made");
        setShowErrorModal(true);
        setCorrectLoading(false);
        return;
      }

      const response = await fetch("/api/admin/receipts/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedReceipt.id,
          updates,
        }),
      });

      if (response.ok) {
        setSuccessMessage("Receipt information corrected successfully!");
        setShowSuccessModal(true);
        fetchReceipts();
        setShowCorrectModal(false);
        setShowDetailsModal(false);
        setSelectedReceipt(null);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to correct receipt");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error correcting receipt:", error);
      setErrorMessage("Failed to correct receipt");
      setShowErrorModal(true);
    } finally {
      setCorrectLoading(false);
    }
  };

  const fetchDrivers = async () => {
    setDriversLoading(true);
    try {
      const res = await fetch("/api/admin/drivers");
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers || []);
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
    } finally {
      setDriversLoading(false);
    }
  };

  const fetchAvailableRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await fetch("/api/admin/requests");
      if (res.ok) {
        const data = await res.json();
        const pendingReceipt = (data.requests || []).filter(
          (r: any) =>
            (r.status === "approved" ||
              r.status === "sent" ||
              r.status === "completed") &&
            !r.hasReceipt,
        );
        setAvailableRequests(pendingReceipt);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleSelectDriver = (driver: any) => {
    setUploadDriverName(driver.name || "");
    setUploadDriverEmail(driver.email || "");
    setUploadDriverPhone(driver.phone || "");
    setUploadCarNumber(driver.carRegistration || "");
  };

  const handleSelectRequest = (requestId: string) => {
    setSelectedRequestId(requestId);
    if (!requestId) {
      setUploadDriverName("");
      setUploadDriverEmail("");
      setUploadDriverPhone("");
      setUploadCarNumber("");
      setUploadAmount("");
      setUploadType("fuel");
      return;
    }
    const req = availableRequests.find((r: any) => r.id === requestId);
    if (req) {
      setUploadDriverName(req.driverName || "");
      setUploadDriverEmail(req.driverEmail || "");
      setUploadDriverPhone(req.driverPhone || "");
      setUploadCarNumber(req.carNumber || "");
      setUploadAmount(
        req.actualAmount?.toString() || req.amount?.toString() || "",
      );
      setUploadType(req.type || "fuel");
    }
  };

  const handleOpenUploadModal = () => {
    setShowUploadModal(true);
    fetchDrivers();
    fetchAvailableRequests();
  };

  const handleUploadForDriver = async () => {
    if (!uploadFile) {
      setErrorMessage("Please select a file to upload");
      setShowErrorModal(true);
      return;
    }

    setUploadLoading(true);
    try {
      const compressedBlob = await compressImage(uploadFile);
      const compressedFile = new File([compressedBlob], uploadFile.name, {
        type: compressedBlob.type || uploadFile.type,
      });

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("requestId", selectedRequestId);
      formData.append("driverName", uploadDriverName);
      formData.append("driverEmail", uploadDriverEmail);
      formData.append("driverPhone", uploadDriverPhone);
      formData.append("carNumber", uploadCarNumber);
      formData.append("actualAmount", uploadAmount);
      formData.append("type", uploadType);

      const response = await fetch("/api/admin/receipts/upload-for-driver", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadSuccessMessage(data.message);
        setShowUploadSuccessModal(true);
        setShowUploadModal(false);
        setUploadFile(null);
        setSelectedRequestId("");
        setUploadDriverName("");
        setUploadDriverEmail("");
        setUploadDriverPhone("");
        setUploadCarNumber("");
        setUploadAmount("");
        setUploadType("fuel");
        setDriverSearch("");
        fetchReceipts();
        window.dispatchEvent(new Event("refreshAdminCounts"));
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to upload receipt");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error uploading receipt:", error);
      setErrorMessage("Failed to upload receipt");
      setShowErrorModal(true);
    } finally {
      setUploadLoading(false);
    }
  };

  const openCorrectModal = () => {
    if (!selectedReceipt) return;
    setCorrectedAmount(
      selectedReceipt.actualAmount?.toString() ||
        selectedReceipt.amount.toString(),
    );
    setCorrectedDriverName(selectedReceipt.driverName);
    setCorrectedDriverEmail(selectedReceipt.driverEmail);
    setCorrectedDriverPhone(selectedReceipt.driverPhone);
    setCorrectedCarNumber(selectedReceipt.carRegistration);
    setShowCorrectModal(true);
    setShowDetailsModal(false);
  };

  const formatPhoneNumber = (phone: string): string => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (!cleanPhone.startsWith("27") && cleanPhone.length === 9) {
      return `27${cleanPhone}`;
    }
    if (
      !cleanPhone.startsWith("27") &&
      cleanPhone.length === 10 &&
      cleanPhone.startsWith("0")
    ) {
      return `27${cleanPhone.substring(1)}`;
    }
    return cleanPhone;
  };

  const handleWhatsAppReminder = (req: any) => {
    const message = `Hi ${req.driverName || "Driver"},

This is a reminder from Kapuka Tradings to please upload your receipt for your recent ${req.type || "service"} request of R${(req.actualAmount || req.amount || 0).toLocaleString()}.

Vehicle: ${req.carNumber || "N/A"}
Request ID: ${(req.id || req._id || "").slice(-6).toUpperCase()}

Please upload your receipt as soon as possible to keep your account up to date.

Thank you,
Kapuka Tradings Team`;

    const fullPhone = formatPhoneNumber(req.driverPhone);
    const whatsappUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case "fuel":
        return <Fuel className="w-5 h-5 text-green-600" />;
      case "airtime":
        return <Smartphone className="w-5 h-5 text-blue-600" />;
      case "cash":
        return <DollarSign className="w-5 h-5 text-yellow-600" />;
      case "carwash":
        return <SprayCan className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getServiceTypeBadge = (type: string) => {
    const config: any = {
      fuel: { bg: "bg-green-100", text: "text-green-700", label: "Fuel" },
      airtime: { bg: "bg-blue-100", text: "text-blue-700", label: "Airtime" },
      cash: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: "Cash Loan",
      },
      carwash: {
        bg: "bg-purple-100",
        text: "text-purple-700",
        label: "Car Wash",
      },
    };
    const c = config[type] || {
      bg: "bg-gray-100",
      text: "text-gray-700",
      label: type,
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${c.bg} ${c.text}`}
      >
        {c.label}
      </span>
    );
  };

  const filteredReceipts = receipts.filter(
    (r) =>
      r.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.carRegistration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.driverEmail.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const isLoading = loading || refreshing;

  // Stats
  const stats = {
    pending: receipts.filter((r) => !r.hasReceipt).length,
    verified: receipts.filter((r) => r.hasReceipt).length,
    totalAmount: receipts.reduce(
      (sum, r) => sum + (r.actualAmount || r.amount),
      0,
    ),
  };

  // No receipt stats are loaded separately
  const [noReceiptStats, setNoReceiptStats] = useState({
    count: 0,
    totalAmount: 0,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#01312D]">
            Fuel & Service Receipts
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Verify receipts uploaded by drivers for completed services
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenUploadModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#3A7717] text-white rounded-xl font-semibold hover:bg-[#2d5a12] transition-all shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Upload Receipt
          </button>
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Pending Verification</p>
              <div className="text-2xl font-bold text-yellow-600">
                {isLoading ? <Skeleton className="h-8 w-20" /> : stats.pending}
              </div>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Verified Receipts</p>
              <div className="text-2xl font-bold text-[#3A7717]">
                {isLoading ? <Skeleton className="h-8 w-20" /> : stats.verified}
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
              <p className="text-xs text-gray-500">Total Value</p>
              <div className="text-2xl font-bold text-[#01312D]">
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  `R${stats.totalAmount.toLocaleString()}`
                )}
              </div>
            </div>
            <div className="w-10 h-10 bg-[#eafde7] rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#3A7717]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Awaiting Receipt Upload</p>
              <div className="text-2xl font-bold text-orange-600">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  noReceiptStats.count
                )}
              </div>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-[#bff202]/20">
        <div className="flex gap-2 p-1 bg-[#eafde7] rounded-xl">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "pending"
                ? "bg-white text-[#01312D] shadow-sm"
                : "text-gray-500 hover:text-[#01312D]"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveTab("verified")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "verified"
                ? "bg-white text-[#01312D] shadow-sm"
                : "text-gray-500 hover:text-[#01312D]"
            }`}
          >
            Verified
          </button>
          <button
            onClick={() => setActiveTab("noreceipt")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "noreceipt"
                ? "bg-white text-[#01312D] shadow-sm"
                : "text-gray-500 hover:text-[#01312D]"
            }`}
          >
            No Receipt
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "all"
                ? "bg-white text-[#01312D] shadow-sm"
                : "text-gray-500 hover:text-[#01312D]"
            }`}
          >
            All
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search driver, car..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#eafde7]/50 border-none rounded-xl focus:ring-2 focus:ring-[#bff202] outline-none text-sm"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/10"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
                <div className="flex items-center justify-between lg:justify-end gap-8 border-t lg:border-t-0 pt-4 lg:pt-0">
                  <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-28" />
                  </div>
                  <Skeleton className="h-12 w-28 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === "noreceipt" && noReceiptRequests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#bff202]/20">
          <div className="w-20 h-20 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-[#01312D]">
            All receipts uploaded
          </h3>
          <p className="text-gray-500">
            All approved/sent requests have receipts uploaded.
          </p>
        </div>
      ) : activeTab === "noreceipt" ? (
        <div className="grid grid-cols-1 gap-4">
          {noReceiptRequests.map((req: any) => (
            <div
              key={req.id || req._id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/10 hover:border-orange-300 transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                      req.type === "fuel"
                        ? "bg-green-50"
                        : req.type === "airtime"
                          ? "bg-blue-50"
                          : req.type === "cash"
                            ? "bg-yellow-50"
                            : "bg-purple-50"
                    }`}
                  >
                    {getServiceTypeIcon(req.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[#01312D] text-lg">
                        {req.driverName}
                      </h3>
                      {getServiceTypeBadge(req.type)}
                      <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> NO RECEIPT
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Car className="w-4 h-4" /> {req.carNumber}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />{" "}
                        {req.approvedDate
                          ? new Date(req.approvedDate).toLocaleDateString()
                          : "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="capitalize text-xs font-semibold text-gray-400">
                          {req.status}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between lg:justify-end gap-8 border-t lg:border-t-0 pt-4 lg:pt-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                      Amount
                    </p>
                    <p className="text-2xl font-black text-[#01312D]">
                      R{(req.actualAmount || req.amount).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleWhatsAppReminder(req)}
                    className="flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1da851] transition-all shadow-md active:scale-95"
                  >
                    <Send className="w-5 h-5" />
                    Send WhatsApp
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredReceipts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#bff202]/20">
          <div className="w-20 h-20 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-[#01312D]">
            No receipts found
          </h3>
          <p className="text-gray-500">
            There are no receipts matching your criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReceipts.map((receipt) => (
            <div
              key={receipt.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/10 hover:border-[#bff202] transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                      receipt.type === "fuel"
                        ? "bg-green-50"
                        : receipt.type === "airtime"
                          ? "bg-blue-50"
                          : receipt.type === "cash"
                            ? "bg-yellow-50"
                            : "bg-purple-50"
                    }`}
                  >
                    {getServiceTypeIcon(receipt.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[#01312D] text-md">
                        {receipt.driverName}
                      </h3>
                      {getServiceTypeBadge(receipt.type)}
                      {receipt.hasReceipt ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> VERIFIED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" /> PENDING VERIFICATION
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Car className="w-4 h-4" /> {receipt.carRegistration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> Completed{" "}
                        {new Date(receipt.completedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-8 border-t lg:border-t-0 pt-4 lg:pt-0">
                  <div className="text-right">
                    <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">
                      Amount
                    </p>
                    <p className="text-2xl font-black text-[#01312D]">
                      R
                      {(
                        receipt.actualAmount || receipt.amount
                      ).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedReceipt(receipt);
                      setShowDetailsModal(true);
                    }}
                    className="flex items-center gap-2 bg-[#01312D] text-white px-6 py-2.5 rounded-lg 
                     hover:bg-[#3A7717] transition-all shadow-md active:scale-95 text-xs"
                  >
                    <Eye className="w-4 h-4" />
                    Review
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDetailsModal(false)}
          />
          <div className="relative bg-white rounded-[0.5rem] sm:rounded-[2rem] max-w-2xl w-full max-h-[95vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-[#bff202]/20 p-4 sm:p-6 flex justify-between items-center z-10">
              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center ${
                    selectedReceipt.type === "fuel"
                      ? "bg-green-50"
                      : "bg-blue-50"
                  }`}
                >
                  {getServiceTypeIcon(selectedReceipt.type)}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[#01312D] leading-tight">
                    Receipt Verification
                  </h2>
                  <p className="text-[10px] sm:text-sm text-gray-500">
                    Verify service delivery proof
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 overflow-y-auto">
              {/* Receipt Image */}
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-bold text-[#01312D] flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#3A7717]" />{" "}
                    Uploaded Receipt
                  </h3>
                  {selectedReceipt.popUrl && (
                    <a
                      href={selectedReceipt.popUrl}
                      target="_blank"
                      className="text-[10px] sm:text-xs font-bold text-[#3A7717] hover:underline flex items-center gap-1"
                    >
                      Open Original{" "}
                      <ArrowRight className="w-2.5 h-2.5 sm:w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="bg-gray-50 rounded-2xl sm:rounded-3xl p-2 sm:p-4 border-2 border-dashed border-[#bff202]/30 min-h-[200px] sm:min-h-[300px] flex items-center justify-center relative group overflow-hidden">
                  {selectedReceipt.popUrl ? (
                    <img
                      src={selectedReceipt.popUrl}
                      alt="Service Receipt"
                      className="max-w-full h-auto max-h-[40vh] sm:max-h-none rounded-xl sm:rounded-2xl shadow-lg transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-200 mx-auto mb-2" />
                      <p className="text-gray-400 text-xs sm:text-sm">
                        No image available
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                <div className="bg-[#eafde7] rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <h3 className="text-sm sm:text-base font-bold text-[#01312D] flex items-center gap-2 border-b border-[#bff202]/20 pb-2">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#3A7717]" />{" "}
                    Driver Details
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">
                        Name
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#01312D]">
                        {selectedReceipt.driverName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">
                        Phone
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#01312D]">
                        {selectedReceipt.driverPhone}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">
                        Vehicle
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#01312D]">
                        {selectedReceipt.carRegistration}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#eafde7] rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <h3 className="text-sm sm:text-base font-bold text-[#01312D] flex items-center gap-2 border-b border-[#bff202]/20 pb-2">
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#3A7717]" />{" "}
                    Service Info
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">
                        Type
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#01312D] capitalize">
                        {selectedReceipt.type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">
                        Date
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#01312D]">
                        {new Date(
                          selectedReceipt.completedDate,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">
                        Amount
                      </span>
                      <span className="text-base sm:text-xl font-black text-[#3A7717]">
                        R
                        {(
                          selectedReceipt.actualAmount || selectedReceipt.amount
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning box if not verified */}
              {!selectedReceipt.hasReceipt && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] sm:text-sm text-yellow-800 leading-relaxed">
                    Please ensure the receipt clearly shows the{" "}
                    <strong>amount</strong>, <strong>date</strong>, and{" "}
                    <strong>station name</strong> before verifying. Verified
                    receipts will be used for final bookkeeping.
                  </p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-[#bff202]/20 p-4 sm:p-6 flex flex-col gap-3">
              {!selectedReceipt.hasReceipt ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => handleVerifyReceipt(selectedReceipt.id)}
                    disabled={processing}
                    className="flex-[2] bg-gradient-to-r from-[#3A7717] to-[#72BF00] text-white px-4 py-3 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl text-sm sm:text-base font-black shadow-lg shadow-[#3A7717]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:translate-y-0"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 sm:w-6 sm:h-6 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6" />
                    )}
                    <span className="whitespace-nowrap">Verify & Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setTimeout(() => {
                        setShowRejectModal(true);
                      }, 200);
                    }}
                    disabled={processing}
                    className="flex-1 bg-red-500 text-white px-4 py-3 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="whitespace-nowrap">Reject</span>
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 text-green-700 px-4 py-3 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6" />
                  <span>Verified</span>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={openCorrectModal}
                  className="flex-1 px-4 py-3 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold text-[#3A7717] bg-[#eafde7] hover:bg-[#d4f5cc] transition-all flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="whitespace-nowrap">Correct Info</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-4 py-3 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold text-gray-500 hover:bg-gray-100 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-[2.5rem] max-w-sm w-full p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-[#01312D] mb-2">
              Success!
            </h2>
            <p className="text-gray-500 mb-8">{successMessage}</p>
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-[#01312D] text-white py-4 rounded-2xl font-bold hover:bg-[#3A7717] transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-[2.5rem] max-w-sm w-full p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-black text-red-600 mb-2">Oops!</h2>
            <p className="text-gray-500 mb-8">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedReceipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !rejectLoading && setShowRejectModal(false)}
          />
          <div className="relative bg-white rounded-[2rem] max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Reject Receipt
                  </h2>
                  <p className="text-white/80 text-sm">
                    Provide a reason for rejection
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-[#eafde7] rounded-xl p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Driver:</span>
                    <span className="font-semibold text-[#01312D]">
                      {selectedReceipt.driverName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vehicle:</span>
                    <span className="font-semibold text-[#01312D]">
                      {selectedReceipt.carRegistration}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-bold text-[#3A7717]">
                      R
                      {(
                        selectedReceipt.actualAmount || selectedReceipt.amount
                      ).toLocaleString()}
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
                  placeholder="Explain why this receipt is being rejected..."
                  className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl focus:outline-none focus:border-red-500 resize-none"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This reason will be recorded with the rejection
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-red-800 font-semibold">
                      This action cannot be undone
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      The driver may need to re-upload a corrected receipt.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 p-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                disabled={rejectLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectReceipt}
                disabled={rejectLoading}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
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
      )}

      {/* Correct Information Modal */}
      {showCorrectModal && selectedReceipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !correctLoading && setShowCorrectModal(false)}
          />
          <div className="relative bg-white rounded-[2rem] max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#01312D] to-[#3A7717] p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Edit3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Correct Information
                  </h2>
                  <p className="text-white/80 text-sm">
                    Update receipt details
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[#01312D] font-semibold mb-1.5 text-sm">
                  Amount (R)
                </label>
                <input
                  type="number"
                  value={correctedAmount}
                  onChange={(e) => setCorrectedAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#bff202]/40 rounded-xl focus:outline-none focus:border-[#3A7717] text-sm"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-1.5 text-sm">
                  Driver Name
                </label>
                <input
                  type="text"
                  value={correctedDriverName}
                  onChange={(e) => setCorrectedDriverName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#bff202]/40 rounded-xl focus:outline-none focus:border-[#3A7717] text-sm"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-1.5 text-sm">
                  Driver Email
                </label>
                <input
                  type="email"
                  value={correctedDriverEmail}
                  onChange={(e) => setCorrectedDriverEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#bff202]/40 rounded-xl focus:outline-none focus:border-[#3A7717] text-sm"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-1.5 text-sm">
                  Driver Phone
                </label>
                <input
                  type="text"
                  value={correctedDriverPhone}
                  onChange={(e) => setCorrectedDriverPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#bff202]/40 rounded-xl focus:outline-none focus:border-[#3A7717] text-sm"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-1.5 text-sm">
                  Car Registration
                </label>
                <input
                  type="text"
                  value={correctedCarNumber}
                  onChange={(e) => setCorrectedCarNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#bff202]/40 rounded-xl focus:outline-none focus:border-[#3A7717] text-sm"
                />
              </div>
            </div>
            <div className="border-t border-gray-100 p-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowCorrectModal(false)}
                disabled={correctLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCorrectReceipt}
                disabled={correctLoading}
                className="flex-1 bg-gradient-to-r from-[#3A7717] to-[#72BF00] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
              >
                {correctLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Receipt for Driver Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !uploadLoading && setShowUploadModal(false)}
          />
          <div className="relative bg-white rounded-[2rem] max-w-lg w-full max-h-[95vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#01312D] to-[#3A7717] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Upload Receipt
                    </h2>
                    <p className="text-white/80 text-sm">
                      For elderly or disabled drivers
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedRequestId("");
                  }}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800">
                  Use this form to upload a receipt on behalf of a driver who is
                  unable to do so themselves (e.g., elderly or disabled
                  drivers).
                </p>
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-1.5 text-sm">
                  Receipt Image *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2.5 bg-white border border-[#bff202]/40 rounded-xl focus:outline-none focus:border-[#3A7717] text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#eafde7] file:text-[#01312D] file:font-semibold file:text-xs"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-1.5 text-sm">
                  Service Type
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#bff202]/40 rounded-xl focus:outline-none focus:border-[#3A7717] text-sm"
                >
                  <option value="fuel">Fuel</option>
                  <option value="airtime">Airtime</option>
                  <option value="cash">Cash Loan</option>
                  <option value="carwash">Car Wash</option>
                </select>
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-1.5 text-sm">
                  Amount (R) *
                </label>
                <input
                  type="number"
                  value={uploadAmount}
                  onChange={(e) => setUploadAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-4 py-2.5 bg-white border border-[#bff202]/40 rounded-xl focus:outline-none focus:border-[#3A7717] text-sm"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-1.5 text-sm">
                  Link to Existing Request{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedRequestId}
                  onChange={(e) => handleSelectRequest(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#bff202]/40 rounded-xl focus:outline-none focus:border-[#3A7717] text-sm"
                >
                  <option value="">-- Select a completed request --</option>
                  {requestsLoading ? (
                    <option disabled>Loading requests...</option>
                  ) : availableRequests.length === 0 ? (
                    <option disabled>
                      No completed requests without receipts
                    </option>
                  ) : (
                    availableRequests.map((req: any) => (
                      <option key={req.id} value={req.id}>
                        {req.driverName || "Unknown"} - {req.type} - R
                        {(req.actualAmount || req.amount).toLocaleString()} (
                        {req.id.slice(-6).toUpperCase()})
                      </option>
                    ))
                  )}
                </select>
                {!requestsLoading && availableRequests.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {availableRequests.length} request
                    {availableRequests.length !== 1 ? "s" : ""} awaiting receipt
                    upload
                  </p>
                )}
              </div>
              <div className="bg-[#eafde7] rounded-xl p-3 space-y-3">
                <p className="text-xs font-semibold text-[#01312D]">
                  Driver Details
                  {selectedRequestId ? (
                    <span className="text-[#3A7717] font-normal">
                      {" "}
                      (auto-filled from request)
                    </span>
                  ) : (
                    <span className="text-gray-400 font-normal">
                      {" "}
                      (or enter manually)
                    </span>
                  )}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 font-semibold uppercase mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={uploadDriverName}
                      onChange={(e) => setUploadDriverName(e.target.value)}
                      placeholder="Full name"
                      className="w-full px-3 py-2 bg-white border border-[#bff202]/30 rounded-lg text-sm focus:outline-none focus:border-[#3A7717]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 font-semibold uppercase mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={uploadDriverEmail}
                      onChange={(e) => setUploadDriverEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 bg-white border border-[#bff202]/30 rounded-lg text-sm focus:outline-none focus:border-[#3A7717]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 font-semibold uppercase mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={uploadDriverPhone}
                      onChange={(e) => setUploadDriverPhone(e.target.value)}
                      placeholder="+27 XX XXX XXXX"
                      className="w-full px-3 py-2 bg-white border border-[#bff202]/30 rounded-lg text-sm focus:outline-none focus:border-[#3A7717]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 font-semibold uppercase mb-1">
                      Vehicle
                    </label>
                    <input
                      type="text"
                      value={uploadCarNumber}
                      onChange={(e) => setUploadCarNumber(e.target.value)}
                      placeholder="e.g. CA 123-456"
                      className="w-full px-3 py-2 bg-white border border-[#bff202]/30 rounded-lg text-sm focus:outline-none focus:border-[#3A7717]"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 p-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                disabled={uploadLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadForDriver}
                disabled={uploadLoading || !uploadFile}
                className="flex-1 bg-gradient-to-r from-[#3A7717] to-[#72BF00] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
              >
                {uploadLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Success Modal */}
      {showUploadSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-[2.5rem] max-w-sm w-full p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-[#01312D] mb-2">
              Uploaded!
            </h2>
            <p className="text-gray-500 mb-8">{uploadSuccessMessage}</p>
            <button
              type="button"
              onClick={() => setShowUploadSuccessModal(false)}
              className="w-full bg-[#01312D] text-white py-4 rounded-2xl font-bold hover:bg-[#3A7717] transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
