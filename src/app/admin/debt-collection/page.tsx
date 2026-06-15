"use client";

import { useState, useEffect, useMemo } from "react";
import { formatMoney, toMoney } from "@/lib/money";
import { generateDriverProfileReportHtml } from "@/lib/driver-profile-report";
import {
  Loader2,
  Search,
  X,
  User,
  Car,
  Eye,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Printer,
  Banknote,
  Building2,
  ArrowRight,
} from "lucide-react";

interface DebtRecord {
  id: string;
  type: string;
  amount: number;
  interest: number;
  totalRepayable: number;
  repaymentDays: number;
  dailyPayment: number;
  status: string;
  requestDate: string;
  approvalDate?: string;
  otp?: string;
  isPaid?: boolean;
  remainingBalance?: number;
  repaidAmount?: number;
  collateral?: {
    itemName?: string;
    category?: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    condition?: string;
    purchaseYear?: number;
    color?: string;
    images?: string[];
  };
}

interface DriverSummary {
  userId: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  paid: number;
  outstanding: number;
}

export default function DebtCollectionPage() {
  const [drivers, setDrivers] = useState<DriverSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/driver-view");
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers || []);
      }
    } catch (err) {
      console.error("Error fetching drivers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDriverData = async (userId: string) => {
    setProfileLoading(true);
    setSelectedUserId(userId);
    setProfile(null);
    setDebts([]);
    try {
      const [profileRes, debtsRes] = await Promise.all([
        fetch(`/api/admin/drivers/profile?userId=${userId}`),
        fetch(`/api/driver/requests?userId=${userId}`),
      ]);
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile || null);
      }
      if (debtsRes.ok) {
        const data = await debtsRes.json();
        const formatted: DebtRecord[] = (data || []).map((r: any) => ({
          id: r.id || r._id,
          type: r.type,
          amount: r.amount || 0,
          interest: r.interest || 0,
          totalRepayable: r.totalRepayable || 0,
          repaymentDays: r.repaymentDays || 0,
          dailyPayment: r.dailyPayment || 0,
          status: r.status,
          requestDate: r.requestDate,
          approvalDate: r.approvedDate || r.approvalDate,
          otp: r.otp,
          collateral: r.collateral,
          isPaid: r.isPaid,
          remainingBalance: r.remainingBalance,
          repaidAmount: r.repaidAmount,
        }));
        setDebts(formatted);
      }
    } catch (err) {
      console.error("Error fetching driver data:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedUserId(null);
    setProfile(null);
    setDebts([]);
  };

  const filteredDrivers = useMemo(() => {
    if (!searchQuery) return drivers;
    const q = searchQuery.toLowerCase();
    return drivers.filter(
      (d) =>
        d.driverName.toLowerCase().includes(q) ||
        d.driverEmail.toLowerCase().includes(q) ||
        (d.driverPhone && d.driverPhone.includes(q)),
    );
  }, [drivers, searchQuery]);

  const outstandingDebts = useMemo(
    () => debts.filter((d) => {
      if (d.status === "rejected") return false;
      if (d.isPaid === true) return false;
      if (d.remainingBalance !== undefined && d.remainingBalance <= 0) return false;
      return true;
    }),
    [debts],
  );

  const totals = useMemo(() => {
    let totalOutstanding = 0,
      totalInterest = 0;
    for (const d of outstandingDebts) {
      totalOutstanding += d.totalRepayable;
      totalInterest += d.interest;
    }
    return {
      totalOutstanding: toMoney(totalOutstanding),
      totalInterest: toMoney(totalInterest),
      count: outstandingDebts.length,
    };
  }, [outstandingDebts]);

  const handlePrint = () => {
    const html = generateDriverProfileReportHtml({
      profile: {
        fullName: profile?.fullName || selectedDriver?.driverName,
        phone: profile?.phone || selectedDriver?.driverPhone,
        email: selectedDriver?.driverEmail,
        dateOfBirth: profile?.dateOfBirth,
        city: profile?.city,
        pincode: profile?.pincode,
        physicalAddress: profile?.address,
        totalRequests: profile?.totalRequests,
        totalSpent: profile?.totalSpent,
        carRegistrationNumber: profile?.carRegistrationNumber,
        carModel: profile?.carModel,
        carYear: profile?.carYear,
        carColor: profile?.carColor,
        ownershipStatus: profile?.ownershipStatus,
        carOwnerName: profile?.carOwnerName,
        carOwnerPhone: profile?.carOwnerPhone,
        carOwnerAddress: profile?.carOwnerAddress,
        verificationStatus: profile?.verificationStatus,
        verifiedAt: profile?.verifiedAt,
        referenceName: profile?.referenceName,
        referencePhone: profile?.referencePhone,
        bankName: profile?.bankName,
        accountHolder: profile?.accountHolder,
        accountNumber: profile?.accountNumber,
        branchCode: profile?.branchCode,
        profilePhotoUrl: profile?.profilePhotoUrl,
        drivingLicenseUrl: profile?.drivingLicenseUrl,
        carRegistrationUrl: profile?.carRegistrationUrl,
      },
      debts: outstandingDebts,
      totals: {
        totalOutstanding: totals.totalOutstanding,
        totalInterest: totals.totalInterest,
        count: totals.count,
      },
    });
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      fuel: "Fuel",
      airtime: "Airtime",
      cash: "Cash Loan",
      carwash: "Car Wash",
    };
    return map[type] || type;
  };

  const selectedDriver = drivers.find((d) => d.userId === selectedUserId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#01312D]">
            Driver Profile
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            View driver details, banking information, outstanding debts, and generate reports
          </p>
        </div>
        <button
          onClick={fetchDrivers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#eafde7] rounded-xl text-[#01312D] font-semibold hover:bg-[#bff202]/30 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search driver by name, email or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-[#bff202]/20 text-sm text-[#01312D] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#bff202]/40"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Driver List / Report */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/10 animate-pulse"
            >
              <div className="h-5 bg-gray-200 rounded w-48 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      ) : selectedUserId ? (
        <>
          {/* Back Button + Print */}
          <div className="flex items-center justify-between">
            <button
              onClick={clearSelection}
              className="flex items-center gap-2 text-[#3A7717] font-semibold hover:underline"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to search
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#01312D] text-white rounded-xl font-semibold hover:bg-[#01312D]/90 transition-all"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
          </div>

          {profileLoading ? (
            <div className="bg-white rounded-2xl p-8 animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-64" />
              <div className="h-4 bg-gray-200 rounded w-48" />
              <div className="h-4 bg-gray-200 rounded w-56" />
              <div className="h-4 bg-gray-200 rounded w-40" />
            </div>
          ) : (
            <div
              className="bg-white rounded-2xl shadow-sm border border-[#bff202]/20 overflow-hidden"
            >
              {/* Report Content */}
              <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="text-center mb-8 pb-6 border-b-2 border-[#01312D]">
                  <h2 className="text-2xl font-black text-[#01312D] uppercase tracking-wide">
                    Driver Profile Report
                  </h2>
                  <p className="text-sm text-gray-500 mt-2">
                    Generated: {new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <p className="text-xs text-gray-400">
                    Kapuka Tradings — Confidential — Driver Profile
                  </p>
                </div>

                {/* Driver Information */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-[#01312D] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" /> Driver Information
                  </h3>
                  <div className="bg-[#eafde7] rounded-xl p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      <div>
                        <span className="text-xs text-gray-500">Full Name</span>
                        <p className="font-semibold text-[#01312D]">
                          {profile?.fullName || selectedDriver?.driverName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Phone</span>
                        <p className="font-semibold text-[#01312D] flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {profile?.phone || selectedDriver?.driverPhone || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Email</span>
                        <p className="font-semibold text-[#01312D] flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {selectedDriver?.driverEmail || "N/A"}
                        </p>
                      </div>
                      {profile?.dateOfBirth && (
                        <div>
                          <span className="text-xs text-gray-500">Date of Birth</span>
                          <p className="font-semibold text-[#01312D]">{profile.dateOfBirth}</p>
                        </div>
                      )}
                      {profile?.address && (
                        <div>
                          <span className="text-xs text-gray-500">Address</span>
                          <p className="font-semibold text-[#01312D] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {profile.address}
                          </p>
                        </div>
                      )}
                      {profile?.city && (
                        <div>
                          <span className="text-xs text-gray-500">City / Suburb</span>
                          <p className="font-semibold text-[#01312D]">{profile.city}{profile?.pincode ? ` (${profile.pincode})` : ""}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-gray-500">Car Registration</span>
                        <p className="font-semibold text-[#01312D] flex items-center gap-1">
                          <Car className="w-3 h-3 text-gray-400" />
                          {profile?.carRegistrationNumber || "N/A"}
                        </p>
                      </div>
                      {profile?.carModel && (
                        <div>
                          <span className="text-xs text-gray-500">Car Model</span>
                          <p className="font-semibold text-[#01312D]">{profile.carModel}</p>
                        </div>
                      )}
                      {profile?.carYear && (
                        <div>
                          <span className="text-xs text-gray-500">Car Year</span>
                          <p className="font-semibold text-[#01312D]">{profile.carYear}</p>
                        </div>
                      )}
                      {profile?.carColor && (
                        <div>
                          <span className="text-xs text-gray-500">Car Color</span>
                          <p className="font-semibold text-[#01312D]">{profile.carColor}</p>
                        </div>
                      )}
                      {profile?.ownershipStatus && (
                        <div>
                          <span className="text-xs text-gray-500">Ownership</span>
                          <p className="font-semibold text-[#01312D]">{profile.ownershipStatus === "own" ? "Own Vehicle" : "Rented"}</p>
                        </div>
                      )}
                      {profile?.verificationStatus && (
                        <div>
                          <span className="text-xs text-gray-500">Verification</span>
                          <p className="font-semibold text-[#01312D] uppercase">{profile.verificationStatus}</p>
                        </div>
                      )}
                      {profile?.referenceName && (
                        <div>
                          <span className="text-xs text-gray-500">Reference</span>
                          <p className="font-semibold text-[#01312D]">{profile.referenceName}{profile?.referencePhone ? ` — ${profile.referencePhone}` : ""}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Driver Images */}
                {(profile?.profilePhotoUrl || profile?.drivingLicenseUrl || profile?.carRegistrationUrl) && (
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-[#01312D] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Eye className="w-4 h-4" /> Driver Documents
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {profile?.profilePhotoUrl && (
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">Profile Photo</span>
                          <img
                            src={profile.profilePhotoUrl}
                            alt="Profile"
                            className="w-full h-36 object-cover rounded-xl border border-gray-200"
                          />
                        </div>
                      )}
                      {profile?.drivingLicenseUrl && (
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">Driving License</span>
                          <img
                            src={profile.drivingLicenseUrl}
                            alt="Driving License"
                            className="w-full h-36 object-cover rounded-xl border border-gray-200"
                          />
                        </div>
                      )}
                      {profile?.carRegistrationUrl && (
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">Car Registration</span>
                          <img
                            src={profile.carRegistrationUrl}
                            alt="Car Registration"
                            className="w-full h-36 object-cover rounded-xl border border-gray-200"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Banking Details */}
                {(profile?.bankName || profile?.accountNumber) && (
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-[#01312D] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Banking Details
                    </h3>
                    <div className="bg-[#eafde7] rounded-xl p-4 space-y-2">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        {profile.bankName && (
                          <div>
                            <span className="text-xs text-gray-500">Bank</span>
                            <p className="font-semibold text-[#01312D]">{profile.bankName}</p>
                          </div>
                        )}
                        {profile.accountHolder && (
                          <div>
                            <span className="text-xs text-gray-500">Account Holder</span>
                            <p className="font-semibold text-[#01312D]">{profile.accountHolder}</p>
                          </div>
                        )}
                        {profile.accountNumber && (
                          <div>
                            <span className="text-xs text-gray-500">Account Number</span>
                            <p className="font-semibold text-[#01312D]">{profile.accountNumber}</p>
                          </div>
                        )}
                        {profile.branchCode && (
                          <div>
                            <span className="text-xs text-gray-500">Branch Code</span>
                            <p className="font-semibold text-[#01312D]">{profile.branchCode}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Financial Statement */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-[#01312D] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Banknote className="w-4 h-4" /> Financial Statement
                  </h3>

                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#01312D] text-white">
                          <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider">Date</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider">Reference</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider">Type</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wider">Principal</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wider">Interest</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wider">Total Due</th>
                        </tr>
                      </thead>
                      <tbody>
                        {outstandingDebts.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center px-3 py-6 text-gray-400 italic">
                              No outstanding debts recorded for this driver.
                            </td>
                          </tr>
                        ) : (
                          outstandingDebts.map((debt) => (
                            <tr key={debt.id} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="px-3 py-2.5 text-gray-700">
                                {debt.requestDate
                                  ? new Date(debt.requestDate).toLocaleDateString("en-ZA")
                                  : "—"}
                              </td>
                              <td className="px-3 py-2.5 font-semibold text-[#01312D]">
                                {debt.id.slice(-8).toUpperCase()}
                              </td>
                              <td className="px-3 py-2.5 text-gray-700">{getTypeLabel(debt.type)}</td>
                              <td className="px-3 py-2.5 text-right font-medium">{formatMoney(debt.amount)}</td>
                              <td className="px-3 py-2.5 text-right font-medium">{formatMoney(debt.interest)}</td>
                              <td className="px-3 py-2.5 text-right font-bold text-red-600">
                                {formatMoney(debt.totalRepayable)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-[#01312D] bg-gray-50">
                          <td colSpan={3} className="px-3 py-2.5 font-bold text-[#01312D] uppercase tracking-wider text-xs">
                            Total Outstanding
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold">{formatMoney(totals.totalOutstanding)}</td>
                          <td className="px-3 py-2.5 text-right font-semibold">{formatMoney(totals.totalInterest)}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-red-600">
                            {formatMoney(totals.totalOutstanding)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <p className="text-xs text-gray-400 mt-2 italic">
                    Active accounts: {totals.count} — This statement reflects all outstanding balances as of{" "}
                    {new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}.
                  </p>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-400 pt-6 border-t border-gray-200">
                  <p>Kapuka Tradings — Driver Profile Report</p>
                  <p>
                    Generated on {new Date().toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {" at "}
                    {new Date().toLocaleTimeString("en-ZA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-1">This document is confidential and intended for reporting purposes only.</p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : filteredDrivers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#bff202]/20">
          <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#01312D]">No drivers found</h3>
          <p className="text-sm text-gray-500 mt-1">
            {drivers.length === 0
              ? "No drivers with loans in the system"
              : "Try a different search term"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDrivers.map((driver) => (
            <button
              key={driver.userId}
              onClick={() => fetchDriverData(driver.userId)}
              className="w-full bg-white rounded-2xl p-4 border border-[#bff202]/10 hover:border-[#bff202]/40 hover:shadow-sm transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 shrink-0 bg-[#eafde7] rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-[#3A7717]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#01312D]">{driver.driverName}</p>
                    <p className="text-xs text-gray-400 truncate">{driver.driverEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Outstanding</p>
                    <p className="text-sm font-bold text-red-600">
                      {formatMoney(driver.outstanding)}
                    </p>
                  </div>
                  <Eye className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
