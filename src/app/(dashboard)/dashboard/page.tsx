// src/app/dashboard/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetch";
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
  const userId = session?.user?.id;

  const { data: requestsData, error: requestsError, isLoading: requestsLoading, isValidating: requestsValidating, mutate: mutateRequests } = useSWR(
    userId ? `/api/driver/requests?userId=${userId}` : null,
    fetcher,
    { refreshInterval: 120_000, dedupingInterval: 60_000 },
  );
  const { data: profile, isLoading: profileLoading, error: profileError } = useSWR(
    userId ? `/api/driver/profile?userId=${userId}` : null,
    fetcher,
    { refreshInterval: 60_000, dedupingInterval: 60_000 },
  );
  const { data: activeLoan, isLoading: loanLoading } = useSWR(
    userId ? `/api/driver/loans/active?userId=${userId}` : null,
    fetcher,
    { refreshInterval: 60_000, dedupingInterval: 60_000 },
  );

  const loading = (!requestsData && requestsLoading) || (!profile && profileLoading) || isPending;
  const refreshing = requestsValidating && !requestsLoading;

  const stats = useMemo(() => {
    if (!requestsData) return { totalRequests: 0, totalSpent: 0, activeLoans: 0, completedRequests: 0, pendingRequests: 0, rating: 0 };
    const total = requestsData.length;
    const totalSpent = toMoney(requestsData
      .filter((r: any) => r.status === "approved" || r.status === "sent" || r.status === "completed")
      .reduce((sum: number, r: any) => sum + (r.actualAmount || r.amount), 0));
    const pending = requestsData.filter((r: any) => r.status === "pending").length;
    const completed = requestsData.filter((r: any) => r.status === "completed").length;
    const activeLoans = requestsData.filter((r: any) => r.type === "cash" && r.status === "approved").length;
    return { totalRequests: total, totalSpent, pendingRequests: pending, completedRequests: completed, activeLoans, rating: profile?.rating || 0 };
  }, [requestsData, profile]);

  const recentRequests = useMemo(() => (requestsData || []).slice(0, 5), [requestsData]);
  const approvedCount = useMemo(() => (requestsData || []).filter((r: any) => r.status === "approved" || r.status === "sent").length, [requestsData]);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/sign-in");
    }
  }, [session, isPending, router]);

  const handleRefresh = () => {
    mutateRequests();
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
      <div className="sticky top-0 z-20">
        <div className="bg-white border-b border-[#bff202]/20 px-5 py-4 max-w-3xl mx-auto">
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

      {requestsError || profileError ? (
        <div className="px-5 pt-4 max-w-3xl mx-auto w-full">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">
              Failed to load some data.{" "}
              <button onClick={handleRefresh} className="underline font-semibold">
                Tap to retry
              </button>
            </p>
          </div>
        </div>
      ) : null}

      <div className="px-5 pt-6 max-w-3xl mx-auto w-full">
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

        {/* Cash Loan Now Available */}
        <div className="bg-linear-to-r from-[#bff202]/20 to-[#72bf00]/20 rounded-2xl p-4 mb-6 border border-[#bff202]/30">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#bff202] rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#01312D]" />
              </div>
              <div>
                <p className="font-semibold text-[#01312D]">Cash Loan Available!</p>
                <p className="text-xs text-gray-600">
                  26% interest • 14-day repayment • Collateral required
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-xs bg-white/50 px-2 py-1 rounded-full text-[#01312D]">
                New
              </span>
            </div>
          </div>
        </div>

        {/* Active Loan Banner */}
        {activeLoan ? (
          <div className="bg-gradient-to-r from-[#bff202] to-[#72bf00] rounded-2xl p-4 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-[#01312D]">Active Loan</h3>
              <span className="text-xs bg-[#01312D]/20 px-2 py-1 rounded-full text-[#01312D]">
                13% Interest
              </span>
            </div>
            <div className="space-y-2">
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
            </div>
          </div>
        ) : loanLoading ? (
          <div className="bg-gradient-to-r from-[#bff202] to-[#72bf00] rounded-2xl p-4 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-[#01312D]">Active Loan</h3>
              <span className="text-xs bg-[#01312D]/20 px-2 py-1 rounded-full text-[#01312D]">
                13% Interest
              </span>
            </div>
            <div className="space-y-2">
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
            </div>
          </div>
        ) : null}

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#01312D] mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {/* Fuel Request */}
            <button
              onClick={() => router.push("/requests?type=fuel")}
              className="bg-white rounded-2xl p-3 shadow-sm border border-[#bff202]/20 flex flex-col items-center gap-2 hover:shadow-md transition-shadow active:scale-95"
            >
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                <Fuel className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-[#01312D] text-xs">Fuel</p>
                <p className="text-[10px] text-gray-500">Petrol/Diesel</p>
              </div>
            </button>

            {/* Car Wash Request */}
            <button
              onClick={() => router.push("/requests?type=carwash")}
              className="bg-white rounded-2xl p-3 shadow-sm border border-[#bff202]/20 flex flex-col items-center gap-2 hover:shadow-md transition-shadow active:scale-95"
            >
              <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                <Car className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-[#01312D] text-xs">Car Wash</p>
                <p className="text-[10px] text-gray-500">Premium</p>
              </div>
            </button>

            {/* Cash Loan Request */}
            <button
              onClick={() => router.push("/requests?type=cash")}
              className="bg-white rounded-2xl p-3 shadow-sm border border-[#bff202]/20 flex flex-col items-center gap-2 hover:shadow-md transition-shadow active:scale-95"
            >
              <div className="w-9 h-9 bg-yellow-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-[#01312D] text-xs">Cash Loan</p>
                <p className="text-[10px] text-gray-500">Collateral</p>
              </div>
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
              {recentRequests.map((request: any) => {
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
