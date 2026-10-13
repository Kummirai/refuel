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

type ServiceType = "fuel" | "carwash" | "cash";

function getDaysUntilNextTuesday(): number {
  const today = new Date().getDay();
  return ((2 - today + 7) % 7) || 7;
}

function getNextTuesdayName(): string {
  const date = new Date();
  date.setDate(date.getDate() + getDaysUntilNextTuesday());
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

// Default config (will be overridden by API)
const DEFAULT_CONFIG: Record<
  ServiceType,
  {
    name: string;
    interestRate: number;
    defaultRepaymentDays: number;
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
    defaultRepaymentDays: getDaysUntilNextTuesday(),
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
    icon: Car,
    color: "from-[#01312D] to-[#3A7717]",
    textColor: "text-[#01312D]",
  },
  cash: {
    name: "Cash Loan",
    interestRate: 26,
    defaultRepaymentDays: 14,
    icon: DollarSign,
    color: "from-[#72bf00] to-[#bff202]",
    textColor: "text-[#01312D]",
    minAmount: 500,
    maxAmount: 3000,
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

  // Cash loan collateral state
  const [collateralItemName, setCollateralItemName] = useState("");
  const [collateralBrand, setCollateralBrand] = useState("");
  const [collateralModel, setCollateralModel] = useState("");
  const [collateralPurchaseYear, setCollateralPurchaseYear] = useState("");
  const [collateralColor, setCollateralColor] = useState("");
  const [collateralCondition, setCollateralCondition] = useState<
    "new" | "like_new" | "good" | "fair"
  >("good");
  const [collateralSerialNumber, setCollateralSerialNumber] = useState("");
  const [collateralImages, setCollateralImages] = useState<string[]>([]);
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);
  const [collateralCategory, setCollateralCategory] = useState("");
  const [collateralEstimatedValue, setCollateralEstimatedValue] = useState("");

  const cashCategories = [
    "Electronics", "Vehicle", "Jewelry", "Appliances", "Furniture", "Other",
  ];

  const cashConditions: { value: "new" | "like_new" | "good" | "fair"; label: string }[] = [
    { value: "new", label: "New" },
    { value: "like_new", label: "Like New" },
    { value: "good", label: "Good" },
    { value: "fair", label: "Fair" },
  ];

  const serialRequiredCats = ["Electronics", "electronics", "Vehicle", "vehicle", "Appliances", "appliances"];

  const [approvedCount, setApprovedCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Weekly fuel credit
  const [fuelCredit, setFuelCredit] = useState<{
    limit: number;
    used: number;
    remaining: number;
    enabled: boolean;
  } | null>(null);

  const fetchFuelCredit = async () => {
    if (!session?.user?.id) return;
    try {
      const response = await fetch(
        `/api/driver/fuel-credit?userId=${session.user.id}`,
      );
      if (response.ok) {
        const data = await response.json();
        setFuelCredit({
          limit: data.limit,
          used: data.used,
          remaining: data.remaining,
          enabled: data.enabled !== false,
        });
      }
    } catch (error) {
      console.error("Error fetching fuel credit:", error);
    }
  };

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/driver/fuel-credit?userId=${session.user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.remaining === "number") {
          setFuelCredit({
            limit: data.limit,
            used: data.used,
            remaining: data.remaining,
            enabled: data.enabled !== false,
          });
        }
      })
      .catch((err) => console.error("Error fetching fuel credit:", err));
  }, [session?.user?.id]);

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
              defaultRepaymentDays: getDaysUntilNextTuesday(),
              minAmount: Number(data.services.minLoanAmount) || 500,
              maxAmount: Number(data.services.maxLoanAmount) || 2000,
            },
            carwash: {
               ...DEFAULT_CONFIG.carwash,
               interestRate: 0,
               defaultRepaymentDays: 0,
             },
             cash: {
               ...DEFAULT_CONFIG.cash,
               interestRate: Number(data.services.cashInterestRate) || 26,
               defaultRepaymentDays: 14,
               minAmount: Number(data.services.minLoanAmount) || 500,
               maxAmount: Number(data.services.maxLoanAmount) || 3000,
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

  // Calculate interest and repayment details
  const calculateServiceDetails = (amountNum: number) => {
    const interestRate = currentConfig.interestRate / 100;
    const interest = toMoney(amountNum * interestRate);
    const totalRepayable = toMoney(amountNum + interest);
    const days = selectedService === "fuel" ? getDaysUntilNextTuesday() : 14;
    const dailyPayment = toMoney(totalRepayable / days);
    return {
      interest,
      totalRepayable,
      dailyPayment,
      interestRate: currentConfig.interestRate,
      days,
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
      const { interest, totalRepayable, dailyPayment, interestRate, days } =
        calculateServiceDetails(amountNum);
      const minAmount = currentConfig.minAmount || 500;
      const maxAmount = currentConfig.maxAmount || 2000;
      const creditRemaining =
        fuelCredit?.enabled !== false ? fuelCredit?.remaining ?? null : null;
      const exceedsCredit =
        creditRemaining !== null && amountNum > creditRemaining;
      const isWithinLimits =
        amountNum >= minAmount &&
        amountNum <= maxAmount &&
        !exceedsCredit;

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
            {creditRemaining !== null && (
              <div className="flex justify-between">
                <span className="text-[#01312D]">Weekly Fuel Credit Left:</span>
                <span
                  className={`font-semibold ${exceedsCredit ? "text-red-600" : "text-[#01312D]"}`}
                >
                  {formatMoney(creditRemaining)} of{" "}
                  {formatMoney(fuelCredit?.limit ?? 0)}
                </span>
              </div>
            )}
            {exceedsCredit && (
              <div className="flex justify-between bg-red-100 rounded-lg p-1 -mx-1">
                <span className="text-red-600 text-xs">
                  ⚠️ Exceeds weekly fuel credit
                </span>
                <span className="text-red-600 text-xs font-semibold">
                  Max available: {formatMoney(creditRemaining)}
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
                {days} days (on {getNextTuesdayName()})
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

    // For Cash Loan
    if (selectedService === "cash") {
      const { interest, totalRepayable, dailyPayment, interestRate, days } =
        calculateServiceDetails(amountNum);

      const minAmount = currentConfig.minAmount || 500;
      const maxAmount = currentConfig.maxAmount || 3000;
      const isWithinLimits = amountNum >= minAmount && amountNum <= maxAmount;

      return (
        <div className="bg-linear-to-r from-[#bff202] to-[#72bf00] rounded-xl p-4 mt-3">
          <div className="flex items-center gap-2 mb-3">
            <Icon className="w-4 h-4 text-[#01312D]" />
            <p className="text-sm font-semibold text-[#01312D]">
              Cash Loan - Repayment Summary
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#01312D]">Loan Amount:</span>
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
            {collateralItemName && (
              <div className="flex justify-between">
                <span className="text-[#01312D]">Collateral:</span>
                <span className="font-semibold text-[#01312D]">
                  {collateralItemName}
                </span>
              </div>
            )}
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
                {days} days
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
            {collateralItemName && (
              <div className="flex items-center gap-2 bg-green-50 rounded-lg p-2 -mx-1 mt-1">
                <svg className="w-3.5 h-3.5 text-[#3A7717] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-xs text-[#3A7717]">
                  Collateral: {collateralItemName}{collateralCategory ? ` (${collateralCategory})` : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
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

    // Apply amount limits ONLY for loan services (fuel, cash)
    // Car wash has fixed packages - no amount limits
    if (selectedService === "fuel" || selectedService === "cash") {
      const minAmount = currentConfig.minAmount || 500;
      const maxAmount = currentConfig.maxAmount || 3000;

      if (amountNum < minAmount) {
        setError(
          `Minimum ${selectedService === "cash" ? "loan" : "fuel"} request amount is ${formatMoney(minAmount)}`,
        );
        setLoading(false);
        setSubmitted(false);
        return;
      }

      if (amountNum > maxAmount) {
        setError(
          `Maximum ${selectedService === "cash" ? "loan" : "fuel"} request amount is ${formatMoney(maxAmount)}`,
        );
        setLoading(false);
        setSubmitted(false);
        return;
      }

      if (
        selectedService === "fuel" &&
        fuelCredit?.enabled !== false &&
        fuelCredit &&
        amountNum > fuelCredit.remaining
      ) {
        setError(
          `You have ${formatMoney(fuelCredit.remaining)} left of your ${formatMoney(fuelCredit.limit)} weekly fuel credit (resets Monday).`,
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

    // Cash loan collateral validation
    if (selectedService === "cash") {
      if (!collateralCategory) {
        setError("Please select a collateral category");
        setLoading(false);
        setSubmitted(false);
        return;
      }
      if (!collateralItemName.trim()) {
        setError("Please enter the collateral item name");
        setLoading(false);
        setSubmitted(false);
        return;
      }
      if (!collateralCondition) {
        setError("Please select the collateral condition");
        setLoading(false);
        setSubmitted(false);
        return;
      }
      const imageCount = collateralImages.filter(Boolean).length;
      if (imageCount === 0) {
        setError("Please upload at least one photo of the collateral");
        setLoading(false);
        setSubmitted(false);
        return;
      }
      if (serialRequiredCats.includes(collateralCategory) && !collateralSerialNumber.trim()) {
        setError("Serial number / IMEI is required for electronics, vehicles, and appliances");
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
        const { interest, totalRepayable, dailyPayment, interestRate, days } =
          calculateServiceDetails(amountNum);
        requestData = {
          ...requestData,
          amount: amountNum,
          fuelType: fuelType,
          interest: interest,
          totalRepayable: totalRepayable,
          interestRate: interestRate,
          repaymentDays: days,
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
      } else if (selectedService === "cash") {
        const { interest, totalRepayable, dailyPayment, interestRate, days } =
          calculateServiceDetails(amountNum);
        requestData = {
          ...requestData,
          amount: amountNum,
          interest: interest,
          totalRepayable: totalRepayable,
          interestRate: interestRate,
          repaymentDays: days,
          dailyPayment: toMoney(dailyPayment),
          hasReceipt: false,
          collateral: {
            category: collateralCategory,
            itemName: collateralItemName.trim(),
            condition: collateralCondition,
            brand: collateralBrand.trim() || undefined,
            model: collateralModel.trim() || undefined,
            purchaseYear: collateralPurchaseYear ? parseInt(collateralPurchaseYear, 10) : undefined,
            color: collateralColor.trim() || undefined,
            serialNumber: collateralSerialNumber.trim() || undefined,
            estimatedValue: collateralEstimatedValue ? parseFloat(collateralEstimatedValue) : undefined,
            images: collateralImages.filter(Boolean),
          },
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
      if (selectedService === "fuel") {
        fetchFuelCredit();
      }

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
      case "cash":
        return "Enter loan amount in R (e.g., 2000)";
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
                className="w-full px-4 bg-yellow-600 text-white py-3 rounded-xl font-semibold mt-2"
              >
                Check Status →
              </button>
            )}
            {(driverDetails.verificationStatus === "rejected" ||
              driverDetails.verificationStatus === "not_submitted") && (
              <button
                onClick={() => router.push("/verify")}
                className="w-full px-4 bg-linear-to-r from-[#01312D] to-[#3A7717] text-white py-3 rounded-xl font-semibold mt-2"
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
    selectedService === "fuel" || selectedService === "cash"
      ? currentAmount >= minAmount &&
        currentAmount <= maxAmount &&
        !(
          selectedService === "fuel" &&
          fuelCredit?.enabled !== false &&
          fuelCredit &&
          currentAmount > fuelCredit.remaining
        )
      : true;

  return (
    <div className="min-h-screen bg-[#eafde7] relative overflow-x-clip pb-32">
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
                        : service.id === "cash"
                          ? `${service.interestRate}% · 14 days`
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

                  {/* Weekly fuel credit banner */}
                  {selectedService === "fuel" &&
                    fuelCredit &&
                    fuelCredit.enabled !== false && (
                    <div className="mt-3 bg-[#eafde7] border border-[#bff202]/40 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Fuel className="w-4 h-4 text-[#3A7717]" />
                          <p className="text-xs font-semibold text-[#01312D]">
                            Weekly Fuel Credit
                          </p>
                        </div>
                        <p className="text-sm font-bold text-[#01312D]">
                          {formatMoney(fuelCredit.remaining)} left
                        </p>
                      </div>
                      <div className="bg-white rounded-full h-1.5 mt-2 overflow-hidden">
                        <div
                          className="bg-[#3A7717] h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(100, (fuelCredit.used / Math.max(1, fuelCredit.limit)) * 100)}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {formatMoney(fuelCredit.used)} of {formatMoney(fuelCredit.limit)} used
                        {" · "}resets every Monday
                      </p>
                    </div>
                  )}

                  {/* Amount limits hint for fuel and cash loan */}
                  {(selectedService === "fuel" || selectedService === "cash") && (
                    <div className="mt-2">
                      <div className="flex gap-2 flex-wrap">
                        {[500, 1000, 1500, 2000, 2500, 3000].map((amt) => (
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
                        {selectedService === "fuel" &&
                        fuelCredit &&
                        fuelCredit.enabled !== false
                          ? ` | Weekly credit left: ${formatMoney(fuelCredit.remaining)}`
                          : ""}
                        {!isAmountValid &&
                          amount &&
                          selectedService === "fuel" &&
                          fuelCredit?.enabled !== false &&
                          fuelCredit &&
                          currentAmount > fuelCredit.remaining
                            ? ` - Amount exceeds your weekly fuel credit of ${formatMoney(fuelCredit.remaining)}`
                            : !isAmountValid &&
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
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                We'll use this number to contact you about your request
              </p>
            </div>

            {/* Cash Loan Collateral Form */}
            {selectedService === "cash" && currentAmount > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-[#bff202]/20 space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#3A7717]" />
                  <h3 className="font-bold text-[#01312D] text-sm">
                    Collateral Details
                  </h3>
                </div>
                <p className="text-xs text-gray-500 -mt-2">
                  Provide details about the item you're offering as collateral for this loan.
                </p>

                {/* Photos grid — up to 4 */}
                <div>
                  <label className="block text-[#01312D] font-semibold mb-1 text-xs">
                    Photos <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[10px] text-gray-400 mb-2">Upload up to 4 photos of the item</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((i) => (
                      <label
                        key={i}
                        className="aspect-square bg-[#eafde7] border-2 border-dashed border-[#bff202]/30 rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#d4f5d0] transition-colors overflow-hidden"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadingImageIndex(i);
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setCollateralImages((prev) => {
                                  const next = [...prev];
                                  next[i] = ev.target?.result as string;
                                  return next;
                                });
                                setUploadingImageIndex(null);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        {collateralImages[i] ? (
                          <div className="relative w-full h-full">
                            <img
                              src={collateralImages[i]}
                              alt={`Collateral ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setCollateralImages((prev) => {
                                  const next = [...prev];
                                  next.splice(i, 1);
                                  return next;
                                });
                              }}
                              className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                            >
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : uploadingImageIndex === i ? (
                          <div className="flex flex-col items-center gap-1">
                            <svg className="w-5 h-5 text-[#3A7717] animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span className="text-[10px] text-[#3A7717]">Loading...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-[10px] text-gray-400">Add Photo</span>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[#01312D] font-semibold mb-1.5 text-xs">
                    Item Info <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[10px] text-gray-400 mb-2">Select category and describe the item</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cashCategories.map((cat) => {
                      const active = collateralCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCollateralCategory(cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            active
                              ? "bg-[#01312D] text-white"
                              : "bg-white text-[#01312D] border border-[#bff202]/20"
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                  <div className="relative mt-2">
                    <input
                      type="text"
                      value={collateralItemName}
                      onChange={(e) => setCollateralItemName(e.target.value)}
                      placeholder="e.g. Samsung Galaxy S24, Rolex Submariner"
                      className="w-full px-3 py-2.5 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Brand, Model, Purchase Year, Color */}
                <div>
                  <label className="block text-[#01312D] font-semibold mb-1 text-xs">
                    Product Details
                  </label>
                  <p className="text-[10px] text-gray-400 mb-2">Brand, model, purchase year and color (optional)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#01312D] font-medium mb-1 text-xs">Brand</label>
                      <input
                        type="text"
                        value={collateralBrand}
                        onChange={(e) => setCollateralBrand(e.target.value)}
                        placeholder="e.g. Samsung"
                        className="w-full px-3 py-2.5 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[#01312D] font-medium mb-1 text-xs">Model</label>
                      <input
                        type="text"
                        value={collateralModel}
                        onChange={(e) => setCollateralModel(e.target.value)}
                        placeholder="e.g. S24 Ultra"
                        className="w-full px-3 py-2.5 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-[#01312D] font-medium mb-1 text-xs">Purchase Year</label>
                      <input
                        type="number"
                        value={collateralPurchaseYear}
                        onChange={(e) => setCollateralPurchaseYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                        placeholder="e.g. 2024"
                        min="1900"
                        max="2030"
                        className="w-full px-3 py-2.5 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[#01312D] font-medium mb-1 text-xs">Color</label>
                      <input
                        type="text"
                        value={collateralColor}
                        onChange={(e) => setCollateralColor(e.target.value)}
                        placeholder="e.g. Black"
                        className="w-full px-3 py-2.5 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-[#01312D] font-semibold mb-1 text-xs">
                    Condition <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[10px] text-gray-400 mb-2">How would you describe the item's condition?</p>
                  <div className="grid grid-cols-4 gap-2">
                    {cashConditions.map((c) => {
                      const active = collateralCondition === c.value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setCollateralCondition(c.value)}
                          className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                            active
                              ? "bg-[#01312D] text-white"
                              : "bg-[#eafde7] text-[#01312D] border border-[#bff202]/20"
                          }`}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Serial Number / IMEI */}
                <div>
                  <label className="block text-[#01312D] font-semibold mb-1 text-xs">
                    Serial Number / IMEI
                    {serialRequiredCats.includes(collateralCategory) && <span className="text-red-500"> *</span>}
                  </label>
                  <p className="text-[10px] text-gray-400 mb-2">
                    {serialRequiredCats.includes(collateralCategory)
                      ? "Required for electronic items"
                      : "Optional — enter if available"}
                  </p>
                  <input
                    type="text"
                    value={collateralSerialNumber}
                    onChange={(e) => setCollateralSerialNumber(e.target.value)}
                    placeholder={serialRequiredCats.includes(collateralCategory) ? "Required for electronics" : "Serial number or IMEI"}
                    className="w-full px-3 py-2.5 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] text-sm"
                  />
                </div>

              </div>
            )}

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

            {selectedService === "fuel" && amount && parseFloat(amount) > 0 && (
              <div className="flex items-center gap-2 bg-[#eafde7] border border-[#bff202]/30 rounded-xl p-3">
                <Calendar className="w-4 h-4 text-[#01312D] shrink-0" />
                <p className="text-sm text-[#01312D] font-semibold">
                  Repayment due in {getDaysUntilNextTuesday()} days (on {getNextTuesdayName()})
                </p>
              </div>
            )}

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
                ((selectedService === "fuel" || selectedService === "cash") && !isAmountValid) ||
                (selectedService === "cash" && (
                  collateralImages.filter(Boolean).length < 3
                  || !collateralItemName
                  || !collateralCategory
                  || (serialRequiredCats.includes(collateralCategory) && !collateralSerialNumber.trim())
                ))
              }
              className="w-full px-6 bg-linear-to-r from-[#01312D] to-[#3A7717] text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
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
                      : selectedService === "cash"
                        ? `💰 Cash loan of ${formatMoney(parseFloat(amount) || 0)} at ${currentConfig.interestRate}% interest over 14 days. Collateral required.`
                        : `💰 Fuel request between ${formatMoney(minAmount)} - ${formatMoney(maxAmount)}. ${currentConfig.interestRate}% interest. Payment due next ${getNextTuesdayName()}.`}
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
