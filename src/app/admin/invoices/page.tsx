"use client";

import { useState, useEffect } from "react";
import { formatMoney } from "@/lib/money";
import {
  Loader2,
  Send,
  CheckCircle,
  AlertCircle,
  Car,
  Fuel,
  SprayCan,
  Smartphone,
  DollarSign,
  RefreshCw,
  FileText,
  User,
  Mail,
  Phone,
} from "lucide-react";

interface InvoiceItem {
  type: string;
  carNumber: string;
  amount: number;
  totalRepayable: number;
  remainingBalance: number;
}

interface DriverInvoice {
  driverEmail: string;
  driverName: string;
  items: InvoiceItem[];
  totalOutstanding: number;
}

export default function AdminInvoicesPage() {
  const [drivers, setDrivers] = useState<DriverInvoice[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [result, setResult] = useState<{
    sent: number;
    errors: number;
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/invoices");
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers || []);
        setTotalOutstanding(data.totalOutstanding || 0);
      }
    } catch (err) {
      console.error("Error fetching invoice data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendAll = async () => {
    setSending(true);
    setSent(false);
    setResult(null);
    try {
      const res = await fetch("/api/admin/invoices/send", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setResult({ sent: data.sent, errors: data.errors });
        setSent(true);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to send invoices");
      }
    } catch (err) {
      console.error("Error sending invoices:", err);
      alert("Failed to send invoices");
    } finally {
      setSending(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "fuel":
        return <Fuel className="w-4 h-4 text-green-600" />;
      case "carwash":
        return <SprayCan className="w-4 h-4 text-purple-600" />;
      case "airtime":
        return <Smartphone className="w-4 h-4 text-blue-600" />;
      case "cash":
        return <DollarSign className="w-4 h-4 text-yellow-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      fuel: "Fuel",
      airtime: "Airtime",
      cash: "Cash Loan",
      carwash: "Car Wash",
    };
    return map[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#01312D]">
            Weekly Invoices
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Drivers with outstanding balances
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
          <p className="text-xs text-gray-500">Total Drivers</p>
          <div className="text-2xl font-bold text-[#01312D]">
            {loading ? "..." : drivers.length}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Total Outstanding</p>
          <div className="text-2xl font-bold text-red-600">
            {loading ? "..." : formatMoney(totalOutstanding)}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Status</p>
          <div className="text-lg font-bold text-[#01312D]">
            {result
              ? `${result.sent} sent, ${result.errors} errors`
              : "Ready"}
          </div>
        </div>
      </div>

      {/* Driver List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/10 animate-pulse"
            >
              <div className="h-5 bg-gray-200 rounded w-48 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
          ))}
        </div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#bff202]/20">
          <div className="w-20 h-20 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-[#3A7717]" />
          </div>
          <h3 className="text-lg font-bold text-[#01312D]">
            All caught up!
          </h3>
          <p className="text-gray-500">
            No drivers have outstanding balances.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {drivers.map((driver, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/10"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#eafde7] rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-[#3A7717]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#01312D]">
                      {driver.driverName}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 text-xs text-gray-500 mt-1">
                      {driver.driverEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {driver.driverEmail}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Outstanding</p>
                  <p className="text-xl font-black text-red-600">
                    {formatMoney(driver.totalOutstanding)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {driver.items.length} item{driver.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Items Table - Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-gray-400 font-semibold text-xs uppercase">
                        Type
                      </th>
                      <th className="text-left py-2 text-gray-400 font-semibold text-xs uppercase">
                        Vehicle
                      </th>
                      <th className="text-right py-2 text-gray-400 font-semibold text-xs uppercase">
                        Amount
                      </th>
                      <th className="text-right py-2 text-gray-400 font-semibold text-xs uppercase">
                        Interest
                      </th>
                      <th className="text-right py-2 text-gray-400 font-semibold text-xs uppercase">
                        Total Repayable
                      </th>
                      <th className="text-right py-2 text-gray-400 font-semibold text-xs uppercase">
                        Remaining
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {driver.items.map((item, iidx) => (
                      <tr key={iidx} className="border-b border-gray-50">
                        <td className="py-2">
                          <span className="flex items-center gap-1.5">
                            {getTypeIcon(item.type)}
                            {getTypeLabel(item.type)}
                          </span>
                        </td>
                        <td className="py-2">
                          <span className="flex items-center gap-1 text-gray-600">
                            <Car className="w-3 h-3" /> {item.carNumber}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          {formatMoney(item.amount)}
                        </td>
                        <td className="py-2 text-right">
                          {formatMoney(item.totalRepayable - item.amount)}
                        </td>
                        <td className="py-2 text-right">
                          {formatMoney(item.totalRepayable)}
                        </td>
                        <td className="py-2 text-right font-semibold text-red-600">
                          {formatMoney(item.remainingBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Items Cards - Mobile */}
              <div className="sm:hidden space-y-2">
                {driver.items.map((item, iidx) => (
                  <div
                    key={iidx}
                    className="bg-gray-50 rounded-xl p-3 border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-[#01312D]">
                        {getTypeIcon(item.type)}
                        {getTypeLabel(item.type)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Car className="w-3 h-3" /> {item.carNumber}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Amount</span>
                        <span className="font-semibold text-[#01312D]">{formatMoney(item.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Interest</span>
                        <span className="font-semibold text-[#01312D]">{formatMoney(item.totalRepayable - item.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total</span>
                        <span className="font-semibold text-[#01312D]">{formatMoney(item.totalRepayable)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-gray-200">
                        <span className="text-gray-400 font-semibold">Remaining</span>
                        <span className="font-semibold text-red-600">{formatMoney(item.remainingBalance)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Send Button */}
      {drivers.length > 0 && (
        <div className="sticky bottom-0 bg-[#eafde7] rounded-2xl p-4 sm:p-6 shadow-lg border border-[#bff202]/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-500">
                Sending to {drivers.length} driver{drivers.length !== 1 ? "s" : ""}
              </p>
              <p className="text-lg font-bold text-[#01312D]">
                Total: {formatMoney(totalOutstanding)}
              </p>
            </div>
            {sent ? (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-2 text-green-600 font-semibold text-sm sm:text-base">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  Sent! ({result?.sent} delivered
                  {result?.errors ? `, ${result.errors} failed` : ""})
                </div>
                <button
                  onClick={handleSendAll}
                  className="w-full sm:w-auto px-6 py-3 bg-[#01312D] text-white rounded-xl font-semibold hover:bg-[#3A7717] transition-all"
                >
                  Send Again
                </button>
              </div>
            ) : (
              <button
                onClick={handleSendAll}
                disabled={sending}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-[#01312D] text-white rounded-xl font-bold text-base sm:text-lg shadow-lg hover:bg-[#3A7717] transition-all disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Invoice Emails
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
