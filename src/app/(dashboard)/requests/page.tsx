// src/app/requests/page.tsx
"use client";

import { Suspense } from "react";
import { formatMoney, toMoney } from "@/lib/money";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import BottomNavigation from "@/components/BottomNavigation";
import {
  Fuel,
  Smartphone,
  DollarSign,
  ArrowLeft,
  Send,
  CheckCircle,
  AlertCircle,
  Phone,
  CircleDollarSign,
  Loader2,
  Shield,
  Car,
  User,
  Home,
  ClipboardList,
  History,
  UserCircle,
  Clock,
  XCircle,
  TrendingUp,
  Calendar,
  Ban,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

type ServiceType = "fuel" | "carwash";

// Default config (will be overridden by API)
const DEFAULT_CONFIG: Record<
  ServiceType,
  {
    name: string;
    interestRate: number;
    defaultRepaymentDays: number;
    repaymentOptions: number[];
    icon: any;
    color: string;
    textColor: string;
    minAmount?: number;
    maxAmount?: number;
  }
> = {
  fuel: {
    name: "Fuel",
    interestRate: 13,
    defaultRepaymentDays: 7,
    repaymentOptions: [1, 3, 5, 7],
    icon: Fuel,
    color: "from-[#3A7717] to-[#72bf00]",
    textColor: "text-[#3A7717]",
    minAmount: 500,
    maxAmount: 2000,
  },
  carwash: {
    name: "Car Wash",
    interestRate: 0,
    defaultRepaymentDays: 0,
    repaymentOptions: [],
    icon: Car,
    color: "from-[#01312D] to-[#3A7717]",
    textColor: "text-[#01312D]",
  },
};

// Create a separate component that uses useSearchParams
function RequestsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = authClient.useSession();
  const initialType = (searchParams.get("type") as ServiceType) || "fuel";

  const [selectedService, setSelectedService] =
    useState<ServiceType>(initialType);
  const [amount, setAmount] = useState<string>("");
  const [fuelType, setFuelType] = useState<"petrol" | "diesel">("petrol");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState("");
  const [selectedRepaymentDays, setSelectedRepaymentDays] = useState<number>(7);
  const [serviceConfig, setServiceConfig] = useState(DEFAULT_CONFIG);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [carWashPackages, setCarWashPackages] = useState<
    {
      id: string;
      name: string;
      description: string;
      price: number;
      isActive: boolean;
    }[]
  >([]);
  const [carWashServiceCharge, setCarWashServiceCharge] = useState<number>(0);

  const [approvedCount, setApprovedCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Fetch approved count
  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/driver/requests?userId=${session.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          const approved = data.filter(
            (r: any) => r.status === "approved" || r.status === "sent",
          ).length;
          setApprovedCount(approved);
        })
        .catch((err) => console.error("Error fetching approved count:", err));
    }
  }, [session]);

  // Fetch settings from API
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        if (data.services) {
          setServiceConfig({
            fuel: {
              ...DEFAULT_CONFIG.fuel,
              interestRate: Number(data.services.fuelInterestRate) || 13,
              defaultRepaymentDays: data.services.defaultRepaymentPeriod || 7,
              repaymentOptions: data.services.repaymentPeriods || [1, 3, 5, 7],
              minAmount: Number(data.services.minLoanAmount) || 500,
              maxAmount: Number(data.services.maxLoanAmount) || 2000,
            },
            carwash: {
              ...DEFAULT_CONFIG.carwash,
              interestRate: 0,
              defaultRepaymentDays: 0,
              repaymentOptions: [],
            },
          });

          // Load car wash packages from settings
          const packages =
            Array.isArray(data.services.carWashPackages) &&
            data.services.carWashPackages.length > 0
              ? data.services.carWashPackages.filter((p: any) => p.isActive)
              : [
                  {
                    id: "1",
                    name: "Basic Wash",
                    description: "Exterior wash and dry",
                    price: 60,
                    isActive: true,
                  },
                  {
                    id: "2",
                    name: "Full Service",
                    description: "Interior and exterior cleaning",
                    price: 100,
                    isActive: true,
                  },
                ];
          setCarWashPackages(packages);
          setCarWashServiceCharge(
            Number(data.services.carWashServiceCharge) || 10,
          );
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Get current service config
  const currentConfig = serviceConfig[selectedService];

  // Driver details from database
  const [driverDetails, setDriverDetails] = useState({
    fullName: "",
    carRegistrationNumber: "",
    carModel: "",
    phone: "",
    email: "",
    isVerified: false,
    verificationStatus: "",
  });
  const [fetchingDetails, setFetchingDetails] = useState(true);

  // Check authentication and fetch driver details
  useEffect(() => {
    if (!isPending && !settingsLoading) {
      if (!session) {
        router.push("/auth/sign-in");
      } else {
        fetchDriverDetails();
      }
    }
  }, [session, isPending, router, settingsLoading]);

  const fetchDriverDetails = async () => {
    try {
      const response = await fetch(
        `/api/driver/profile?userId=${session?.user?.id}`,
      );
      if (response.ok) {
        const data = await response.json();

        setDriverDetails({
          fullName: data.fullName || session?.user?.name || "",
          carRegistrationNumber: data.carRegistrationNumber || "",
          carModel: data.carModel || "",
          phone: data.phone || (session?.user as any)?.phone || "",
          email: session?.user?.email || "",
          isVerified: data.isVerified || false,
          verificationStatus: data.verificationStatus || "not_submitted",
        });
      }
    } catch (error) {
      console.error("Error fetching driver details:", error);
    } finally {
      setFetchingDetails(false);
    }
  };

  // Calculate interest and repayment details for fuel only
  const calculateServiceDetails = (amountNum: number) => {
    const interestRate = currentConfig.interestRate / 100;
    const interest = toMoney(amountNum * interestRate);
    const totalRepayable = toMoney(amountNum + interest);
    const dailyPayment = toMoney(totalRepayable / selectedRepaymentDays);
    return {
      interest,
      totalRepayable,
      dailyPayment,
      interestRate: currentConfig.interestRate,
    };
  };

  // Get service-specific summary
  const getServiceSummary = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return null;
    const Icon = currentConfig.icon;

    // For Car Wash - Show service fee, no interest
    if (selectedService === "carwash") {
      const selectedPackage = carWashPackages.find(
        (p) => p.price === amountNum,
      );
      const totalCarWash = toMoney(amountNum + carWashServiceCharge);
      return (
        <div className="bg-linear-to-r from-[#bff202] to-[#72bf00] rounded-xl p-4 mt-3">
          <div className="flex items-center gap-2 mb-3">
            <Icon className="w-4 h-4 text-[#01312D]" />
            <p className="text-sm font-semibold text-[#01312D]">
              Car Wash - Order Summary
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#01312D]">Package:</span>
              <span className="font-semibold text-[#01312D]">
                {selectedPackage?.name || "Custom"}
              </span>
            </div>
            {selectedPackage?.description && (
              <div className="flex justify-between">
                <span className="text-[#01312D]">Includes:</span>
                <span className="font-semibold text-[#01312D] text-right text-xs max-w-[60%]">
                  {selectedPackage.description}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#01312D]">Package Price:</span>
              <span className="font-semibold text-[#01312D]">
                {formatMoney(amountNum)}
              </span>
            </div>
            {carWashServiceCharge > 0 && (
              <div className="flex justify-between">
                <span className="text-[#01312D]">Service Fee:</span>
                <span className="font-semibold text-[#01312D]">
                  + {formatMoney(carWashServiceCharge)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#01312D]">Contact Number:</span>
              <span className="font-semibold text-[#01312D]">
                {phoneNumber || "Not entered"}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#01312D]/20 bg-[#01312D]/10 rounded-lg p-2 -mx-1">
              <span className="font-bold text-[#01312D]">Total Due:</span>
              <span className="font-bold text-[#01312D]">
                {formatMoney(totalCarWash)}
              </span>
            </div>
            <div className="bg-green-50 rounded-lg p-2 mt-2 -mx-1">
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <p className="text-xs text-green-700">
                  ✓ No interest. Pay the total due after service.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // For Fuel - Show interest calculation
    if (selectedService === "fuel") {
      const { interest, totalRepayable, dailyPayment, interestRate } =
        calculateServiceDetails(amountNum);

      // Get min/max limits
      const minAmount = currentConfig.minAmount || 500;
      const maxAmount = currentConfig.maxAmount || 2000;
      const isWithinLimits = amountNum >= minAmount && amountNum <= maxAmount;

      return (
        <div className="bg-linear-to-r from-[#bff202] to-[#72bf00] rounded-xl p-4 mt-3">
          <div className="flex items-center gap-2 mb-3">
            <Icon className="w-4 h-4 text-[#01312D]" />
            <p className="text-sm font-semibold text-[#01312D]">
              Fuel - Repayment Summary
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#01312D]">Fuel Amount:</span>
              <span className="font-semibold text-[#01312D]">
                {formatMoney(amountNum)}
              </span>
            </div>
            {!isWithinLimits && (
              <div className="flex justify-between bg-red-100 rounded-lg p-1 -mx-1">
                <span className="text-red-600 text-xs">
                  ⚠️ Amount outside limits
                </span>
                <span className="text-red-600 text-xs font-semibold">
                  Min: {formatMoney(minAmount)} | Max: {formatMoney(maxAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#01312D]">Fuel Type:</span>
              <span className="font-semibold text-[#01312D] capitalize">
                {fuelType}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#01312D]">Contact Number:</span>
              <span className="font-semibold text-[#01312D]">
                {phoneNumber || "Not entered"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#01312D]">Interest Rate:</span>
              <span className="font-semibold text-[#01312D]">
                {interestRate}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#01312D]">Interest Amount:</span>
              <span className="font-semibold text-[#01312D]">
                + {formatMoney(interest)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#01312D]/20">
              <span className="font-semibold text-[#01312D]">
                Total Repayable:
              </span>
              <span className="font-bold text-[#01312D]">
                {formatMoney(totalRepayable)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#01312D]">Repayment Period:</span>
              <span className="font-semibold text-[#01312D]">
                {selectedRepaymentDays} days
              </span>
            </div>
            <div className="flex justify-between bg-[#01312D]/10 rounded-lg p-2 -mx-1">
              <span className="font-semibold text-[#01312D]">
                Daily Payment:
              </span>
              <span className="font-bold text-[#01312D]">
                {formatMoney(dailyPayment)}/day
              </span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Get repayment period selector (only for fuel)
  const getRepaymentPeriodSelector = () => {
    if (selectedService === "fuel" || selectedService === "carwash")
      return null;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return null;

    return (
      <div>
        <label className="block text-[#01312D] font-semibold mb-2 text-sm">
          Select Repayment Period
        </label>
        <div className="flex gap-2">
          {currentConfig.repaymentOptions.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setSelectedRepaymentDays(days)}
              className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
                selectedRepaymentDays === days
                  ? "bg-linear-to-r from-[#01312D] to-[#3A7717] text-white shadow-md"
                  : "bg-white border border-[#bff202]/20 text-[#01312D]"
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Choose how long you need to repay
        </p>
      </div>
    );
  };

  const services = Object.entries(serviceConfig).map(([id, config]) => ({
    id: id as ServiceType,
    name: config.name,
    icon: config.icon,
    color: config.color,
    bg: "bg-[#eafde7]",
    textColor: config.textColor,
    interestRate: config.interestRate,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (submitted || loading) {
      return;
    }

    setSubmitted(true);
    setLoading(true);
    setError("");

    if (driverDetails.verificationStatus !== "approved") {
      setError(
        "You need to be verified to make requests. Please complete verification first.",
      );
      setLoading(false);
      setSubmitted(false);
      return;
    }

    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      setLoading(false);
      setSubmitted(false);
      return;
    }

    // Apply amount limits ONLY for fuel (loan services)
    // Car wash has fixed packages - no amount limits
    if (selectedService === "fuel") {
      const minAmount = currentConfig.minAmount || 500;
      const maxAmount = currentConfig.maxAmount || 2000;

      if (amountNum < minAmount) {
        setError(
          `Minimum fuel request amount is ${formatMoney(minAmount)}`,
        );
        setLoading(false);
        setSubmitted(false);
        return;
      }

      if (amountNum > maxAmount) {
        setError(
          `Maximum fuel request amount is ${formatMoney(maxAmount)}`,
        );
        setLoading(false);
        setSubmitted(false);
        return;
      }
    }

    // For car wash, validate that a package is selected
    if (selectedService === "carwash") {
      const selectedPackage = carWashPackages.find(
        (p) => p.price === amountNum,
      );
      if (!selectedPackage) {
        setError("Please select a valid car wash package");
        setLoading(false);
        setSubmitted(false);
        return;
      }
    }

    // Validate phone number for all services
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid 10-digit phone number");
      setLoading(false);
      setSubmitted(false);
      return;
    }

    if (!driverDetails.carRegistrationNumber) {
      setError("Please update your car registration number in profile first");
      setLoading(false);
      setSubmitted(false);
      return;
    }

    try {
      let requestData: any = {
        userId: session?.user?.id,
        type: selectedService,
        carNumber: driverDetails.carRegistrationNumber,
        carModel: driverDetails.carModel,
        contactPhone: phoneNumber,
        driverName: driverDetails.fullName,
        driverPhone: driverDetails.phone,
        driverEmail: driverDetails.email,
      };

      if (selectedService === "fuel") {
        const { interest, totalRepayable, dailyPayment, interestRate } =
          calculateServiceDetails(amountNum);
        requestData = {
          ...requestData,
          amount: amountNum,
          fuelType: fuelType,
          interest: interest,
          totalRepayable: totalRepayable,
          interestRate: interestRate,
          repaymentDays: selectedRepaymentDays,
          dailyPayment: toMoney(dailyPayment),
          hasReceipt: false
        };
      } else if (selectedService === "carwash") {
        const selectedPackage = carWashPackages.find(
          (p) => p.price === amountNum,
        );
        const totalDue = toMoney(amountNum + carWashServiceCharge);
        requestData = {
          ...requestData,
          amount: amountNum,
          package: selectedPackage?.name || "Custom",
          packageDescription: selectedPackage?.description || "",
          serviceCharge: carWashServiceCharge,
          totalDue: totalDue,
          interest: 0,
          totalRepayable: totalDue,
          interestRate: 0,
          repaymentDays: 0,
          dailyPayment: 0,
          hasReceipt: false
        };
      }

      console.log("Submitting request with data:", requestData);

      const response = await fetch("/api/driver/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      setRequestId(data.requestId);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        router.push("/requests/history");
      }, 3000);
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || "Failed to submit request. Please try again.");
      setSubmitted(false); // Reset submitted state on error so user can retry
    } finally {
      setLoading(false);
      // Don't reset submitted here - keep it disabled while navigating away
    }
  };
  const getPlaceholder = () => {
    switch (selectedService) {
      case "fuel":
        return "Enter amount in R (e.g., 2000)";
      case "carwash":
        return "Select package";
    }
  };

  const getVerificationStatusDisplay = () => {
    switch (driverDetails.verificationStatus) {
      case "approved":
        return {
          text: "Verified",
          color: "text-green-600",
          bgColor: "bg-green-50",
          icon: CheckCircle,
        };
      case "pending":
        return {
          text: "Pending Review",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          icon: Clock,
        };
      case "rejected":
        return {
          text: "Verification Failed",
          color: "text-red-600",
          bgColor: "bg-red-50",
          icon: XCircle,
        };
      default:
        return {
          text: "Not Started",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          icon: AlertCircle,
        };
    }
  };

  const isLoadingInitial = fetchingDetails || settingsLoading;

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#eafde7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#3A7717] animate-spin mx-auto mb-4" />
          <p className="text-[#01312D]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const statusDisplay = getVerificationStatusDisplay();

  if (!isLoadingInitial && driverDetails.verificationStatus !== "approved") {
    return (
      <div className="min-h-screen bg-[#eafde7] flex items-center justify-center px-5">
        <div className="text-center max-w-md">
          <div
            className={`w-20 h-20 ${statusDisplay.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}
          >
            <statusDisplay.icon
              className={`w-10 h-10 ${statusDisplay.color}`}
            />
          </div>
          <h2 className="text-2xl font-bold text-[#01312D] mb-2">
            Verification {statusDisplay.text}
          </h2>
          <p className="text-gray-600 mb-6">
            {driverDetails.verificationStatus === "pending" &&
              "Your documents are being reviewed by our admin. This usually takes 24-48 hours."}
            {driverDetails.verificationStatus === "rejected" &&
              "Your verification was not approved. Please re-submit your documents."}
            {driverDetails.verificationStatus === "not_submitted" &&
              "You need to complete driver verification before you can request services."}
          </p>
          <div className="bg-white rounded-2xl p-4 mb-6 text-left">
            <p className="text-sm text-[#01312D] font-semibold mb-2">
              Verification Status:
            </p>
            <p
              className={`text-sm ${statusDisplay.color} capitalize mb-2 flex items-center gap-2`}
            >
              <statusDisplay.icon className="w-4 h-4" />
              {statusDisplay.text}
            </p>
            {driverDetails.verificationStatus === "pending" && (
              <button
                onClick={() => router.push("/verify/status")}
                className="w-full bg-yellow-600 text-white py-3 rounded-xl font-semibold mt-2"
              >
                Check Status →
              </button>
            )}
            {(driverDetails.verificationStatus === "rejected" ||
              driverDetails.verificationStatus === "not_submitted") && (
              <button
                onClick={() => router.push("/verify")}
                className="w-full bg-linear-to-r from-[#01312D] to-[#3A7717] text-white py-3 rounded-xl font-semibold mt-2"
              >
                {driverDetails.verificationStatus === "rejected"
                  ? "Re-submit Documents →"
                  : "Complete Verification →"}
              </button>
            )}
          </div>
          <button
            onClick={() => router.push("/")}
            className="text-[#72bf00] font-semibold"
          >
            ← Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const minAmount = currentConfig.minAmount || 500;
  const maxAmount = currentConfig.maxAmount || 2000;
  const currentAmount = parseFloat(amount) || 0;
  const isAmountValid =
    selectedService === "fuel"
      ? currentAmount >= minAmount && currentAmount <= maxAmount
      : true;

  return (
    <div className="min-h-screen bg-[#eafde7] relative overflow-hidden pb-32">
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#bff202]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#3A7717]/5 rounded-full blur-3xl"></div>
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full animate-slideUp shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#3A7717]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[#3A7717]" />
              </div>
              <h3 className="text-xl font-bold text-[#01312D] mb-2">
                Request Sent!
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Your request has been sent to admin for approval
              </p>
              <div className="bg-[#eafde7] rounded-xl p-3 mb-4">
                <p className="text-xs text-[#3A7717] font-semibold">
                  Request ID: {requestId}
                </p>
              </div>
              <button
                onClick={() => setShowSuccess(false)}
                className="bg-[#01312D] text-white px-6 py-2 rounded-lg font-semibold"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      <main className="relative z-10 max-w-3xl mx-auto w-full">
        <div className="bg-white border-b border-[#bff202]/20 sticky top-0 z-20">
          <div className="px-5 py-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 bg-[#eafde7] rounded-full flex items-center justify-center active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5 text-[#01312D]" />
            </button>
            <h1 className="text-xl font-bold text-[#01312D]">
              Request Service
            </h1>
          </div>
        </div>

        <div className="px-5 pt-6 max-w-3xl mx-auto w-full">
          {/* Driver Info Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#eafde7] rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-[#3A7717]" />
              </div>
              <div>
                <div className="font-semibold text-[#01312D]">
                  {isLoadingInitial ? <Skeleton className="h-5 w-36" /> : driverDetails.fullName}
                </div>
                <div className="text-xs text-gray-500">
                  {isLoadingInitial ? <Skeleton className="h-4 w-44" /> : driverDetails.email}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Car Registration</p>
                <div className="font-semibold text-[#01312D]">
                  {isLoadingInitial ? <Skeleton className="h-4 w-24" /> : driverDetails.carRegistrationNumber || "Not set"}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Car Model</p>
                <div className="font-semibold text-[#01312D]">
                  {isLoadingInitial ? <Skeleton className="h-4 w-28" /> : driverDetails.carModel || "Not set"}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Registered Phone</p>
                <div className="font-semibold text-[#01312D]">
                  {isLoadingInitial ? <Skeleton className="h-4 w-28" /> : driverDetails.phone || "Not set"}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                {isLoadingInitial ? <Skeleton className="h-5 w-16 rounded-full" /> : <p className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block">✓ Verified</p>}
              </div>
            </div>
          </div>

          {/* Available Services Section */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#01312D] mb-3">
              Available Services
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {services.map((service) => {
                const Icon = service.icon;
                const isActive = selectedService === service.id;
                return (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service.id);
                      setAmount("");
                      setError("");
                      setSelectedRepaymentDays(7);
                    }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 ${
                      isActive
                        ? `bg-linear-to-r ${service.color} text-white shadow-lg scale-105`
                        : "bg-white text-[#01312D] border border-[#bff202]/20"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${isActive ? "text-white" : service.textColor}`}
                    />
                    <span
                      className={`text-xs font-semibold ${isActive ? "text-white" : "text-[#01312D]"}`}
                    >
                      {service.name}
                    </span>
                    <span
                      className={`text-[10px] ${isActive ? "text-white/80" : service.id === "carwash" ? "text-[#3A7717]" : "text-[#72bf00]"}`}
                    >
                      {service.id === "carwash"
                        ? "Service fee applies"
                        : `${service.interestRate}% interest`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Amount Field */}
            <div>
              <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                {selectedService === "carwash" ? "Select Package" : "Amount"}
              </label>

              {selectedService === "carwash" ? (
                <div className="space-y-2">
                  {carWashPackages.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setAmount(pkg.price.toString())}
                      className={`w-full p-4 rounded-2xl text-left transition-all ${
                        amount === pkg.price.toString()
                          ? "bg-linear-to-r from-[#01312D] to-[#3A7717] text-white shadow-lg"
                          : "bg-white border border-[#bff202]/20 text-[#01312D]"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold">{pkg.name}</h3>
                          <p
                            className={`text-xs mt-1 ${amount === pkg.price.toString() ? "text-white/80" : "text-gray-500"}`}
                          >
                            {pkg.description}
                          </p>
                        </div>
                        <p className="text-xl font-bold">{formatMoney(pkg.price)}</p>
                      </div>
                    </button>
                  ))}
                  {carWashServiceCharge > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg text-center">
                      <p className="text-xs text-blue-700">
                        Service fee of {formatMoney(carWashServiceCharge)} applies to all
                        packages
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="relative">
                    <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#72bf00]" />
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={getPlaceholder()}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] text-[#01312D]"
                      required
                    />
                  </div>

                  {/* Amount limits hint for fuel */}
                  {selectedService === "fuel" && (
                    <div className="mt-2">
                      <div className="flex gap-2 flex-wrap">
                        {[500, 1000, 1500, 2000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setAmount(amt.toString())}
                            className="px-3 py-1 bg-[#eafde7] rounded-lg text-xs text-[#3A7717] font-semibold border border-[#bff202]/20"
                          >
                            R{amt}
                          </button>
                        ))}
                      </div>
                      <p
                        className={`text-xs mt-2 ${!isAmountValid && amount ? "text-red-500" : "text-gray-500"}`}
                      >
                        Min: {formatMoney(minAmount)} | Max: {formatMoney(maxAmount)}
                        {!isAmountValid &&
                          amount &&
                          ` - Amount must be between ${formatMoney(minAmount)} and ${formatMoney(maxAmount)}`}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Contact Phone Number */}
            <div>
              <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                Contact Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#72bf00]" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                We'll use this number to contact you about your request
              </p>
            </div>

            {selectedService === "fuel" && (
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Fuel Type
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFuelType("petrol")}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${fuelType === "petrol" ? "bg-linear-to-r from-[#3A7717] to-[#72bf00] text-white shadow-md" : "bg-white border border-[#bff202]/20 text-[#01312D]"}`}
                  >
                    ⛽ Petrol
                  </button>
                  <button
                    type="button"
                    onClick={() => setFuelType("diesel")}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${fuelType === "diesel" ? "bg-linear-to-r from-[#3A7717] to-[#72bf00] text-white shadow-md" : "bg-white border border-[#bff202]/20 text-[#01312D]"}`}
                  >
                    🛢️ Diesel
                  </button>
                </div>
              </div>
            )}

            {amount &&
              parseFloat(amount) > 0 &&
              selectedService === "fuel" &&
              getRepaymentPeriodSelector()}

            {amount && parseFloat(amount) > 0 && getServiceSummary()}

            <div>
              <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                Car Registration Number
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#72bf00]">
                  🚗
                </div>
                <input
                  type="text"
                  value={driverDetails.carRegistrationNumber}
                  disabled
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-[#bff202]/20 rounded-xl text-[#01312D] cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                To update, go to Profile → Settings → Update Vehicle Details
              </p>
            </div>

            <button
              type="submit"
              disabled={
                loading ||
                submitted ||
                !amount ||
                !phoneNumber ||
                (selectedService === "fuel" && !isAmountValid)
              }
              className="w-full bg-linear-to-r from-[#01312D] to-[#3A7717] text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                </>
              ) : submitted ? (
                <>
                  <CheckCircle className="w-5 h-5" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" /> Submit Request
                </>
              )}
            </button>

            <div className="bg-[#eafde7] rounded-xl p-3 border border-[#bff202]/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#72bf00] mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600">
                    Your request will be sent to admin for approval. Once
                    approved, you'll receive an OTP and confirmation details.
                  </p>
                  <p className="text-xs text-[#3A7717] font-semibold mt-1">
                    {selectedService === "carwash"
                      ? `🚗 Car wash will be scheduled after approval. Service fee: ${formatMoney(carWashServiceCharge)}. Total due: ${formatMoney(toMoney((parseFloat(amount) || 0) + carWashServiceCharge))}.`
                      : `💰 Fuel request between ${formatMoney(minAmount)} - ${formatMoney(maxAmount)}. ${currentConfig.interestRate}% interest over ${selectedRepaymentDays} days.`}
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <BottomNavigation approvedCount={approvedCount} isAdmin={false} />
    </div>
  );
}

// Main export with Suspense boundary
export default function RequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#eafde7] px-5 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      }
    >
      <RequestsPageContent />
    </Suspense>
  );
}
