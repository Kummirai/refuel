// src/app/requests/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  Fuel,
  Smartphone,
  DollarSign,
  Car,
  ArrowLeft,
  Send,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Phone,
  MapPin,
  Gauge,
  CircleDollarSign,
  Loader2,
  Shield,
  User,
} from "lucide-react";

type ServiceType = "fuel" | "airtime" | "cash" | "carwash";

export default function RequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = authClient.useSession();
  const initialType = (searchParams.get("type") as ServiceType) || "fuel";

  const [selectedService, setSelectedService] =
    useState<ServiceType>(initialType);
  const [amount, setAmount] = useState<string>("");
  const [fuelType, setFuelType] = useState<"petrol" | "diesel">("petrol");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState("");

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
    if (!isPending) {
      if (!session) {
        router.push("/auth/sign-in");
      } else {
        fetchDriverDetails();
      }
    }
  }, [session, isPending, router]);

  const fetchDriverDetails = async () => {
    try {
      const response = await fetch(
        `/api/driver/profile?userId=${session?.user?.id}`,
      );
      if (response.ok) {
        const data = await response.json();

        // Check if user is verified
        if (!data.isVerified || data.verificationStatus !== "approved") {
          setError(
            "You need to be verified to make requests. Please complete verification first.",
          );
          setTimeout(() => {
            router.push("/verify");
          }, 2000);
        }

        setDriverDetails({
          fullName: data.fullName || session?.user?.name || "",
          carRegistrationNumber: data.carRegistrationNumber || "",
          carModel: data.carModel || "",
          phone: data.phone || session?.user?.phone || "",
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

  // Calculate interest for cash loans
  const calculateInterest = (amountNum: number) => {
    const interestRate = 0.13; // 13%
    const interest = amountNum * interestRate;
    const totalRepayable = amountNum + interest;
    return { interest, totalRepayable };
  };

  const services = [
    {
      id: "fuel" as const,
      name: "Fuel",
      icon: Fuel,
      color: "from-[#3A7717] to-[#72bf00]",
      bg: "bg-[#eafde7]",
      textColor: "text-[#3A7717]",
    },
    {
      id: "airtime" as const,
      name: "Airtime",
      icon: Smartphone,
      color: "from-[#01312D] to-[#3A7717]",
      bg: "bg-[#eafde7]",
      textColor: "text-[#01312D]",
    },
    {
      id: "cash" as const,
      name: "Cash Loan",
      icon: DollarSign,
      color: "from-[#72bf00] to-[#bff202]",
      bg: "bg-[#eafde7]",
      textColor: "text-[#72bf00]",
    },
    {
      id: "carwash" as const,
      name: "Car Wash",
      icon: Car,
      color: "from-[#01312D] to-[#3A7717]",
      bg: "bg-[#eafde7]",
      textColor: "text-[#01312D]",
    },
  ];

  const carWashPackages = [
    { id: "basic", name: "Basic Wash", price: 499 },
    { id: "premium", name: "Premium Wash", price: 999 },
    { id: "deluxe", name: "Deluxe Wash", price: 1499 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Check if user is verified
    if (!driverDetails.isVerified) {
      setError(
        "You need to be verified to make requests. Please complete verification first.",
      );
      setLoading(false);
      return;
    }

    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      setLoading(false);
      return;
    }

    // Validate based on service type
    if (
      selectedService === "airtime" &&
      (!phoneNumber || phoneNumber.length < 10)
    ) {
      setError("Please enter a valid 10-digit phone number");
      setLoading(false);
      return;
    }

    if (!driverDetails.carRegistrationNumber) {
      setError("Please update your car registration number in profile first");
      setLoading(false);
      return;
    }

    if (!location) {
      setError("Please enter your current location");
      setLoading(false);
      return;
    }

    try {
      const requestData: any = {
        userId: session?.user?.id,
        type: selectedService,
        amount: amountNum,
        driverName: driverDetails.fullName,
        carNumber: driverDetails.carRegistrationNumber,
        carModel: driverDetails.carModel,
        driverPhone: driverDetails.phone,
        driverEmail: driverDetails.email,
        location: location,
      };

      // Add service-specific fields
      if (selectedService === "fuel") {
        requestData.fuelType = fuelType;
      }
      if (selectedService === "airtime") {
        requestData.phoneNumber = phoneNumber;
      }
      if (selectedService === "cash") {
        const { interest, totalRepayable } = calculateInterest(amountNum);
        requestData.interest = interest;
        requestData.totalRepayable = totalRepayable;
        requestData.interestRate = 13;
        requestData.repaymentDays = 14; // Default 14 days
      }
      if (selectedService === "carwash") {
        const selectedPackage = carWashPackages.find(
          (p) => p.price === amountNum,
        );
        requestData.package = selectedPackage?.name || "Custom";
      }

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

      // Reset form after 3 seconds and redirect
      setTimeout(() => {
        setShowSuccess(false);
        router.push("/requests/history");
      }, 3000);
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || "Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (selectedService) {
      case "fuel":
        return "Request Fuel";
      case "airtime":
        return "Request Airtime";
      case "cash":
        return "Request Cash Loan";
      case "carwash":
        return "Book Car Wash";
    }
  };

  const getPlaceholder = () => {
    switch (selectedService) {
      case "fuel":
        return "Enter amount in ₹ (e.g., 2000)";
      case "airtime":
        return "Enter amount in ₹ (e.g., 500)";
      case "cash":
        return "Enter loan amount in ₹ (e.g., 5000)";
      case "carwash":
        return "Select package";
    }
  };

  if (isPending || fetchingDetails) {
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

  // Show verification required message
  if (!driverDetails.isVerified) {
    return (
      <div className="min-h-screen bg-[#eafde7] flex items-center justify-center px-5">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#01312D] mb-2">
            Verification Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to complete driver verification before you can request
            services. This helps us ensure the safety and security of all
            drivers.
          </p>
          <div className="bg-white rounded-2xl p-4 mb-6 text-left">
            <p className="text-sm text-[#01312D] font-semibold mb-2">
              Verification Status:
            </p>
            <p className="text-sm text-yellow-600 capitalize mb-2">
              {driverDetails.verificationStatus}
            </p>
            <button
              onClick={() => router.push("/verify")}
              className="w-full bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white py-3 rounded-xl font-semibold"
            >
              Complete Verification →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eafde7] relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#bff202]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#3A7717]/5 rounded-full blur-3xl"></div>

      {/* Success Modal */}
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

      {/* Main Content */}
      <main className="relative z-10 pb-24">
        {/* Header */}
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

        <div className="px-5 pt-6">
          {/* Driver Info Card - Pre-filled from database */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#eafde7] rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-[#3A7717]" />
              </div>
              <div>
                <p className="font-semibold text-[#01312D]">
                  {driverDetails.fullName}
                </p>
                <p className="text-xs text-gray-500">{driverDetails.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Car Registration</p>
                <p className="font-semibold text-[#01312D]">
                  {driverDetails.carRegistrationNumber || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Car Model</p>
                <p className="font-semibold text-[#01312D]">
                  {driverDetails.carModel || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="font-semibold text-[#01312D]">
                  {driverDetails.phone}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block">
                  ✓ Verified
                </p>
              </div>
            </div>
          </div>

          {/* Service Selection Tabs */}
          <div className="mb-8">
            <div className="grid grid-cols-4 gap-2">
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
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 ${
                      isActive
                        ? `bg-gradient-to-r ${service.color} text-white shadow-lg scale-105`
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
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Request Form */}
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
                          ? "bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white shadow-lg"
                          : "bg-white border border-[#bff202]/20 text-[#01312D]"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold">{pkg.name}</h3>
                          <p
                            className={`text-xs mt-1 ${amount === pkg.price.toString() ? "text-white/80" : "text-gray-500"}`}
                          >
                            Premium cleaning service
                          </p>
                        </div>
                        <p className="text-xl font-bold">₹{pkg.price}</p>
                      </div>
                    </button>
                  ))}
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
                      className="w-full pl-10 pr-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] focus:ring-2 focus:ring-[#72bf00]/20 text-[#01312D]"
                      required
                    />
                  </div>

                  {/* Quick amount buttons */}
                  {selectedService === "fuel" && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {[500, 1000, 2000, 3000, 5000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setAmount(amt.toString())}
                          className="px-3 py-1 bg-[#eafde7] rounded-lg text-xs text-[#3A7717] font-semibold border border-[#bff202]/20"
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedService === "airtime" && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {[100, 200, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setAmount(amt.toString())}
                          className="px-3 py-1 bg-[#eafde7] rounded-lg text-xs text-[#3A7717] font-semibold border border-[#bff202]/20"
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedService === "cash" && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {[5000, 10000, 20000, 50000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setAmount(amt.toString())}
                          className="px-3 py-1 bg-[#eafde7] rounded-lg text-xs text-[#3A7717] font-semibold border border-[#bff202]/20"
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Interest Calculation for Cash Loan */}
            {selectedService === "cash" && amount && parseFloat(amount) > 0 && (
              <div className="bg-gradient-to-r from-[#bff202] to-[#72bf00] rounded-xl p-4">
                <p className="text-sm font-semibold text-[#01312D] mb-2">
                  Loan Summary
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#01312D]">Loan Amount:</span>
                    <span className="font-semibold text-[#01312D]">
                      ₹{parseFloat(amount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#01312D]">Interest (13%):</span>
                    <span className="font-semibold text-[#01312D]">
                      + ₹{(parseFloat(amount) * 0.13).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#01312D]/20">
                    <span className="font-semibold text-[#01312D]">
                      Total Repayable:
                    </span>
                    <span className="font-bold text-[#01312D]">
                      ₹{(parseFloat(amount) * 1.13).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Fuel Type (Only for fuel) */}
            {selectedService === "fuel" && (
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Fuel Type
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFuelType("petrol")}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      fuelType === "petrol"
                        ? "bg-gradient-to-r from-[#3A7717] to-[#72bf00] text-white shadow-md"
                        : "bg-white border border-[#bff202]/20 text-[#01312D]"
                    }`}
                  >
                    ⛽ Petrol
                  </button>
                  <button
                    type="button"
                    onClick={() => setFuelType("diesel")}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      fuelType === "diesel"
                        ? "bg-gradient-to-r from-[#3A7717] to-[#72bf00] text-white shadow-md"
                        : "bg-white border border-[#bff202]/20 text-[#01312D]"
                    }`}
                  >
                    🛢️ Diesel
                  </button>
                </div>
              </div>
            )}

            {/* Phone Number (Only for airtime) */}
            {selectedService === "airtime" && (
              <div>
                <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#72bf00]" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] focus:ring-2 focus:ring-[#72bf00]/20 text-[#01312D]"
                    required
                  />
                </div>
              </div>
            )}

            {/* Car Registration Number - Pre-filled and disabled */}
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

            {/* Location */}
            <div>
              <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                Current Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#72bf00]" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter your current location"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] focus:ring-2 focus:ring-[#72bf00]/20 text-[#01312D]"
                  required
                />
              </div>
              <button
                type="button"
                className="text-xs text-[#72bf00] mt-1 font-semibold flex items-center gap-1"
              >
                <Gauge className="w-3 h-3" />
                Use current location
              </button>
            </div>

            {/* Service Summary Card */}
            <div className="bg-gradient-to-r from-[#01312D] to-[#3A7717] rounded-2xl p-4 text-white">
              <p className="text-sm opacity-90 mb-2">Request Summary</p>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">
                  {services.find((s) => s.id === selectedService)?.name}
                </span>
                <span className="text-xl font-bold">₹{amount || "0"}</span>
              </div>
              <p className="text-xs opacity-80">
                Driver: {driverDetails.fullName}
              </p>
              <p className="text-xs opacity-80">
                Car: {driverDetails.carRegistrationNumber}
              </p>
              {selectedService === "fuel" && fuelType && (
                <p className="text-xs opacity-80">Fuel Type: {fuelType}</p>
              )}
              {selectedService === "airtime" && phoneNumber && (
                <p className="text-xs opacity-80">To: {phoneNumber}</p>
              )}
              {selectedService === "cash" &&
                amount &&
                parseFloat(amount) > 0 && (
                  <p className="text-xs opacity-80">
                    Total Repayable: ₹
                    {(parseFloat(amount) * 1.13).toLocaleString()}
                  </p>
                )}
              <p className="text-xs opacity-80 mt-2">Service Fee: Free</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !amount}
              className="w-full bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Request
                </>
              )}
            </button>

            {/* Info Note */}
            <div className="bg-[#eafde7] rounded-xl p-3 border border-[#bff202]/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#72bf00] mt-0.5" />
                <p className="text-xs text-gray-600">
                  Your request will be sent to admin for approval. Once
                  approved, you'll receive an OTP and confirmation details.
                </p>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-[#bff202]/20 px-6 py-2 z-50 shadow-lg">
        <div className="flex justify-around items-center">
          {[
            { icon: HomeIcon, label: "Home", path: "/" },
            {
              icon: ClipboardIcon,
              label: "Requests",
              active: true,
              path: "/requests",
            },
            { icon: HistoryIcon, label: "History", path: "/requests/history" },
            { icon: UserIcon, label: "Profile", path: "/profile" },
          ].map((item, index) => {
            const IconComponent = item.icon;
            return (
              <button
                key={index}
                onClick={() => router.push(item.path)}
                className="flex flex-col items-center gap-0.5 py-1 group"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    item.active
                      ? "bg-[#bff202] scale-110 shadow-md"
                      : "bg-[#eafde7] group-hover:bg-[#bff202]/50"
                  }`}
                >
                  <IconComponent
                    className={`w-5 h-5 ${
                      item.active
                        ? "text-[#01312D]"
                        : "text-[#3A7717] group-hover:text-[#01312D]"
                    }`}
                  />
                </div>
                <span
                  className={`text-xs ${
                    item.active
                      ? "text-[#01312D] font-bold"
                      : "text-[#3A7717] group-hover:text-[#01312D]"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// Icon Components
function HomeIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function ClipboardIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  );
}

function HistoryIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function UserIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}
