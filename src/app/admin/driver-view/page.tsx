"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { formatMoney } from "@/lib/money";
import {
  Loader2,
  Search,
  X,
  User,
  Car,
  Fuel,
  SprayCan,
  Smartphone,
  DollarSign,
  FileText,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface LoanItem {
  id: string;
  type: string;
  amount: number;
  totalRepayable: number;
  repaid: number;
  remaining: number;
  status: string;
  hasReceipt: boolean;
  completedDate?: string;
  carNumber?: string;
}

interface DriverView {
  userId: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  paid: number;
  outstanding: number;
  loans: LoanItem[];
}

export default function AdminDriverViewPage() {
  const [drivers, setDrivers] = useState<DriverView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<DriverView | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/driver-view");
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers || []);
      }
    } catch (err) {
      console.error("Error fetching driver view data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDrivers = useMemo(() => {
    if (!searchQuery) return drivers;
    const q = searchQuery.toLowerCase();
    return drivers.filter(
      (d) =>
        d.driverName.toLowerCase().includes(q) ||
        d.driverEmail.toLowerCase().includes(q)
    );
  }, [drivers, searchQuery]);

  const totals = useMemo(() => {
    let paid = 0,
      outstanding = 0;
    for (const d of filteredDrivers) {
      paid += d.paid;
      outstanding += d.outstanding;
    }
    return { paid, outstanding };
  }, [filteredDrivers]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "fuel": return <Fuel className="w-4 h-4 text-green-600" />;
      case "carwash": return <SprayCan className="w-4 h-4 text-purple-600" />;
      case "airtime": return <Smartphone className="w-4 h-4 text-blue-600" />;
      case "cash": return <DollarSign className="w-4 h-4 text-yellow-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = { fuel: "Fuel", airtime: "Airtime", cash: "Cash Loan", carwash: "Car Wash" };
    return map[type] || type;
  };

  const DriverCard = ({ driver, isSelected, onToggle, getTypeIcon, getTypeLabel, formatMoney }: any) => {
    const cardRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (isSelected && cardRef.current) {
        cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, [isSelected]);
    return (
    <div ref={cardRef} className={`rounded-2xl border transition-all duration-200 overflow-hidden ${isSelected ? "bg-[#eafde7] border-[#bff202] shadow-md" : "bg-white border-[#bff202]/10"}`}>
      <button onClick={onToggle} className="w-full text-left p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${isSelected ? "bg-[#bff202]" : "bg-[#eafde7]"}`}>
              <User className={`w-4 h-4 ${isSelected ? "text-[#01312D]" : "text-[#3A7717]"}`} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[#01312D]">{driver.driverName}</p>
              <p className={`text-xs truncate ${isSelected ? "text-[#01312D]/70" : "text-gray-400"}`}>{driver.driverEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <p className={`text-xs ${isSelected ? "text-[#01312D]/70" : "text-gray-400"}`}>Paid</p>
              <p className={`text-sm font-semibold ${isSelected ? "text-[#01312D]" : "text-green-600"}`}>{formatMoney(driver.paid)}</p>
            </div>
            <div className="text-right">
              <p className={`text-xs ${isSelected ? "text-[#01312D]/70" : "text-gray-400"}`}>Outstanding</p>
              <p className="text-sm font-bold text-red-600">{formatMoney(driver.outstanding)}</p>
            </div>
            <Eye className={`w-4 h-4 ${isSelected ? "text-[#01312D]/50" : "text-gray-300"}`} />
          </div>
        </div>
      </button>

      {isSelected && (
        <div className="bg-[#01312D]/5 rounded-b-2xl border-t border-[#bff202]/30 px-4 pb-4 pt-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Loans ({driver.loans.length})</h4>
          <div className="space-y-2">
            {driver.loans.map((loan: any) => (
              <div key={loan.id} className="bg-white rounded-xl p-3 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-[#01312D]">
                    {getTypeIcon(loan.type)}
                    {getTypeLabel(loan.type)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {loan.completedDate ? new Date(loan.completedDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }) : loan.status}
                  </span>
                </div>
                {loan.carNumber && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Car className="w-3 h-3" /> {loan.carNumber}
                  </p>
                )}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div><p className="text-gray-400">Amount</p><p className="font-semibold">{formatMoney(loan.amount)}</p></div>
                  <div><p className="text-gray-400">Interest</p><p className="font-semibold text-orange-600">{formatMoney(Math.max(0, loan.totalRepayable - loan.amount))}</p></div>
                  <div><p className="text-gray-400">Repaid</p><p className="font-semibold text-green-600">{formatMoney(loan.repaid)}</p></div>
                  <div>
                    <p className="text-gray-400">Remaining</p>
                    <p className={`font-bold ${loan.remaining > 0 ? "text-red-600" : "text-green-600"}`}>
                      {loan.remaining > 0 ? formatMoney(loan.remaining) : "Paid"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#01312D]">Driver View</h1>
          <p className="text-gray-500 text-sm mt-1">
            What each driver sees on their dashboard
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#eafde7] rounded-xl text-[#01312D] font-semibold hover:bg-[#bff202]/30 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Drivers with active loans</p>
          <p className="text-2xl font-bold text-[#01312D]">
            {loading ? "..." : filteredDrivers.length}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">
            {loading ? "..." : formatMoney(totals.paid)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Total Outstanding</p>
          <p className="text-2xl font-bold text-red-600">
            {loading ? "..." : formatMoney(totals.outstanding)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search driver..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-[#bff202]/20 text-sm text-[#01312D] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#bff202]/40"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Driver List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/10 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-48 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#bff202]/20">
          <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#01312D]">No drivers found</h3>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDrivers.map((driver) => (
            <DriverCard
              key={driver.userId}
              driver={driver}
              isSelected={selectedDriver?.userId === driver.userId}
              onToggle={() => setSelectedDriver(selectedDriver?.userId === driver.userId ? null : driver)}
              getTypeIcon={getTypeIcon}
              getTypeLabel={getTypeLabel}
              formatMoney={formatMoney}
            />
          ))}
        </div>
      )}
    </div>
  );
}
