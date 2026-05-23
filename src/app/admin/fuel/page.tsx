"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetch";
import { Fuel, Loader2, X } from "lucide-react";

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
              <span className="text-sm font-medium tabular-nums whitespace-nowrap text-[#01312D]">
                R{fuelBudget.used.toLocaleString()} / R
                {fuelBudget.total.toLocaleString()}
              </span>
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
