// src/app/requests/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
} from "lucide-react";

type ServiceType = "fuel" | "airtime" | "cash" | "carwash";

export default function RequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = (searchParams.get("type") as ServiceType) || "fuel";

  const [selectedService, setSelectedService] =
    useState<ServiceType>(initialType);
  const [amount, setAmount] = useState<string>("");
  const [fuelType, setFuelType] = useState<"petrol" | "diesel">("petrol");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [carNumber, setCarNumber] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

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
      name: "Cash",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);

      // Reset after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        router.push("/requests/history");
      }, 3000);
    }, 2000);
  };

  const getTitle = () => {
    switch (selectedService) {
      case "fuel":
        return "Request Fuel";
      case "airtime":
        return "Request Airtime";
      case "cash":
        return "Request Cash";
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
        return "Enter amount in ₹ (e.g., 5000)";
      case "carwash":
        return "Select package";
    }
  };

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
                  Request ID: #REQ{Math.floor(Math.random() * 10000)}
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
          {/* Service Selection Tabs */}
          <div className="mb-8">
            <div className="grid grid-cols-4 gap-2">
              {services.map((service) => {
                const Icon = service.icon;
                const isActive = selectedService === service.id;
                return (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
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

          {/* Request Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Amount Field */}
            <div>
              <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                {selectedService === "carwash" ? "Select Package" : "Amount"}
              </label>
              <div className="relative">
                <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#72bf00]" />
                <input
                  type={selectedService === "carwash" ? "text" : "number"}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={getPlaceholder()}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] focus:ring-2 focus:ring-[#72bf00]/20 text-[#01312D]"
                  required
                />
              </div>
              {selectedService === "fuel" && (
                <div className="flex gap-2 mt-2">
                  {[1000, 2000, 3000, 5000].map((amt) => (
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
                <div className="flex gap-2 mt-2">
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
            </div>

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
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Airtime will be sent to this number
                </p>
              </div>
            )}

            {/* Car Registration Number */}
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
                  value={carNumber}
                  onChange={(e) => setCarNumber(e.target.value)}
                  placeholder="e.g., KA01AB1234"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] focus:ring-2 focus:ring-[#72bf00]/20 text-[#01312D] uppercase"
                  required
                />
              </div>
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
              {selectedService === "fuel" && fuelType && (
                <p className="text-xs opacity-80">Fuel Type: {fuelType}</p>
              )}
              {selectedService === "airtime" && phoneNumber && (
                <p className="text-xs opacity-80">To: {phoneNumber}</p>
              )}
              <p className="text-xs opacity-80 mt-2">Service Fee: Free</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
