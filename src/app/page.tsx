// src/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { authClient } from "@/lib/auth-client";
import { fetcher } from "@/lib/fetch";
import BottomNavigation from "@/components/BottomNavigation";
import DepositHero from "@/components/DepositHero";
import {
  Fuel,
  DollarSign,
  Car,
  Star,
  Shield,
  ShieldCheck,
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
  Flame,
  ArrowRight,
  Download,
  Smartphone,
  Gift,
  Tag,
  CalendarDays,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatMoney } from "@/lib/money";
import { useSessionPending } from "@/lib/hooks/useSessionPending";
import { ANDROID_APK_URL } from "@/lib/app-download";
import {
  PROMOTIONAL_FUEL_FEE_RATE,
  STANDARD_FUEL_FEE_RATE,
  isPromotionalRateActive,
  type DriverDepositSummary,
} from "@/lib/deposit-ui";

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
  const sessionPending = useSessionPending(isPending);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "approved" | "pending" | "rejected" | "not_submitted"
  >("not_submitted");
  const [loadError, setLoadError] = useState(false);

  const userId = session?.user?.id;
  const { data: deposit, isLoading: depositLoading } =
    useSWR<DriverDepositSummary>(
      userId && userRole !== "admin"
        ? `/api/driver/deposit?userId=${userId}`
        : null,
      fetcher,
      { refreshInterval: 60_000, dedupingInterval: 30_000 },
    );

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
    if (!sessionPending) {
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
  }, [session, sessionPending]);

  // Add state for approved count
  const [approvedCount, setApprovedCount] = useState(0);

  // Cash loan rate from admin settings (fallback matches requests page)
  const [cashRate, setCashRate] = useState(26);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const rate = Number(data?.services?.cashInterestRate);
        if (!cancelled && rate > 0) setCashRate(rate);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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

  if (sessionPending) {
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

        {/* Promotional refueling rate banner */}
        {!isAdmin && isPromotionalRateActive() && (
          <div className="relative overflow-hidden rounded-3xl mb-5 bg-white border border-[#fecaca] shadow-md shadow-red-600/10">
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, #dc2626 0 2px, transparent 2px 16px)",
              }}
            />
            <Gift className="absolute -right-4 -bottom-8 w-32 h-32 text-[#dc2626] opacity-[0.07] pointer-events-none" />
            <div className="relative z-10 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#dc2626] px-2.5 py-1 text-[9px] font-extrabold tracking-wider text-white">
                  <Tag className="w-3 h-3" />
                  LIMITED-TIME RATE
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">
                  <CalendarDays className="w-3 h-3" />
                  1 Nov – 30 Jan
                </span>
              </div>

              <div className="mt-2.5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-600/80">
                    New service fee
                  </p>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black leading-none tracking-tight text-[#dc2626]">
                      {PROMOTIONAL_FUEL_FEE_RATE}%
                    </span>
                    <span className="mb-0.5 text-xl font-black leading-none text-gray-400 line-through">
                      {STANDARD_FUEL_FEE_RATE}%
                    </span>
                  </div>
                </div>
                <div className="-rotate-6 rounded-xl bg-[#bff202] px-3 py-1.5 text-center text-[#01312D]">
                  <p className="text-[8px] font-extrabold uppercase tracking-wide">
                    You save
                  </p>
                  <p className="text-lg font-black leading-tight">
                    {STANDARD_FUEL_FEE_RATE - PROMOTIONAL_FUEL_FEE_RATE}%
                  </p>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-dashed border-red-200 pt-2">
                <p className="text-[11px] font-semibold text-gray-600">
                  On every fuel request
                </p>
                <button
                  type="button"
                  onClick={() =>
                    router.push(isLoggedIn ? "/requests" : "/auth/sign-in")
                  }
                  className="inline-flex items-center gap-1 rounded-full bg-[#dc2626] px-3.5 py-1 text-[10px] font-extrabold text-white transition-transform active:scale-95"
                >
                  Fuel now
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hero — deposit summary for drivers, marketing for guests/admin */}
        {isLoggedIn && !isAdmin ? (
          <DepositHero
            deposit={deposit}
            loading={depositLoading}
            onPress={() => router.push("/deposit")}
          />
        ) : (
          <div className="relative overflow-hidden rounded-3xl mb-5 bg-linear-to-br from-[#01312D] to-[#3A7717] shadow-xl sm:flex sm:items-stretch">
            <div className="relative h-44 sm:order-2 sm:h-auto sm:w-[46%] sm:shrink-0">
              <img
                src="/images/hero-refuel.jpg"
                alt="A car being refueled at a station"
                className="w-full h-full object-cover object-[58%_42%] sm:absolute sm:inset-0 sm:object-center"
              />
              <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-[#01312D] to-transparent pointer-events-none sm:inset-y-0 sm:left-0 sm:right-auto sm:h-full sm:w-14 sm:bg-linear-to-r" />
            </div>

            <div className="relative z-10 p-6 pt-5 sm:order-1 sm:flex-1 sm:py-8">
              <h1 className="text-[21px] leading-6 font-extrabold text-white tracking-tight">
                {isLoggedIn ? "Manage your" : "Fuel today."}
              </h1>
              <p className="text-[34px] leading-9 font-extrabold text-[#bff202] tracking-tight">
                {isLoggedIn ? "drivers." : "Work n Pay Later"}
              </p>

              <p className="text-xs text-white/70 leading-relaxed mt-4 max-w-[80%] sm:max-w-none">
                {isLoggedIn
                  ? "Approve driver profiles, deposits and requests."
                  : "Fuel, car wash and cash loans on one weekly plan."}
              </p>

              <button
                type="button"
                onClick={handleGetStarted}
                className="mt-6 inline-flex items-center gap-2 bg-[#bff202] text-[#01312D] px-6 py-3 rounded-full text-xs font-extrabold shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                {isLoggedIn ? "Open admin panel" : "Get Started"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Benefits strip / request shortcut */}
        {isLoggedIn ? (
          <button
            type="button"
            onClick={() => router.push("/requests")}
            className="w-full mb-8 rounded-3xl bg-linear-to-r from-[#01312D] to-[#3A7717] px-6 py-4 flex items-center justify-center gap-2 shadow-lg shadow-[#01312D]/20 active:scale-[0.99] transition-all"
          >
            <Zap className="w-4 h-4 text-[#bff202]" />
            <span className="text-base font-bold text-white">
              Make a request
            </span>
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        ) : (
          <div className="mb-8 rounded-2xl bg-linear-to-r from-[#bff202] to-[#72bf00] px-2 py-3 flex items-stretch shadow-lg shadow-[#01312D]/10">
            {[
              { icon: Headphones, label: "24/7 Support" },
              { icon: ShieldCheck, label: "No Hidden Fees" },
              { icon: Zap, label: "Instant Processing" },
            ].map((feature, index) => (
              <div
                key={feature.label}
                className={`flex-1 flex items-center justify-center gap-1.5 px-1 ${
                  index > 0 ? "border-l border-[#01312D]/15" : ""
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-[#01312D] flex items-center justify-center shrink-0">
                  <feature.icon className="w-3 h-3 text-[#bff202]" />
                </span>
                <span className="text-[9px] font-extrabold text-[#01312D] leading-tight">
                  {feature.label}
                </span>
              </div>
            ))}
          </div>
        )}

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
          <div className="mb-10">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-[#01312D]">
                Available Services
              </h2>
              <p className="text-xs text-[#3A7717]">
                {isLoggedIn && verificationStatus !== "approved"
                  ? "Complete verification to access services"
                  : "Quick & reliable delivery"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleServiceRequest("fuel")}
              disabled={isLoggedIn && verificationStatus !== "approved"}
              className={`relative w-full overflow-hidden rounded-2xl bg-linear-to-br from-[#01312D] to-[#3A7717] p-4 text-left shadow-lg hover:shadow-xl transition-all active:scale-[0.99] ${
                isLoggedIn && verificationStatus !== "approved"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              <div className="absolute -right-6 -top-10 w-32 h-32 rounded-full bg-[#bff202]/10 pointer-events-none" />
              <div className="relative flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#bff202] flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-[#01312D]" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-extrabold text-white">Fuel</p>
                  <p className="text-[11px] text-white/70">
                    Petrol · Diesel · On credit
                  </p>
                </div>
                {isPromotionalRateActive() && (
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[9px] font-bold text-[#bff202] whitespace-nowrap">
                    {PROMOTIONAL_FUEL_FEE_RATE}% fee
                  </span>
                )}
              </div>
              <div className="relative flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                <span className="text-[11px] font-bold text-white">
                  Request fuel
                </span>
                <span className="w-6 h-6 rounded-full bg-[#bff202] flex items-center justify-center">
                  <ArrowRight className="w-3.5 h-3.5 text-[#01312D]" />
                </span>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <button
                type="button"
                onClick={() => handleServiceRequest("carwash")}
                disabled={isLoggedIn && verificationStatus !== "approved"}
                className={`bg-linear-to-br from-[#72bf00] to-[#3A7717] rounded-2xl p-4 text-left shadow-md hover:shadow-xl transition-all active:scale-[0.99] ${
                  isLoggedIn && verificationStatus !== "approved"
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-extrabold text-white mt-3">
                  Car Wash
                </p>
                <p className="text-[10px] text-white/80">Premium cleaning</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] font-bold text-[#bff202]">
                    Request wash
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#bff202]" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleServiceRequest("cash")}
                disabled={isLoggedIn && verificationStatus !== "approved"}
                className={`bg-linear-to-br from-[#bff202] to-[#72bf00] rounded-2xl p-4 text-left shadow-md hover:shadow-xl transition-all active:scale-[0.99] ${
                  isLoggedIn && verificationStatus !== "approved"
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#01312D]/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-[#01312D]" />
                </div>
                <p className="text-sm font-extrabold text-[#01312D] mt-3">
                  Cash Loan
                </p>
                <p className="text-[10px] text-[#01312D]/70">
                  {cashRate}% · 14 days
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] font-bold text-[#01312D]">
                    Apply now
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#01312D]" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* APK download banner */}
        {!isAdmin && (
          <div className="relative overflow-hidden rounded-3xl bg-black p-5 mb-10 shadow-xl">
            <div className="absolute -right-10 -top-14 w-40 h-40 rounded-full bg-[#bff202]/10 pointer-events-none" />
            <div className="relative z-10 flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#bff202] flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6 text-[#01312D]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-base font-extrabold text-white">
                    Get Kapuka on Android
                  </p>
                  <span className="rounded-full bg-[#bff202] px-2 py-0.5 text-[9px] font-extrabold text-[#01312D]">
                    APK
                  </span>
                </div>
                <p className="text-[11px] text-white/80 leading-relaxed mt-1">
                  Download the app to request fuel, track your deposit and get
                  updates on the go.
                </p>
                <div className="flex items-center gap-3 mt-4 flex-wrap">
                  <a
                    href={ANDROID_APK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-2 rounded-full bg-[#bff202] px-5 py-2.5 text-xs font-extrabold text-[#01312D] shadow-lg active:scale-95 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download APK
                  </a>
                  <span className="text-[10px] text-white/70">
                    Latest release · GitHub
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Section - Hide for admin */}
        {!isAdmin && (
          <>
            <div className="mb-10">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-[#01312D]">
                  Why Choose Us?
                </h2>
                <p className="text-xs text-[#3A7717]">
                  Fast, secure & reliable service
                </p>
              </div>

              <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#01312D] to-[#3A7717] p-4 shadow-xl">
                <div className="absolute -right-10 -bottom-16 w-44 h-44 rounded-full bg-[#bff202]/10 pointer-events-none" />
                <div className="relative z-10">
                  {[
                    {
                      icon: Zap,
                      title: "Fast Delivery",
                      desc: "Fuel at your pump, without the queue.",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Secure",
                      desc: "Verified accounts and protected payments.",
                    },
                    {
                      icon: Headphones,
                      title: "24/7 Support",
                      desc: "We're here whenever you're on the road.",
                    },
                  ].map((feature, index) => (
                    <div
                      key={feature.title}
                      className={`flex items-center gap-3 py-3.5 ${
                        index > 0 ? "border-t border-white/10" : ""
                      }`}
                    >
                      <span className="w-9 h-9 rounded-xl bg-[#bff202] flex items-center justify-center shrink-0">
                        <feature.icon className="w-4 h-4 text-[#01312D]" />
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">
                          {feature.title}
                        </p>
                        <p className="text-[10px] text-white/60 mt-0.5">
                          {feature.desc}
                        </p>
                      </div>
                      <ShieldCheck className="w-4 h-4 text-[#bff202]" />
                    </div>
                  ))}
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
