"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { Loader2, Clock, X, ArrowLeft, Car, FileText, Fuel, SprayCan, Smartphone, DollarSign, Eye } from "lucide-react";
import Link from "next/link";

interface InvoiceItem {
  type: string;
  carNumber: string;
  amount: number;
  totalRepayable: number;
  remainingBalance: number;
  completedDate?: string;
}

interface DriverEntry {
  driverName: string;
  driverEmail: string;
  driverPhone?: string;
  carRegistration?: string;
  outstanding: number;
  items: InvoiceItem[];
}

interface InvoiceBatch {
  _id: string;
  sentAt: string;
  totalDrivers: number;
  totalOutstanding: number;
  sent: number;
  errors: number;
  dateRange?: { startDate: string; endDate: string } | null;
  drivers: DriverEntry[];
}

function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    fuel: "Fuel",
    airtime: "Airtime",
    cash: "Cash Loan",
    carwash: "Car Wash",
  };
  return map[type] || type;
}

function GetTypeIcon({ type }: { type: string }) {
  const cl = "w-3.5 h-3.5";
  switch (type) {
    case "fuel":
      return <Fuel className={`${cl} text-green-600`} />;
    case "carwash":
      return <SprayCan className={`${cl} text-purple-600`} />;
    case "airtime":
      return <Smartphone className={`${cl} text-blue-600`} />;
    case "cash":
      return <DollarSign className={`${cl} text-yellow-600`} />;
    default:
      return <FileText className={`${cl} text-gray-600`} />;
  }
}

