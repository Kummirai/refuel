"use client";

import { useState, useEffect } from "react";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import { formatMoney } from "@/lib/money";
import {
  Clock,
  Fuel,
  Smartphone,
  DollarSign,
  Car,
  Search,
  User,
  Phone,
  Calendar,
  Copy,
  Check,
  Loader2,
  CheckCircle,
  X,
  AlertCircle,
  RefreshCw,
  ImageIcon,
} from "lucide-react";

type RequestType = "fuel" | "airtime" | "cash" | "carwash";

interface ManagerRequest {
  id: string;
  type: RequestType;
  amount: number;
  actualAmount?: number;
  carNumber: string;
  carModel?: string;
  driverName: string;
  driverPhone: string;
  driverEmail: string;
  status: string;
  otp?: string;
  refueledByManager?: boolean;
  requestDate: string;
  approvedDate: string;
  completedDate?: string;
  interestRate?: number;
  interest?: number;
  totalRepayable?: number;
  fuelType?: string;
  contactPhone?: string;
  popUrl?: string;
}

export default function ManagerPendingPage() {
  const [requests, setRequests] = useState<ManagerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<ManagerRequest | null>(null);
  const [showRefuelModal, setShowRefuelModal] = useState(false);
  const [refuelLoading, setRefuelLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [copiedOtp, setCopiedOtp] = useState<string | null>(null);
  const [detailRequest, setDetailRequest] = useState<ManagerRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useBodyScrollLock(showRefuelModal || showSuccessModal || showErrorModal || showDetailModal);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/manager/requests?status=approved", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.pending || []);
      }
    } catch (err) {
      console.error("Error fetching pending requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOtp = (otp: string) => {
    navigator.clipboard.writeText(otp);
    setCopiedOtp(otp);
    setTimeout(() => setCopiedOtp(null), 2000);
  };

  const openRefuelModal = (request: ManagerRequest) => {
    setSelectedRequest(request);
    setShowRefuelModal(true);
  };

  const handleConfirmRefuel = async () => {
    if (!selectedRequest) return;
    setRefuelLoading(true);
    try {
      const res = await fetch("/api/manager/requests/refuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: selectedRequest.id }),
      });
      if (res.ok) {
        setSuccessMessage(`Request marked as refueled (completed)!`);
        setShowSuccessModal(true);
        fetchRequests();
        setShowRefuelModal(false);
        setSelectedRequest(null);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || "Failed to mark as refueled");
        setShowErrorModal(true);
      }
    } catch (err) {
      setErrorMessage("Failed to mark as refueled");
      setShowErrorModal(true);
    } finally {
      setRefuelLoading(false);
    }
  };

  const getTypeIcon = (type: RequestType) => {
    switch (type) {
      case "fuel": return Fuel;
      case "airtime": return Smartphone;
      case "cash": return DollarSign;
      case "carwash": return Car;
    }
  };

  const getTypeLabel = (type: RequestType) => {
    switch (type) {
      case "fuel": return "Fuel";
      case "airtime": return "Airtime";
      case "cash": return "Cash Loan";
      case "carwash": return "Car Wash";
    }
  };

  const getTypeColor = (type: RequestType) => {
    switch (type) {
      case "fuel": return "bg-[#3A7717]/10 text-[#3A7717]";
      case "airtime": return "bg-[#72BF00]/10 text-[#72BF00]";
      case "cash": return "bg-[#BFF202]/20 text-[#01312D]";
      case "carwash": return "bg-[#EAFDE7] text-[#01312D]";
    }
  };

  const filtered = requests.filter(
    (r) =>
      r.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.carNumber?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#01312D]">Pending Requests</h1>
          <p className="text-gray-500 text-sm mt-1">
            {requests.length} request{requests.length !== 1 ? "s" : ""} awaiting refuel confirmation
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2 bg-[#3A7717] text-white rounded-xl hover:bg-[#2d5e12] text-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by driver name or car number..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
        />
      </div>

      {/* Pending List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-[#3A7717] animate-spin mx-auto" />
          <p className="mt-2 text-gray-500">Loading requests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-[#bff202]/20">
          <CheckCircle className="w-12 h-12 text-[#3A7717] mx-auto mb-3" />
          <p className="text-lg font-semibold text-[#01312D]">All caught up!</p>
          <p className="text-gray-500">No pending requests for this cycle.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const TypeIcon = getTypeIcon(req.type);
            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeColor(req.type)}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-[#01312D]">{req.driverName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getTypeColor(req.type)}`}>
                          {getTypeLabel(req.type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{req.carNumber}{req.carModel ? ` - ${req.carModel}` : ""}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-gray-500">
                          Amount: <strong className="text-[#01312D]">{formatMoney(req.amount)}</strong>
                        </span>
                        {req.otp && (
                          <span className="text-gray-500">
                            OTP: <code className="font-mono font-bold text-[#01312D]">{req.otp}</code>
                          </span>
                        )}
                      </div>
                      {req.approvedDate && (
                        <p className="text-xs text-gray-400 mt-1">
                          Approved: {new Date(req.approvedDate).toLocaleDateString("en-ZA")}
                        </p>
                      )}
                      {req.popUrl && (
                        <div className="mt-2 pt-2 border-t border-[#bff202]/10">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#EAFDE7] rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-[#3A7717]" />
                            </div>
                            <span className="text-xs text-gray-500">Receipt uploaded</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => { setDetailRequest(req); setShowDetailModal(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#01312D] text-white rounded-xl font-semibold text-sm hover:bg-[#012520] transition-colors whitespace-nowrap"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Refuel Confirmation Modal */}
      {showRefuelModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !refuelLoading && setShowRefuelModal(false)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-[#3A7717] to-[#72BF00] rounded-t-2xl p-5">
              <h2 className="text-xl font-bold text-white">Confirm Refuel</h2>
              <p className="text-white/80 text-sm">Mark this request as completed</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#EAFDE7] rounded-xl p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Driver:</span>
                    <span className="font-semibold text-[#01312D]">{selectedRequest.driverName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vehicle:</span>
                    <span className="font-semibold text-[#01312D]">{selectedRequest.carNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Service:</span>
                    <span className="font-semibold text-[#01312D]">{getTypeLabel(selectedRequest.type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-bold text-[#3A7717]">{formatMoney(selectedRequest.amount)}</span>
                  </div>
                  {selectedRequest.otp && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">OTP:</span>
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold text-[#01312D]">{selectedRequest.otp}</code>
                        <button onClick={() => handleCopyOtp(selectedRequest.otp!)} className="p-1 hover:bg-white rounded">
                          {copiedOtp === selectedRequest.otp ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <p className="text-xs text-green-800">
                    Confirm that the driver has refueled/received the service. This will mark the request as completed.
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 p-5 flex gap-3">
              <button
                onClick={() => { setShowRefuelModal(false); setSelectedRequest(null); }}
                disabled={refuelLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRefuel}
                disabled={refuelLoading}
                className="flex-1 bg-[#3A7717] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#2d5e12] disabled:opacity-50"
              >
                {refuelLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Confirm Refuel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-bold text-[#01312D] mb-2">Success!</p>
            <p className="text-gray-500">{successMessage}</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="mt-4 w-full bg-[#01312D] text-white py-2 rounded-xl font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && detailRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowDetailModal(false); setDetailRequest(null); }} />
          <div className="relative bg-white rounded-2xl max-w-sm w-full shadow-2xl">
            <div className="bg-gradient-to-r from-[#01312D] to-[#3A7717] rounded-t-2xl p-6 text-center">
              <p className="text-white/70 text-xs uppercase tracking-wider mb-1">{getTypeLabel(detailRequest.type)}</p>
              <h2 className="text-2xl font-bold text-white">{detailRequest.driverName}</h2>
              <p className="text-white/80 text-lg font-semibold mt-1">{detailRequest.carNumber}{detailRequest.carModel ? ` - ${detailRequest.carModel}` : ""}</p>
            </div>
            <div className="p-6 space-y-5">
              {detailRequest.otp && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
                  <p className="text-xs text-amber-700 uppercase tracking-wider font-semibold mb-2">One-Time Password</p>
                  <p className="text-4xl font-bold tracking-[0.15em] text-[#01312D] font-mono">{detailRequest.otp}</p>

                </div>
              )}
              <div className="bg-[#EAFDE7] border border-[#bff202]/20 rounded-2xl p-5 text-center">
                <p className="text-xs text-[#3A7717] uppercase tracking-wider font-semibold mb-1">Amount</p>
                <p className="text-3xl font-bold text-[#01312D]">{formatMoney(detailRequest.amount)}</p>
              </div>
              {detailRequest.fuelType && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Fuel Type</span>
                  <span className="font-semibold text-[#01312D]">{detailRequest.fuelType}</span>
                </div>
              )}
              {detailRequest.approvedDate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Approved</span>
                  <span className="text-[#01312D]">{new Date(detailRequest.approvedDate).toLocaleString("en-ZA")}</span>
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 p-5 flex gap-3">
              <button
                onClick={() => { setShowDetailModal(false); setDetailRequest(null); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => { setShowDetailModal(false); setDetailRequest(null); openRefuelModal(detailRequest); }}
                className="flex-1 px-4 py-2.5 bg-[#3A7717] text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#2d5e12]"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm Refuel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowErrorModal(false)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-lg font-bold text-[#01312D] mb-2">Error</p>
            <p className="text-gray-500">{errorMessage}</p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="mt-4 w-full bg-red-500 text-white py-2 rounded-xl font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
