"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetch";
import { Fuel, Loader2, X, Users, Pencil, Check, RotateCcw, Search } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { DriverFuelCreditRow, FuelCreditsResponse } from "@/services/admin";

const LS_FROM = "fuelFrom";
const LS_TO = "fuelTo";

function load(key: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) || "";
}

function save(key: string, value: string) {
  if (typeof window !== "undefined") {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  }
}

export default function FuelPage() {
  const [fuelFrom, setFuelFrom] = useState(() => load(LS_FROM));
  const [fuelTo, setFuelTo] = useState(() => load(LS_TO));

  useEffect(() => {
    save(LS_FROM, fuelFrom);
  }, [fuelFrom]);
  useEffect(() => {
    save(LS_TO, fuelTo);
  }, [fuelTo]);

  const [showFuelModal, setShowFuelModal] = useState(false);
  const [fuelInput, setFuelInput] = useState("");
  const [fuelSaving, setFuelSaving] = useState(false);

  // Per-driver weekly fuel credits
  const [creditSearch, setCreditSearch] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editLimitInput, setEditLimitInput] = useState("");
  const [creditSaving, setCreditSaving] = useState<string | null>(null);
  const [creditNotice, setCreditNotice] = useState("");
  const [editingDefault, setEditingDefault] = useState(false);
  const [defaultLimitInput, setDefaultLimitInput] = useState("");

  const { data: creditsData, mutate: mutateCredits } = useSWR<FuelCreditsResponse>(
    "/api/admin/fuel-credits",
    fetcher,
    { refreshInterval: 60_000, dedupingInterval: 60_000 },
  );

  const filteredCreditDrivers = useMemo(() => {
    const drivers: DriverFuelCreditRow[] = creditsData?.drivers || [];
    const q = creditSearch.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter(
      (d) =>
        (d.name || "").toLowerCase().includes(q) ||
        (d.email || "").toLowerCase().includes(q) ||
        (d.carRegistration || "").toLowerCase().includes(q),
    );
  }, [creditsData, creditSearch]);

  const fuelQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (fuelFrom) params.set("from", fuelFrom);
    if (fuelTo) params.set("to", fuelTo);
    const qs = params.toString();
    return qs
      ? `/api/admin/dashboard/fuel-budget?${qs}`
      : "/api/admin/dashboard/fuel-budget";
  }, [fuelFrom, fuelTo]);

  const { data: fuelBudgetData, mutate: mutateFuelBudget } = useSWR(
    fuelQuery,
    fetcher,
    { refreshInterval: 60_000, dedupingInterval: 60_000 },
  );
  const fuelBudget = useMemo(
    () => fuelBudgetData || { total: 0, used: 0, remaining: 0 },
    [fuelBudgetData],
  );

  const handleSetFuelBudget = async () => {
    const total = parseFloat(fuelInput);
    if (isNaN(total) || total <= 0) return;
    setFuelSaving(true);
    try {
      const res = await fetch("/api/admin/dashboard/fuel-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total }),
      });
      if (res.ok) {
        mutateFuelBudget();
        setShowFuelModal(false);
        setFuelInput("");
      }
    } catch {
    } finally {
      setFuelSaving(false);
    }
  };

  const startEditLimit = (driver: DriverFuelCreditRow) => {
    setEditingUserId(driver.userId);
    setEditLimitInput(String(driver.limit));
    setEditingDefault(false);
    setCreditNotice("");
  };

  const saveDriverLimit = async (userId: string) => {
    const limit = parseFloat(editLimitInput);
    if (isNaN(limit) || limit < 0) return;
    setCreditSaving(userId);
    setCreditNotice("");
    try {
      const res = await fetch("/api/admin/fuel-credits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, limit }),
      });
      if (res.ok) {
        setEditingUserId(null);
        setCreditNotice("Driver fuel credit updated.");
        mutateCredits();
      } else {
        const data = await res.json().catch(() => ({}));
        setCreditNotice(data.error || "Failed to update fuel credit.");
      }
    } catch {
      setCreditNotice("Failed to update fuel credit.");
    } finally {
      setCreditSaving(null);
    }
  };

  const resetDriverLimit = async (userId: string) => {
    setCreditSaving(userId);
    setCreditNotice("");
    try {
      const res = await fetch("/api/admin/fuel-credits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, limit: null }),
      });
      if (res.ok) {
        setEditingUserId(null);
        setCreditNotice("Driver reset to the default weekly credit.");
        mutateCredits();
      }
    } catch {
      setCreditNotice("Failed to reset fuel credit.");
    } finally {
      setCreditSaving(null);
    }
  };

  const saveDefaultLimit = async () => {
    const limit = parseFloat(defaultLimitInput);
    if (isNaN(limit) || limit < 0) return;
    setCreditSaving("__default__");
    setCreditNotice("");
    try {
      const res = await fetch("/api/admin/fuel-credits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit, isDefaultLimit: true }),
      });
      if (res.ok) {
        setEditingDefault(false);
        setCreditNotice("Default weekly fuel credit updated.");
        mutateCredits();
      }
    } catch {
      setCreditNotice("Failed to update default fuel credit.");
    } finally {
      setCreditSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#01312D]">Fuel Budget</h1>
        <button
          onClick={() => setShowFuelModal(true)}
          className="px-4 py-2 bg-[#01312D] text-white rounded-lg text-sm font-medium hover:bg-[#3A7717] transition-colors flex items-center gap-2"
        >
          <Fuel className="w-4 h-4" />
          {fuelBudget.total > 0 ? "Adjust Budget" : "Set Budget"}
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#bff202]/20">
        <div className="flex items-center gap-3 mb-4">
          <Fuel className="w-5 h-5 text-[#3A7717]" />
          <span className="font-semibold text-[#01312D]">Overview</span>
        </div>

        {fuelBudget.total > 0 ? (
          <div className="space-y-4">
            <div className="flex gap-3 items-center">
              <div className="flex-1 flex gap-[3px] items-center">
                {Array.from({ length: 20 }).map((_, i) => {
                  const threshold = (i + 1) / 20;
                  const filled =
                    fuelBudget.used / fuelBudget.total >= threshold;
                  return (
                    <div
                      key={i}
                      className={`h-4 flex-1 rounded-sm transition-all duration-300 ${
                        filled
                          ? i >= 18
                            ? "bg-red-500"
                            : i >= 14
                              ? "bg-yellow-500"
                              : "bg-[#bff202]"
                          : "bg-gray-100"
                      }`}
                    />
                  );
                })}
              </div>
              {/* <span className="text-sm font-medium tabular-nums whitespace-nowrap text-[#01312D]">
                R{fuelBudget.used.toLocaleString()} / R
                {fuelBudget.total.toLocaleString()}
              </span>*/}
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-[#eafde7] rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Used</p>
                <p className="text-lg font-bold text-[#01312D]">
                  R{fuelBudget.used.toLocaleString()}
                </p>
              </div>
              <div className="bg-[#eafde7] rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Remaining</p>
                <p className="text-lg font-bold text-[#01312D]">
                  R{fuelBudget.remaining.toLocaleString()}
                </p>
              </div>
              <div className="bg-[#eafde7] rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Total Budget</p>
                <p className="text-lg font-bold text-[#01312D]">
                  R{fuelBudget.total.toLocaleString()}
                </p>
              </div>
            </div>

            {(fuelFrom || fuelTo) && (
              <p className="text-xs text-gray-400">
                Showing usage from {fuelFrom || "start"} to {fuelTo || "now"}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Fuel className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No fuel budget set yet.</p>
            <p className="text-gray-400 text-xs mt-1">
              Click the button above to set your first budget.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#bff202]/20">
        <div className="flex items-center gap-3 mb-4">
          <Fuel className="w-5 h-5 text-[#3A7717]" />
          <span className="font-semibold text-[#01312D]">Date Range</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              From
            </label>
            <input
              type="date"
              value={fuelFrom}
              onChange={(e) => setFuelFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#bff202]"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              To
            </label>
            <input
              type="date"
              value={fuelTo}
              onChange={(e) => setFuelTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#bff202]"
            />
          </div>
        </div>
      </div>

      {/* Per-Driver Weekly Fuel Credits */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#bff202]/20">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-[#3A7717]" />
            <div>
              <span className="font-semibold text-[#01312D]">
                Driver Fuel Credits
              </span>
              <p className="text-xs text-gray-400">
                {creditsData && creditsData.enabled === false
                  ? "Credit limits are currently OFF — enable in Settings → Services"
                  : "Weekly limit per driver · resets every Monday"}
                {creditsData?.weekStart && creditsData?.weekEnd
                  ? ` · current week: ${new Date(creditsData.weekStart).toLocaleDateString()} – ${new Date(creditsData.weekEnd).toLocaleDateString()}`
                  : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {creditsData?.enabled === false && (
              <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-semibold">
                OFF
              </span>
            )}
            {editingDefault ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={defaultLimitInput}
                  onChange={(e) => setDefaultLimitInput(e.target.value)}
                  className="w-28 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#bff202]"
                  placeholder="e.g. 2500"
                />
                <button
                  onClick={saveDefaultLimit}
                  disabled={creditSaving === "__default__" || !defaultLimitInput}
                  className="px-3 py-1.5 bg-[#01312D] text-white rounded-lg text-xs font-medium hover:bg-[#3A7717] disabled:opacity-50 flex items-center gap-1"
                >
                  {creditSaving === "__default__" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  Save
                </button>
                <button
                  onClick={() => setEditingDefault(false)}
                  className="px-2 py-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditingDefault(true);
                  setDefaultLimitInput(String(creditsData?.defaultLimit ?? 2500));
                  setEditingUserId(null);
                }}
                className="px-3 py-1.5 bg-[#eafde7] text-[#01312D] rounded-lg text-xs font-medium hover:bg-[#d4f5d0] transition-colors flex items-center gap-1.5"
              >
                <Pencil className="w-3 h-3" />
                Default: {formatMoney(creditsData?.defaultLimit ?? 2500)}/week
              </button>
            )}
          </div>
        </div>

        {creditNotice && (
          <p className="text-xs text-[#3A7717] bg-[#eafde7] rounded-lg px-3 py-2 mb-3">
            {creditNotice}
          </p>
        )}

        <div className="mb-4 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={creditSearch}
            onChange={(e) => setCreditSearch(e.target.value)}
            placeholder="Search drivers..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#bff202]"
          />
        </div>

        {!creditsData ? (
          <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading driver
            credits...
          </div>
        ) : filteredCreditDrivers.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">
            No drivers found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-2 pr-3">Driver</th>
                  <th className="pb-2 pr-3">Weekly Limit</th>
                  <th className="pb-2 pr-3">Used This Week</th>
                  <th className="pb-2 pr-3">Remaining</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCreditDrivers.map((driver) => {
                  const isEditing = editingUserId === driver.userId;
                  const isSaving = creditSaving === driver.userId;
                  const usedPercent =
                    driver.limit > 0
                      ? Math.min(100, (driver.used / driver.limit) * 100)
                      : 0;
                  return (
                    <tr
                      key={driver.userId}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="py-3 pr-3">
                        <p className="font-medium text-[#01312D]">
                          {driver.name || "Unnamed"}
                          {driver.isDefault && (
                            <span className="ml-2 text-[10px] bg-[#eafde7] text-[#3A7717] px-1.5 py-0.5 rounded font-semibold">
                              DEFAULT
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">
                          {driver.email}
                          {driver.carRegistration
                            ? ` · ${driver.carRegistration}`
                            : ""}
                        </p>
                      </td>
                      <td className="py-3 pr-3">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editLimitInput}
                            onChange={(e) => setEditLimitInput(e.target.value)}
                            className="w-28 px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#bff202]"
                            autoFocus
                          />
                        ) : (
                          <span className="font-semibold text-[#01312D]">
                            {formatMoney(driver.limit)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-gray-600">
                          {formatMoney(driver.used)}
                        </span>
                        <div className="w-24 bg-gray-100 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${usedPercent >= 100 ? "bg-red-500" : usedPercent >= 75 ? "bg-yellow-500" : "bg-[#3A7717]"}`}
                            style={{ width: `${usedPercent}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`font-semibold ${driver.remaining <= 0 ? "text-red-600" : "text-[#01312D]"}`}
                        >
                          {formatMoney(driver.remaining)}
                        </span>
                      </td>
                      <td className="py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => saveDriverLimit(driver.userId)}
                              disabled={isSaving || !editLimitInput}
                              className="px-2.5 py-1 bg-[#01312D] text-white rounded-lg text-xs font-medium hover:bg-[#3A7717] disabled:opacity-50 flex items-center gap-1"
                            >
                              {isSaving ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              Save
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="px-2 py-1 text-gray-400 hover:text-gray-600 rounded-lg"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => startEditLimit(driver)}
                              className="px-2.5 py-1 bg-[#eafde7] text-[#01312D] rounded-lg text-xs font-medium hover:bg-[#d4f5d0] flex items-center gap-1"
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                            {!driver.isDefault && (
                              <button
                                onClick={() => resetDriverLimit(driver.userId)}
                                disabled={isSaving}
                                className="px-2.5 py-1 text-gray-400 hover:text-[#01312D] rounded-lg text-xs font-medium flex items-center gap-1"
                                title="Reset to default"
                              >
                                <RotateCcw className="w-3 h-3" /> Reset
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showFuelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#01312D] flex items-center gap-2">
                <Fuel className="w-5 h-5 text-[#3A7717]" /> Fuel Budget
              </h3>
              <button
                onClick={() => {
                  setShowFuelModal(false);
                  setFuelInput("");
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Total Budget (R)
                </label>
                <input
                  type="number"
                  value={fuelInput}
                  onChange={(e) => setFuelInput(e.target.value)}
                  placeholder="e.g. 500000"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#bff202]"
                />
              </div>
              {fuelBudget.total > 0 && (
                <p className="text-xs text-gray-400">
                  Current budget: R{fuelBudget.total.toLocaleString()}. Setting
                  a new one will reset usage tracking.
                </p>
              )}
              <button
                onClick={handleSetFuelBudget}
                disabled={fuelSaving || !fuelInput}
                className="w-full py-2 bg-[#01312D] text-white rounded-lg font-medium text-sm hover:bg-[#3A7717] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {fuelSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {fuelSaving
                  ? "Saving..."
                  : fuelBudget.total > 0
                    ? "Update Budget"
                    : "Set Budget"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
