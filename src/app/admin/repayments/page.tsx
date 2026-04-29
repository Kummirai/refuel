// src/app/admin/repayments/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Eye,
  RefreshCw,
  TrendingUp,
  Wallet,
  Calendar,
  User,
  Phone,
  Mail,
  Car,
  Loader2,
  CreditCard,
  Banknote,
  ArrowLeft,
} from "lucide-react";

interface Repayment {
  id: string;
  loanId: string;
  driverId: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  carRegistration: string;
  amount: number;
  interestRate: number;
  totalRepayable: number;
  repaidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  dailyPayment: number;
  repaymentDays: number;
  nextPaymentDate: string;
  lastPaymentDate?: string;
}

export default function LoanRepaymentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"outstanding" | "paid" | "all">(
    "outstanding",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [selectedRepayment, setSelectedRepayment] = useState<Repayment | null>(
    null,
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRepayments();
  }, []);

  const fetchRepayments = async () => {
    try {
      const response = await fetch("/api/admin/repayments");
      if (response.ok) {
        const data = await response.json();
        setRepayments(data);
      }
    } catch (error) {
      console.error("Error fetching repayments:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRepayments();
  };

  const handleMarkAsPaid = async (repayment: Repayment, amount: number) => {
    setProcessing(true);
    try {
      const response = await fetch("/api/admin/repayments/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repaymentId: repayment.id,
          amount: amount,
        }),
      });

      if (response.ok) {
        alert(
          `✅ Payment of R${amount.toLocaleString()} recorded successfully!`,
        );
        fetchRepayments();
        setShowPaymentModal(false);
        setPaymentAmount("");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to record payment");
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      alert("Failed to record payment");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" /> Paid
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" /> Overdue
          </span>
        );
      default:
        return null;
    }
  };

  const filteredRepayments = repayments
    .filter((r) => {
      if (activeTab === "outstanding") return r.status !== "paid";
      if (activeTab === "paid") return r.status === "paid";
      return true;
    })
    .filter(
      (r) =>
        r.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.carRegistration.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.driverEmail.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  const stats = {
    totalOutstanding: repayments
      .filter((r) => r.status !== "paid")
      .reduce((sum, r) => sum + r.remainingAmount, 0),
    totalPaid: repayments
      .filter((r) => r.status === "paid")
      .reduce((sum, r) => sum + r.repaidAmount, 0),
    totalLoans: repayments.length,
    activeLoans: repayments.filter((r) => r.status !== "paid").length,
    overdueCount: repayments.filter((r) => r.status === "overdue").length,
  };

  const PaymentModal = ({
    repayment,
    onClose,
  }: {
    repayment: Repayment;
    onClose: () => void;
  }) => {
    const [amount, setAmount] = useState(repayment.dailyPayment.toString());
    const maxAmount = repayment.remainingAmount;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-md w-full">
          <div className="sticky top-0 bg-white border-b border-[#bff202]/20 p-5 flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#01312D]">Record Payment</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#eafde7] rounded-lg"
            >
              <XCircle className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="bg-[#eafde7] rounded-xl p-4">
              <p className="text-sm text-gray-500">Driver</p>
              <p className="font-semibold text-[#01312D]">
                {repayment.driverName}
              </p>
              <p className="text-sm text-gray-500 mt-2">Car Registration</p>
              <p className="font-semibold text-[#01312D]">
                {repayment.carRegistration}
              </p>
              <p className="text-sm text-gray-500 mt-2">Remaining Amount</p>
              <p className="text-2xl font-bold text-[#01312D]">
                R{repayment.remainingAmount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-2">Daily Payment Amount</p>
              <p className="font-semibold text-[#01312D]">
                R{repayment.dailyPayment.toLocaleString()}/day
              </p>
            </div>

            <div>
              <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                Payment Amount (R)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                min="1"
                max={maxAmount}
              />
              <p className="text-xs text-gray-500 mt-1">
                Max: R{maxAmount.toLocaleString()}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setAmount(repayment.dailyPayment.toString())}
                className="flex-1 py-2 bg-[#eafde7] text-[#01312D] rounded-lg text-sm font-semibold"
              >
                Daily Payment (R{repayment.dailyPayment})
              </button>
              <button
                onClick={() => setAmount(repayment.remainingAmount.toString())}
                className="flex-1 py-2 bg-[#eafde7] text-[#01312D] rounded-lg text-sm font-semibold"
              >
                Full Payment (R{repayment.remainingAmount})
              </button>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-[#bff202]/20 p-5 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-[#01312D] py-2 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => handleMarkAsPaid(repayment, parseFloat(amount))}
              disabled={processing || !amount || parseFloat(amount) <= 0}
              className="flex-1 bg-[#3A7717] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Record Payment
            </button>
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
          <p className="text-[#01312D]">Loading repayments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#01312D]">Loan Repayments</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track and manage loan repayments
          </p>
        </div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Outstanding Amount</p>
              <p className="text-2xl font-bold text-[#01312D]">
                R{stats.totalOutstanding.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Repaid</p>
              <p className="text-2xl font-bold text-[#3A7717]">
                R{stats.totalPaid.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Active Loans</p>
              <p className="text-2xl font-bold text-[#01312D]">
                {stats.activeLoans}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.overdueCount}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by driver name, email, or registration..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#bff202]/20">
        <button
          onClick={() => setActiveTab("outstanding")}
          className={`px-4 py-2 font-semibold transition-all ${
            activeTab === "outstanding"
              ? "text-[#3A7717] border-b-2 border-[#3A7717]"
              : "text-gray-500"
          }`}
        >
          Outstanding
          <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
            {repayments.filter((r) => r.status !== "paid").length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("paid")}
          className={`px-4 py-2 font-semibold transition-all ${
            activeTab === "paid"
              ? "text-[#3A7717] border-b-2 border-[#3A7717]"
              : "text-gray-500"
          }`}
        >
          Paid
          <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
            {repayments.filter((r) => r.status === "paid").length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 font-semibold transition-all ${
            activeTab === "all"
              ? "text-[#3A7717] border-b-2 border-[#3A7717]"
              : "text-gray-500"
          }`}
        >
          All
        </button>
      </div>

      {/* Repayments List */}
      <div className="space-y-3">
        {filteredRepayments.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#bff202]/20">
            <div className="w-20 h-20 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500">No {activeTab} repayments found</p>
          </div>
        ) : (
          filteredRepayments.map((repayment) => (
            <div
              key={repayment.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#eafde7] rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-[#3A7717]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#01312D]">
                      {repayment.driverName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {repayment.carRegistration}
                    </p>
                    <p className="text-xs text-gray-500">
                      {repayment.driverEmail}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-[#01312D]">
                    R{repayment.remainingAmount.toLocaleString()}
                  </p>
                  {getStatusBadge(repayment.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-3 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Total Loan</p>
                  <p className="font-semibold text-[#01312D]">
                    R{repayment.totalRepayable.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Repaid</p>
                  <p className="font-semibold text-[#3A7717]">
                    R{repayment.repaidAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Daily Payment</p>
                  <p className="font-semibold text-[#01312D]">
                    R{repayment.dailyPayment.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="font-semibold text-[#01312D]">
                    {new Date(repayment.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Repayment Progress</span>
                  <span className="font-semibold text-[#01312D]">
                    {Math.round(
                      (repayment.repaidAmount / repayment.totalRepayable) * 100,
                    )}
                    %
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#3A7717] h-2 rounded-full transition-all"
                    style={{
                      width: `${(repayment.repaidAmount / repayment.totalRepayable) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {repayment.status !== "paid" && (
                  <button
                    onClick={() => {
                      setSelectedRepayment(repayment);
                      setShowPaymentModal(true);
                    }}
                    className="flex-1 py-2 bg-[#3A7717] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Banknote className="w-4 h-4" />
                    Record Payment
                  </button>
                )}
                <button className="flex-1 py-2 bg-[#eafde7] text-[#01312D] rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedRepayment && (
        <PaymentModal
          repayment={selectedRepayment}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
