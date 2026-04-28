// src/app/admin/dashboard/page.tsx - Update the data fetching
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
  Search,
  Filter,
  Star,
  Phone,
  Mail,
  Car,
  Calendar,
  AlertTriangle,
  ThumbsUp,
  RefreshCw,
  Fuel,
  Smartphone,
  Copy,
  Send,
  X,
} from "lucide-react";
import Image from "next/image";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "drivers">(
    "overview",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalDrivers: 0,
    pendingVerifications: 0,
    verifiedDrivers: 0,
    rejectedVerifications: 0,
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalRevenue: 0,
    revenueGrowth: 0,
    averageRating: 0,
    activeLoans: 0,
    totalLoanAmount: 0,
  });

  const [drivers, setDrivers] = useState<any[]>([]);
  const [recentVerifications, setRecentVerifications] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch("/api/admin/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch drivers
      const driversRes = await fetch("/api/admin/drivers");
      if (driversRes.ok) {
        const driversData = await driversRes.json();
        setDrivers(driversData.drivers || []);
        setRecentVerifications(driversData.recent || []);
      }

      // Fetch requests
      const requestsRes = await fetch("/api/admin/requests");
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setRecentRequests(requestsData.recent || []);
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

  const handleApproveVerification = async (verification: any) => {
    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId: verification.id,
          action: "approve",
        }),
      });
      if (response.ok) {
        alert(`Approved ${verification.name}'s verification`);
        fetchDashboardData();
        setShowVerificationModal(false);
      }
    } catch (error) {
      console.error("Error approving verification:", error);
    }
  };

  const handleRejectVerification = async (verification: any) => {
    const reason = prompt("Please enter rejection reason:");
    if (reason) {
      try {
        const response = await fetch("/api/admin/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verificationId: verification.id,
            action: "reject",
            reason,
          }),
        });
        if (response.ok) {
          alert(`Rejected ${verification.name}'s verification`);
          fetchDashboardData();
          setShowVerificationModal(false);
        }
      } catch (error) {
        console.error("Error rejecting verification:", error);
      }
    }
  };

  const handleApproveRequest = async (request: any) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const response = await fetch("/api/admin/requests/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          otp,
        }),
      });
      if (response.ok) {
        alert(`Approved ${request.id} with OTP: ${otp}`);
        fetchDashboardData();
        setShowRequestModal(false);
      }
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  const handleRejectRequest = async (request: any) => {
    const reason = prompt("Please enter rejection reason:");
    if (reason) {
      try {
        const response = await fetch("/api/admin/requests/reject", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: request.id,
            reason,
          }),
        });
        if (response.ok) {
          alert(`Rejected ${request.id}`);
          fetchDashboardData();
          setShowRequestModal(false);
        }
      } catch (error) {
        console.error("Error rejecting request:", error);
      }
    }
  };

  // Rest of the component remains the same with the existing modal components...
  // (Keeping the existing modal components as they are)

  const StatCard = ({ title, value, icon: Icon, color, change }: any) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/20 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-[#01312D] mt-1">{value}</p>
          {change !== undefined && change !== 0 && (
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

  // Keep all the existing modal components (VerificationDetailsModal, RequestDetailsModal, DriverDetailsModal)
  // ... (they remain the same as in your current file)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3A7717] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#01312D]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.carRegistration.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#01312D]">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, Admin</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#eafde7] rounded-xl text-[#01312D] font-semibold hover:bg-[#bff202]/30 transition-all"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#bff202]/20">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 font-semibold transition-all ${
            activeTab === "overview"
              ? "text-[#3A7717] border-b-2 border-[#3A7717]"
              : "text-gray-500 hover:text-[#01312D]"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("drivers")}
          className={`px-4 py-2 font-semibold transition-all flex items-center gap-2 ${
            activeTab === "drivers"
              ? "text-[#3A7717] border-b-2 border-[#3A7717]"
              : "text-gray-500 hover:text-[#01312D]"
          }`}
        >
          <Users className="w-4 h-4" />
          All Drivers
          <span className="px-1.5 py-0.5 bg-gray-200 rounded-full text-xs">
            {drivers.length}
          </span>
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Drivers"
              value={stats.totalDrivers}
              icon={Users}
              color="bg-[#01312D]"
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
            />
          </div>

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
                </div>
              </div>
              <div className="divide-y divide-[#bff202]/10">
                {recentVerifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 text-sm">
                      No pending verifications
                    </p>
                  </div>
                ) : (
                  recentVerifications.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex items-center justify-between hover:bg-[#eafde7] transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedVerification(item);
                        setShowVerificationModal(true);
                      }}
                    >
                      <div>
                        <p className="font-semibold text-[#01312D]">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.carRegistration}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 bg-[#3A7717] text-white text-xs rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveVerification(item);
                          }}
                        >
                          Approve
                        </button>
                        <button
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectVerification(item);
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
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
                </div>
              </div>
              <div className="divide-y divide-[#bff202]/10">
                {recentRequests.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 text-sm">No pending requests</p>
                  </div>
                ) : (
                  recentRequests.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex items-center justify-between hover:bg-[#eafde7] transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedRequest(item);
                        setShowRequestModal(true);
                      }}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[#01312D] capitalize">
                            {item.type}
                          </p>
                          <span className="text-xs text-[#3A7717] font-semibold">
                            ₹{item.amount}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{item.driver}</p>
                      </div>
                      <button className="px-3 py-1 bg-[#72bf00] text-white text-xs rounded-lg">
                        View Details
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Drivers Tab */}
      {activeTab === "drivers" && (
        <>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or registration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-[#bff202]/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#eafde7] border-b border-[#bff202]/20">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-[#01312D]">
                      Driver
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-[#01312D]">
                      Vehicle
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-[#01312D]">
                      Status
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-[#01312D]">
                      Rating
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-[#01312D]">
                      Requests
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-[#01312D]">
                      Spent
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-[#01312D]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#bff202]/10">
                  {filteredDrivers.map((driver) => (
                    <tr
                      key={driver.id}
                      className="hover:bg-[#eafde7] transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedDriver(driver);
                        setShowDriverModal(true);
                      }}
                    >
                      <td className="p-4">
                        <p className="font-semibold text-[#01312D]">
                          {driver.name}
                        </p>
                        <p className="text-xs text-gray-500">{driver.email}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-[#01312D]">
                          {driver.carModel}
                        </p>
                        <p className="text-xs text-gray-500">
                          {driver.carRegistration}
                        </p>
                      </td>
                      <td className="p-4">
                        {driver.verificationStatus === "approved" && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </span>
                        )}
                        {driver.verificationStatus === "pending" && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-yellow-100 text-yellow-700">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                        {driver.verificationStatus === "rejected" && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                        {driver.verificationStatus === "not_submitted" && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">
                            Not Started
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {driver.rating > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                            <span className="font-semibold text-[#01312D]">
                              {driver.rating}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            No ratings
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-[#01312D]">
                          {driver.totalRequests}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-[#3A7717]">
                          ₹{driver.totalSpent.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <button className="px-3 py-1.5 bg-[#eafde7] text-[#01312D] rounded-lg text-sm font-semibold flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Keep the modal components here - they remain the same */}
      {/* ... VerificationDetailsModal, RequestDetailsModal, DriverDetailsModal ... */}
    </div>
  );
}