function InvoiceView({ batch, driverIdx, onBack }: { batch: InvoiceBatch; driverIdx: number; onBack: () => void }) {
  const driver = batch.drivers[driverIdx];
  if (!driver) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Driver not found</p>
        <button onClick={onBack} className="mt-4 text-[#01312D] underline">Go back</button>
      </div>
    );
  }

  const totalAmount = driver.items.reduce((s, i) => s + i.amount, 0);
  const totalInterest = driver.items.reduce((s, i) => s + (i.totalRepayable - i.amount), 0);
  const totalDue = driver.items.reduce((s, i) => s + i.totalRepayable, 0);

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#01312D] mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to history
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-[#bff202]/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0d4a2a] via-[#1a6b3e] to-[#0d4a2a] px-6 py-8">
          <h2 className="text-2xl font-bold text-white">Kapuka Tradings</h2>
          <p className="text-white/80 text-sm">Official Tax Invoice</p>
          <div className="h-1 bg-gradient-to-r from-[#bff202] via-[#72bf00] to-[#bff202] mt-4" />
        </div>

        <div className="p-6">
          {/* Invoice header */}
          <div className="flex justify-between items-start border-b-2 border-[#0d4a2a] pb-4 mb-6">
            <div>
              <h3 className="text-3xl font-extrabold text-[#0d4a2a] tracking-tight">INVOICE</h3>
              <p className="text-sm text-gray-500">Statement of outstanding balances</p>
              <p className="text-sm font-bold text-red-600 mt-1">Remember to do immediate payment.</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Sent</p>
              <p className="text-sm font-semibold text-[#0f172a]">
                {new Date(batch.sentAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
              </p>
              <span className="inline-block mt-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                AMOUNT DUE
              </span>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bill To</p>
            <p className="text-lg font-bold text-[#0f172a]">{driver.driverName}</p>
            <p className="text-sm text-gray-600">{driver.driverEmail}</p>
            {driver.carRegistration && (
              <p className="text-sm text-green-600 mt-0.5">{driver.carRegistration}</p>
            )}
          </div>

          {/* Items */}
          <table className="w-full text-sm border-collapse mb-6">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-bold text-[#0d4a2a] uppercase border-b-2 border-[#0d4a2a]">Date</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[#0d4a2a] uppercase border-b-2 border-[#0d4a2a]">Description</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-[#0d4a2a] uppercase border-b-2 border-[#0d4a2a]">Amount</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-[#0d4a2a] uppercase border-b-2 border-[#0d4a2a]">Interest</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-[#0d4a2a] uppercase border-b-2 border-[#0d4a2a]">Total</th>
              </tr>
            </thead>
            <tbody>
              {driver.items.map((item, i) => {
                const interest = item.totalRepayable - item.amount;
                return (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-4 py-3 text-gray-500">
                      {item.completedDate
                        ? new Date(item.completedDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <GetTypeIcon type={item.type} />
                        <span className="font-medium text-[#0f172a]">{getTypeLabel(item.type)}</span>
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">{item.carNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-[#0f172a]">R{item.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-[#0f172a]">R{interest.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#0f172a]">R{item.totalRepayable.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end gap-10 border-t-2 border-gray-200 pt-4 mb-6">
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-2">Subtotal</p>
              <p className="text-sm text-gray-500 mb-2">Interest</p>
              <div className="border-t-2 border-[#0d4a2a] pt-2">
                <p className="text-base font-bold text-[#0d4a2a]">Total Due</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[#0f172a] mb-2">R{totalAmount.toFixed(2)}</p>
              <p className="text-sm font-semibold text-[#0f172a] mb-2">R{totalInterest.toFixed(2)}</p>
              <div className="border-t-2 border-[#0d4a2a] pt-2">
                <p className="text-xl font-extrabold text-[#0d4a2a]">R{totalDue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Banking Details */}
          <div className="bg-green-50 rounded-xl p-4 border border-green-200 mb-4">
            <p className="text-sm font-bold text-green-800 mb-2">Banking Details</p>
            <div className="text-sm text-gray-700 leading-relaxed">
              <strong>Bank:</strong> FNB/RMB<br />
              <strong>Account Holder:</strong> Japhet Sibuyi<br />
              <strong>Account Type:</strong> FNB Aspire Current Account<br />
              <strong>Account Number:</strong> 63131222307<br />
              <strong>Branch Code:</strong> 250655<br />
              <strong className="text-red-600">Reference:</strong> Use your <strong className="text-red-600">car registration</strong> as payment reference
            </div>
          </div>

          {/* Reminder */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <p className="text-sm font-bold text-amber-800">
              Remaining balance must be paid to keep your account in good standing.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 text-center text-xs text-gray-400 border-t border-gray-200">
          <strong className="text-gray-500">Kapuka Tradings</strong><br />
          Thank you for your business
        </div>
      </div>
    </div>
  );
}

export default function InvoiceHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [history, setHistory] = useState<InvoiceBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<InvoiceBatch | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);

  const viewBatchId = searchParams.get("batch");
  const viewDriver = searchParams.get("driver");

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/invoices/history");
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  useEffect(() => {
    if (viewBatchId && viewDriver !== null) {
      const batch = history.find((b) => b._id === viewBatchId);
      if (batch) {
        setSelectedBatch(batch);
        setSelectedDriver(Number(viewDriver));
      }
    }
  }, [viewBatchId, viewDriver, history]);

  const handleViewInvoice = (batchId: string, driverIdx: number) => {
    router.push(`/admin/invoices/history?batch=${batchId}&driver=${driverIdx}`);
  };

  const handleBackToList = () => {
    router.push("/admin/invoices/history");
    setSelectedBatch(null);
    setSelectedDriver(null);
  };

  if (selectedBatch && selectedDriver !== null) {
    return <InvoiceView batch={selectedBatch} driverIdx={selectedDriver} onBack={handleBackToList} />;
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-ZA", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/invoices" className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#01312D]">Invoice History</h1>
            <p className="text-gray-500 text-sm mt-0.5">Past invoice email batches</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-[#bff202]/10" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#bff202]/20">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#01312D]">No invoices sent yet</h3>
          <p className="text-gray-500 text-sm mt-1">Sent invoice batches will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((batch) => (
            <div
              key={batch._id}
              className="bg-white rounded-2xl border border-[#bff202]/10 overflow-hidden"
            >
              <button
                onClick={() => setExpandedBatch(expandedBatch === batch._id ? null : batch._id)}
                className="w-full text-left p-5 hover:bg-[#eafde7] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#01312D]">{formatDate(batch.sentAt)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {batch.sent} sent{batch.errors ? `, ${batch.errors} errors` : ""} &middot; {batch.totalDrivers} driver{batch.totalDrivers !== 1 ? "s" : ""}
                      {batch.dateRange?.startDate && ` · ${new Date(batch.dateRange.startDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })} - ${new Date(batch.dateRange.endDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#01312D]">{formatMoney(batch.totalOutstanding)}</p>
                    <p className="text-xs text-gray-400">{batch.drivers.length} drivers</p>
                  </div>
                </div>
              </button>

              {expandedBatch === batch._id && (
                <div className="px-5 pb-4 space-y-2 border-t border-gray-100 pt-3">
                  {batch.drivers.map((d, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-[#01312D]">{d.driverName}</p>
                          {d.driverEmail && <p className="text-xs text-gray-400 truncate">{d.driverEmail}</p>}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-bold text-sm text-red-600">{formatMoney(d.outstanding)}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewInvoice(batch._id, i); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#01312D] text-white rounded-lg text-xs font-semibold hover:bg-[#3A7717] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Invoice
                          </button>
                        </div>
                      </div>
                      {d.items.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500 space-y-1">
                          {d.items.map((item, j) => (
                            <div key={j} className="flex items-center gap-2">
                              <GetTypeIcon type={item.type} />
                              <span className="flex-1">
                                {getTypeLabel(item.type)} ({item.carNumber})
                                {item.completedDate && ` — ${new Date(item.completedDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}`}
                              </span>
                              <span className="font-medium text-[#01312D]">{formatMoney(item.totalRepayable)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
