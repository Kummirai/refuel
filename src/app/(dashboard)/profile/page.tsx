"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Car,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Shield,
  AlertCircle,
  Edit2,
  Camera,
  TrendingUp,
  Wallet,
  History,
  Star,
  ThumbsUp,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "loans" | "settings">(
    "profile",
  );

  // Sample user data - will be replaced with Supabase data
  const [userData, setUserData] = useState({
    name: "Rajesh Kumar",
    email: "rajesh.kumar@example.com",
    phone: "+91 98765 43210",
    address: "123, Main Street, Indiranagar, Bangalore - 560038",
    carRegistration: "KA01AB1234",
    carModel: "Hyundai i20",
    carYear: "2022",
    isVerified: true,
    verificationStatus: "approved",
    memberSince: "January 2024",
    totalRequests: 24,
    totalSpent: 48500,
    totalLoans: 3,
    activeLoan: {
      amount: 15000,
      remaining: 8750,
      interest: 13,
      dueDate: "2024-02-15",
      dailyPayment: 750,
    },
  });

  const [loanHistory, setLoanHistory] = useState([
    {
      id: "LN1001",
      amount: 10000,
      interest: 13,
      totalRepayable: 11300,
      repaid: 11300,
      status: "completed",
      date: "2024-01-10",
      repaidDate: "2024-01-25",
      dailyAmount: 754,
    },
    {
      id: "LN1002",
      amount: 20000,
      interest: 13,
      totalRepayable: 22600,
      repaid: 15000,
      remaining: 7600,
      status: "active",
      date: "2024-01-20",
      dueDate: "2024-02-10",
      dailyAmount: 1507,
    },
    {
      id: "LN1003",
      amount: 5000,
      interest: 13,
      totalRepayable: 5650,
      repaid: 5650,
      status: "completed",
      date: "2024-01-05",
      repaidDate: "2024-01-18",
      dailyAmount: 377,
    },
  ]);

  const [recentRequests, setRecentRequests] = useState([
    {
      type: "Fuel",
      amount: 2500,
      status: "completed",
      date: "2024-01-15",
      otp: "123456",
    },
    {
      type: "Airtime",
      amount: 500,
      status: "approved",
      date: "2024-01-14",
      otp: "789012",
    },
    {
      type: "Car Wash",
      amount: 999,
      status: "completed",
      date: "2024-01-13",
      otp: "345678",
    },
    {
      type: "Cash Loan",
      amount: 15000,
      status: "active",
      date: "2024-01-10",
      otp: "901234",
    },
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="text-[#72bf00] bg-[#72bf00]/10 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case "completed":
        return (
          <span className="text-[#3A7717] bg-[#3A7717]/10 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Completed
          </span>
        );
      case "active":
        return (
          <span className="text-[#bff202] bg-[#bff202]/10 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" /> Active
          </span>
        );
      default:
        return (
          <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg text-xs font-semibold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#eafde7] pb-24">
      {/* Header with Cover Photo */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-32 bg-gradient-to-r from-[#01312D] to-[#3A7717] relative">
          <button className="absolute bottom-2 right-2 bg-black/50 p-1.5 rounded-full">
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Profile Avatar */}
        <div className="absolute -bottom-12 left-5">
          <div className="relative">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-white">
              <div className="w-full h-full bg-gradient-to-br from-[#01312D] to-[#3A7717] rounded-xl flex items-center justify-center">
                <span className="text-4xl text-white font-bold">
                  {userData.name.charAt(0)}
                </span>
              </div>
            </div>
            <button className="absolute bottom-0 right-0 bg-[#bff202] p-1.5 rounded-full shadow-md">
              <Camera className="w-3 h-3 text-[#01312D]" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-5 pt-16 pb-4 bg-white border-b border-[#bff202]/20">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-[#01312D]">
              {userData.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-500 text-sm">{userData.email}</p>
              {userData.isVerified && (
                <div className="flex items-center gap-1 bg-[#3A7717]/10 px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3 text-[#3A7717]" />
                  <span className="text-[#3A7717] text-xs font-semibold">
                    Verified
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="bg-[#eafde7] px-2 py-1 rounded-lg">
                <p className="text-xs text-[#01312D]">
                  Member since {userData.memberSince}
                </p>
              </div>
            </div>
          </div>
          <button className="bg-[#eafde7] p-2 rounded-full">
            <Edit2 className="w-5 h-5 text-[#3A7717]" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2 p-5">
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#bff202]/20">
          <div className="w-8 h-8 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-1">
            <History className="w-4 h-4 text-[#3A7717]" />
          </div>
          <p className="text-lg font-bold text-[#01312D]">
            {userData.totalRequests}
          </p>
          <p className="text-xs text-gray-500">Requests</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#bff202]/20">
          <div className="w-8 h-8 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-1">
            <Wallet className="w-4 h-4 text-[#3A7717]" />
          </div>
          <p className="text-lg font-bold text-[#01312D]">
            ₹{userData.totalSpent}
          </p>
          <p className="text-xs text-gray-500">Spent</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#bff202]/20">
          <div className="w-8 h-8 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-1">
            <TrendingUp className="w-4 h-4 text-[#3A7717]" />
          </div>
          <p className="text-lg font-bold text-[#01312D]">
            {userData.totalLoans}
          </p>
          <p className="text-xs text-gray-500">Loans</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#bff202]/20">
          <div className="w-8 h-8 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-1">
            <Star className="w-4 h-4 text-[#3A7717]" />
          </div>
          <p className="text-lg font-bold text-[#01312D]">4.8</p>
          <p className="text-xs text-gray-500">Rating</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 border-b border-[#bff202]/20 bg-white">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-3 px-1 font-semibold transition-all relative ${
              activeTab === "profile" ? "text-[#3A7717]" : "text-gray-500"
            }`}
          >
            Profile
            {activeTab === "profile" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3A7717] rounded-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("loans")}
            className={`pb-3 px-1 font-semibold transition-all relative ${
              activeTab === "loans" ? "text-[#3A7717]" : "text-gray-500"
            }`}
          >
            Loans & History
            {activeTab === "loans" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3A7717] rounded-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 px-1 font-semibold transition-all relative ${
              activeTab === "settings" ? "text-[#3A7717]" : "text-gray-500"
            }`}
          >
            Settings
            {activeTab === "settings" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3A7717] rounded-full"></div>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-5">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <h3 className="font-bold text-[#01312D] mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[#3A7717]" />
                Personal Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#72bf00]" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-[#01312D]">{userData.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#72bf00]" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-[#01312D]">{userData.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#72bf00]" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm text-[#01312D]">{userData.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <h3 className="font-bold text-[#01312D] mb-3 flex items-center gap-2">
                <Car className="w-4 h-4 text-[#3A7717]" />
                Vehicle Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">
                    Registration Number
                  </span>
                  <span className="text-sm font-semibold text-[#01312D]">
                    {userData.carRegistration}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Car Model</span>
                  <span className="text-sm font-semibold text-[#01312D]">
                    {userData.carModel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Year</span>
                  <span className="text-sm font-semibold text-[#01312D]">
                    {userData.carYear}
                  </span>
                </div>
              </div>
            </div>

            {/* Verification Status */}
            <div className="bg-gradient-to-r from-[#01312D] to-[#3A7717] rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Verification Status</p>
                  <p className="text-lg font-bold mt-1 flex items-center gap-2">
                    {userData.isVerified
                      ? "✓ Verified Account"
                      : "⚠ Pending Verification"}
                  </p>
                </div>
                {!userData.isVerified && (
                  <button className="bg-[#bff202] text-[#01312D] px-4 py-2 rounded-lg text-sm font-semibold">
                    Verify Now
                  </button>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-[#01312D]">Recent Requests</h3>
                <button className="text-[#72bf00] text-xs font-semibold">
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {recentRequests.slice(0, 3).map((request, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="font-semibold text-[#01312D]">
                        {request.type}
                      </p>
                      <p className="text-xs text-gray-500">{request.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#01312D]">
                        ₹{request.amount}
                      </p>
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loans & History Tab */}
        {activeTab === "loans" && (
          <div className="space-y-4">
            {/* Active Loan Banner */}
            {userData.activeLoan && (
              <div className="bg-gradient-to-r from-[#bff202] to-[#72bf00] rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-[#01312D]">Active Loan</h3>
                  <ThumbsUp className="w-5 h-5 text-[#01312D]" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-[#01312D]">Loan Amount</span>
                    <span className="font-bold text-[#01312D]">
                      ₹{userData.activeLoan.amount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#01312D]">Remaining</span>
                    <span className="font-bold text-[#01312D]">
                      ₹{userData.activeLoan.remaining}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#01312D]">
                      Daily Payment
                    </span>
                    <span className="font-bold text-[#01312D]">
                      ₹{userData.activeLoan.dailyPayment}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#01312D]">Due Date</span>
                    <span className="font-semibold text-[#01312D]">
                      {userData.activeLoan.dueDate}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="bg-[#01312D]/20 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#01312D] h-2 rounded-full"
                        style={{
                          width: `${((userData.activeLoan.amount - userData.activeLoan.remaining) / userData.activeLoan.amount) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-[#01312D] mt-1 text-right">
                      {Math.round(
                        ((userData.activeLoan.amount -
                          userData.activeLoan.remaining) /
                          userData.activeLoan.amount) *
                          100,
                      )}
                      % Paid
                    </p>
                  </div>
                </div>
                <button className="w-full mt-3 bg-[#01312D] text-white py-2 rounded-xl font-semibold text-sm">
                  Make Payment
                </button>
              </div>
            )}

            {/* Loan History */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <h3 className="font-bold text-[#01312D] mb-3">Loan History</h3>
              <div className="space-y-3">
                {loanHistory.map((loan) => (
                  <div
                    key={loan.id}
                    className="border-b border-gray-100 last:border-0 pb-3 last:pb-0"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-[#01312D]">
                          Loan #{loan.id}
                        </p>
                        <p className="text-xs text-gray-500">{loan.date}</p>
                      </div>
                      {loan.status === "completed" ? (
                        <span className="text-[#3A7717] bg-[#3A7717]/10 px-2 py-1 rounded-lg text-xs font-semibold">
                          Completed
                        </span>
                      ) : (
                        <span className="text-[#72bf00] bg-[#72bf00]/10 px-2 py-1 rounded-lg text-xs font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="font-semibold">₹{loan.amount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Interest (13%)</p>
                        <p className="font-semibold">₹{loan.interest}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="font-semibold">₹{loan.totalRepayable}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Repaid</p>
                        <p className="font-semibold text-[#3A7717]">
                          ₹{loan.repaid}
                        </p>
                      </div>
                    </div>
                    {loan.status === "active" && loan.remaining > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Repayment Progress</span>
                          <span>
                            {Math.round(
                              (loan.repaid / loan.totalRepayable) * 100,
                            )}
                            %
                          </span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#72bf00] h-1.5 rounded-full"
                            style={{
                              width: `${(loan.repaid / loan.totalRepayable) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <h3 className="font-bold text-[#01312D] mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#3A7717]" />
                Payment Methods
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-[#eafde7] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <span className="text-xl">🏦</span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#01312D]">
                        Bank Transfer
                      </p>
                      <p className="text-xs text-gray-500">XXXX-XXXX-1234</p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-[#3A7717]" />
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#bff202]/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#eafde7] rounded-lg flex items-center justify-center">
                      <span className="text-xl">💳</span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#01312D]">UPI ID</p>
                      <p className="text-xs text-gray-500">rajesh@okhdfcbank</p>
                    </div>
                  </div>
                  <button className="text-[#72bf00] text-sm font-semibold">
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            {/* Account Settings */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <h3 className="font-bold text-[#01312D] mb-3">
                Account Settings
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between py-2">
                  <span className="text-[#01312D]">Change Password</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between py-2">
                  <span className="text-[#01312D]">Change Phone Number</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between py-2">
                  <span className="text-[#01312D]">Update Email</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between py-2">
                  <span className="text-[#01312D]">Update Vehicle Details</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <h3 className="font-bold text-[#01312D] mb-3">Notifications</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#01312D]">
                      Push Notifications
                    </p>
                    <p className="text-xs text-gray-500">
                      Get alerts about requests and payments
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      defaultChecked
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3A7717]"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#01312D]">
                      Email Notifications
                    </p>
                    <p className="text-xs text-gray-500">
                      Receive email for important updates
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      defaultChecked
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3A7717]"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#01312D]">SMS Alerts</p>
                    <p className="text-xs text-gray-500">
                      Get SMS for OTP and confirmations
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3A7717]"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Support & Legal */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <h3 className="font-bold text-[#01312D] mb-3">Support & Legal</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between py-2">
                  <span className="text-[#01312D]">Help Center</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between py-2">
                  <span className="text-[#01312D]">Terms & Conditions</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between py-2">
                  <span className="text-[#01312D]">Privacy Policy</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between py-2">
                  <span className="text-[#01312D]">About Us</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
              <h3 className="font-bold text-red-600 mb-3">Danger Zone</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-between py-2 text-red-600">
                  <span>Delete Account</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button className="w-full flex items-center justify-between py-2 text-red-600">
                  <span>Deactivate Account</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Logout Button */}
            <button className="w-full bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 mt-4">
              <LogOut className="w-5 h-5" />
              Log Out
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-[#bff202]/20 px-6 py-2 z-50 shadow-lg">
        <div className="flex justify-around items-center">
          {[
            { icon: HomeIcon, label: "Home", path: "/" },
            { icon: ClipboardIcon, label: "Requests", path: "/requests" },
            { icon: HistoryIcon, label: "History", path: "/requests/history" },
            {
              icon: UserIcon,
              label: "Profile",
              active: true,
              path: "/profile",
            },
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
