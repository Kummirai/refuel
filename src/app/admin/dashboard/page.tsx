// src/app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  ClipboardList,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();

  const [stats, setStats] = useState({
    totalDrivers: 245,
    pendingVerifications: 12,
    verifiedDrivers: 198,
    rejectedVerifications: 35,
    totalRequests: 156,
    pendingRequests: 23,
    completedRequests: 118,
    totalRevenue: 45750,
    revenueGrowth: 15.3,
  });

  const [recentVerifications, setRecentVerifications] = useState([
    {
      id: 1,
      name: "Rajesh Kumar",
      email: "rajesh@example.com",
      date: "2024-01-20",
      status: "pending",
    },
    {
      id: 2,
      name: "Priya Singh",
      email: "priya@example.com",
      date: "2024-01-20",
      status: "pending",
    },
    {
      id: 3,
      name: "Amit Patel",
      email: "amit@example.com",
      date: "2024-01-19",
      status: "pending",
    },
    {
      id: 4,
      name: "Sneha Reddy",
      email: "sneha@example.com",
      date: "2024-01-19",
      status: "pending",
    },
  ]);

  const [recentRequests, setRecentRequests] = useState([
    {
      id: "REQ001",
      type: "Fuel",
      amount: 2500,
      driver: "Rajesh Kumar",
      date: "2024-01-20",
      status: "pending",
    },
    {
      id: "REQ002",
      type: "Cash Loan",
      amount: 10000,
      driver: "Priya Singh",
      date: "2024-01-20",
      status: "pending",
    },
    {
      id: "REQ003",
      type: "Airtime",
      amount: 500,
      driver: "Amit Patel",
      date: "2024-01-19",
      status: "pending",
    },
  ]);

  const StatCard = ({ title, value, icon: Icon, color, change }: any) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/20">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-[#01312D] mt-1">{value}</p>
          {change && (
            <div
              className={`flex items-center gap-1 mt-2 text-xs ${change > 0 ? "text-[#3A7717]" : "text-red-500"}`}
            >
              {change > 0 ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              )}
              {Math.abs(change)}% from last week
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#01312D]">
          Dashboard Overview
        </h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, Admin</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Drivers"
          value={stats.totalDrivers}
          icon={Users}
          color="bg-[#01312D]"
          change={12.5}
        />
        <StatCard
          title="Pending Verifications"
          value={stats.pendingVerifications}
          icon={Clock}
          color="bg-yellow-500"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon={ClipboardList}
          color="bg-[#72bf00]"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-[#3A7717]"
          change={stats.revenueGrowth}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Verifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#bff202]/20">
          <div className="p-5 border-b border-[#bff202]/20">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-[#01312D]">
                  Pending Verifications
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Drivers waiting for approval
                </p>
              </div>
              <button
                onClick={() => router.push("/admin/verifications")}
                className="text-[#72bf00] text-sm font-semibold flex items-center gap-1"
              >
                View All <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="divide-y divide-[#bff202]/10">
            {recentVerifications.map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between hover:bg-[#eafde7] transition-colors"
              >
                <div>
                  <p className="font-semibold text-[#01312D]">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.email}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.date}</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-[#3A7717] text-white text-xs rounded-lg">
                    Approve
                  </button>
                  <button className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Service Requests */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#bff202]/20">
          <div className="p-5 border-b border-[#bff202]/20">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-[#01312D]">
                  Pending Service Requests
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Requests awaiting approval
                </p>
              </div>
              <button
                onClick={() => router.push("/admin/service-requests")}
                className="text-[#72bf00] text-sm font-semibold flex items-center gap-1"
              >
                View All <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="divide-y divide-[#bff202]/10">
            {recentRequests.map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between hover:bg-[#eafde7] transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#01312D]">{item.type}</p>
                    <span className="text-xs text-[#3A7717] font-semibold">
                      ₹{item.amount}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{item.driver}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.date}</p>
                </div>
                <button className="px-3 py-1 bg-[#72bf00] text-white text-xs rounded-lg">
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Chart placeholder */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#bff202]/20 p-5">
        <h2 className="font-bold text-[#01312D] mb-4">Recent Activity</h2>
        <div className="h-64 flex items-center justify-center bg-[#eafde7] rounded-xl">
          <p className="text-gray-500">Activity chart will appear here</p>
        </div>
      </div>
    </div>
  );
}
