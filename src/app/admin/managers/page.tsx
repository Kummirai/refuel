"use client";

import { useState, useEffect } from "react";
import { formatMoney } from "@/lib/money";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Users,
  Shield,
  UserPlus,
  Search,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Star,
  UserMinus,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export default function AdminManagersPage() {
  const [managers, setManagers] = useState<User[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"managers" | "add">("managers");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("success");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [managersRes, driversRes] = await Promise.all([
        fetch("/api/admin/managers"),
        fetch("/api/admin/drivers"),
      ]);
      if (managersRes.ok) {
        const data = await managersRes.json();
        setManagers(data);
      }
      if (driversRes.ok) {
        const data = await driversRes.json();
        setDrivers(
          (data.drivers || data.data || data || [])
            .filter((d: any) => d.role !== "manager" && d.role !== "admin")
            .map((d: any) => ({
              id: d.id || d._id?.toString(),
              name: d.name || d.driverName,
              email: d.email || d.driverEmail,
              phone: d.phone,
              role: d.role || "driver",
            })),
        );
      }
    } catch (err) {
      console.error("Error fetching:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/managers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setModalMessage(
          newRole === "manager"
            ? "User promoted to Manager successfully!"
            : "Manager demoted to Driver.",
        );
        setModalType("success");
        setShowModal(true);
        fetchData();
      } else {
        const err = await res.json();
        setModalMessage(err.error || "Failed to update role");
        setModalType("error");
        setShowModal(true);
      }
    } catch (err) {
      setModalMessage("Failed to update role");
      setModalType("error");
      setShowModal(true);
    } finally {
      setActionLoading(false);
      setConfirmId(null);
    }
  };

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#01312D]">Managers</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage manager accounts
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-[#3A7717] text-white rounded-xl hover:bg-[#2d5e12] text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-3">
        <button
          onClick={() => setActiveTab("managers")}
          className={`px-4 py-2 rounded-xl font-semibold text-sm ${
            activeTab === "managers"
              ? "bg-[#3A7717] text-white"
              : "bg-white text-[#01312D] border border-[#bff202]/20"
          }`}
        >
          <Shield className="w-4 h-4 inline mr-1" />
          Managers ({managers.length})
        </button>
        <button
          onClick={() => setActiveTab("add")}
          className={`px-4 py-2 rounded-xl font-semibold text-sm ${
            activeTab === "add"
              ? "bg-[#3A7717] text-white"
              : "bg-white text-[#01312D] border border-[#bff202]/20"
          }`}
        >
          <UserPlus className="w-4 h-4 inline mr-1" />
          Add Manager
        </button>
      </div>

      {activeTab === "managers" ? (
        loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-[#3A7717] animate-spin mx-auto" />
          </div>
        ) : managers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#bff202]/20">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-[#01312D]">No managers yet</p>
            <p className="text-sm text-gray-500">Promote drivers to manager role to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {managers.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl p-4 border border-[#bff202]/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-[#01312D]">{m.name}</p>
                    <p className="text-sm text-gray-500">{m.email}</p>
                    {m.phone && <p className="text-xs text-gray-400">{m.phone}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
                    Manager
                  </span>
                  <button
                    onClick={() => setConfirmId(m.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                  {confirmId === m.id && (
                    <button
                      onClick={() => {
                        handleRoleChange(m.id, "driver");
                        setConfirmId(null);
                      }}
                      disabled={actionLoading}
                      className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-semibold"
                    >
                      {actionLoading ? "..." : "Demote"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div>
          <div className="relative max-w-md mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search drivers..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none"
            />
          </div>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-[#3A7717] animate-spin mx-auto" />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDrivers.map((d) => (
                <div key={d.id} className="bg-white rounded-2xl p-4 border border-[#bff202]/20 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#01312D]">{d.name}</p>
                    <p className="text-sm text-gray-500">{d.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setConfirmId(d.id);
                      handleRoleChange(d.id, "manager");
                    }}
                    disabled={actionLoading && confirmId === d.id}
                    className="px-4 py-2 bg-[#3A7717] text-white rounded-xl font-semibold text-sm hover:bg-[#2d5e12] disabled:opacity-50"
                  >
                    {actionLoading && confirmId === d.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Promote to Manager"
                    )}
                  </button>
                </div>
              ))}
              {filteredDrivers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {search ? "No drivers match your search." : "No drivers available."}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl max-w-sm w-full shadow-2xl p-5 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${modalType === "success" ? "bg-green-100" : "bg-red-100"}`}>
              {modalType === "success" ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600" />
              )}
            </div>
            <p className="font-bold text-[#01312D] mb-2">{modalType === "success" ? "Success" : "Error"}</p>
            <p className="text-sm text-gray-500">{modalMessage}</p>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full bg-[#01312D] text-white py-2 rounded-xl font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
