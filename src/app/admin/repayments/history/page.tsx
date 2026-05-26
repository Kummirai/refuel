// src/app/admin/repayments/history/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatMoney } from "@/lib/money";
import {
  Loader2, Clock, X, ArrowLeft, Car, FileText, Fuel, SprayCan,
  Smartphone, DollarSign, Search, Calendar, User, CheckCircle,
} from "lucide-react";
import Link from "next/link";

interface HistoryEntry {
  id: string;
  loanId: string;
  driverId: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  carNumber: string;
  serviceType: string;
  serviceTypeLabel: string;
  amount: number;
  method: string;
  paymentDate: string;
  approvedAt: string;
  approvedDate: string;
  remainingBalance: number;
  isProofApproval: boolean;
  proofId?: string;
}

interface HistoryGroup {
  driverId: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  approvedDate: string;
  entries: HistoryEntry[];
  totalAmount: number;
}

interface HistoryData {
  groups: HistoryGroup[];
  stats: { totalAmount: number; totalEntries: number; uniqueDrivers: number };
}

function getTypeIcon(type: string, className = "w-3.5 h-3.5") {
  switch (type) {
    case "fuel": return <Fuel className={`${className} text-green-600`} />;
    case "carwash": return <SprayCan className={`${className} text-purple-600`} />;
    case "airtime": return <Smartphone className={`${className} text-blue-600`} />;
    case "cash": return <DollarSign className={`${className} text-yellow-600`} />;
    default: return <FileText className={`${className} text-gray-600`} />;
  }
}

