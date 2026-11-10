"use client";

import { useState, useEffect } from "react";
import { formatMoney } from "@/lib/money";
import {
  CheckCircle,
  Fuel,
  Smartphone,
  DollarSign,
  Car,
  Search,
  RefreshCw,
  Loader2,
  Calendar,
  Truck,
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
}

export default function ManagerCompletedPage() {
  const [requests, setRequests] = useState<ManagerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/manager/requests?status=completed", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.completed || []);
      }
    } catch (err) {
      console.error("Error fetching completed requests:", err);
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold text-[#01312D]">Completed Requests</h1>
          <p className="text-gray-500 text-sm mt-1">
            {requests.length} request{requests.length !== 1 ? "s" : ""} completed this cycle
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

      {/* Completed List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-[#3A7717] animate-spin mx-auto" />
          <p className="mt-2 text-gray-500">Loading completed requests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-[#bff202]/20">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-lg font-semibold text-[#01312D]">No completed requests</p>
          <p className="text-gray-500">No requests have been completed this cycle yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const TypeIcon = getTypeIcon(req.type);
            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeColor(req.type)}`}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-[#01312D]">{req.driverName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getTypeColor(req.type)}`}>
                        {getTypeLabel(req.type)}
                      </span>
                      {req.refueledByManager && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Refueled
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{req.carNumber}{req.carModel ? ` - ${req.carModel}` : ""}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-gray-500">
                        Amount: <strong className="text-[#01312D]">{formatMoney(req.amount)}</strong>
                      </span>
                      {req.totalRepayable && (
                        <span className="text-gray-500">
                          Total: <strong className="text-[#3A7717]">{formatMoney(req.totalRepayable)}</strong>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      {req.approvedDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Approved: {new Date(req.approvedDate).toLocaleDateString("en-ZA")}
                        </span>
                      )}
                      {req.completedDate && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Completed: {new Date(req.completedDate).toLocaleDateString("en-ZA")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
