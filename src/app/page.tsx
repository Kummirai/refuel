// src/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import BottomNavigation from "@/components/BottomNavigation";
import {
  Fuel,
  DollarSign,
  Car,
  Star,
  Clock,
  Shield,
  ChevronRight,
  Zap,
  Truck,
  Headphones,
  Sparkles,
  AlertCircle,
  XCircle,
  LogOut,
  User,
  FileCheck,
  Hourglass,
  Home,
  ClipboardList,
  History,
  UserCircle,
  Flame,
  Rocket,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatMoney } from "@/lib/money";

type FuelCredit = {
  limit: number;
  used: number;
  remaining: number;
  enabled: boolean;
};

function FuelCreditCard({ userId }: { userId: string | null }) {
  const router = useRouter();
  const [credit, setCredit] = useState<FuelCredit | null>(null);
  const [creditLoading, setCreditLoading] = useState(!!userId);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetch(`/api/driver/fuel-credit?userId=${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && !data.error) setCredit(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCreditLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (credit && credit.enabled === false) return null;

  const limit = credit?.limit ?? 0;
  const used = credit?.used ?? 0;
  const remaining = credit?.remaining ?? 0;
  const usedPct = Math.min(100, (used / Math.max(1, limit)) * 100);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#eafde7] rounded-full flex items-center justify-center">
            <Fuel className="w-5 h-5 text-[#3A7717]" />
          </div>
          <div>
            <p className="font-bold text-[#01312D]">Fuel Credit Limit</p>
            <p className="text-[10px] text-gray-500">Resets every Monday</p>
          </div>
        </div>
        {creditLoading ? (
          <Skeleton className="h-6 w-20" />
        ) : (
          <p className="text-lg font-bold text-[#01312D]">
            {formatMoney(remaining)}
          </p>
        )}
      </div>
      {creditLoading ? (
        <Skeleton className="h-2 w-full rounded-full" />
      ) : (
        <>
          <div className="bg-[#eafde7] rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full ${used >= limit ? "bg-red-500" : "bg-[#3A7717]"}`}
              style={{ width: `${usedPct}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">
              {formatMoney(used)} used of {formatMoney(limit)}
            </p>
            <button
              onClick={() => router.push("/requests?type=fuel")}
              className="text-xs font-semibold text-[#72bf00]"
            >
              Request Fuel →
            </button>
          </div>
          {remaining <= 0 && (
            <p className="text-xs text-red-600 mt-2 font-semibold">
              Weekly fuel credit used up — resets Monday.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "approved" | "pending" | "rejected" | "not_submitted"
  >("not_submitted");
  const [loadError, setLoadError] = useState(false);

  // Safety timeout for loading state (crucial for older Safari/iPhone)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("Loading timed out, forcing display");
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (!isPending) {
      if (session && session.user) {
        const user = session.user as any;
        setUserRole(user.role || null);

        if (user.role === "admin") {
          setLoading(false);
        } else if (user.role === "manager") {
          router.push("/manager/dashboard");
          return;
        } else {
          fetchUserProfile();
        }
      } else {
        setLoading(false);
      }
    }
  }, [session, isPending]);

  // Add state for approved count
  const [approvedCount, setApprovedCount] = useState(0);

  // In your fetchUserProfile or similar, calculate approved requests
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

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(
        `/api/driver/profile?userId=${session?.user?.id}`,
      );
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
        setVerificationStatus(profile?.verificationStatus || "not_submitted");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
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

    // Map service name to query param
    const typeMap: Record<string, string> = {
      fuel: "fuel",
      carwash: "carwash",
      "car wash": "carwash",
      cash: "cash",
      "cash loan": "cash",
    };
    router.push(`/requests?type=${typeMap[service.toLowerCase()] || service.toLowerCase()}`);
  };

  const VerificationStatusBadge = () => {
    if (verificationStatus === "approved")
      return <FuelCreditCard userId={session?.user?.id ?? null} />;

    const getStatusConfig = () => {
      switch (verificationStatus) {
        case "pending":
          return {
            icon: Hourglass,
            title: "Verification Pending",
            message:
              "Your documents are being reviewed by our admin. This usually takes 24-48 hours. You will be notified once verified.",
            color: "text-yellow-600",
            bgColor: "bg-yellow-50",
            borderColor: "border-yellow-200",
            buttonText: "Check Status",
            buttonAction: () => router.push("/verify/status"),
          };
        case "rejected":
          return {
            icon: XCircle,
            title: "Verification Failed",
            message:
              "Your documents were not approved. Please re-submit with correct information.",
            color: "text-red-600",
            bgColor: "bg-red-50",
            borderColor: "border-red-200",
            buttonText: "Re-submit",
            buttonAction: () => router.push("/verify"),
          };
        default:
          return {
            icon: AlertCircle,
            title: "Verification Required",
            message:
              "Complete verification to access fuel & car wash services.",
            color: "text-[#01312D]",
            bgColor: "bg-[#eafde7]",
            borderColor: "border-[#bff202]",
            buttonText: "Verify Now",
            buttonAction: () => router.push("/verify"),
          };
      }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
      <div
        className={`rounded-2xl p-4 border ${config.bgColor} ${config.borderColor} mb-6`}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bgColor}`}
            >
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div className="flex-1">
              <h3 className={`font-bold ${config.color}`}>{config.title}</h3>
              <p className="text-xs text-gray-600 mt-1">{config.message}</p>
            </div>
          </div>

          <button
            onClick={config.buttonAction}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${verificationStatus === "pending"
              ? "bg-yellow-600 text-white"
              : verificationStatus === "rejected"
                ? "bg-red-600 text-white"
                : "bg-[#01312D] text-white"
              }`}
          >
            {config.buttonText} →
          </button>
        </div>
      </div>
    );
  };

  const DocumentsSubmittedBadge = () => {
    if (verificationStatus !== "pending") return null;

    const hasDocuments =
      userProfile?.drivingLicenseUrl &&
      userProfile?.carRegistrationUrl &&
      userProfile?.profilePhotoUrl;

    if (!hasDocuments) return null;

    return (
      <div className="bg-green-50 rounded-xl p-4 border border-green-200 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-green-800">Documents Submitted</p>
            <p className="text-xs text-green-700">
              Your documents have been received. Our admin is reviewing them.
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#eafde7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3A7717] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#01312D]">Loading...</p>
        </div>
      </div>
    );
  }

  const isLoggedIn = !!session;
  const isAdmin = userRole === "admin";
  const showSkeleton = loading && isLoggedIn;

  return (
    <div className="min-h-screen bg-[#eafde7] relative overflow-x-clip">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#bff202]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#3A7717]/5 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#72bf00]/5 rounded-full blur-3xl"></div>

      {/* Main Content */}
      <main className="relative z-10 px-5 pt-6 pb-24 max-w-3xl mx-auto w-full">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-10 h-10 bg-[#01312D] rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-[#bff202]" />
              </div>
              <div>
                <h1 className="text-[#01312D] font-bold text-xl">Kapuka</h1>
                <p className="text-[#72bf00] text-xs font-semibold">Tradings</p>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {isLoggedIn && (
                <div
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${isAdmin
                    ? "bg-[#bff202] text-[#01312D]"
                    : "bg-[#bff202] text-[#01312D]"
                    }`}
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
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#eafde7] text-[#01312D] border-2 border-[#01312D]/10 hover:border-[#01312D]/30 active:scale-95 transition-all duration-200 shadow-sm active:shadow-inner whitespace-nowrap touch-manipulation"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <LogOut className="w-4 h-4 text-[#3A7717]" />
                  Logout
                </button>
              )}
            </div>
          </div>

          {/* Welcome Messages */}
          {isLoggedIn && !isAdmin && (
            <div className="mt-4 bg-white/80 rounded-2xl p-4 shadow-sm border border-[#bff202]/20 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-[#01312D] flex items-center gap-1">
                    Welcome back,{" "}
                    {showSkeleton ? (
                      <Skeleton className="h-6 w-24 inline-block" />
                    ) : (
                      <span className="font-bold text-lg">
                        {session?.user?.name?.split(" ")[0] || "Driver"}!
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#3A7717] font-medium mt-0.5 opacity-80">
                    Manage your services & track earnings
                  </p>
                </div>
                {showSkeleton ? (
                  <div className="bg-[#bff202]/20 px-3 py-2 rounded-xl flex flex-col items-center justify-center border border-[#bff202]/30 min-w-[70px]">
                    <Skeleton className="h-5 w-16" />
                  </div>
                ) : userProfile?.rating !== undefined ? (
                  <div className="bg-[#bff202]/20 px-3 py-2 rounded-xl flex flex-col items-center justify-center border border-[#bff202]/30 min-w-[70px]">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Star className="w-4 h-4 text-[#3A7717] fill-[#3A7717]" />
                      <span className="font-black text-[#01312D] text-lg">
                        {userProfile.rating ? userProfile.rating.toFixed(1) : "5.0"}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#3A7717] uppercase tracking-tighter">
                      Reliability
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {isLoggedIn && isAdmin && (
            <div className="mt-4 bg-linear-to-r from-[#01312D] to-[#3A7717] rounded-2xl p-4 text-white">
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

        {/* Hero Card — matches mobile app HomeScreen */}
        <div className="relative overflow-hidden rounded-3xl p-6 mb-6 bg-linear-to-br from-[#01312D] to-[#3A7717] shadow-xl">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-white/95 rounded-full px-3 py-1.5 mb-4">
              <Rocket className="w-3.5 h-3.5 text-[#01312D]" />
              <span className="text-xs font-bold text-[#01312D]">
                {isLoggedIn ? "Ready to" : "Join Us"}
              </span>
            </div>

            <h1 className="text-[28px] leading-9 font-extrabold text-white mb-3">
              Get Fuel
              <br />
              <span className="text-[#bff202] text-[32px]">
                Car Wash Services
              </span>
            </h1>

            <p className="text-xs text-white/90 mb-6">
              with{" "}
              <span className="text-[#bff202] font-medium tracking-widest text-sm">
                Kapuka Tradings
              </span>
            </p>

            <button
              type="button"
              onClick={handleGetStarted}
              className="bg-white text-[#01312D] px-6 py-3 rounded-full text-xs font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              {isLoggedIn
                ? "Make a request →"
                : "Refuel, Work And Pay Later →"}
            </button>
          </div>
          <Flame className="absolute -right-5 -bottom-5 w-32 h-32 text-[#bff202] opacity-15 pointer-events-none" />
        </div>

        {/* Feature Pills */}
        <div className="flex items-center justify-center gap-3 text-xs text-[#3A7717] mb-10">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-[#3A7717] rounded-full"></span>
            24/7 Support
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-[#3A7717] rounded-full"></span>
            No Hidden Fees
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-[#3A7717] rounded-full"></span>
            Instant Processing
          </span>
        </div>

        {/* Documents Submitted Badge */}
        <DocumentsSubmittedBadge />

        {/* VERIFICATION STATUS BADGE */}
        {isLoggedIn && !isAdmin && (showSkeleton ? (
          <div className="rounded-2xl p-4 border border-[#bff202]/20 mb-6">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-9 w-28 rounded-lg shrink-0" />
            </div>
          </div>
        ) : (
          <VerificationStatusBadge />
        ))}

        {/* Available Services Section */}
        {(!isLoggedIn || (isLoggedIn && !isAdmin)) && (
          <>
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#01312D]">
                    Available Services
                  </h2>
                  <p className="text-xs text-[#3A7717]">
                    {isLoggedIn && verificationStatus !== "approved"
                      ? "Complete verification to access services"
                      : "Quick & reliable delivery"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Fuel Service */}
                <button
                  onClick={() => handleServiceRequest("fuel")}
                  disabled={isLoggedIn && verificationStatus !== "approved"}
                  className={`bg-white rounded-2xl p-3 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left border border-[#bff202]/20 ${isLoggedIn && verificationStatus !== "approved"
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                    }`}
                >
                  <div className="bg-linear-to-r from-[#3A7717] to-[#72bf00] w-10 h-10 rounded-xl flex items-center justify-center mb-2">
                    <Fuel className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-[#01312D] text-sm">Fuel</h3>
                  <p className="text-gray-500 text-[10px] mt-0.5">Petrol • Diesel</p>
                  <div className="flex items-center gap-0.5 mt-1 text-[#72bf00] text-[10px] font-semibold">
                    <span>Request</span>
                    <ChevronRight className="w-2.5 h-2.5" />
                  </div>
                </button>

                {/* Car Wash Service */}
                <button
                  onClick={() => handleServiceRequest("carwash")}
                  disabled={isLoggedIn && verificationStatus !== "approved"}
                  className={`bg-white rounded-2xl p-3 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left border border-[#bff202]/20 ${isLoggedIn && verificationStatus !== "approved"
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                    }`}
                >
                  <div className="bg-linear-to-r from-[#01312D] to-[#3A7717] w-10 h-10 rounded-xl flex items-center justify-center mb-2">
                    <Car className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-[#01312D] text-sm">Car Wash</h3>
                  <p className="text-gray-500 text-[10px] mt-0.5">Premium</p>
                  <div className="flex items-center gap-0.5 mt-1 text-[#72bf00] text-[10px] font-semibold">
                    <span>Request</span>
                    <ChevronRight className="w-2.5 h-2.5" />
                  </div>
                </button>

                {/* Cash Loan Service */}
                <button
                  onClick={() => handleServiceRequest("cash")}
                  disabled={isLoggedIn && verificationStatus !== "approved"}
                  className={`bg-white rounded-2xl p-3 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left border border-[#bff202]/20 ${isLoggedIn && verificationStatus !== "approved"
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                    }`}
                >
                  <div className="bg-linear-to-r from-[#72bf00] to-[#bff202] w-10 h-10 rounded-xl flex items-center justify-center mb-2">
                    <DollarSign className="w-5 h-5 text-[#01312D]" />
                  </div>
                  <h3 className="font-bold text-[#01312D] text-sm">Cash Loan</h3>
                  <p className="text-gray-500 text-[10px] mt-0.5">26% · 14 days</p>
                  <div className="flex items-center gap-0.5 mt-1 text-[#72bf00] text-[10px] font-semibold">
                    <span>Request</span>
                    <ChevronRight className="w-2.5 h-2.5" />
                  </div>
                </button>
              </div>
            </div>


          </>
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
              <div className="mt-6 bg-linear-to-r from-[#bff202] to-[#72bf00] rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md shrink-0">
                    <Truck className="w-6 h-6 text-[#01312D]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#01312D] font-bold text-sm">
                      New to Kapuka?
                    </p>
                    <p className="text-[#01312D]/80 text-xs">
                      Sign up now & continue with your requests!
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
      <BottomNavigation approvedCount={approvedCount} isAdmin={isAdmin} />
    </div>
  );
}
