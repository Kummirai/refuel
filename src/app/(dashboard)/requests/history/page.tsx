// src/app/requests/history/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
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
  Loader2,
  RefreshCw,
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
  location?: string;
  fuelType?: string;
  phoneNumber?: string;
  interest?: number;
  totalRepayable?: number;
}

export default function RequestHistoryPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"all" | RequestStatus>(
    "all",
  );
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.push("/auth/sign-in");
      } else {
        fetchRequests();
      }
    }
  }, [session, isPending]);

  const fetchRequests = async () => {
    try {
      const response = await fetch(
        `/api/driver/requests?userId=${session?.user?.id}`,
      );
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
  };

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
    }
  };

  const filteredRequests =
    selectedFilter === "all"
      ? requests
      : requests.filter((r) => r.status === selectedFilter);

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    completed: requests.filter((r) => r.status === "completed").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    totalSpent: requests.reduce((sum, r) => sum + r.amount, 0),
  };

  const RequestDetailModal = ({
    request,
    onClose,
  }: {
    request: Request;
    onClose: () => void;
  }) => {
    const Icon = getTypeIcon(request.type);
    const date = new Date(request.date);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-[#bff202]/20 p-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeColor(request.type)}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#01312D]">
                  {getTypeLabel(request.type)}
                </h2>
                <p className="text-xs text-gray-500">{request.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#eafde7] rounded-lg"
            >
              <XCircle className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="bg-[#eafde7] rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 text-sm">Amount</span>
                <span className="text-2xl font-bold text-[#01312D]">
                  R{request.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Status</span>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(request.status)}`}
                >
                  {getStatusIcon(request.status)}
                  <span>{getStatusText(request.status)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-500">Request Date:</span>{" "}
                {date.toLocaleDateString()} at {date.toLocaleTimeString()}
              </p>
              <p>
                <span className="text-gray-500">Car Registration:</span>{" "}
                {request.carNumber}
              </p>
              {request.location && (
                <p>
                  <span className="text-gray-500">Location:</span>{" "}
                  {request.location}
                </p>
              )}
              {request.fuelType && (
                <p>
                  <span className="text-gray-500">Fuel Type:</span>{" "}
                  {request.fuelType}
                </p>
              )}
              {request.phoneNumber && (
                <p>
                  <span className="text-gray-500">Mobile Number:</span>{" "}
                  {request.phoneNumber}
                </p>
              )}
              {request.type === "cash" && request.interest && (
                <>
                  <p>
                    <span className="text-gray-500">Interest (13%):</span> R
                    {request.interest}
                  </p>
                  <p>
                    <span className="text-gray-500">Total Repayable:</span> R
                    {request.totalRepayable?.toLocaleString()}
                  </p>
                </>
              )}
              {request.otp && (
                <div className="mt-3 pt-3 border-t border-[#bff202]/20">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">OTP:</span>
                    <code className="bg-white px-3 py-1 rounded-lg font-mono text-lg font-bold text-[#01312D]">
                      {request.otp}
                    </code>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-[#bff202]/20 p-5">
            <button className="w-full bg-[#eafde7] text-[#01312D] py-2 rounded-xl font-semibold flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Download Receipt
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-[#eafde7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#3A7717] animate-spin mx-auto mb-4" />
          <p className="text-[#01312D]">Loading history...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#eafde7]">
      {/* Header */}
      <div className="bg-white border-b border-[#bff202]/20 sticky top-0 z-20">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
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
                R{stats.totalSpent.toLocaleString()}
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
                {filter !== "all" &&
                  filter === "pending" &&
                  stats.pending > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {stats.pending}
                    </span>
                  )}
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
              {selectedFilter !== "all"
                ? `No ${selectedFilter} requests in your history`
                : "Your request history will appear here"}
            </p>
            <button
              onClick={() => router.push("/requests")}
              className="mt-4 bg-linear-to-r from-[#01312D] to-[#3A7717] text-white px-6 py-2 rounded-lg font-semibold text-sm"
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
                  className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowDetailModal(true);
                  }}
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
                          {getTypeLabel(request.type)}
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
                        R{request.amount.toLocaleString()}
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
                    <button
                      className="flex-1 py-2 bg-[#eafde7] rounded-lg text-[#01312D] text-sm font-semibold flex items-center justify-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRequest(request);
                        setShowDetailModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                      Details
                    </button>
                    {request.status === "completed" && (
                      <button
                        className="flex-1 py-2 bg-[#eafde7] rounded-lg text-[#01312D] text-sm font-semibold flex items-center justify-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="w-4 h-4" />
                        Receipt
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setShowDetailModal(false)}
        />
      )}

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

// Icon Components
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
