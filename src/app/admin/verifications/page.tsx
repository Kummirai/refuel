// src/app/admin/verifications/page.tsx
"use client";

import { useState } from "react";
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
} from "lucide-react";

export default function VerificationsPage() {
  const [selectedTab, setSelectedTab] = useState<
    "pending" | "approved" | "rejected"
  >("pending");
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const verifications = [
    {
      id: 1,
      name: "Rajesh Kumar",
      email: "rajesh@example.com",
      phone: "+91 98765 43210",
      address: "123, Main Street, Bangalore",
      carRegistration: "KA01AB1234",
      carModel: "Hyundai i20",
      carYear: "2022",
      submittedDate: "2024-01-20",
      status: "pending",
      documents: {
        license: "/images/license1.jpg",
        registration: "/images/rc1.jpg",
        profile: "/images/profile1.jpg",
      },
    },
    {
      id: 2,
      name: "Priya Singh",
      email: "priya@example.com",
      phone: "+91 98765 43211",
      address: "456, Park Avenue, Mumbai",
      carRegistration: "MH02CD5678",
      carModel: "Maruti Suzuki Swift",
      carYear: "2023",
      submittedDate: "2024-01-20",
      status: "pending",
      documents: {
        license: "/images/license2.jpg",
        registration: "/images/rc2.jpg",
        profile: "/images/profile2.jpg",
      },
    },
    {
      id: 3,
      name: "Amit Patel",
      email: "amit@example.com",
      phone: "+91 98765 43212",
      address: "789, Lake View, Delhi",
      carRegistration: "DL03EF9012",
      carModel: "Toyota Innova",
      carYear: "2021",
      submittedDate: "2024-01-19",
      status: "pending",
      documents: {
        license: "/images/license3.jpg",
        registration: "/images/rc3.jpg",
        profile: "/images/profile3.jpg",
      },
    },
  ];

  const filteredVerifications = verifications.filter(
    (v) => v.status === selectedTab,
  );

  const handleApprove = (driver: any) => {
    // API call to approve
    alert(`Approved ${driver.name}'s verification`);
  };

  const handleReject = (driver: any) => {
    // API call to reject
    alert(`Rejected ${driver.name}'s verification`);
  };

  const ViewDetailsModal = ({ driver, onClose }: any) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#bff202]/20 p-5 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#01312D]">Driver Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#eafde7] rounded-lg"
          >
            <XCircle className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Profile */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-[#eafde7] rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-[#3A7717]" />
            </div>
            <div>
              <h3 className="font-bold text-[#01312D] text-lg">
                {driver.name}
              </h3>
              <p className="text-gray-500 text-sm">{driver.email}</p>
              <p className="text-gray-500 text-sm">{driver.phone}</p>
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-[#eafde7] rounded-xl p-4">
            <h4 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-[#3A7717]" />
              Personal Information
            </h4>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-500">Address:</span> {driver.address}
              </p>
              <p>
                <span className="text-gray-500">Submitted:</span>{" "}
                {driver.submittedDate}
              </p>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="bg-[#eafde7] rounded-xl p-4">
            <h4 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
              <Car className="w-4 h-4 text-[#3A7717]" />
              Vehicle Information
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p>
                <span className="text-gray-500">Registration:</span>{" "}
                {driver.carRegistration}
              </p>
              <p>
                <span className="text-gray-500">Model:</span> {driver.carModel}
              </p>
              <p>
                <span className="text-gray-500">Year:</span> {driver.carYear}
              </p>
            </div>
          </div>

          {/* Documents */}
          <div>
            <h4 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#3A7717]" />
              Documents
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Driver's License</p>
                <div className="bg-[#eafde7] rounded-lg h-24 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-gray-400" />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">RC Document</p>
                <div className="bg-[#eafde7] rounded-lg h-24 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-gray-400" />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Profile Photo</p>
                <div className="bg-[#eafde7] rounded-lg h-24 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[#bff202]/20 p-5 flex gap-3">
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
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#01312D]">
          Driver Verifications
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Review and verify driver applications
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or registration..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
          />
        </div>
        <button className="px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </button>
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
            {tab === "pending" &&
              verifications.filter((v) => v.status === "pending").length >
                0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {verifications.filter((v) => v.status === "pending").length}
                </span>
              )}
          </button>
        ))}
      </div>

      {/* Verifications List */}
      <div className="space-y-3">
        {filteredVerifications.map((driver) => (
          <div
            key={driver.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20"
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#eafde7] rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-[#3A7717]" />
                </div>
                <div>
                  <p className="font-semibold text-[#01312D]">{driver.name}</p>
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
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        <button className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-[#bff202]/20">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 bg-[#3A7717] text-white rounded-lg flex items-center justify-center">
          1
        </button>
        <button className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-[#bff202]/20">
          2
        </button>
        <button className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-[#bff202]/20">
          3
        </button>
        <button className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-[#bff202]/20">
          <ChevronRight className="w-4 h-4" />
        </button>
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
