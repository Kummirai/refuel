// src/app/requests/history/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Fuel,
  Smartphone,
  DollarSign,
  Car,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Download,
} from "lucide-react";

type RequestStatus = "pending" | "approved" | "completed" | "rejected";

interface Request {
  id: string;
  type: "fuel" | "airtime" | "cash" | "carwash";
  amount: number;
  status: RequestStatus;
  date: string;
  otp?: string;
  driverName: string;
  carNumber: string;
}

export default function RequestHistoryPage() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<"all" | RequestStatus>(
    "all",
  );

  // Sample data - will be replaced with real data from Supabase
  const requests: Request[] = [
    {
      id: "REQ1001",
      type: "fuel",
      amount: 2500,
      status: "completed",
      date: "2024-01-15T10:30:00",
      otp: "123456",
      driverName: "John Doe",
      carNumber: "KA01AB1234",
    },
    {
      id: "REQ1002",
      type: "airtime",
      amount: 500,
      status: "approved",
      date: "2024-01-15T14:20:00",
      otp: "789012",
      driverName: "John Doe",
      carNumber: "KA01AB1234",
    },
    {
      id: "REQ1003",
      type: "cash",
      amount: 5000,
      status: "pending",
      date: "2024-01-16T09:15:00",
      driverName: "John Doe",
      carNumber: "KA01AB1234",
    },
    {
      id: "REQ1004",
      type: "carwash",
      amount: 800,
      status: "rejected",
      date: "2024-01-14T16:45:00",
      driverName: "John Doe",
      carNumber: "KA01AB1234",
    },
  ];

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-[#3A7717]" />;
      case "approved":
        return <CheckCircle className="w-4 h-4 text-[#72bf00]" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (status: RequestStatus) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "approved":
        return "Approved";
      case "pending":
        return "Pending";
      case "rejected":
        return "Rejected";
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case "completed":
        return "text-[#3A7717] bg-[#3A7717]/10";
      case "approved":
        return "text-[#72bf00] bg-[#72bf00]/10";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "rejected":
        return "text-red-600 bg-red-50";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "fuel":
        return Fuel;
      case "airtime":
        return Smartphone;
      case "cash":
        return DollarSign;
      case "carwash":
        return Car;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "fuel":
        return "text-[#3A7717] bg-[#eafde7]";
      case "airtime":
        return "text-[#01312D] bg-[#eafde7]";
      case "cash":
        return "text-[#72bf00] bg-[#eafde7]";
      case "carwash":
        return "text-[#01312D] bg-[#eafde7]";
    }
  };

  const filteredRequests =
    selectedFilter === "all"
      ? requests
      : requests.filter((r) => r.status === selectedFilter);

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    completed: requests.filter((r) => r.status === "completed").length,
    totalSpent: requests.reduce((sum, r) => sum + r.amount, 0),
  };

  return (
    <div className="min-h-screen bg-[#eafde7]">
      {/* Header */}
      <div className="bg-white border-b border-[#bff202]/20 sticky top-0 z-20">
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 bg-[#eafde7] rounded-full flex items-center justify-center active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5 text-[#01312D]" />
            </button>
            <h1 className="text-xl font-bold text-[#01312D]">
              Request History
            </h1>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="bg-white rounded-xl p-2 text-center shadow-sm border border-[#bff202]/20">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-lg font-bold text-[#01312D]">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl p-2 text-center shadow-sm border border-[#bff202]/20">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-lg font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>
            <div className="bg-white rounded-xl p-2 text-center shadow-sm border border-[#bff202]/20">
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-lg font-bold text-[#3A7717]">
                {stats.completed}
              </p>
            </div>
            <div className="bg-white rounded-xl p-2 text-center shadow-sm border border-[#bff202]/20">
              <p className="text-xs text-gray-500">Spent</p>
              <p className="text-lg font-bold text-[#72bf00]">
                ₹{stats.totalSpent}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 pt-4 pb-2 overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          {["all", "pending", "approved", "completed", "rejected"].map(
            (filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter as any)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  selectedFilter === filter
                    ? "bg-[#01312D] text-white shadow-md"
                    : "bg-white text-[#01312D] border border-[#bff202]/20"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Requests List */}
      <div className="px-5 pt-4 pb-24">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
              <Clock className="w-10 h-10 text-[#72bf00]" />
            </div>
            <p className="text-[#01312D] font-semibold">No requests found</p>
            <p className="text-xs text-gray-500 mt-1">
              Your request history will appear here
            </p>
            <button
              onClick={() => router.push("/requests")}
              className="mt-4 bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white px-6 py-2 rounded-lg font-semibold text-sm"
            >
              Make a Request
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => {
              const Icon = getTypeIcon(request.type);
              const typeColor = getTypeColor(request.type);
              const statusColor = getStatusColor(request.status);
              const date = new Date(request.date);

              return (
                <div
                  key={request.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeColor}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-[#01312D] capitalize">
                          {request.type}
                        </p>
                        <p className="text-xs text-gray-500">{request.id}</p>
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusColor}`}
                    >
                      {getStatusIcon(request.status)}
                      <span>{getStatusText(request.status)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-2xl font-bold text-[#01312D]">
                        ₹{request.amount}
                      </p>
                      <p className="text-xs text-gray-500">
                        {date.toLocaleDateString()} at{" "}
                        {date.toLocaleTimeString()}
                      </p>
                    </div>
                    {request.otp && request.status === "approved" && (
                      <div className="bg-[#bff202]/20 rounded-lg px-3 py-1">
                        <p className="text-xs text-[#01312D] font-semibold">
                          OTP: {request.otp}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button className="flex-1 py-2 bg-[#eafde7] rounded-lg text-[#01312D] text-sm font-semibold flex items-center justify-center gap-2">
                      <Eye className="w-4 h-4" />
                      Details
                    </button>
                    <button className="flex-1 py-2 bg-[#eafde7] rounded-lg text-[#01312D] text-sm font-semibold flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />
                      Receipt
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-[#bff202]/20 px-6 py-2 z-50 shadow-lg">
        <div className="flex justify-around items-center">
          {[
            { icon: HomeIcon, label: "Home", path: "/" },
            { icon: ClipboardIcon, label: "Requests", path: "/requests" },
            {
              icon: HistoryIcon,
              label: "History",
              active: true,
              path: "/requests/history",
            },
            { icon: UserIcon, label: "Profile", path: "/profile" },
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

// Icon Components (same as above)
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
