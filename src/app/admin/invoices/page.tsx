"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { formatMoney } from "@/lib/money";
import { toPng } from "html-to-image";
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
  Search,
  Calendar,
  X,
  Clock,
  Percent,
  Tag,
} from "lucide-react";
import Link from "next/link";

interface InvoiceItem {
  type: string;
  carNumber: string;
  amount: number;
  totalRepayable: number;
  remainingBalance: number;
  completedDate?: string;
}

interface DriverInvoice {
  driverEmail: string;
  driverName: string;
  driverPhone?: string;
  carRegistration?: string;
  items: InvoiceItem[];
  totalOutstanding: number;
}

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = "driver_documents";

export default function AdminInvoicesPage() {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [drivers, setDrivers] = useState<DriverInvoice[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [result, setResult] = useState<{
    sent: number;
    errors: number;
  } | null>(null);
  const [whatsappSent, setWhatsappSent] = useState<Set<string>>(new Set());
  const [whatsappLoading, setWhatsappLoading] = useState<Set<string>>(new Set());
  const [discounts, setDiscounts] = useState<Record<string, number>>({});
  const [discountInputs, setDiscountInputs] = useState<Record<string, boolean>>({});
  const [discountValues, setDiscountValues] = useState<Record<string, string>>({});
  const [captureDriver, setCaptureDriver] = useState<DriverInvoice | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const hasDateFilter = appliedFrom || appliedTo;

  const filteredDrivers = useMemo(() => {
    if (!searchQuery) return drivers;
    const q = searchQuery.toLowerCase();
    return drivers.filter((d) => d.driverName.toLowerCase().includes(q));
  }, [drivers, searchQuery]);

  const totals = useMemo(() => {
    let amount = 0;
    let interest = 0;
    let total = 0;
    for (const d of filteredDrivers) {
      for (const item of d.items) {
        amount += item.amount;
        interest += item.totalRepayable - item.amount;
        total += item.totalRepayable;
      }
    }
    return { amount, interest, total };
  }, [filteredDrivers]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setWhatsappSent(new Set());
    try {
      const params = new URLSearchParams();
      if (appliedFrom) params.set("startDate", appliedFrom);
      if (appliedTo) params.set("endDate", appliedTo);
      const url = `/api/admin/invoices${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const d = data.drivers || [];
        setDrivers(d);
        const init: Record<string, number> = {};
        for (const drv of d) {
          if (drv.discountPercent != null) init[drv.driverEmail] = drv.discountPercent;
        }
        setDiscounts(init);
        setTotalOutstanding(data.totalOutstanding || 0);
      }
    } catch (err) {
      console.error("Error fetching invoice data:", err);
    } finally {
      setLoading(false);
    }
  }, [appliedFrom, appliedTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyDateRange = () => {
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
  };

  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
    setAppliedFrom("");
    setAppliedTo("");
  };

  const toggleDiscountInput = (email: string) => {
    setDiscountInputs((prev) => {
      const next = { ...prev };
      next[email] = !next[email];
      return next;
    });
    if (!discountInputs[email] && discounts[email] != null) {
      setDiscountValues((prev) => ({ ...prev, [email]: String(discounts[email]) }));
    }
  };

  const handleSetDiscount = async (email: string) => {
    const val = parseFloat(discountValues[email] || "0");
    if (isNaN(val) || val <= 0 || val > 100) return;
    try {
      const res = await fetch("/api/admin/invoices/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverEmail: email, discountPercent: val }),
      });
      if (res.ok) {
        setDiscounts((prev) => ({ ...prev, [email]: val }));
        setDiscountInputs((prev) => ({ ...prev, [email]: false }));
      }
    } catch (e) {
      console.error("Error setting discount:", e);
    }
  };

  const handleClearDiscount = async (email: string) => {
    try {
      const res = await fetch("/api/admin/invoices/discount", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverEmail: email }),
      });
      if (res.ok) {
        setDiscounts((prev) => {
          const next = { ...prev };
          delete next[email];
          return next;
        });
        setDiscountInputs((prev) => ({ ...prev, [email]: false }));
      }
    } catch (e) {
      console.error("Error clearing discount:", e);
    }
  };

  const handleSendAll = async () => {
    setSending(true);
    setSent(false);
    setResult(null);
    try {
      const res = await fetch("/api/admin/invoices/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(appliedFrom && { startDate: appliedFrom }),
          ...(appliedTo && { endDate: appliedTo }),
        }),
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

  const formatPhoneNumber = (phone: string): string => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (!cleanPhone.startsWith("27") && cleanPhone.length === 9) {
      return `27${cleanPhone}`;
    }
    if (!cleanPhone.startsWith("27") && cleanPhone.length === 10 && cleanPhone.startsWith("0")) {
      return `27${cleanPhone.slice(1)}`;
    }
    if (!cleanPhone.startsWith("27")) {
      return `27${cleanPhone}`;
    }
    return cleanPhone;
  };

  const uploadImageToCloudinary = async (dataUrl: string): Promise<string | null> => {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const formData = new FormData();
      formData.append("file", blob, "invoice.png");
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData },
      );

      if (!uploadResponse.ok) throw new Error("Cloudinary upload failed");
      const uploadData = await uploadResponse.json();
      return uploadData.secure_url;
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      return null;
    }
  };

  const handleWhatsAppInvoice = async (driver: DriverInvoice) => {
    if (!driver.driverPhone) {
      alert("No phone number available for this driver");
      return;
    }

    const key = `${driver.driverName}|${driver.driverEmail}`;
    setWhatsappLoading((prev) => new Set(prev).add(key));
    setCaptureDriver(driver);

    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      if (!invoiceRef.current) {
        throw new Error("Invoice ref not available");
      }

      const element = invoiceRef.current;
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
        pixelRatio: 2.5,
        cacheBust: true,
      });

      element.style.position = "absolute";
      element.style.left = "-9999px";
      element.style.top = "-9999px";
      element.style.zIndex = "-1";
      element.style.visibility = "hidden";

      const imageUrl = await uploadImageToCloudinary(dataUrl);

      if (!imageUrl) {
        throw new Error("Failed to upload invoice image");
      }

      const message = `Dear ${driver.driverName},

Your invoice from Kapuka Tradings is now available.

View your invoice here: ${imageUrl}

Please ensure payment is made promptly to keep your account up to date.

Thank you for your continued business.

Kind regards,
Kapuka Tradings Team`;

      const fullPhone = formatPhoneNumber(driver.driverPhone);
      const whatsappUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");

      setWhatsappSent((prev) => new Set(prev).add(key));
    } catch (error) {
      console.error("Error sending WhatsApp invoice:", error);
      alert("Failed to send invoice via WhatsApp. Please try again.");
    } finally {
      setWhatsappLoading((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setCaptureDriver(null);
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
        <div className="flex items-center gap-2">
          <Link
            href="/admin/invoices/history"
            className="flex items-center gap-2 px-4 py-2 bg-[#eafde7] rounded-xl text-[#01312D] font-semibold hover:bg-[#bff202]/30 transition-all"
          >
            <Clock className="w-4 h-4" />
            History
          </Link>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#eafde7] rounded-xl text-[#01312D] font-semibold hover:bg-[#bff202]/30 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search driver..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-[#bff202]/20 text-sm text-[#01312D] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#bff202]/40"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
        <div className="flex justify-between sm:flex-row flex-col sm:items-end gap-5">
          <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
            <div className="w-full sm:flex-1 sm:min-w-[150px]">
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                From
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#bff202]/70 rounded-lg text-sm focus:outline-none focus:border-[#72bf00] bg-white"
              />
            </div>
            <div className="w-full sm:flex-1 sm:min-w-[150px]">
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                To
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#bff202]/70 rounded-lg text-sm focus:outline-none focus:border-[#72bf00] bg-white"
              />
            </div>
          </div>
          <div className="flex w-full sm:w-auto gap-3">
            <button
              onClick={handleApplyDateRange}
              className="flex-1 sm:flex-none px-7.5 py-2.5 bg-[#01312D] text-white rounded-lg text-[13px] font-medium hover:bg-[#3A7717] transition-colors"
            >
              Apply
            </button>
            <button
              onClick={clearDateFilter}
              className="flex-1 sm:flex-none px-7.5 py-2.5 bg-gray-200 text-[#01312D] rounded-lg text-[13px] font-medium hover:bg-gray-300 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Requested Outstanding</p>
          <div className="text-xl sm:text-2xl font-bold text-[#01312D]">
            {loading ? "..." : formatMoney(totals.amount)}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Interest</p>
          <div className="text-xl sm:text-2xl font-bold text-[#01312D]">
            {loading ? "..." : formatMoney(totals.interest)}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Total</p>
          <div className="text-xl sm:text-2xl font-bold text-[#01312D]">
            {loading ? "..." : formatMoney(totals.total)}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Drivers</p>
          <div className="text-xl sm:text-2xl font-bold text-[#01312D]">
            {loading ? "..." : drivers.length}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Status</p>
          <div className="text-base sm:text-lg font-bold text-[#01312D]">
            {loading
              ? "..."
              : result
                ? `${result.sent} sent${result.errors ? `, ${result.errors} errors` : ""}`
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
            {hasDateFilter ? "No results for this period" : "All caught up!"}
          </h3>
          <p className="text-gray-500">
            {hasDateFilter
              ? "No outstanding invoices found for the selected date range."
              : "No drivers have outstanding balances."}
          </p>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#bff202]/20">
          <div className="w-16 h-16 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-3">
            <Search className="w-8 h-8 text-[#3A7717]" />
          </div>
          <h3 className="text-lg font-bold text-[#01312D]">
            No drivers found
          </h3>
          <p className="text-gray-500">
            No drivers match "{searchQuery}"
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDrivers.map((driver, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/10"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 shrink-0 bg-[#eafde7] rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-[#3A7717]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-[#01312D]">
                    {driver.driverName}
                  </h3>
                  {driver.driverEmail && (
                    <p className="text-xs text-gray-500 truncate">
                      {driver.driverEmail}
                    </p>
                  )}
                </div>
                {discounts[driver.driverEmail] != null && (
                  <span className="shrink-0 text-xs font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">
                    {discounts[driver.driverEmail]}% OFF
                  </span>
                )}
                <button
                  onClick={() => toggleDiscountInput(driver.driverEmail)}
                  className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    discounts[driver.driverEmail] != null
                      ? "bg-red-100 text-red-600"
                      : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                  }`}
                  title={discounts[driver.driverEmail] != null ? "Change discount" : "Add discount"}
                >
                  <Percent className="w-4 h-4" />
                </button>
                {driver.driverPhone && (
                  <button
                    onClick={() => handleWhatsAppInvoice(driver)}
                    disabled={whatsappLoading.has(`${driver.driverName}|${driver.driverEmail}`)}
                    className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative disabled:opacity-50"
                    title="Send invoice via WhatsApp"
                  >
                    {whatsappLoading.has(`${driver.driverName}|${driver.driverEmail}`) ? (
                      <Loader2 className="w-4 h-4 text-[#25D366] animate-spin" />
                    ) : whatsappSent.has(`${driver.driverName}|${driver.driverEmail}`) ? (
                      <>
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-2 h-2 fill-white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        </span>
                      </>
                    ) : (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    )}
                  </button>
                )}
              </div>

              {discountInputs[driver.driverEmail] && (
                <div className="mb-3 p-3 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-red-500 shrink-0" />
                    <input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="Discount %"
                      value={discountValues[driver.driverEmail] || ""}
                      onChange={(e) =>
                        setDiscountValues((prev) => ({ ...prev, [driver.driverEmail]: e.target.value }))
                      }
                      className="w-20 px-2 py-1 text-sm border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                    <button
                      onClick={() => handleSetDiscount(driver.driverEmail)}
                      className="px-3 py-1 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => handleClearDiscount(driver.driverEmail)}
                      className="px-3 py-1 text-xs font-semibold text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setDiscountInputs((prev) => ({ ...prev, [driver.driverEmail]: false }))}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-4 pb-3 border-b border-gray-100">
                <span className="inline-block text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md mb-2">
                  {driver.items.length} item{driver.items.length !== 1 ? "s" : ""}
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Outstanding</span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const disc = discounts[driver.driverEmail];
                      if (disc == null) return null;
                      const interestMult = (13 - disc) / 13;
                      const totalAmount = driver.items.reduce((s, it) => s + it.amount, 0);
                      const totalInterest = driver.items.reduce((s, it) => s + (it.totalRepayable - it.amount), 0);
                      const discOutstanding = totalAmount + totalInterest * interestMult;
                      return (
                        <>
                          <span className="text-sm text-gray-400 line-through">
                            {formatMoney(driver.totalOutstanding)}
                          </span>
                          <span className="text-xl font-black text-red-600 leading-tight">
                            {formatMoney(discOutstanding)}
                          </span>
                        </>
                      );
                    })()}
                    {discounts[driver.driverEmail] == null && (
                      <p className="text-xl font-black text-red-600 leading-tight">
                        {formatMoney(driver.totalOutstanding)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table - Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-gray-400 font-semibold text-xs uppercase">
                        Date
                      </th>
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
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {driver.items.map((item, iidx) => {
                      const disc = discounts[driver.driverEmail];
                      const interest = item.totalRepayable - item.amount;
                      const interestMult = disc != null ? (13 - disc) / 13 : 1;
                      const discInterest = interest * interestMult;
                      const discTotal = item.amount + discInterest;
                      return (
                      <tr key={iidx} className="border-b border-gray-50">
                        <td className="py-2 text-xs text-gray-500 whitespace-nowrap">
                          {item.completedDate
                            ? new Date(item.completedDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })
                            : "-"}
                        </td>
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
                        <td className="py-2 text-right font-semibold text-[#01312D]">
                          {formatMoney(item.amount)}
                        </td>
                        <td className="py-2 text-right">
                          {disc != null ? (
                            <span className="flex items-center justify-end gap-1">
                              <span className="text-gray-400 line-through text-xs">{formatMoney(interest)}</span>
                              <span className="text-[#01312D]">{formatMoney(discInterest)}</span>
                            </span>
                          ) : formatMoney(interest)}
                        </td>
                        <td className="py-2 text-right font-semibold text-[#01312D]">
                          {disc != null ? (
                            <span className="flex items-center justify-end gap-1">
                              <span className="text-gray-400 line-through text-xs">{formatMoney(item.totalRepayable)}</span>
                              <span>{formatMoney(discTotal)}</span>
                            </span>
                          ) : formatMoney(item.totalRepayable)}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Items Cards - Mobile */}
              <div className="sm:hidden space-y-2">
                {driver.items.map((item, iidx) => {
                  const disc = discounts[driver.driverEmail];
                  const interest = item.totalRepayable - item.amount;
                  const interestMult = disc != null ? (13 - disc) / 13 : 1;
                  const discInterest = interest * interestMult;
                  const discTotal = item.amount + discInterest;
                  return (
                  <div
                    key={iidx}
                    className="bg-gray-50 rounded-xl p-3 border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-[#01312D]">
                        {getTypeIcon(item.type)}
                        {getTypeLabel(item.type)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {item.completedDate
                          ? new Date(item.completedDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })
                          : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
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
                        <span className="font-semibold text-[#01312D]">
                          {disc != null ? (
                            <span className="flex items-center gap-1">
                              <span className="text-gray-400 line-through text-xs">{formatMoney(interest)}</span>
                              <span>{formatMoney(discInterest)}</span>
                            </span>
                          ) : formatMoney(interest)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-gray-200">
                        <span className="text-gray-400 font-semibold">Total</span>
                        <span className="font-semibold text-[#01312D]">
                          {disc != null ? (
                            <span className="flex items-center gap-1">
                              <span className="text-gray-400 line-through text-xs">{formatMoney(item.totalRepayable)}</span>
                              <span>{formatMoney(discTotal)}</span>
                            </span>
                          ) : formatMoney(item.totalRepayable)}
                        </span>
                      </div>
                    </div>
                  </div>
                  );
                })}
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
                {hasDateFilter ? " (filtered by date)" : ""}
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
                    {hasDateFilter ? "Send Filtered Invoices" : "Send Invoice Emails"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hidden invoice template for image capture */}
      <div
        ref={invoiceRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          zIndex: "-1",
          visibility: "hidden",
          width: "580px",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        }}
      >
        {captureDriver && (
          <div style={{ backgroundColor: "#f4f6f9", padding: "24px" }}>
            <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}>
              {/* Header Gradient */}
              <div style={{ background: "linear-gradient(135deg, #0d4a2a 0%, #1a6b3e 50%, #0d4a2a 100%)", padding: "36px 28px", position: "relative" }}>
                <div style={{ fontSize: "26px", fontWeight: "700", color: "#ffffff", letterSpacing: "-0.5px", margin: "0 0 4px 0" }}>Kapuka Tradings</div>
                <div style={{ fontSize: "15px", color: "rgba(255,255,255,0.85)", margin: 0 }}>Official Tax Invoice</div>
                <div style={{ height: "4px", background: "linear-gradient(90deg, #bff202, #72bf00, #bff202)", marginTop: "16px" }} />
              </div>

              {/* Content */}
              <div style={{ padding: "32px" }}>
                {/* Invoice Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #0d4a2a", paddingBottom: "16px", marginBottom: "24px" }}>
                  <div>
                    <div style={{ fontSize: "32px", fontWeight: "800", color: "#0d4a2a", letterSpacing: "-1px" }}>INVOICE</div>
                    <div style={{ color: "#64748b", fontSize: "13px" }}>Statement of outstanding balances</div>
                    <div style={{ color: "#dc2626", fontWeight: "800", fontSize: "13px", marginTop: "4px" }}>Remember to do immediate payment.</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#64748b", fontSize: "12px" }}>Date</div>
                    <div style={{ color: "#0f172a", fontWeight: "600", fontSize: "14px" }}>
                      {new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    <div style={{ marginTop: "8px" }}>
                      <span style={{ display: "inline-block", backgroundColor: "#16a34a", color: "#ffffff", padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", letterSpacing: "0.5px" }}>AMOUNT DUE</span>
                    </div>
                  </div>
                </div>

                {/* Bill To */}
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>Bill To</div>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>{captureDriver.driverName}</div>
                  <div style={{ color: "#475569", fontSize: "14px" }}>{captureDriver.driverEmail}</div>
                  {captureDriver.carRegistration && (
                    <div style={{ color: "#16a34a", fontSize: "14px", marginTop: "2px" }}>{captureDriver.carRegistration}</div>
                  )}
                </div>

                {/* Items Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc" }}>
                      <th style={{ padding: "12px 16px", color: "#0d4a2a", fontWeight: "700", fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", borderBottom: "2px solid #0d4a2a", textAlign: "left" }}>Date</th>
                      <th style={{ padding: "12px 16px", color: "#0d4a2a", fontWeight: "700", fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", borderBottom: "2px solid #0d4a2a", textAlign: "left" }}>Description</th>
                      <th style={{ padding: "12px 16px", color: "#0d4a2a", fontWeight: "700", fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", borderBottom: "2px solid #0d4a2a", textAlign: "right" }}>Amount</th>
                      <th style={{ padding: "12px 16px", color: "#0d4a2a", fontWeight: "700", fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", borderBottom: "2px solid #0d4a2a", textAlign: "right" }}>Interest</th>
                      <th style={{ padding: "12px 16px", color: "#0d4a2a", fontWeight: "700", fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", borderBottom: "2px solid #0d4a2a", textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {captureDriver.items.map((item, i) => {
                      const totalInterest = item.totalRepayable - item.amount;
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <td style={{ padding: "14px 16px", color: "#64748b" }}>
                            {item.completedDate
                              ? new Date(item.completedDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })
                              : "-"}
                          </td>
                          <td style={{ padding: "14px 16px", color: "#0f172a" }}>
                            <div style={{ fontWeight: "500" }}>{item.type}</div>
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{item.carNumber}</div>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#0f172a", textAlign: "right" }}>R {item.amount.toFixed(2)}</td>
                          <td style={{ padding: "14px 16px", color: "#0f172a", textAlign: "right" }}>R {totalInterest.toFixed(2)}</td>
                          <td style={{ padding: "14px 16px", color: "#0f172a", textAlign: "right", fontWeight: "600" }}>R {item.totalRepayable.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "40px", borderTop: "2px solid #e2e8f0", paddingTop: "16px", marginBottom: "24px" }}>
                  <div>
                    <div style={{ color: "#64748b", fontSize: "14px", marginBottom: "8px" }}>Subtotal</div>
                    <div style={{ color: "#64748b", fontSize: "14px", marginBottom: "8px" }}>Interest</div>
                    <div style={{ borderTop: "2px solid #0d4a2a", paddingTop: "8px" }}>
                      <div style={{ color: "#0d4a2a", fontSize: "16px", fontWeight: "700" }}>Total Due</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#0f172a", fontWeight: "600", fontSize: "14px", marginBottom: "8px" }}>R {captureDriver.items.reduce((s, i) => s + i.amount, 0).toFixed(2)}</div>
                    <div style={{ color: "#0f172a", fontWeight: "600", fontSize: "14px", marginBottom: "8px" }}>R {captureDriver.items.reduce((s, i) => s + (i.totalRepayable - i.amount), 0).toFixed(2)}</div>
                    <div style={{ borderTop: "2px solid #0d4a2a", paddingTop: "8px" }}>
                      <div style={{ color: "#0d4a2a", fontSize: "20px", fontWeight: "800" }}>R {captureDriver.items.reduce((s, i) => s + i.totalRepayable, 0).toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                {/* Banking Details */}
                <div style={{ backgroundColor: "#f0fdf4", borderRadius: "12px", padding: "16px", marginBottom: "16px", border: "1px solid #bbf7d0" }}>
                  <div style={{ color: "#166534", fontSize: "13px", fontWeight: "700", marginBottom: "8px" }}>Banking Details</div>
                  <div style={{ color: "#333", fontSize: "13px", lineHeight: "1.6" }}>
                    <strong>Bank:</strong> FNB/RMB<br />
                    <strong>Account Holder:</strong> Japhet Sibuyi<br />
                    <strong>Account Type:</strong> FNB Aspire Current Account<br />
                    <strong>Account Number:</strong> 63131222307<br />
                    <strong>Branch Code:</strong> 250655<br />
                    <strong style={{ color: "#dc2626" }}>Reference:</strong> Use your <strong style={{ color: "#dc2626" }}>car registration</strong> as payment reference
                  </div>
                </div>

                {/* Terms Box */}
                <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                  <div style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.5" }}>
                    <strong style={{ color: "#0f172a" }}>Payment Terms:</strong> Amount due in full within the agreed repayment period.
                  </div>
                </div>

                {/* Validity Box */}
                <div style={{ backgroundColor: "#fef3c7", borderRadius: "12px", padding: "16px 20px", border: "1px solid #fde68a" }}>
                  <div style={{ color: "#92400e", fontSize: "14px", fontWeight: "700" }}>
                    Remaining balance must be paid to keep your account in good standing.
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ backgroundColor: "#f8fafc", padding: "24px", textAlign: "center", borderTop: "1px solid #e2e8f0", fontSize: "12px", color: "#94a3b8", lineHeight: "1.6" }}>
                <strong style={{ color: "#64748b" }}>Kapuka Tradings</strong><br />
                Thank you for your business<br />
                For any queries, please contact your account manager
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
