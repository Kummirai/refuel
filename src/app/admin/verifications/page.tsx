// src/app/admin/verifications/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight,
  User,
  Car,
  FileText,
  Camera,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";

export default function VerificationsPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<
    "pending" | "approved" | "rejected"
  >("pending");
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [verifications, setVerifications] = useState<any[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const response = await fetch("/api/admin/drivers");
      if (response.ok) {
        const data = await response.json();

        // Filter drivers by verification status
        const pendingDrivers = data.drivers.filter(
          (d: any) => d.verificationStatus === "pending",
        );
        const approvedDrivers = data.drivers.filter(
          (d: any) => d.verificationStatus === "approved",
        );
        const rejectedDrivers = data.drivers.filter(
          (d: any) => d.verificationStatus === "rejected",
        );

        setVerifications(data.drivers);
        setStats({
          pending: pendingDrivers.length,
          approved: approvedDrivers.length,
          rejected: rejectedDrivers.length,
          total: data.drivers.length,
        });
      }
    } catch (error) {
      console.error("Error fetching verifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVerifications();
  };

  const handleApprove = async (driver: any) => {
    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId: driver.id,
          action: "approve",
        }),
      });
      if (response.ok) {
        alert(`✅ Approved ${driver.name}'s verification`);
        fetchVerifications();
        setShowModal(false);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to approve verification");
      }
    } catch (error) {
      console.error("Error approving verification:", error);
      alert("Failed to approve verification");
    }
  };

  const handleReject = async (driver: any) => {
    const reason = prompt("Please enter rejection reason:");
    if (reason) {
      try {
        const response = await fetch("/api/admin/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verificationId: driver.id,
            action: "reject",
            reason,
          }),
        });
        if (response.ok) {
          alert(`❌ Rejected ${driver.name}'s verification`);
          fetchVerifications();
          setShowModal(false);
        } else {
          const error = await response.json();
          alert(error.error || "Failed to reject verification");
        }
      } catch (error) {
        console.error("Error rejecting verification:", error);
        alert("Failed to reject verification");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" /> Verified
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
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">
            Not Started
          </span>
        );
    }
  };

  const ViewDetailsModal = ({
    driver,
    onClose,
  }: {
    driver: any;
    onClose: () => void;
  }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#bff202]/20 p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#eafde7] rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-[#01312D]">
                {driver.name?.charAt(0) || "U"}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#01312D]">
                Verification Details
              </h2>
              <p className="text-sm text-gray-500">{driver.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#eafde7] rounded-lg"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Personal Information */}
          <div className="bg-[#eafde7] rounded-xl p-4">
            <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-[#3A7717]" />
              Personal Information
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-500">Full Name:</span> {driver.name}
              </p>
              <p>
                <span className="text-gray-500">Email:</span> {driver.email}
              </p>
              <p>
                <span className="text-gray-500">Phone:</span> {driver.phone}
              </p>
              <p>
                <span className="text-gray-500">Address:</span>{" "}
                {driver.address || "Not provided"}
              </p>
              <p>
                <span className="text-gray-500">Submitted:</span>{" "}
                {new Date(
                  driver.submittedDate || driver.joinedDate,
                ).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="bg-[#eafde7] rounded-xl p-4">
            <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
              <Car className="w-4 h-4 text-[#3A7717]" />
              Vehicle Information
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p>
                <span className="text-gray-500">Registration:</span>{" "}
                {driver.carRegistration || "Not provided"}
              </p>
              <p>
                <span className="text-gray-500">Model:</span>{" "}
                {driver.carModel || "Not provided"}
              </p>
              <p>
                <span className="text-gray-500">Year:</span>{" "}
                {driver.carYear || "Not provided"}
              </p>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-[#eafde7] rounded-xl p-4">
            <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#3A7717]" />
              Uploaded Documents
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                <span className="text-sm">Driver's License</span>
                <a href="#" className="text-[#72bf00] text-sm font-semibold">
                  View
                </a>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                <span className="text-sm">RC Document</span>
                <a href="#" className="text-[#72bf00] text-sm font-semibold">
                  View
                </a>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                <span className="text-sm">Profile Photo</span>
                <a href="#" className="text-[#72bf00] text-sm font-semibold">
                  View
                </a>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-[#eafde7] rounded-xl p-4">
            <h3 className="font-semibold text-[#01312D] mb-3">Statistics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#01312D]">
                  {driver.totalRequests || 0}
                </p>
                <p className="text-xs text-gray-500">Total Requests</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#01312D]">
                  ₹{driver.totalSpent?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500">Total Spent</p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[#bff202]/20 p-5 flex gap-3">
          {driver.verificationStatus === "pending" && (
            <>
              <button
                onClick={() => handleApprove(driver)}
                className="flex-1 bg-[#3A7717] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => handleReject(driver)}
                className="flex-1 bg-red-500 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </>
          )}
          {driver.verificationStatus !== "pending" && (
            <button
              onClick={onClose}
              className="w-full bg-gray-500 text-white py-2 rounded-xl font-semibold"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const filteredVerifications = verifications.filter((v) => {
    const matchesTab = v.verificationStatus === selectedTab;
    const matchesSearch =
      v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.carRegistration?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#3A7717] animate-spin mx-auto mb-4" />
          <p className="text-[#01312D]">Loading verifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#01312D]">
            Driver Verifications
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Review and verify driver applications
          </p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-xl font-bold text-[#01312D]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Approved</p>
          <p className="text-xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Rejected</p>
          <p className="text-xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Search */}
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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#bff202]/20">
        {["pending", "approved", "rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab as any)}
            className={`px-4 py-2 font-semibold capitalize transition-all ${
              selectedTab === tab
                ? "text-[#3A7717] border-b-2 border-[#3A7717]"
                : "text-gray-500"
            }`}
          >
            {tab}
            {tab === "pending" && stats.pending > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {stats.pending}
              </span>
            )}
            {tab === "approved" && stats.approved > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">
                {stats.approved}
              </span>
            )}
            {tab === "rejected" && stats.rejected > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {stats.rejected}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Verifications List */}
      <div className="space-y-3">
        {filteredVerifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-[#bff202]/20">
            <div className="w-20 h-20 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500">
              No {selectedTab} verifications found
            </p>
          </div>
        ) : (
          filteredVerifications.map((driver) => (
            <div
              key={driver.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#eafde7] rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-[#3A7717]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#01312D]">
                      {driver.name}
                    </p>
                    <p className="text-xs text-gray-500">{driver.email}</p>
                    <p className="text-xs text-gray-500">
                      {driver.carRegistration}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedDriver(driver);
                      setShowModal(true);
                    }}
                    className="px-3 py-1.5 bg-[#eafde7] text-[#01312D] rounded-lg text-sm font-semibold flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  {selectedTab === "pending" && (
                    <>
                      <button
                        onClick={() => handleApprove(driver)}
                        className="px-3 py-1.5 bg-[#3A7717] text-white rounded-lg text-sm font-semibold flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(driver)}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-semibold flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && selectedDriver && (
        <ViewDetailsModal
          driver={selectedDriver}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
