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
  AlertCircle,
  History,
  Download,
  Receipt,
  Fuel,
  Smartphone,
  SprayCan,
  FileText,
  ImageIcon,
} from "lucide-react";

interface Repayment {
  id: string;
  loanId: string;
  driverId: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  carRegistration: string;
  serviceType: string;
  serviceTypeLabel: string;
  amount: number;
  requestedAmount?: number;
  actualAmount?: number;
  interestRate: number;
  interest: number;
  totalRepayable: number;
  repaidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  dailyPayment: number;
  repaymentDays: number;
  nextPaymentDate: string;
  lastPaymentDate?: string;
  approvedDate?: string;
  completedDate?: string;
  requestDate?: string;
  packageInfo?: { package: string; description: string };
  fuelType?: string;
  contactPhone?: string;
  otp?: string;
  popUrl?: string;
  popUploadedAt?: string;
  payments?: PaymentHistory[];
}

interface PaymentHistory {
  id: string;
  amount: number;
  date: string;
  method: string;
  reference?: string;
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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "bank_transfer" | "card"
  >("cash");
  const [paymentReference, setPaymentReference] = useState("");

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
    if (amount <= 0 || amount > repayment.remainingAmount) {
      setErrorMessage(
        `Amount must be between 1 and ${repayment.remainingAmount}`,
      );
      setShowErrorModal(true);
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/admin/repayments/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repaymentId: repayment.id,
          amount: amount,
          method: paymentMethod,
          reference: paymentReference || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccessMessage(
          `✅ Payment of R${amount.toLocaleString()} recorded successfully! Remaining: R${result.remainingBalance.toLocaleString()}`,
        );
        setShowSuccessModal(true);
        fetchRepayments();
        setShowPaymentModal(false);
        setPaymentAmount("");
        setPaymentMethod("cash");
        setPaymentReference("");
        setSelectedRepayment(null);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to record payment");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      setErrorMessage("Failed to record payment");
      setShowErrorModal(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkLoanAsFullyPaid = async (repayment: Repayment) => {
    if (
      !confirm(
        `Are you sure you want to mark this ${repayment.serviceTypeLabel} as fully paid?\n\nThis will close the repayment and mark it as completed.`,
      )
    )
      return;

    setProcessing(true);
    try {
      const response = await fetch("/api/admin/repayments/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repaymentId: repayment.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccessMessage(
          `✅ ${repayment.serviceTypeLabel} marked as fully paid and closed!`,
        );
        setShowSuccessModal(true);
        fetchRepayments();
        setShowDetailsModal(false);
        setSelectedRepayment(null);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to mark as paid");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error marking as paid:", error);
      setErrorMessage("Failed to mark as paid");
      setShowErrorModal(true);
    } finally {
      setProcessing(false);
    }
  };

  const getServiceTypeBadge = (type: string, serviceData?: any) => {
    switch (type) {
      case "fuel":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700">
            <Fuel className="w-3 h-3" /> Fuel
            {serviceData?.fuelType && (
              <span className="ml-1 text-[10px] opacity-75">
                ({serviceData.fuelType})
              </span>
            )}
          </span>
        );
      case "airtime":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">
            <Smartphone className="w-3 h-3" /> Airtime
          </span>
        );
      case "cash":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-yellow-100 text-yellow-700">
            <DollarSign className="w-3 h-3" /> Cash Loan
          </span>
        );
      case "carwash":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-700">
            <SprayCan className="w-3 h-3" /> Car Wash
            {serviceData?.packageInfo?.package && (
              <span className="ml-1 text-[10px] opacity-75">
                ({serviceData.packageInfo.package})
              </span>
            )}
          </span>
        );
      default:
        return null;
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

  // Success Modal Component
  const SuccessModal = () => {
    if (!showSuccessModal) return null;

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowSuccessModal(false)}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-t-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Success!</h2>
                <p className="text-white/80 text-sm">Payment recorded</p>
              </div>
            </div>
          </div>

          <div className="p-5 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <p className="text-[#01312D] font-semibold mb-2">
              {successMessage}
            </p>
          </div>

          <div className="border-t border-gray-100 p-5">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-[#01312D] text-white py-2 rounded-xl font-semibold hover:bg-[#3A7717] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Error Modal Component
  const ErrorModal = () => {
    if (!showErrorModal) return null;

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowErrorModal(false)}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Error!</h2>
                <p className="text-white/80 text-sm">Operation failed</p>
              </div>
            </div>
          </div>

          <div className="p-5 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <p className="text-[#01312D] font-semibold mb-2">{errorMessage}</p>
          </div>

          <div className="border-t border-gray-100 p-5">
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-red-500 text-white py-2 rounded-xl font-semibold hover:bg-red-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
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

    const suggestedPayments = [
      { label: "Daily", amount: repayment.dailyPayment },
      { label: "Weekly", amount: repayment.dailyPayment * 7 },
      { label: "Monthly", amount: repayment.dailyPayment * 30 },
      { label: "Full", amount: repayment.remainingAmount },
    ];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-[#bff202]/20 p-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#eafde7] rounded-full flex items-center justify-center">
                {repayment.serviceType === "fuel" && (
                  <Fuel className="w-5 h-5 text-green-600" />
                )}
                {repayment.serviceType === "airtime" && (
                  <Smartphone className="w-5 h-5 text-blue-600" />
                )}
                {repayment.serviceType === "cash" && (
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                )}
                {repayment.serviceType === "carwash" && (
                  <SprayCan className="w-5 h-5 text-purple-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#01312D]">
                  Record Payment
                </h2>
                <p className="text-sm text-gray-500">
                  {repayment.serviceTypeLabel}
                </p>
              </div>
            </div>
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
              <p className="text-sm text-gray-500 mt-2">Service</p>
              <p className="font-semibold text-[#01312D]">
                {repayment.serviceTypeLabel}
                {repayment.fuelType && ` (${repayment.fuelType})`}
                {repayment.packageInfo?.package &&
                  ` - ${repayment.packageInfo.package}`}
              </p>
              {repayment.actualAmount &&
                repayment.actualAmount !== repayment.amount && (
                  <>
                    <p className="text-sm text-gray-500 mt-2">
                      Requested Amount
                    </p>
                    <p className="text-gray-500 line-through">
                      R{repayment.requestedAmount?.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Actual Amount (POP)
                    </p>
                    <p className="font-semibold text-[#3A7717]">
                      R{repayment.actualAmount.toLocaleString()}
                    </p>
                  </>
                )}
              <p className="text-sm text-gray-500 mt-2">Car Registration</p>
              <p className="font-semibold text-[#01312D]">
                {repayment.carRegistration}
              </p>
              <p className="text-sm text-gray-500 mt-2">Remaining Amount</p>
              <p className="text-2xl font-bold text-[#3A7717]">
                R{repayment.remainingAmount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-2">Daily Payment</p>
              <p className="font-semibold text-[#01312D]">
                R{repayment.dailyPayment.toLocaleString()}/day
              </p>
            </div>

            {/* Suggested Payments */}
            <div>
              <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                Suggested Amounts
              </label>
              <div className="flex flex-wrap gap-2">
                {suggestedPayments.map((suggestion) => (
                  <button
                    key={suggestion.label}
                    type="button"
                    onClick={() => setAmount(suggestion.amount.toString())}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      parseFloat(amount) === suggestion.amount
                        ? "bg-[#3A7717] text-white"
                        : "bg-[#eafde7] text-[#01312D] hover:bg-[#bff202]/30"
                    }`}
                  >
                    {suggestion.label}: R{suggestion.amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                Payment Amount (R)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                min="1"
                max={maxAmount}
              />
              <p className="text-xs text-gray-500 mt-1">
                Max: R{maxAmount.toLocaleString()}
              </p>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                Payment Method
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex-1 py-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    paymentMethod === "cash"
                      ? "bg-[#3A7717] text-white"
                      : "bg-[#eafde7] text-[#01312D]"
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank_transfer")}
                  className={`flex-1 py-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    paymentMethod === "bank_transfer"
                      ? "bg-[#3A7717] text-white"
                      : "bg-[#eafde7] text-[#01312D]"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Transfer
                </button>
              </div>
            </div>

            {/* Reference (optional) */}
            {paymentMethod !== "cash" && (
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Transaction Reference (Optional)
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Enter transaction ID or reference"
                  className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                />
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-white border-t border-[#bff202]/20 p-5 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-[#01312D] py-3 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => handleMarkAsPaid(repayment, parseFloat(amount))}
              disabled={processing || !amount || parseFloat(amount) <= 0}
              className="flex-1 bg-gradient-to-r from-[#3A7717] to-[#72bf00] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
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

  const DetailsModal = ({
    repayment,
    onClose,
  }: {
    repayment: Repayment;
    onClose: () => void;
  }) => {
    const payments = repayment.payments || [];
    const hasActualAmount =
      repayment.actualAmount && repayment.actualAmount !== repayment.amount;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-[#bff202]/20 p-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#eafde7] rounded-full flex items-center justify-center">
                {repayment.serviceType === "fuel" && (
                  <Fuel className="w-5 h-5 text-green-600" />
                )}
                {repayment.serviceType === "airtime" && (
                  <Smartphone className="w-5 h-5 text-blue-600" />
                )}
                {repayment.serviceType === "cash" && (
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                )}
                {repayment.serviceType === "carwash" && (
                  <SprayCan className="w-5 h-5 text-purple-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#01312D]">
                  {repayment.serviceTypeLabel} Details
                </h2>
                <p className="text-sm text-gray-500">{repayment.driverName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#eafde7] rounded-lg"
            >
              <XCircle className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Driver Info */}
            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[#3A7717]" />
                Driver Information
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Name:</span>{" "}
                  <span className="font-semibold">{repayment.driverName}</span>
                </p>
                <p>
                  <span className="text-gray-500">Email:</span>{" "}
                  <span className="font-semibold">{repayment.driverEmail}</span>
                </p>
                <p>
                  <span className="text-gray-500">Phone:</span>{" "}
                  <span className="font-semibold">{repayment.driverPhone}</span>
                </p>
                <p>
                  <span className="text-gray-500">Car Registration:</span>{" "}
                  <span className="font-semibold">
                    {repayment.carRegistration}
                  </span>
                </p>
              </div>
            </div>

            {/* Service Details */}
            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                {repayment.serviceType === "fuel" && (
                  <Fuel className="w-4 h-4 text-[#3A7717]" />
                )}
                {repayment.serviceType === "airtime" && (
                  <Smartphone className="w-4 h-4 text-[#3A7717]" />
                )}
                {repayment.serviceType === "cash" && (
                  <DollarSign className="w-4 h-4 text-[#3A7717]" />
                )}
                {repayment.serviceType === "carwash" && (
                  <SprayCan className="w-4 h-4 text-[#3A7717]" />
                )}
                Service Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Service Type:</span>
                  <span className="font-semibold">
                    {repayment.serviceTypeLabel}
                  </span>
                </div>
                {repayment.fuelType && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fuel Type:</span>
                    <span className="font-semibold capitalize">
                      {repayment.fuelType}
                    </span>
                  </div>
                )}
                {repayment.packageInfo?.package && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Package:</span>
                      <span className="font-semibold">
                        {repayment.packageInfo.package}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Description:</span>
                      <span className="font-semibold text-sm">
                        {repayment.packageInfo.description}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-2 border-t border-[#bff202]/20">
                  <span className="text-gray-500">Amount:</span>
                  <span
                    className={`font-semibold ${hasActualAmount ? "line-through text-gray-500" : "text-[#01312D]"}`}
                  >
                    R{repayment.amount.toLocaleString()}
                  </span>
                </div>
                {hasActualAmount && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Actual Amount (POP):</span>
                    <span className="font-semibold text-[#3A7717]">
                      R{repayment.actualAmount?.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Interest Rate:</span>
                  <span className="font-semibold">
                    {repayment.interestRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Interest Amount:</span>
                  <span className="font-semibold">
                    R{repayment.interest.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Repayable:</span>
                  <span className="font-semibold text-[#3A7717]">
                    R{repayment.totalRepayable.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* POP Document Section */}
            {repayment.popUrl && (
              <div className="bg-[#eafde7] rounded-xl p-4">
                <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#3A7717]" /> Proof of
                  Payment (POP)
                </h3>
                <div className="space-y-3">
                  <a
                    href={repayment.popUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#3A7717] font-semibold hover:underline"
                  >
                    <ImageIcon className="w-4 h-4" />
                    View POP Document
                  </a>
                  {repayment.popUrl && (
                    <div className="mt-2 border border-[#BFF202]/20 rounded-lg overflow-hidden bg-white p-2">
                      <img
                        src={repayment.popUrl}
                        alt="Proof of Payment"
                        className="max-w-full h-auto max-h-48 object-contain mx-auto"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.insertAdjacentHTML(
                              "beforeend",
                              '<p class="text-xs text-red-500 text-center p-2">Failed to load image. <a href="' +
                                repayment.popUrl +
                                '" target="_blank" class="underline">Click here to view</a></p>',
                            );
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Loan Details */}
            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#3A7717]" />
                Repayment Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Repaid Amount:</span>
                  <span className="font-semibold text-green-600">
                    R{repayment.repaidAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Remaining:</span>
                  <span className="font-semibold text-red-600">
                    R{repayment.remainingAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Daily Payment:</span>
                  <span className="font-semibold">
                    R{repayment.dailyPayment.toLocaleString()}/day
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Repayment Period:</span>
                  <span className="font-semibold">
                    {repayment.repaymentDays} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date:</span>
                  <span className="font-semibold">
                    {repayment.dueDate
                      ? new Date(repayment.dueDate).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  {getStatusBadge(repayment.status)}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="bg-[#eafde7] rounded-xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Repayment Progress</span>
                <span className="font-semibold text-[#01312D]">
                  {Math.round(
                    (repayment.repaidAmount / repayment.totalRepayable) * 100,
                  )}
                  %
                </span>
              </div>
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-[#3A7717] h-3 rounded-full transition-all"
                  style={{
                    width: `${(repayment.repaidAmount / repayment.totalRepayable) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Payment History */}
            {payments.length > 0 && (
              <div className="bg-[#eafde7] rounded-xl p-4">
                <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-[#3A7717]" />
                  Payment History
                </h3>
                <div className="space-y-2">
                  {payments.map((payment, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 bg-white rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-[#3A7717]">
                          R{payment.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(payment.date).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-[#01312D] capitalize">
                          {payment.method?.replace("_", " ")}
                        </p>
                        {payment.reference && (
                          <p className="text-xs text-gray-500">
                            Ref: {payment.reference}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-white border-t border-[#bff202]/20 p-5 flex gap-3">
            {repayment.status !== "paid" && (
              <>
                <button
                  onClick={() => {
                    setSelectedRepayment(repayment);
                    setShowPaymentModal(true);
                    setShowDetailsModal(false);
                  }}
                  className="flex-1 bg-[#3A7717] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#2d5a12] transition-colors"
                >
                  <Banknote className="w-4 h-4" />
                  Record Payment
                </button>
                <button
                  onClick={() => handleMarkLoanAsFullyPaid(repayment)}
                  disabled={processing}
                  className="flex-1 bg-green-600 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Fully Paid
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className={`${repayment.status !== "paid" ? "flex-1" : "w-full"} bg-gray-500 text-white py-2 rounded-xl font-semibold hover:bg-gray-600 transition-colors`}
            >
              Close
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
          <h1 className="text-2xl font-bold text-[#01312D]">Repayments</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track and manage all service repayments
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
              <p className="text-xs text-gray-500">Active Repayments</p>
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
          filteredRepayments.map((repayment) => {
            const hasActualAmount =
              repayment.actualAmount &&
              repayment.actualAmount !== repayment.amount;

            return (
              <div
                key={repayment.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#eafde7] rounded-full flex items-center justify-center">
                      {repayment.serviceType === "fuel" && (
                        <Fuel className="w-6 h-6 text-green-600" />
                      )}
                      {repayment.serviceType === "airtime" && (
                        <Smartphone className="w-6 h-6 text-blue-600" />
                      )}
                      {repayment.serviceType === "cash" && (
                        <DollarSign className="w-6 h-6 text-yellow-600" />
                      )}
                      {repayment.serviceType === "carwash" && (
                        <SprayCan className="w-6 h-6 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {getServiceTypeBadge(repayment.serviceType, repayment)}
                        {getStatusBadge(repayment.status)}
                        {hasActualAmount && (
                          <span className="text-xs bg-[#BFF202]/20 text-[#01312D] px-2 py-0.5 rounded-full">
                            Amount Adjusted
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-[#01312D]">
                        {repayment.driverName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {repayment.carRegistration}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-[#3A7717]">
                      R{repayment.remainingAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Due: {new Date(repayment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Total Amount</p>
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
                    <p className="text-xs text-gray-500">Period</p>
                    <p className="font-semibold text-[#01312D]">
                      {repayment.repaymentDays} days
                    </p>
                  </div>
                </div>

                {/* Show actual amount if different */}
                {hasActualAmount && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                    <span className="text-gray-400">
                      Requested: R{repayment.amount.toLocaleString()}
                    </span>
                    <span>→</span>
                    <span className="text-[#3A7717] font-medium">
                      Actual: R{repayment.actualAmount?.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Repayment Progress</span>
                    <span className="font-semibold text-[#01312D]">
                      {Math.round(
                        (repayment.repaidAmount / repayment.totalRepayable) *
                          100,
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
                      className="flex-1 py-2 bg-[#3A7717] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#2d5a12] transition-colors"
                    >
                      <Banknote className="w-4 h-4" />
                      Record Payment
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedRepayment(repayment);
                      setShowDetailsModal(true);
                    }}
                    className="flex-1 py-2 bg-[#eafde7] text-[#01312D] rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#bff202]/30 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {showPaymentModal && selectedRepayment && (
        <PaymentModal
          repayment={selectedRepayment}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedRepayment(null);
          }}
        />
      )}
      {showDetailsModal && selectedRepayment && (
        <DetailsModal
          repayment={selectedRepayment}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRepayment(null);
          }}
        />
      )}
      <SuccessModal />
      <ErrorModal />
    </div>
  );
}
