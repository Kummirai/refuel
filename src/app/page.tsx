// src/app/page.tsx - Completely rewritten for mobile

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  ArrowRight,
  Fuel,
  Smartphone,
  DollarSign,
  Car,
  Clock,
  Shield,
  ChevronRight,
  Zap,
  Truck,
  Headphones,
  Sparkles,
  LogOut,
  User,
  Home,
  ClipboardList,
  History,
  UserCircle,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] =
    useState<string>("not_submitted");

  // Simple auth check without using useSession hook
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to get session from localStorage first
        const cachedSession = localStorage.getItem("session");
        if (cachedSession) {
          const session = JSON.parse(cachedSession);
          setIsLoggedIn(true);
          const role = session.user?.role;
          setIsAdmin(role === "admin");
          setUserName(session.user?.name || "");
          if (role !== "admin") {
            await fetchProfile(session.user?.id);
          }
          setLoading(false);
          return;
        }

        // If not in cache, try to fetch
        const { data: session } = await authClient.getSession();

        if (session) {
          setIsLoggedIn(true);
          const role = (session.user as any)?.role;
          setIsAdmin(role === "admin");
          setUserName(session.user?.name || "");

          // Cache the session
          localStorage.setItem("session", JSON.stringify(session));

          if (role !== "admin") {
            await fetchProfile(session.user?.id);
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchProfile = async (userId: string) => {
      try {
        const response = await fetch(`/api/driver/profile?userId=${userId}`);
        if (response.ok) {
          const profile = await response.json();
          setVerificationStatus(profile?.verificationStatus || "not_submitted");
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    await authClient.signOut();
    localStorage.removeItem("session");
    setIsLoggedIn(false);
    setIsAdmin(false);
    router.push("/");
  };

  const handleGetStarted = () => {
    if (isAdmin) {
      router.push("/admin/dashboard");
      return;
    }

    if (isLoggedIn) {
      if (verificationStatus === "approved") {
        router.push("/dashboard");
      } else {
        router.push("/verify");
      }
    } else {
      router.push("/auth/sign-in");
    }
  };

  const handleServiceRequest = (service: string) => {
    if (!isLoggedIn) {
      router.push("/auth/sign-in");
      return;
    }

    if (isAdmin) {
      return;
    }

    if (verificationStatus !== "approved") {
      router.push("/verify");
      return;
    }

    router.push(`/requests?type=${service.toLowerCase()}`);
  };

  const getButtonText = () => {
    if (isAdmin) {
      return "Go to Admin Panel";
    }

    if (isLoggedIn) {
      if (verificationStatus === "approved") {
        return "Go to Dashboard";
      }
      if (verificationStatus === "pending") {
        return "Check Verification Status";
      }
      return "Complete Verification";
    }
    return "Get Started";
  };

  // Show loading for max 2 seconds
  if (loading) {
    return (
      <div className="min-h-screen bg-[#eafde7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3A7717] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#01312D]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eafde7] relative overflow-hidden pb-24">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#bff202]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#3A7717]/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Content */}
      <main className="relative z-10 px-5 pt-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Logo */}
            <div
              className="flex items-center gap-2 shrink-0 cursor-pointer"
              onClick={() => router.push("/")}
            >
              <div className="w-10 h-10 bg-[#01312D] rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-[#bff202]" />
              </div>
              <div>
                <h1 className="text-[#01312D] font-bold text-xl">
                  Fuel<span className="text-[#3A7717]">eX</span>
                </h1>
                <p className="text-[#72bf00] text-xs font-semibold">
                  Driver Services
                </p>
              </div>
            </div>

            {/* Right Side Actions */}
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            )}
          </div>

          {/* Welcome Messages */}
          {isLoggedIn && !isAdmin && (
            <div className="mt-4 bg-white/80 rounded-2xl p-3 shadow-sm border border-[#bff202]/20">
              <p className="text-sm text-[#01312D]">
                Welcome back,{" "}
                <span className="font-bold">{userName || "Driver"}!</span>
              </p>
            </div>
          )}

          {isLoggedIn && isAdmin && (
            <div className="mt-4 bg-gradient-to-r from-[#01312D] to-[#3A7717] rounded-2xl p-4 text-white">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-[#bff202] shrink-0" />
                <div>
                  <p className="font-bold">
                    Welcome back, {userName || "Admin"}!
                  </p>
                  <p className="text-sm opacity-90">
                    Manage drivers and service requests from your admin panel.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hero Tagline */}
        <div className="text-center mb-6">
          <div className="inline-block bg-[#bff202]/20 rounded-full px-4 py-1 mb-3">
            <p className="text-xs font-semibold text-[#01312D]">
              Everything for Drivers
            </p>
          </div>
          <h1 className="text-3xl font-extrabold text-[#01312D] leading-tight mb-2">
            Get Fuel, Cash,
            <br />
            Airtime & Car Wash
            <br />
            Instantly!
          </h1>
          <p className="text-[#3A7717] text-sm">
            Quick, reliable service at your fingertips
          </p>
        </div>

        {/* Get Started Button */}
        <div className="flex justify-center mb-12">
          <button
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white px-8 py-3 rounded-full font-bold text-lg shadow-xl active:scale-95 transition-transform flex items-center gap-2"
          >
            <span>{getButtonText()}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Services Grid */}
        {(!isLoggedIn || (!isAdmin && verificationStatus !== "approved")) && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-[#01312D] mb-4 text-center">
              Our Services
            </h2>
            <p className="text-xs text-[#3A7717] text-center mb-4">
              {isLoggedIn
                ? "Complete verification to access services"
                : "Quick & reliable delivery"}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleServiceRequest("fuel")}
                className="bg-white rounded-2xl p-4 shadow-md active:scale-95 transition-transform text-left border border-[#bff202]/20"
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

              <button
                onClick={() => handleServiceRequest("airtime")}
                className="bg-white rounded-2xl p-4 shadow-md active:scale-95 transition-transform text-left border border-[#bff202]/20"
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

              <button
                onClick={() => handleServiceRequest("cash")}
                className="bg-white rounded-2xl p-4 shadow-md active:scale-95 transition-transform text-left border border-[#bff202]/20"
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

              <button
                onClick={() => handleServiceRequest("carwash")}
                className="bg-white rounded-2xl p-4 shadow-md active:scale-95 transition-transform text-left border border-[#bff202]/20"
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
        )}

        {/* Features Section */}
        {!isAdmin && (
          <div className="mb-10">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-[#01312D]">
                Why Choose Us?
              </h2>
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
        )}

        {/* Support Section */}
        {!isAdmin && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#eafde7] w-10 h-10 rounded-full flex items-center justify-center shrink-0">
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
        )}
      </main>

      {/* Bottom Navigation Bar */}
      {!isAdmin && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-[#bff202]/20 px-6 py-2 z-50 shadow-lg">
          <div className="flex justify-around items-center">
            <button
              onClick={() => router.push("/")}
              className="flex flex-col items-center gap-0.5 py-1 active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#bff202] scale-110 shadow-md">
                <Home className="w-5 h-5 text-[#01312D]" />
              </div>
              <span className="text-xs text-[#01312D] font-bold">Home</span>
            </button>

            <button
              onClick={() =>
                router.push(isLoggedIn ? "/requests" : "/auth/sign-in")
              }
              className="flex flex-col items-center gap-0.5 py-1 active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#eafde7]">
                <ClipboardList className="w-5 h-5 text-[#3A7717]" />
              </div>
              <span className="text-xs text-[#3A7717]">Requests</span>
            </button>

            <button
              onClick={() =>
                router.push(isLoggedIn ? "/requests/history" : "/auth/sign-in")
              }
              className="flex flex-col items-center gap-0.5 py-1 active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#eafde7]">
                <History className="w-5 h-5 text-[#3A7717]" />
              </div>
              <span className="text-xs text-[#3A7717]">History</span>
            </button>

            <button
              onClick={() =>
                router.push(isLoggedIn ? "/profile" : "/auth/sign-in")
              }
              className="flex flex-col items-center gap-0.5 py-1 active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#eafde7]">
                <UserCircle className="w-5 h-5 text-[#3A7717]" />
              </div>
              <span className="text-xs text-[#3A7717]">Profile</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
