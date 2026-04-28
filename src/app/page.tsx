// src/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  Fuel,
  Smartphone,
  DollarSign,
  Car,
  Star,
  Clock,
  Shield,
  ChevronRight,
  Zap,
  ThumbsUp,
  Truck,
  Headphones,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      const { data: driver } = await supabase
        .from("drivers")
        .select("is_verified")
        .eq("id", user.id)
        .single();
      setIsVerified(driver?.is_verified || false);
    }
    setLoading(false);
  };

  const handleGetStarted = () => {
    if (user) {
      if (isVerified) {
        router.push("/dashboard");
      } else {
        router.push("/verify");
      }
    } else {
      router.push("/sign-up");
    }
  };

  const handleServiceRequest = (service: string) => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
    if (!isVerified) {
      router.push("/verify");
      return;
    }
    router.push(`/requests?type=${service.toLowerCase()}`);
  };

  return (
    <div className="min-h-screen bg-[#eafde7] relative overflow-hidden">
      {/* Background Decorative Elements with brand colors */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#bff202]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#3A7717]/5 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#72bf00]/5 rounded-full blur-3xl"></div>

      {/* Main Content */}
      <main className="relative z-10 px-5 pt-6 pb-24">
        {/* Header Section with Logo */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#01312D] rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-[#bff202]" />
            </div>
            <div>
              <h1 className="text-[#01312D] font-bold text-xl">
                Drive<span className="text-[#3A7717]">Hub</span>
              </h1>
              <p className="text-[#72bf00] text-xs font-semibold">
                Driver Services
              </p>
            </div>
          </div>

          {/* Trust Badge */}
          <div className="bg-white/90 backdrop-blur-md rounded-full px-3 py-1.5 shadow-md">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-bold text-[#01312D]">
                4.9 ★ (1.2k+)
              </span>
            </div>
          </div>
        </div>

        {/* Hero Tagline */}
        <div className="mb-8">
          <div className="inline-block bg-[#bff202]/20 rounded-full px-4 py-1 mb-4">
            <p className="text-xs font-semibold text-[#01312D]">
              🚀 24/7 Available 🚀
            </p>
          </div>
          <h1 className="text-4xl font-extrabold text-[#01312D] leading-tight mb-3">
            Get Fuel, Cash,
            <br />
            Airtime & Car Wash
            <br />
            Instantly!
          </h1>
          <p className="text-[#3A7717] text-sm max-w-xs">
            Everything a driver needs, right at your fingertips
          </p>
        </div>

        {/* Get Started Button */}
        <div className="flex justify-center mb-12">
          <button
            onClick={handleGetStarted}
            className="group relative bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white px-10 py-3.5 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span className="relative z-10">
              {user
                ? isVerified
                  ? "Go to Dashboard"
                  : "Complete Verification"
                : "Get Started"}
            </span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#3A7717] to-[#72bf00] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
          </button>
        </div>

        {/* Services Grid - Main Services */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-[#01312D]">Our Services</h2>
              <p className="text-xs text-[#3A7717]">
                Quick & reliable delivery
              </p>
            </div>
            <button className="text-[#72bf00] text-xs font-semibold flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Fuel Card */}
            <button
              onClick={() => handleServiceRequest("fuel")}
              className="bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left border border-[#bff202]/20"
            >
              <div className="bg-gradient-to-r from-[#3A7717] to-[#72bf00] w-12 h-12 rounded-xl flex items-center justify-center mb-3">
                <Fuel className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-[#01312D] text-lg">Fuel</h3>
              <p className="text-gray-500 text-xs mt-1">Petrol • Diesel</p>
              <div className="flex items-center gap-1 mt-2 text-[#72bf00] text-xs font-semibold">
                <span>Request now</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>

            {/* Airtime Card */}
            <button
              onClick={() => handleServiceRequest("airtime")}
              className="bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left border border-[#bff202]/20"
            >
              <div className="bg-gradient-to-r from-[#01312D] to-[#3A7717] w-12 h-12 rounded-xl flex items-center justify-center mb-3">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-[#01312D] text-lg">Airtime</h3>
              <p className="text-gray-500 text-xs mt-1">All networks</p>
              <div className="flex items-center gap-1 mt-2 text-[#72bf00] text-xs font-semibold">
                <span>Request now</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>

            {/* Cash Card */}
            <button
              onClick={() => handleServiceRequest("cash")}
              className="bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left border border-[#bff202]/20"
            >
              <div className="bg-gradient-to-r from-[#72bf00] to-[#bff202] w-12 h-12 rounded-xl flex items-center justify-center mb-3">
                <DollarSign className="w-6 h-6 text-[#01312D]" />
              </div>
              <h3 className="font-bold text-[#01312D] text-lg">Cash</h3>
              <p className="text-gray-500 text-xs mt-1">Instant transfer</p>
              <div className="flex items-center gap-1 mt-2 text-[#72bf00] text-xs font-semibold">
                <span>Request now</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>

            {/* Car Wash Card */}
            <button
              onClick={() => handleServiceRequest("carwash")}
              className="bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left border border-[#bff202]/20"
            >
              <div className="bg-gradient-to-r from-[#01312D] to-[#3A7717] w-12 h-12 rounded-xl flex items-center justify-center mb-3">
                <Car className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-[#01312D] text-lg">Car Wash</h3>
              <p className="text-gray-500 text-xs mt-1">Premium cleaning</p>
              <div className="flex items-center gap-1 mt-2 text-[#72bf00] text-xs font-semibold">
                <span>Request now</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-10">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-[#01312D]">Why Choose Us?</h2>
            <p className="text-xs text-[#3A7717]">
              Fast, secure & reliable service
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center bg-white rounded-2xl p-3 shadow-sm border border-[#bff202]/20">
              <div className="bg-[#eafde7] w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Zap className="w-5 h-5 text-[#3A7717]" />
              </div>
              <p className="text-[#01312D] font-semibold text-xs">
                Fast Delivery
              </p>
            </div>
            <div className="text-center bg-white rounded-2xl p-3 shadow-sm border border-[#bff202]/20">
              <div className="bg-[#eafde7] w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="w-5 h-5 text-[#3A7717]" />
              </div>
              <p className="text-[#01312D] font-semibold text-xs">Secure</p>
            </div>
            <div className="text-center bg-white rounded-2xl p-3 shadow-sm border border-[#bff202]/20">
              <div className="bg-[#eafde7] w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5 text-[#3A7717]" />
              </div>
              <p className="text-[#01312D] font-semibold text-xs">
                24/7 Support
              </p>
            </div>
          </div>
        </div>

        {/* Recent Requests Section (for logged in verified users) */}
        {user && isVerified && (
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#01312D]">
                  Recent Requests
                </h2>
                <p className="text-xs text-[#3A7717]">Your last 3 requests</p>
              </div>
              <button className="text-[#72bf00] text-xs font-semibold flex items-center gap-1">
                History <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                {
                  type: "Fuel",
                  amount: "₹2,500",
                  status: "Completed",
                  date: "Today, 10:30 AM",
                  icon: Fuel,
                  color: "text-[#3A7717]",
                  bg: "bg-[#eafde7]",
                },
                {
                  type: "Airtime",
                  amount: "₹500",
                  status: "Pending",
                  date: "Yesterday, 3:45 PM",
                  icon: Smartphone,
                  color: "text-[#72bf00]",
                  bg: "bg-[#eafde7]",
                },
                {
                  type: "Car Wash",
                  amount: "₹800",
                  status: "Completed",
                  date: "Yesterday, 9:00 AM",
                  icon: Car,
                  color: "text-[#01312D]",
                  bg: "bg-[#eafde7]",
                },
              ].map((request, index) => {
                const Icon = request.icon;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3 border border-[#bff202]/20"
                  >
                    <div
                      className={`${request.bg} w-10 h-10 rounded-xl flex items-center justify-center`}
                    >
                      <Icon className={`w-5 h-5 ${request.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-[#01312D]">
                            {request.type}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#01312D]">
                            {request.amount}
                          </p>
                          <p
                            className={`text-xs ${
                              request.status === "Completed"
                                ? "text-[#3A7717]"
                                : "text-[#72bf00]"
                            } font-semibold`}
                          >
                            {request.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Verification Banner (for unverified users) */}
        {user && !isVerified && (
          <div className="mt-6 bg-gradient-to-r from-[#bff202] to-[#72bf00] rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <ThumbsUp className="w-4 h-4 text-[#01312D]" />
                  <p className="text-[#01312D] text-xs font-semibold">
                    Action Required
                  </p>
                </div>
                <p className="text-[#01312D] font-bold text-sm">
                  Complete verification to access all services
                </p>
              </div>
              <button
                onClick={() => router.push("/verify")}
                className="bg-[#01312D] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-md hover:bg-[#3A7717] transition-colors"
              >
                Verify Now
              </button>
            </div>
          </div>
        )}

        {/* Welcome Banner for new users */}
        {!user && (
          <div className="mt-6 bg-gradient-to-r from-[#bff202] to-[#72bf00] rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                <Truck className="w-6 h-6 text-[#01312D]" />
              </div>
              <div className="flex-1">
                <p className="text-[#01312D] font-bold text-sm">
                  New to DriveHub?
                </p>
                <p className="text-[#01312D]/80 text-xs">
                  Sign up now & get 10% off on first request!
                </p>
              </div>
              <button
                onClick={() => router.push("/sign-up")}
                className="bg-[#01312D] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-md hover:bg-[#3A7717] transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}

        {/* Support Section */}
        <div className="mt-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#eafde7] w-10 h-10 rounded-full flex items-center justify-center">
                <Headphones className="w-5 h-5 text-[#3A7717]" />
              </div>
              <div>
                <p className="text-[#01312D] font-semibold text-sm">
                  24/7 Customer Support
                </p>
                <p className="text-xs text-gray-500">
                  Need help? We're here for you
                </p>
              </div>
            </div>
            <button className="text-[#72bf00] font-semibold text-sm">
              Contact
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-[#bff202]/20 px-6 py-2 z-50 shadow-lg">
        <div className="flex justify-around items-center">
          {[
            { icon: HomeIcon, label: "Home", active: true, path: "/" },
            {
              icon: ClipboardIcon,
              label: "Requests",
              active: false,
              path: "/requests",
            },
            {
              icon: HistoryIcon,
              label: "History",
              active: false,
              path: "/history",
            },
            {
              icon: UserIcon,
              label: "Profile",
              active: false,
              path: "/profile",
            },
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

// Custom Icon Components (since we need outline versions)
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
