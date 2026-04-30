// src/app/page.tsx - Fixed for mobile touch responsiveness

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
  Star,
  Clock,
  Shield,
  ChevronRight,
  Zap,
  ThumbsUp,
  Truck,
  Headphones,
  Sparkles,
  AlertCircle,
  CheckCircle,
  XCircle,
  LogOut,
  User,
  FileCheck,
  Hourglass,
  Home,
  ClipboardList,
  History,
  UserCircle,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "approved" | "pending" | "rejected" | "not_submitted"
  >("not_submitted");
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device for better touch handling
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Add a safety timeout — never spin forever
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    if (!isPending) {
      clearTimeout(timeout);

      if (session) {
        const role = (session.user as any)?.role;
        setUserRole(role || null);

        if (role === "admin") {
          setLoading(false);
        } else {
          fetchUserProfile();
        }
      } else {
        setLoading(false);
      }
    }

    return () => clearTimeout(timeout);
  }, [session, isPending]);

  const fetchUserProfile = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(
        `/api/driver/profile?userId=${session?.user?.id}`,
        { signal: controller.signal },
      );
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
        setVerificationStatus(profile?.verificationStatus || "not_submitted");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/");
  };

  const handleGetStarted = () => {
    if (userRole === "admin") {
      router.push("/admin/dashboard");
      return;
    }

    if (session) {
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
    if (!session) {
      router.push("/auth/sign-in");
      return;
    }

    if (userRole === "admin") {
      return;
    }

    if (verificationStatus !== "approved") {
      router.push("/verify");
      return;
    }

    router.push(`/requests?type=${service.toLowerCase()}`);
  };

  const getButtonText = () => {
    if (userRole === "admin") {
      return "Go to Admin Panel";
    }

    if (session) {
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

  // Show loading state
  if (loading || isPending) {
    return (
      <div className="min-h-screen bg-[#eafde7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3A7717] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#01312D]">Loading...</p>
        </div>
      </div>
    );
  }

  const isLoggedIn = !!session;
  const isAdmin = userRole === "admin";

  return (
    <div className="min-h-screen bg-[#eafde7] relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#bff202]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#3A7717]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#72bf00]/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Content */}
      <main className="relative z-10 px-5 pt-6 pb-24">
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
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {isLoggedIn && (
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap bg-[#bff202] text-[#01312D]`}
                >
                  {isAdmin ? (
                    <Shield className="w-3 h-3" />
                  ) : (
                    <User className="w-3 h-3" />
                  )}
                  {isAdmin ? "Admin" : "Driver"}
                </div>
              )}

              {isLoggedIn && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-all whitespace-nowrap active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              )}
            </div>
          </div>

          {/* Welcome Messages */}
          {isLoggedIn && !isAdmin && (
            <div className="mt-4 bg-white/80 rounded-2xl p-3 shadow-sm border border-[#bff202]/20">
              <p className="text-sm text-[#01312D]">
                Welcome back,{" "}
                <span className="font-bold">
                  {session?.user?.name || "Driver"}!
                </span>
              </p>
            </div>
          )}

          {isLoggedIn && isAdmin && (
            <div className="mt-4 bg-gradient-to-r from-[#01312D] to-[#3A7717] rounded-2xl p-4 text-white">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-[#bff202] shrink-0" />
                <div>
                  <p className="font-bold">
                    Welcome back, {session?.user?.name || "Admin"}!
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
            className="group relative bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white px-10 py-3.5 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 touch-manipulation"
            style={{ cursor: "pointer" }}
          >
            <span className="relative z-10">{getButtonText()}</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#3A7717] to-[#72bf00] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
          </button>
        </div>

        {/* Services Grid - Show for non-admin users */}
        {(!isLoggedIn || (isLoggedIn && !isAdmin)) && (
          <div className="mb-10">
            <div className="flex justify-between items-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#01312D]">
                  Our Services
                </h2>
                <p className="text-xs text-[#3A7717]">
                  {isLoggedIn && verificationStatus !== "approved"
                    ? "Complete verification to access services"
                    : "Quick & reliable delivery"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleServiceRequest("fuel")}
                disabled={isLoggedIn && verificationStatus !== "approved"}
                className={`bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left border border-[#bff202]/20 active:scale-95 touch-manipulation ${
                  isLoggedIn && verificationStatus !== "approved"
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                style={{
                  cursor:
                    isLoggedIn && verificationStatus !== "approved"
                      ? "not-allowed"
                      : "pointer",
                }}
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
                disabled={isLoggedIn && verificationStatus !== "approved"}
                className={`bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left border border-[#bff202]/20 active:scale-95 touch-manipulation ${
                  isLoggedIn && verificationStatus !== "approved"
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                style={{
                  cursor:
                    isLoggedIn && verificationStatus !== "approved"
                      ? "not-allowed"
                      : "pointer",
                }}
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
                disabled={isLoggedIn && verificationStatus !== "approved"}
                className={`bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left border border-[#bff202]/20 active:scale-95 touch-manipulation ${
                  isLoggedIn && verificationStatus !== "approved"
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                style={{
                  cursor:
                    isLoggedIn && verificationStatus !== "approved"
                      ? "not-allowed"
                      : "pointer",
                }}
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
                disabled={isLoggedIn && verificationStatus !== "approved"}
                className={`bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left border border-[#bff202]/20 active:scale-95 touch-manipulation ${
                  isLoggedIn && verificationStatus !== "approved"
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                style={{
                  cursor:
                    isLoggedIn && verificationStatus !== "approved"
                      ? "not-allowed"
                      : "pointer",
                }}
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

        {/* Features Section - Hide for admin */}
        {!isAdmin && (
          <>
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

            {!isLoggedIn && (
              <div className="mt-6 bg-gradient-to-r from-[#bff202] to-[#72bf00] rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md shrink-0">
                    <Truck className="w-6 h-6 text-[#01312D]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#01312D] font-bold text-sm">
                      New to FueleX?
                    </p>
                    <p className="text-[#01312D]/80 text-xs">
                      Sign up now & get 10% off on first request!
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20 flex items-center justify-between flex-wrap gap-3">
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
                <button className="text-[#72bf00] font-semibold text-sm whitespace-nowrap">
                  Contact
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      {!isAdmin && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-[#bff202]/20 px-6 py-2 z-50 shadow-lg">
          <div className="flex justify-around items-center">
            <button
              onClick={() => router.push("/")}
              className="flex flex-col items-center gap-0.5 py-1 group active:scale-95 transition-transform touch-manipulation"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#bff202] scale-110 shadow-md">
                <Home className="w-5 h-5 text-[#01312D]" />
              </div>
              <span className="text-xs text-[#01312D] font-bold">Home</span>
            </button>

            <button
              onClick={() => {
                if (!isLoggedIn) {
                  router.push("/auth/sign-in");
                } else {
                  router.push("/requests");
                }
              }}
              className="flex flex-col items-center gap-0.5 py-1 group active:scale-95 transition-transform touch-manipulation"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#eafde7] group-hover:bg-[#bff202]/50">
                <ClipboardList className="w-5 h-5 text-[#3A7717] group-hover:text-[#01312D]" />
              </div>
              <span className="text-xs text-[#3A7717] group-hover:text-[#01312D]">
                Requests
              </span>
            </button>

            <button
              onClick={() => {
                if (!isLoggedIn) {
                  router.push("/auth/sign-in");
                } else {
                  router.push("/requests/history");
                }
              }}
              className="flex flex-col items-center gap-0.5 py-1 group active:scale-95 transition-transform touch-manipulation"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#eafde7] group-hover:bg-[#bff202]/50">
                <History className="w-5 h-5 text-[#3A7717] group-hover:text-[#01312D]" />
              </div>
              <span className="text-xs text-[#3A7717] group-hover:text-[#01312D]">
                History
              </span>
            </button>

            <button
              onClick={() => {
                if (!isLoggedIn) {
                  router.push("/auth/sign-in");
                } else {
                  router.push("/profile");
                }
              }}
              className="flex flex-col items-center gap-0.5 py-1 group active:scale-95 transition-transform touch-manipulation"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#eafde7] group-hover:bg-[#bff202]/50">
                <UserCircle className="w-5 h-5 text-[#3A7717] group-hover:text-[#01312D]" />
              </div>
              <span className="text-xs text-[#3A7717] group-hover:text-[#01312D]">
                Profile
              </span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
