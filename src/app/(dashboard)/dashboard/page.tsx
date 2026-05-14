// src/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import BottomNavigation from "@/components/BottomNavigation";
import {
  Car,
  Wallet,
  History,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Fuel,
  Smartphone,
  DollarSign,
  Activity,
  Calendar,
  MapPin,
  ArrowRight,
  Loader2,
  RefreshCw,
  Home,
  ClipboardList,
  UserCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatMoney, toMoney } from "@/lib/money";

export default function DriverDashboard() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalRequests: 0,
    totalSpent: 0,
    activeLoans: 0,
    completedRequests: 0,
    pendingRequests: 0,
    rating: 0,
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [activeLoan, setActiveLoan] = useState<any>(null);

  // In your component, add approved count state
  const [approvedCount, setApprovedCount] = useState(0);

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

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.push("/auth/sign-in");
      } else {
        fetchDashboardData();
      }
    }
  }, [session, isPending]);

  const fetchDashboardData = async () => {
    try {
      // Fetch driver profile
      const profileRes = await fetch(
        `/api/driver/profile?userId=${session?.user?.id}`,
      );
      let profileRating = 0;
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
        profileRating = profileData.rating || 0;
      }

      // Fetch user's service requests
      const requestsRes = await fetch(
        `/api/driver/requests?userId=${session?.user?.id}`,
      );
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setRecentRequests(requestsData.slice(0, 5) || []);

        // Calculate stats from actual request data (not from profile)
        const total = requestsData.length;
        const totalSpent = toMoney(requestsData
          .filter((r: any) => r.status === "approved" || r.status === "sent" || r.status === "completed")
          .reduce((sum: number, r: any) => sum + (r.actualAmount || r.amount), 0));
        const pending = requestsData.filter(
          (r: any) => r.status === "pending",
        ).length;
        const completed = requestsData.filter(
          (r: any) => r.status === "completed",
        ).length;
        const activeLoans = requestsData.filter(
          (r: any) => r.type === "cash" && r.status === "approved",
        ).length;

        setStats({
          totalRequests: total,
          totalSpent,
          pendingRequests: pending,
          completedRequests: completed,
          activeLoans: activeLoans,
          rating: profileRating,
        });
      }

      // Fetch active loan
      const loanRes = await fetch(
        `/api/driver/loans/active?userId=${session?.user?.id}`,
      );
      if (loanRes.ok) {
        const loanData = await loanRes.json();
        setActiveLoan(loanData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" /> Completed
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">
            <Clock className="w-3 h-3" /> Approved
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700">
            <AlertCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "fuel":
        return <Fuel className="w-4 h-4" />;
      case "airtime":
        return <Smartphone className="w-4 h-4" />;
      case "cash":
        return <DollarSign className="w-4 h-4" />;
      case "carwash":
        return <Car className="w-4 h-4" />;
      default:
        return <Car className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "fuel":
        return "bg-green-100 text-green-700";
      case "airtime":
        return "bg-blue-100 text-blue-700";
      case "cash":
        return "bg-yellow-100 text-yellow-700";
      case "carwash":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-purple-100 text-purple-700";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "fuel":
        return "Fuel";
      case "airtime":
        return "Airtime";
      case "cash":
        return "Cash Loan";
      case "carwash":
        return "Car Wash";
      default:
        return "Service";
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#eafde7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#3A7717] animate-spin mx-auto mb-4" />
          <p className="text-[#01312D]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#eafde7] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-[#bff202]/20 sticky top-0 z-20">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#01312D]">
                Driver Dashboard
              </h1>
              <p className="text-xs text-gray-500">
                Welcome back,{" "}
                {profile?.fullName || session.user?.name || "Driver"}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-[#eafde7] rounded-full active:scale-95 transition-transform"
            >
              <RefreshCw
                className={`w-5 h-5 text-[#3A7717] ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 pb-24">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-[#bff202]/20">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-[#eafde7] rounded-full flex items-center justify-center">
                <History className="w-4 h-4 text-[#3A7717]" />
              </div>
            </div>
            {(loading || refreshing) ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-xl font-bold text-[#01312D]">
                {stats.totalRequests}
              </div>
            )}
            <p className="text-xs text-gray-500">Total Requests</p>
          </div>

          <div className="bg-white rounded-2xl p-3 shadow-sm border border-[#bff202]/20">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-[#eafde7] rounded-full flex items-center justify-center">
                <Wallet className="w-4 h-4 text-[#3A7717]" />
              </div>
            </div>
            {(loading || refreshing) ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-xl font-bold text-[#01312D]">
                {formatMoney(stats.totalSpent)}
              </div>
            )}
            <p className="text-xs text-gray-500">Total Spent</p>
          </div>

          <div className="bg-white rounded-2xl p-3 shadow-sm border border-[#bff202]/20">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-[#eafde7] rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#3A7717]" />
              </div>
            </div>
            {(loading || refreshing) ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-xl font-bold text-[#01312D]">
                {stats.activeLoans}
              </div>
            )}
            <p className="text-xs text-gray-500">Active Loans</p>
          </div>

          <div className="bg-white rounded-2xl p-3 shadow-sm border border-[#bff202]/20">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-[#eafde7] rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-[#3A7717]" />
              </div>
            </div>
            {(loading || refreshing) ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-xl font-bold text-[#01312D]">
                {stats.rating || "N/A"}
              </div>
            )}
            <p className="text-xs text-gray-500">Rating</p>
          </div>
        </div>

        {/* Upcoming Services Banner */}
        <div className="bg-linear-to-r from-[#bff202]/20 to-[#72bf00]/20 rounded-2xl p-4 mb-6 border border-[#bff202]/30">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#bff202] rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#01312D]" />
              </div>
              <div>
                <p className="font-semibold text-[#01312D]">Coming Soon!</p>
                <p className="text-xs text-gray-600">
                  Cash Loans will be available soon
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-xs bg-white/50 px-2 py-1 rounded-full text-[#01312D]">
                💰 Cash Loan
              </span>
            </div>
          </div>
        </div>

        {/* Active Loan Banner */}
        {activeLoan || loading ? (
          <div className="bg-gradient-to-r from-[#bff202] to-[#72bf00] rounded-2xl p-4 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-[#01312D]">Active Loan</h3>
              <span className="text-xs bg-[#01312D]/20 px-2 py-1 rounded-full text-[#01312D]">
                13% Interest
              </span>
            </div>
            <div className="space-y-2">
              {loading ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#01312D]">Loan Amount</span>
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#01312D]">Remaining</span>
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#01312D]">Next Payment</span>
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="mt-2">
                    <Skeleton className="h-2 w-full rounded-full" />
                    <Skeleton className="h-10 w-full mt-3 rounded-xl" />
                  </div>
                </>
              ) : activeLoan ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#01312D]">Loan Amount</span>
                    <span className="font-bold text-[#01312D]">
                      {formatMoney(activeLoan.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#01312D]">Remaining</span>
                    <span className="font-bold text-[#01312D]">
                      {formatMoney(activeLoan.remaining)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#01312D]">Next Payment</span>
                    <span className="font-semibold text-[#01312D]">
                      {formatMoney(activeLoan.dailyPayment)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="bg-[#01312D]/20 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#01312D] h-2 rounded-full"
                        style={{
                          width: `${((activeLoan.amount - activeLoan.remaining) / activeLoan.amount) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <button className="w-full mt-3 bg-[#01312D] text-white py-2 rounded-xl font-semibold text-sm">
                      Make Payment
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Quick Actions - Only Fuel and Car Wash */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#01312D] mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Fuel Request */}
            <button
              onClick={() => router.push("/requests?type=fuel")}
              className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20 flex items-center gap-3 hover:shadow-md transition-shadow active:scale-95"
            >
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Fuel className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-[#01312D]">Request Fuel</p>
                <p className="text-xs text-gray-500">Petrol / Diesel</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </button>

            {/* Car Wash Request */}
            <button
              onClick={() => router.push("/requests?type=carwash")}
              className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20 flex items-center gap-3 hover:shadow-md transition-shadow active:scale-95"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Car className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-[#01312D]">Car Wash</p>
                <p className="text-xs text-gray-500">Premium cleaning</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Recent Requests */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-[#01312D]">
              Recent Requests
            </h2>
            <button
              onClick={() => router.push("/requests/history")}
              className="text-[#72bf00] text-xs font-semibold"
            >
              View All →
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20 rounded-lg" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-[#bff202]/20">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No requests yet</p>
              <button
                onClick={() => router.push("/requests")}
                className="mt-3 text-[#72bf00] text-sm font-semibold"
              >
                Make your first request →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((request) => {
                const Icon = getTypeIcon(request.type);
                const typeColor = getTypeColor(request.type);
                return (
                  <div
                    key={request.id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99]"
                    onClick={() => router.push(`/requests/history`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeColor}`}
                        >
                          {Icon}
                        </div>
                        <div>
                          <p className="font-semibold text-[#01312D]">
                            {getTypeLabel(request.type)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(request.requestDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xl font-bold text-[#01312D]">
                        {formatMoney(request.amount)}
                      </p>
                      {request.otp && request.status === "approved" && (
                        <div className="bg-[#bff202]/20 rounded-lg px-3 py-1">
                          <p className="text-xs text-[#01312D] font-semibold">
                            OTP: {request.otp}
                          </p>
                        </div>
                      )}
                      {request.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {request.location}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tip Section */}
        <div className="mt-6 bg-gradient-to-r from-[#01312D] to-[#3A7717] rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Quick Tip</p>
              <p className="text-xs opacity-90">
                Complete your profile for better service recommendations
              </p>
            </div>
            <button
              onClick={() => router.push("/profile")}
              className="bg-white text-[#01312D] px-4 py-2 rounded-lg text-sm font-semibold active:scale-95 transition-transform"
            >
              Update Profile
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
     <BottomNavigation approvedCount={approvedCount} isAdmin={false} />
    </div>
  );
}
