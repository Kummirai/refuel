"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetch";
import {
  Clock,
  CheckCircle,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ManagerDashboardPage() {
  const router = useRouter();
  const { data: stats, isLoading, mutate } = useSWR("/api/manager/stats", fetcher, {
    refreshInterval: 30_000,
    dedupingInterval: 30_000,
  });
  const { data: cycleData } = useSWR("/api/manager/cycle", fetcher, {
    refreshInterval: 60_000,
  });

  const cycle = cycleData?.cycle;
  const formatDateRange = () => {
    if (!cycle) return "This week";
    const start = new Date(cycle.startDate).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
    });
    const end = new Date(cycle.endDate).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${start} - ${end}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#01312D]">Manager Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Current cycle: {formatDateRange()}
          </p>
        </div>
        <button
          onClick={() => mutate()}
          className="flex items-center gap-2 px-4 py-2 bg-[#3A7717] text-white rounded-xl hover:bg-[#2d5e12] text-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/20">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-[#01312D]">
            {isLoading ? "..." : stats?.pending ?? 0}
          </p>
          <p className="text-sm text-gray-500">Pending Requests</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/20">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-[#01312D]">
            {isLoading ? "..." : stats?.completed ?? 0}
          </p>
          <p className="text-sm text-gray-500">Completed Requests</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/20">
        <h2 className="text-lg font-bold text-[#01312D] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => router.push("/manager/pending")}
            className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <Clock className="w-6 h-6 text-blue-600" />
            <div className="text-left">
              <p className="font-semibold text-[#01312D]">View Pending</p>
              <p className="text-sm text-gray-500">
                {isLoading ? "..." : stats?.pending ?? 0} requests to process
              </p>
            </div>
          </button>
          <button
            onClick={() => router.push("/manager/completed")}
            className="flex items-center gap-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
          >
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <p className="font-semibold text-[#01312D]">View Completed</p>
              <p className="text-sm text-gray-500">
                {isLoading ? "..." : stats?.completed ?? 0} completed requests
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Cycle Info */}
      {cycle && (
        <div className="bg-[#fef3c7] border border-[#fde68a] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-[#92400e]" />
            <h3 className="font-bold text-[#92400e]">Current Cycle</h3>
          </div>
          <p className="text-sm text-[#92400e]">
            Showing requests approved between{" "}
            <strong>{formatDateRange()}</strong>.
          </p>
          <p className="text-sm text-[#92400e] mt-1">
            When this cycle ends, the dashboard will reset for the next period.
          </p>
        </div>
      )}
    </div>
  );
}
