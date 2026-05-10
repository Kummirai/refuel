// src/app/admin/receipts/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"pending" | "verified" | "all">(
    "pending",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [receipts, setReceipts] = useState<ReceiptRequest[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRequest | null>(
    null,
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchReceipts();
  }, [activeTab]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/receipts?status=${activeTab === "all" ? "" : activeTab}`);
      if (response.ok) {
        const data = await response.json();
        setReceipts(data.data || []);
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
      cash: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Cash Loan" },
      carwash: { bg: "bg-purple-100", text: "text-purple-700", label: "Car Wash" },
    };
    const c = config[type] || { bg: "bg-gray-100", text: "text-gray-700", label: type };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${c.bg} ${c.text}`}>
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

  // Stats
  const stats = {
    pending: receipts.filter((r) => !r.hasReceipt).length,
    verified: receipts.filter((r) => r.hasReceipt).length,
    totalAmount: receipts.reduce((sum, r) => sum + (r.actualAmount || r.amount), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#01312D]">Fuel & Service Receipts</h1>
          <p className="text-gray-500 text-sm mt-1">
            Verify receipts uploaded by drivers for completed services
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#eafde7] rounded-xl text-[#01312D] font-semibold hover:bg-[#bff202]/30 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Pending Verification</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
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
              <p className="text-2xl font-bold text-[#3A7717]">{stats.verified}</p>
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
              <p className="text-2xl font-bold text-[#01312D]">R{stats.totalAmount.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-[#eafde7] rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#3A7717]" />
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
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-[#bff202]/20">
          <Loader2 className="w-12 h-12 text-[#3A7717] animate-spin mb-4" />
          <p className="text-[#01312D] font-medium">Loading receipts...</p>
        </div>
      ) : filteredReceipts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#bff202]/20">
          <div className="w-20 h-20 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-[#01312D]">No receipts found</h3>
          <p className="text-gray-500">There are no receipts matching your criteria.</p>
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
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    receipt.type === 'fuel' ? 'bg-green-50' : 
                    receipt.type === 'airtime' ? 'bg-blue-50' : 
                    receipt.type === 'cash' ? 'bg-yellow-50' : 'bg-purple-50'
                  }`}>
                    {getServiceTypeIcon(receipt.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[#01312D] text-lg">
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
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Car className="w-4 h-4" /> {receipt.carRegistration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> Completed {new Date(receipt.completedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-8 border-t lg:border-t-0 pt-4 lg:pt-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Amount</p>
                    <p className="text-2xl font-black text-[#01312D]">
                      R{(receipt.actualAmount || receipt.amount).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedReceipt(receipt);
                      setShowDetailsModal(true);
                    }}
                    className="flex items-center gap-2 bg-[#01312D] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#3A7717] transition-all shadow-md active:scale-95"
                  >
                    <Eye className="w-5 h-5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDetailsModal(false)}
          />
          <div className="relative bg-white rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-[#bff202]/20 p-6 flex justify-between items-center z-10">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  selectedReceipt.type === 'fuel' ? 'bg-green-50' : 'bg-blue-50'
                }`}>
                  {getServiceTypeIcon(selectedReceipt.type)}
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#01312D]">Receipt Verification</h2>
                  <p className="text-sm text-gray-500">Verify service delivery proof</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <AlertCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Receipt Image */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#01312D] flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#3A7717]" /> Uploaded Receipt
                  </h3>
                  {selectedReceipt.popUrl && (
                    <a 
                      href={selectedReceipt.popUrl} 
                      target="_blank" 
                      className="text-xs font-bold text-[#3A7717] hover:underline flex items-center gap-1"
                    >
                      Open Original <ArrowRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
                
                <div className="bg-gray-50 rounded-3xl p-4 border-2 border-dashed border-[#bff202]/30 min-h-[300px] flex items-center justify-center relative group overflow-hidden">
                  {selectedReceipt.popUrl ? (
                    <img
                      src={selectedReceipt.popUrl}
                      alt="Service Receipt"
                      className="max-w-full h-auto rounded-2xl shadow-lg transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-16 h-16 text-gray-200 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">No image available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#eafde7] rounded-3xl p-6 space-y-4">
                  <h3 className="font-bold text-[#01312D] flex items-center gap-2 border-b border-[#bff202]/20 pb-2">
                    <User className="w-4 h-4 text-[#3A7717]" /> Driver Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Name</span>
                      <span className="font-bold text-[#01312D]">{selectedReceipt.driverName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Phone</span>
                      <span className="font-bold text-[#01312D]">{selectedReceipt.driverPhone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Vehicle</span>
                      <span className="font-bold text-[#01312D]">{selectedReceipt.carRegistration}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#eafde7] rounded-3xl p-6 space-y-4">
                  <h3 className="font-bold text-[#01312D] flex items-center gap-2 border-b border-[#bff202]/20 pb-2">
                    <FileText className="w-4 h-4 text-[#3A7717]" /> Service Info
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Type</span>
                      <span className="font-bold text-[#01312D] capitalize">{selectedReceipt.type}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Date</span>
                      <span className="font-bold text-[#01312D]">{new Date(selectedReceipt.completedDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Amount</span>
                      <span className="text-xl font-black text-[#3A7717]">R{(selectedReceipt.actualAmount || selectedReceipt.amount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning box if not verified */}
              {!selectedReceipt.hasReceipt && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    Please ensure the receipt clearly shows the <strong>amount</strong>, <strong>date</strong>, and <strong>station name</strong> before verifying. Verified receipts will be used for final bookkeeping.
                  </p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-[#bff202]/20 p-6 flex gap-4">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              
              {!selectedReceipt.hasReceipt ? (
                <button
                  onClick={() => handleVerifyReceipt(selectedReceipt.id)}
                  disabled={processing}
                  className="flex-[2] bg-gradient-to-r from-[#3A7717] to-[#72BF00] text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-[#3A7717]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:translate-y-0"
                >
                  {processing ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <CheckCircle className="w-6 h-6" />
                  )}
                  Verify & Approve Receipt
                </button>
              ) : (
                <div className="flex-[2] bg-green-50 text-green-700 px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                  <CheckCircle className="w-6 h-6" />
                  Verified on {selectedReceipt.receiptVerifiedAt ? new Date(selectedReceipt.receiptVerifiedAt).toLocaleDateString() : 'N/A'}
                </div>
              )}
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
            <h2 className="text-2xl font-black text-[#01312D] mb-2">Success!</h2>
            <p className="text-gray-500 mb-8">{successMessage}</p>
            <button
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
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