function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    fuel: "Fuel", airtime: "Airtime", cash: "Cash Loan", carwash: "Car Wash",
  };
  return map[type] || type;
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-ZA", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ---- Driver Detail View ----
function DriverDetailView({
  group, onBack,
}: {
  group: HistoryGroup; onBack: () => void;
}) {
  const totalEntries = group.entries.length;
  const byMethod = group.entries.reduce((acc, e) => {
    acc[e.method] = (acc[e.method] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#01312D] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to history
      </button>

      {/* Driver Header */}
      <div className="bg-gradient-to-br from-[#01312D] to-[#3A7717] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#bff202]/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black">{group.driverName}</h2>
              <p className="text-white/70 text-sm">{group.driverEmail}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-white/50 text-[10px] font-bold uppercase">Date</p>
              <p className="font-bold">{formatDate(group.approvedDate)}</p>
            </div>
            <div>
              <p className="text-white/50 text-[10px] font-bold uppercase">Total Repaid</p>
              <p className="font-bold text-[#bff202]">{formatMoney(group.totalAmount)}</p>
            </div>
            <div>
              <p className="text-white/50 text-[10px] font-bold uppercase">Entries</p>
              <p className="font-bold">{totalEntries} payment{totalEntries !== 1 ? "s" : ""}</p>
            </div>
            <div>
              <p className="text-white/50 text-[10px] font-bold uppercase">Methods</p>
              <p className="font-bold text-sm">{Object.keys(byMethod).join(", ")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-2xl border border-[#bff202]/20 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-[#01312D] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#3A7717]" /> Payment Details
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 sm:px-4 py-3 text-[10px] font-bold text-gray-500 uppercase hidden sm:table-cell">Service</th>
                <th className="text-left px-3 sm:px-4 py-3 text-[10px] font-bold text-gray-500 uppercase hidden sm:table-cell">Vehicle</th>
                <th className="text-left px-3 sm:px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Time</th>
                <th className="text-right px-3 sm:px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Amount</th>
                <th className="text-right px-3 sm:px-4 py-3 text-[10px] font-bold text-gray-500 uppercase hidden sm:table-cell">Method</th>
                <th className="text-center px-3 sm:px-4 py-3 text-[10px] font-bold text-gray-500 uppercase hidden sm:table-cell">Source</th>
                <th className="text-center px-3 sm:px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {group.entries.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-100 hover:bg-[#eafde7]/30 transition-colors">
                  <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">
                    <span className="flex items-center gap-1.5">
                      {getTypeIcon(entry.serviceType)}
                      <span className="font-medium text-[#01312D]">{entry.serviceTypeLabel}</span>
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-gray-600 hidden sm:table-cell">{entry.carNumber}</td>
                  <td className="px-3 sm:px-4 py-3 text-gray-500 text-[10px] sm:text-xs whitespace-nowrap">{formatDateTime(entry.approvedAt)}</td>
                  <td className="px-3 sm:px-4 py-3 text-right font-bold text-[#01312D]">{formatMoney(entry.amount)}</td>
                  <td className="px-3 sm:px-4 py-3 text-right capitalize text-gray-600 hidden sm:table-cell">{entry.method.replace("_", " ")}</td>
                  <td className="px-3 sm:px-4 py-3 text-center hidden sm:table-cell">
                    {entry.isProofApproval ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Proof
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> Manual
                      </span>
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center">
                    {entry.remainingBalance <= 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                        <CheckCircle className="w-3 h-3" /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                        <Clock className="w-3 h-3" /> Partial
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals by Method */}
      <div className="bg-[#eafde7] rounded-2xl p-5 border border-[#bff202]/20 shadow-sm">
        <h3 className="font-bold text-[#01312D] mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#3A7717]" /> Payment Summary
        </h3>
        <div className="space-y-2">
          {Object.entries(byMethod).map(([method, total]) => (
            <div key={method} className="flex justify-between items-center">
              <span className="text-sm capitalize text-gray-700">{method.replace("_", " ")}</span>
              <span className="font-bold text-[#01312D]">{formatMoney(total)}</span>
            </div>
          ))}
          <div className="border-t border-[#bff202]/30 pt-2 flex justify-between items-center">
            <span className="font-bold text-[#01312D]">Total</span>
            <span className="font-black text-lg text-[#01312D]">{formatMoney(group.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Main History Page ----
export default function RepaymentHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<HistoryGroup | null>(null);
  const [dateFilter, setDateFilter] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  const viewDriverId = searchParams.get("driverId");
  const viewDate = searchParams.get("date");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (viewDriverId) params.set("driverId", viewDriverId);
      if (viewDate) params.set("date", viewDate);
      const qs = params.toString();
      const res = await fetch(`/api/admin/repayments/history${qs ? `?${qs}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        if (viewDriverId && viewDate) {
          const group = data.groups?.find(
            (g: HistoryGroup) => g.driverId === viewDriverId && g.approvedDate === viewDate,
          );
          if (group) setSelectedGroup(group);
        }
      }
    } catch (err) {
      console.error("Error fetching repayment history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDriver = (group: HistoryGroup) => {
    router.push(`/admin/repayments/history?driverId=${group.driverId}&date=${group.approvedDate}`);
    setSelectedGroup(group);
  };

  const handleBack = () => {
    router.push("/admin/repayments/history");
    setSelectedGroup(null);
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (!history) return;
    if (allExpanded) {
      setExpandedGroups(new Set());
    } else {
      setExpandedGroups(new Set(history.groups.map((_, i) => String(i))));
    }
    setAllExpanded(!allExpanded);
  };

  if (selectedGroup) {
    return <DriverDetailView group={selectedGroup} onBack={handleBack} />;
  }

  const filteredGroups = history?.groups.filter((g) => {
    if (searchTerm && !g.driverName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (dateFilter && g.approvedDate !== dateFilter) return false;
    return true;
  }) || [];

  const uniqueDates = [...new Set(history?.groups.map((g) => g.approvedDate) || [])].sort().reverse();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/repayments" className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#01312D]">Repayment History</h1>
            <p className="text-gray-500 text-sm mt-0.5">Approved repayments grouped by driver and date</p>
          </div>
        </div>
        <button
          onClick={() => { setSearchTerm(""); setDateFilter(""); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#eafde7] rounded-xl text-[#01312D] font-semibold hover:bg-[#bff202]/30 transition-all text-sm"
        >
          <Clock className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      {history && !loading && (() => {
        const filteredTotal = filteredGroups.reduce((s, g) => s + g.totalAmount, 0);
        const filteredEntries = filteredGroups.reduce((s, g) => s + g.entries.length, 0);
        const filteredDrivers = new Set(filteredGroups.map(g => g.driverId)).size;
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <p className="text-xs text-gray-500">Total Repaid</p>
              <p className="text-2xl font-bold text-[#3A7717]">{formatMoney(filteredTotal)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <p className="text-xs text-gray-500">Payments Recorded</p>
              <p className="text-2xl font-bold text-[#01312D]">{filteredEntries}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <p className="text-xs text-gray-500">Unique Drivers</p>
              <p className="text-2xl font-bold text-[#01312D]">{filteredDrivers}</p>
            </div>
          </div>
        );
      })()}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by driver name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
          />
        </div>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] text-sm"
        >
          <option value="">All dates</option>
          {uniqueDates.map((d) => (
            <option key={d} value={d}>{formatDate(d)}</option>
          ))}
        </select>
        {history && history.groups.length > 1 && (
          <button
            onClick={toggleAll}
            className="px-4 py-2 bg-[#eafde7] rounded-xl text-[#01312D] font-semibold hover:bg-[#bff202]/30 transition-all text-sm"
          >
            {allExpanded ? "Collapse All" : "Expand All"}
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-[#bff202]/10" />
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#bff202]/20">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#01312D]">No repayment history</h3>
          <p className="text-gray-500 text-sm mt-1">Approved repayments will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map((group, idx) => {
            const key = String(idx);
            const isOpen = expandedGroups.has(key);
            return (
              <div key={key} className="bg-white rounded-2xl border border-[#bff202]/10 overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleGroup(key)}
                  className="w-full text-left p-5 hover:bg-[#eafde7] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-[#eafde7] rounded-full flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-[#3A7717]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#01312D] truncate">{group.driverName}</p>
                        <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-1.5">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span className="whitespace-nowrap">{formatDate(group.approvedDate)}</span>
                          <span className="text-gray-300 shrink-0">·</span>
                          <span className="whitespace-nowrap">{group.entries.length} payment{group.entries.length !== 1 ? "s" : ""}</span>
                          {group.driverEmail && (
                            <>
                              <span className="text-gray-300 shrink-0">·</span>
                              <span className="truncate max-w-[160px] sm:max-w-none">{group.driverEmail}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-lg font-black text-[#01312D]">{formatMoney(group.totalAmount)}</p>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 space-y-3">
                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-gray-500 uppercase">Payments</h4>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewDriver(group); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#01312D] text-white rounded-lg text-xs font-semibold hover:bg-[#3A7717] transition-colors"
                        >
                          <FileText className="w-3 h-3" />
                          View Details
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase hidden sm:table-cell">Service</th>
                              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase hidden sm:table-cell">Vehicle</th>
                              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase">Time</th>
                              <th className="text-right px-3 py-2 font-bold text-gray-500 uppercase">Amount</th>
                              <th className="text-right px-3 py-2 font-bold text-gray-500 uppercase hidden sm:table-cell">Method</th>
                              <th className="text-center px-3 py-2 font-bold text-gray-500 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.entries.map((entry) => (
                              <tr key={entry.id} className="border-b border-gray-50">
                                <td className="px-3 py-2 hidden sm:table-cell">
                                  <span className="flex items-center gap-1">
                                    {getTypeIcon(entry.serviceType)}
                                    <span className="font-medium text-[#01312D]">{entry.serviceTypeLabel}</span>
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-gray-500 hidden sm:table-cell">{entry.carNumber}</td>
                                <td className="px-3 py-2 text-gray-400 whitespace-nowrap text-[10px] sm:text-xs">{formatDateTime(entry.approvedAt)}</td>
                                <td className="px-3 py-2 text-right font-semibold text-[#01312D]">{formatMoney(entry.amount)}</td>
                                <td className="px-3 py-2 text-right capitalize text-gray-500 hidden sm:table-cell">{entry.method.replace("_", " ")}</td>
                                <td className="px-3 py-2 text-center">
                                  {entry.remainingBalance <= 0 ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-1.5 sm:px-2 py-0.5 rounded-full">
                                      <CheckCircle className="w-3 h-3" /> Paid
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 sm:px-2 py-0.5 rounded-full">
                                      <Clock className="w-3 h-3" /> Partial
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-end pt-3 mt-2 border-t border-gray-100">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Total for {formatDate(group.approvedDate)}</p>
                          <p className="text-lg font-black text-[#01312D]">{formatMoney(group.totalAmount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
