// src/app/admin/service-requests/page.tsx
"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Fuel,
  Smartphone,
  DollarSign,
  Car,
  ChevronLeft,
  ChevronRight,
  Download,
  Send,
  MessageCircle,
  TrendingUp,
  Calendar,
  User,
  MapPin,
  Phone,
  Copy,
  Check,
} from "lucide-react";

type RequestType = "fuel" | "airtime" | "cash" | "carwash";
type RequestStatus = "pending" | "approved" | "completed" | "rejected";

interface ServiceRequest {
  id: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  carRegistration: string;
  location: string;
  type: RequestType;
  amount: number;
  fuelType?: "petrol" | "diesel";
  phoneNumber?: string; // for airtime
  interest?: number; // for cash loans
  totalRepayable?: number; // for cash loans
  repaymentDays?: number; // for cash loans
  status: RequestStatus;
  otp?: string;
  requestDate: string;
  approvedDate?: string;
  completedDate?: string;
}

export default function AdminServiceRequestsPage() {
  const [selectedTab, setSelectedTab] = useState<
    "all" | "pending" | "approved" | "completed" | "rejected"
  >("pending");
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(
    null,
  );
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<RequestType | "all">("all");
  const [copiedOtp, setCopiedOtp] = useState<string | null>(null);

  // Sample data - will be replaced with Supabase
  const requests: ServiceRequest[] = [
    {
      id: "REQ001",
      driverName: "Rajesh Kumar",
      driverEmail: "rajesh@example.com",
      driverPhone: "+91 98765 43210",
      carRegistration: "KA01AB1234",
      location: "Indiranagar, Bangalore",
      type: "fuel",
      amount: 2500,
      fuelType: "petrol",
      status: "pending",
      requestDate: "2024-01-20T10:30:00",
    },
    {
      id: "REQ002",
      driverName: "Priya Singh",
      driverEmail: "priya@example.com",
      driverPhone: "+91 98765 43211",
      carRegistration: "MH02CD5678",
      location: "Andheri, Mumbai",
      type: "cash",
      amount: 15000,
      interest: 13,
      totalRepayable: 16950,
      repaymentDays: 14,
      status: "pending",
      requestDate: "2024-01-20T11:45:00",
    },
    {
      id: "REQ003",
      driverName: "Amit Patel",
      driverEmail: "amit@example.com",
      driverPhone: "+91 98765 43212",
      carRegistration: "DL03EF9012",
      location: "Connaught Place, Delhi",
      type: "airtime",
      amount: 500,
      phoneNumber: "+91 98765 43212",
      status: "approved",
      otp: "123456",
      requestDate: "2024-01-19T14:20:00",
      approvedDate: "2024-01-19T15:00:00",
    },
    {
      id: "REQ004",
      driverName: "Sneha Reddy",
      driverEmail: "sneha@example.com",
      driverPhone: "+91 98765 43213",
      carRegistration: "TS09GH3456",
      location: "Hitech City, Hyderabad",
      type: "carwash",
      amount: 999,
      status: "completed",
      otp: "789012",
      requestDate: "2024-01-18T09:15:00",
      approvedDate: "2024-01-18T10:00:00",
      completedDate: "2024-01-18T15:30:00",
    },
    {
      id: "REQ005",
      driverName: "Vikram Singh",
      driverEmail: "vikram@example.com",
      driverPhone: "+91 98765 43214",
      carRegistration: "RJ14IJ7890",
      location: "Vaishali Nagar, Jaipur",
      type: "fuel",
      amount: 3000,
      fuelType: "diesel",
      status: "pending",
      requestDate: "2024-01-20T09:00:00",
    },
  ];

  const getStatusBadge = (status: RequestStatus) => {
    const config = {
      pending: {
        icon: Clock,
        text: "Pending",
        color: "bg-yellow-100 text-yellow-700",
      },
      approved: {
        icon: CheckCircle,
        text: "Approved",
        color: "bg-blue-100 text-blue-700",
      },
      completed: {
        icon: CheckCircle,
        text: "Completed",
        color: "bg-green-100 text-green-700",
      },
      rejected: {
        icon: XCircle,
        text: "Rejected",
        color: "bg-red-100 text-red-700",
      },
    };
    const { icon: Icon, text, color } = config[status];
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${color}`}
      >
        <Icon className="w-3 h-3" />
        {text}
      </span>
    );
  };

  const getTypeIcon = (type: RequestType) => {
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

  const getTypeColor = (type: RequestType) => {
    switch (type) {
      case "fuel":
        return "bg-green-100 text-green-700";
      case "airtime":
        return "bg-blue-100 text-blue-700";
      case "cash":
        return "bg-yellow-100 text-yellow-700";
      case "carwash":
        return "bg-purple-100 text-purple-700";
    }
  };

  const getTypeLabel = (type: RequestType) => {
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

  const handleApprove = (request: ServiceRequest) => {
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    alert(`Approved ${request.id} with OTP: ${otp}`);
    // In production: Update database and send WhatsApp
  };

  const handleReject = (request: ServiceRequest) => {
    const reason = prompt("Please enter rejection reason:");
    if (reason) {
      alert(`Rejected ${request.id} - Reason: ${reason}`);
      // In production: Update database
    }
  };

  const handleComplete = (request: ServiceRequest) => {
    alert(`Marked ${request.id} as completed`);
    // In production: Update database
  };

  const handleSendWhatsApp = (request: ServiceRequest) => {
    const message = `DriveHub Service Request Confirmation\n\nRequest ID: ${request.id}\nDriver: ${request.driverName}\nCar: ${request.carRegistration}\nService: ${getTypeLabel(request.type)}\nAmount: R${request.amount}\nOTP: ${request.otp || "N/A"}\n\nPlease show this OTP to the cashier/attendant.`;
    const whatsappUrl = `https://wa.me/${request.driverPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCopyOtp = (otp: string) => {
    navigator.clipboard.writeText(otp);
    setCopiedOtp(otp);
    setTimeout(() => setCopiedOtp(null), 2000);
  };

  const filteredRequests = requests
    .filter((r) => selectedTab === "all" || r.status === selectedTab)
    .filter((r) => selectedType === "all" || r.type === selectedType)
    .filter(
      (r) =>
        r.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.carRegistration.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    completed: requests.filter((r) => r.status === "completed").length,
    totalAmount: requests.reduce((sum, r) => sum + r.amount, 0),
  };

  const ViewDetailsModal = ({
    request,
    onClose,
  }: {
    request: ServiceRequest;
    onClose: () => void;
  }) => {
    const TypeIcon = getTypeIcon(request.type);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-[#bff202]/20 p-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeColor(request.type)}`}
              >
                <TypeIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#01312D]">
                  Request Details
                </h2>
                <p className="text-xs text-gray-500">ID: {request.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#eafde7] rounded-lg"
            >
              <XCircle className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Driver Info */}
            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[#3A7717]" />
                Driver Information
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Name:</span>{" "}
                  {request.driverName}
                </p>
                <p>
                  <span className="text-gray-500">Email:</span>{" "}
                  {request.driverEmail}
                </p>
                <p>
                  <span className="text-gray-500">Phone:</span>{" "}
                  {request.driverPhone}
                </p>
                <p>
                  <span className="text-gray-500">Car Reg:</span>{" "}
                  {request.carRegistration}
                </p>
                <p>
                  <span className="text-gray-500">Location:</span>{" "}
                  {request.location}
                </p>
              </div>
            </div>

            {/* Request Details */}
            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#3A7717]" />
                Request Details
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Service:</span>{" "}
                  {getTypeLabel(request.type)}
                </p>
                <p>
                  <span className="text-gray-500">Amount:</span> R
                  {request.amount.toLocaleString()}
                </p>
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
                {request.type === "cash" && (
                  <>
                    <p>
                      <span className="text-gray-500">Interest (13%):</span> R
                      {request.interest}
                    </p>
                    <p>
                      <span className="text-gray-500">Total Repayable:</span> R
                      {request.totalRepayable?.toLocaleString()}
                    </p>
                    <p>
                      <span className="text-gray-500">Repayment Period:</span>{" "}
                      {request.repaymentDays} days
                    </p>
                  </>
                )}
                <p>
                  <span className="text-gray-500">Request Date:</span>{" "}
                  {new Date(request.requestDate).toLocaleString()}
                </p>
                {request.approvedDate && (
                  <p>
                    <span className="text-gray-500">Approved Date:</span>{" "}
                    {new Date(request.approvedDate).toLocaleString()}
                  </p>
                )}
                {request.otp && (
                  <div className="mt-2 pt-2 border-t border-[#bff202]/20">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">OTP:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-3 py-1 rounded-lg font-mono text-lg font-bold text-[#01312D]">
                          {request.otp}
                        </code>
                        <button
                          onClick={() => handleCopyOtp(request.otp!)}
                          className="p-1.5 bg-[#eafde7] rounded-lg hover:bg-[#bff202]/30 transition-colors"
                        >
                          {copiedOtp === request.otp ? (
                            <Check className="w-4 h-4 text-[#3A7717]" />
                          ) : (
                            <Copy className="w-4 h-4 text-[#3A7717]" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-[#bff202]/20 p-5 flex gap-3">
            {request.status === "pending" && (
              <>
                <button
                  onClick={() => {
                    handleApprove(request);
                    onClose();
                  }}
                  className="flex-1 bg-[#3A7717] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Request
                </button>
                <button
                  onClick={() => {
                    handleReject(request);
                    onClose();
                  }}
                  className="flex-1 bg-red-500 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}
            {request.status === "approved" && (
              <>
                <button
                  onClick={() => handleSendWhatsApp(request)}
                  className="flex-1 bg-[#25D366] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send WhatsApp
                </button>
                <button
                  onClick={() => {
                    handleComplete(request);
                    onClose();
                  }}
                  className="flex-1 bg-[#01312D] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Completed
                </button>
              </>
            )}
            {request.status === "completed" && (
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
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#01312D]">Service Requests</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage and approve driver service requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-xl font-bold text-[#01312D]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Approved</p>
          <p className="text-xl font-bold text-blue-600">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Completed</p>
          <p className="text-xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#bff202]/20">
          <p className="text-xs text-gray-500">Total Value</p>
          <p className="text-xl font-bold text-[#3A7717]">
            R{stats.totalAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, registration, or request ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as any)}
          className="px-4 py-2 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
        >
          <option value="all">All Types</option>
          <option value="fuel">Fuel</option>
          <option value="airtime">Airtime</option>
          <option value="cash">Cash Loan</option>
          <option value="carwash">Car Wash</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#bff202]/20 overflow-x-auto pb-0">
        {["all", "pending", "approved", "completed", "rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab as any)}
            className={`px-4 py-2 font-semibold capitalize transition-all whitespace-nowrap ${
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
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <div className="w-20 h-20 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500">No requests found</p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const TypeIcon = getTypeIcon(request.type);
            return (
              <div
                key={request.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTypeColor(request.type)}`}
                    >
                      <TypeIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-[#01312D]">
                          {getTypeLabel(request.type)}
                        </p>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm font-semibold text-[#01312D] mt-1">
                        {request.driverName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {request.carRegistration}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-[#01312D]">
                      R{request.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(request.requestDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowModal(true);
                    }}
                    className="flex-1 py-2 bg-[#eafde7] rounded-lg text-[#01312D] text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>

                  {request.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleApprove(request)}
                        className="flex-1 py-2 bg-[#3A7717] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(request)}
                        className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}

                  {request.status === "approved" && (
                    <>
                      <button
                        onClick={() => handleSendWhatsApp(request)}
                        className="flex-1 py-2 bg-[#25D366] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        WhatsApp
                      </button>
                      <button
                        onClick={() => handleComplete(request)}
                        className="flex-1 py-2 bg-[#01312D] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Complete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {filteredRequests.length > 0 && (
        <div className="flex justify-center gap-2 pt-4">
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
      )}

      {/* Modal */}
      {showModal && selectedRequest && (
        <ViewDetailsModal
          request={selectedRequest}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
