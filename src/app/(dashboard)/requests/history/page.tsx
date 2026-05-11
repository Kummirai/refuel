// src/app/requests/history/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import BottomNavigation from "@/components/BottomNavigation";
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
  Home,
  ClipboardList,
  History,
  User,
  Upload,
  FileText,
  AlertCircle,
  Wallet,
  Hourglass,
  ShieldCheck,
  Calendar,
  TrendingUp,
  Truck,
  Receipt,
  Banknote,
} from "lucide-react";
import { PopUploadModal } from "@/components/PopUploadModal";
import { RepaymentProofModal } from "@/components/RepaymentProofModal";

type RequestStatus = "pending" | "approved" | "sent" | "completed" | "rejected";
type RepaymentStatus = "pending" | "approved" | "rejected";

interface RepaymentRecord {
  id: string;
  amount: number;
  status: RepaymentStatus;
  submittedAt: string;
  approvedAt?: string;
  proofUrl?: string;
  proofPublicId?: string;
  remainingBalance?: number;
  isFullyPaid?: boolean;
}

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
  actualAmount?: number;
  popUrl?: string;
  popUploadedAt?: string;
  dailyPayment?: number;
  repaymentDays?: number;
  serviceCharge?: number;
  totalDue?: number;
  package?: string;
  packageDescription?: string;
  sentDate?: string;
  approvedDate?: string;
  completedDate?: string;
  // Repayment fields
  repaidAmount?: number;
  remainingBalance?: number;
  isPaid?: boolean;
  hasPendingRepayment?: boolean;
  pendingRepaymentAmount?: number;
  pendingRepaymentStatus?: RepaymentStatus;
  repayments?: RepaymentRecord[];
  requestDate: string; // Original request date field
}

export default function RequestHistoryPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "pending" | "approved" | "completed" | "rejected"
  >("all");
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPopModal, setShowPopModal] = useState(false);
  const [selectedRequestForPop, setSelectedRequestForPop] =
    useState<Request | null>(null);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [selectedRequestForRepayment, setSelectedRequestForRepayment] =
    useState<Request | null>(null);

  // Modal states for alerts
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
        console.log("Fetched requests:", data);

        const requestsWithRepayments = await Promise.all(
          data.map(async (req: any) => {
            const requestId =
              req.id || (req._id?.toString ? req._id.toString() : req._id);

            try {
              const repaymentResponse = await fetch(
                `/api/driver/repayment-proof/getproof?requestId=${requestId}`,
              );
              let repayments = [];
              if (repaymentResponse.ok) {
                repayments = await repaymentResponse.json();
              }

              const hasPendingRepayment = repayments.some(
                (r: any) => r.status === "pending",
              );
              const pendingRepayment = repayments.find(
                (r: any) => r.status === "pending",
              );

              // CALCULATE remaining balance from approved repayments
              const totalRepayable = req.totalRepayable || req.amount;
              const totalApprovedRepayments = repayments
                .filter((r: any) => r.status === "approved")
                .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

              const calculatedRemainingBalance = Math.max(
                0,
                totalRepayable - totalApprovedRepayments,
              );
              const isPaid = calculatedRemainingBalance <= 0;

              return {
                ...req,
                id: requestId,
                repaidAmount: totalApprovedRepayments,
                remainingBalance: calculatedRemainingBalance, // USE CALCULATED VALUE
                isPaid: isPaid,
                hasPendingRepayment: hasPendingRepayment,
                pendingRepaymentAmount: pendingRepayment?.amount || 0,
                pendingRepaymentStatus: pendingRepayment?.status || null,
                repayments: repayments,
              };
            } catch (err) {
              // Calculate from request data if repayments fetch fails
              const totalRepayable = req.totalRepayable || req.amount;
              const calculatedRemainingBalance = Math.max(
                0,
                totalRepayable - (req.repaidAmount || 0),
              );

              return {
                ...req,
                id: requestId,
                repaidAmount: req.repaidAmount || 0,
                remainingBalance: calculatedRemainingBalance,
                isPaid: req.isPaid || false,
                hasPendingRepayment: false,
                pendingRepaymentAmount: 0,
                pendingRepaymentStatus: null,
                repayments: [],
              };
            }
          }),
        );

        setRequests(requestsWithRepayments);
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

  const getDisplayStatus = (status: RequestStatus): RequestStatus => {
    if (status === "sent") return "approved";
    return status;
  };

  const getStatusIcon = (status: RequestStatus) => {
    const displayStatus = getDisplayStatus(status);
    switch (displayStatus) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-[#3A7717]" />;
      case "approved":
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: RequestStatus) => {
    const displayStatus = getDisplayStatus(status);
    switch (displayStatus) {
      case "completed":
        return "Completed";
      case "approved":
        return "Approved - Upload Receipt";
      case "pending":
        return "Pending";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    const displayStatus = getDisplayStatus(status);
    switch (displayStatus) {
      case "completed":
        return "text-[#3A7717] bg-[#3A7717]/10";
      case "approved":
        return "text-blue-600 bg-blue-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "rejected":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getRepaymentStatusBadge = (status: RepaymentStatus) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Repayment Approved
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
            <Hourglass className="w-3 h-3" />
            Repayment Pending Review
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Repayment Rejected
          </span>
        );
      default:
        return null;
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
      default:
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
      default:
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
      default:
        return "Service";
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "approved") {
      return r.status === "approved" || r.status === "sent";
    }
    return r.status === selectedFilter;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter(
      (r) => r.status === "approved" || r.status === "sent",
    ).length,
    completed: requests.filter((r) => r.status === "completed").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    totalSpent: requests.reduce(
      (sum: number, r: any) => sum + (r.actualAmount || r.amount),
      0,
    ),
    totalOutstanding: requests.reduce(
      (sum: number, r: any) => sum + (r.remainingBalance || 0),
      0,
    ),
  };

  // Helper function to check if request needs receipt upload
  const needsReceiptUpload = (request: Request) => {
    const serviceTypesNeedingReceipt = ["fuel", "carwash"];
    return (
      (request.status === "approved" || request.status === "sent") &&
      serviceTypesNeedingReceipt.includes(request.type) &&
      !request.popUrl
    );
  };

  // Success Modal Component
  const SuccessModal = () => {
    if (!showSuccessModal) return null;

    const isPopRelated =
      successMessage.includes("POP") ||
      successMessage.includes("Proof of Payment") ||
      successMessage.includes("Receipt");
    const isRepaymentRelated =
      successMessage.includes("repayment") ||
      successMessage.includes("Repayment");

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowSuccessModal(false)}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-t-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                {isPopRelated ? (
                  <Receipt className="w-6 h-6 text-white" />
                ) : isRepaymentRelated ? (
                  <Banknote className="w-6 h-6 text-white" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isPopRelated
                    ? "Receipt Uploaded!"
                    : isRepaymentRelated
                      ? "Repayment Submitted!"
                      : "Success!"}
                </h2>
                <p className="text-white/80 text-sm">
                  {isPopRelated
                    ? "Proof of Payment received"
                    : isRepaymentRelated
                      ? "Repayment proof submitted"
                      : "Operation completed"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {isPopRelated ? (
                <Receipt className="w-10 h-10 text-green-600" />
              ) : isRepaymentRelated ? (
                <Banknote className="w-10 h-10 text-green-600" />
              ) : (
                <CheckCircle className="w-10 h-10 text-green-600" />
              )}
            </div>
            <p className="text-[#01312D] font-semibold mb-2">
              {successMessage}
            </p>
            {isPopRelated && (
              <p className="text-gray-500 text-sm mt-2">
                Your service request will be marked as completed once verified.
              </p>
            )}
            {isRepaymentRelated && (
              <p className="text-gray-500 text-sm mt-2">
                Your repayment will be processed once our admin verifies it.
              </p>
            )}
          </div>

          <div className="border-t border-gray-100 p-5">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-[#01312D] text-white py-2 rounded-xl font-semibold hover:bg-[#3A7717] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Error Modal Component
  const ErrorModal = () => {
    if (!showErrorModal) return null;

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowErrorModal(false)}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Error!</h2>
                <p className="text-white/80 text-sm">Operation failed</p>
              </div>
            </div>
          </div>

          <div className="p-5 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <p className="text-[#01312D] font-semibold mb-2">{errorMessage}</p>
          </div>

          <div className="border-t border-gray-100 p-5">
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-red-500 text-white py-2 rounded-xl font-semibold hover:bg-red-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const RequestDetailModal = ({
    request,
    onClose,
  }: {
    request: Request;
    onClose: () => void;
  }) => {
    const IconComponent = getTypeIcon(request.type);
    const date = new Date(request.date);
    // Driver needs to upload POP for "approved" OR "sent" status for BOTH fuel AND carwash
    const needsPopUpload = needsReceiptUpload(request);
    const needsRepayment =
      request.status === "completed" &&
      !request.isPaid &&
      request.remainingBalance &&
      request.remainingBalance > 0;
    const repaidAmount =
      (request.totalRepayable || 0) - (request.remainingBalance || 0);
    const progressPercent = request.totalRepayable
      ? Math.round((repaidAmount / request.totalRepayable) * 100)
      : 0;

    if (!IconComponent) {
      return null;
    }

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
                <IconComponent className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#01312D]">
                  {getTypeLabel(request.type)} Request
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
            {/* Amount Section */}
            <div className="bg-[#eafde7] rounded-xl p-4">
              {request.type === "carwash" ? (
                <>
                  {request.package && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-500 text-sm">Package</span>
                      <span className="font-semibold text-[#01312D]">
                        {request.package}
                      </span>
                    </div>
                  )}
                  {request.packageDescription && (
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-gray-500 text-sm">Includes</span>
                      <span className="font-semibold text-[#01312D] text-right text-xs max-w-[60%]">
                        {request.packageDescription}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500 text-sm">Package Price</span>
                    <span className="text-xl font-bold text-[#01312D]">
                      R{request.amount.toLocaleString()}
                    </span>
                  </div>
                  {(request.serviceCharge ?? 0) > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-500 text-sm">
                        Service Charge
                      </span>
                      <span className="font-semibold text-[#01312D]">
                        + R{(request.serviceCharge ?? 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-3 pt-2 border-t border-[#bff202]/30">
                    <span className="text-gray-500 text-sm font-semibold">
                      Total Due
                    </span>
                    <span className="text-2xl font-bold text-[#3A7717]">
                      R{(request.totalDue ?? request.amount).toLocaleString()}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500 text-sm">
                      Requested Amount
                    </span>
                    <span className="text-2xl font-bold text-[#01312D]">
                      R{request.amount.toLocaleString()}
                    </span>
                  </div>
                  {request.actualAmount && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-500 text-sm">
                        Actual Amount Used
                      </span>
                      <span className="text-xl font-bold text-[#3A7717]">
                        R{request.actualAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </>
              )}
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

            {/* Timeline Dates */}
            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#3A7717]" />
                Timeline
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Request Date:</span>
                  <span className="font-semibold text-[#01312D]">
                    {new Date(request.requestDate).toLocaleString()}
                  </span>
                </div>
                {request.approvedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Approved Date:</span>
                    <span className="font-semibold text-[#01312D]">
                      {new Date(request.approvedDate).toLocaleString()}
                    </span>
                  </div>
                )}
                {request.completedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Completed Date:</span>
                    <span className="font-semibold text-[#3A7717]">
                      {new Date(request.completedDate).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Repayment Progress Section */}
            {request.actualAmount &&
              request.totalRepayable &&
              request.status === "completed" && (
                <div className="bg-[#eafde7] rounded-xl p-4">
                  <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-[#3A7717]" />
                    Loan Repayment Progress
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Loan Amount:</span>
                      <span className="font-semibold">
                        R{request.totalRepayable.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Repaid Amount:</span>
                      <span className="font-semibold text-[#3A7717]">
                        R{repaidAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Outstanding Balance:
                      </span>
                      <span className="font-bold text-red-600">
                        R{(request.remainingBalance || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#3A7717] h-2 rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {progressPercent}% of loan repaid
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Upload Proof of Payment (POP) Section - for service completion */}
            {needsPopUpload && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-start gap-2">
                  <Receipt className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-800">
                      Upload Receipt
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {request.type === "carwash"
                        ? `Your car wash request has been approved! Please upload your proof of payment to confirm the total of R${(request.totalDue ?? request.amount).toLocaleString()}.`
                        : "Your fuel request has been approved! Please upload your proof of payment receipt to confirm service delivery."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Repayment Proof Section - for loan repayments */}
            {needsRepayment && !request.hasPendingRepayment && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-start gap-2">
                  <Banknote className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-800">
                      Make a Loan Repayment
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      You have an outstanding balance. Upload proof of repayment
                      to reduce your loan balance.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Repayment Section */}
            {request.hasPendingRepayment && (
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                  <Hourglass className="w-4 h-4" />
                  Pending Repayment Verification
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-yellow-700">Amount:</span>
                    <span className="font-bold text-yellow-800">
                      R{request.pendingRepaymentAmount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-yellow-700">Status:</span>
                    {getRepaymentStatusBadge(
                      request.pendingRepaymentStatus || "pending",
                    )}
                  </div>
                  <p className="text-xs text-yellow-600 mt-2">
                    Your repayment proof is being reviewed by our admin. You'll
                    be notified once verified.
                  </p>
                </div>
              </div>
            )}

            {/* Repayment History Section */}
            {request.repayments && request.repayments.length > 0 && (
              <div className="bg-[#eafde7] rounded-xl p-4">
                <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-[#3A7717]" />
                  Repayment History
                </h3>
                <div className="space-y-2">
                  {request.repayments.map((repayment, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2 bg-white rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-[#3A7717]">
                          R{repayment.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(repayment.submittedAt).toLocaleDateString()}
                        </p>
                        {repayment.remainingBalance !== undefined && (
                          <p className="text-xs text-gray-400">
                            Remaining Loan: R
                            {repayment.remainingBalance.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {getRepaymentStatusBadge(repayment.status)}
                        {repayment.proofUrl && (
                          <a
                            href={repayment.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#3A7717] underline block mt-1"
                          >
                            View Repayment Proof
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 text-sm">
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
              {request.otp &&
                (request.status === "approved" ||
                  request.status === "sent") && (
                  <div className="mt-3 pt-3 border-t border-[#bff202]/20">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Service OTP:</span>
                      <code className="bg-white px-3 py-1 rounded-lg font-mono text-lg font-bold text-[#01312D]">
                        {request.otp}
                      </code>
                    </div>
                  </div>
                )}
              {request.popUrl && (
                <div className="mt-3 pt-3 border-t border-[#bff202]/20">
                  <p className="text-gray-500 mb-2">Uploaded Receipt:</p>
                  <a
                    href={request.popUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3A7717] font-semibold text-sm flex items-center gap-2 underline"
                  >
                    <Receipt className="w-4 h-4" />
                    View Receipt
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="sticky bottom-0 bg-white border-t border-[#bff202]/20 p-5 space-y-2">
            {/* Upload POP Button - For service completion (Fuel & Car Wash) */}
            {needsPopUpload && (
              <button
                onClick={() => {
                  onClose();
                  setSelectedRequestForPop(request);
                  setShowPopModal(true);
                }}
                className="w-full bg-[#3A7717] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#2d5a12] transition-all"
              >
                <Receipt className="w-4 h-4" />
                Upload Receipt
              </button>
            )}

            {/* Upload Repayment Button - For loan repayments */}
            {needsRepayment && !request.hasPendingRepayment && (
              <button
                onClick={() => {
                  onClose();
                  setSelectedRequestForRepayment(request);
                  setShowRepaymentModal(true);
                }}
                className="w-full bg-[#01312D] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#3A7717] transition-all"
              >
                <Banknote className="w-4 h-4" />
                Upload Proof of Repayment
              </button>
            )}

            {/* Pending Repayment Status */}
            {request.hasPendingRepayment && (
              <div className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-yellow-100 text-yellow-700">
                <Hourglass className="w-4 h-4" />
                Repayment Pending Approval
              </div>
            )}

            {/* Download Receipt Button */}
            {(request.popUrl || request.status === "completed") && (
              <button
                onClick={() => {
                  if (request.popUrl) {
                    window.open(request.popUrl, "_blank");
                  }
                }}
                className="w-full bg-[#eafde7] text-[#01312D] py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#bff202]/30 transition-all"
              >
                <Download className="w-4 h-4" />
                Download Receipt
              </button>
            )}
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
          <div className="grid grid-cols-3 gap-2 mt-4">
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
              <p className="text-xs text-gray-500">Approved</p>
              <p className="text-lg font-bold text-blue-600">
                {stats.approved}
              </p>
            </div>
            <div className="bg-white rounded-xl p-2 text-center shadow-sm border border-[#bff202]/20">
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-lg font-bold text-[#3A7717]">
                {stats.completed}
              </p>
            </div>
            <div className="bg-white rounded-xl p-2 text-center shadow-sm border border-[#bff202]/20">
              <p className="text-xs text-gray-500">Outstanding</p>
              <p className="text-lg font-bold text-red-600">
                R{stats.totalOutstanding.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Filter Tabs */}
      <div className="px-5 pt-4 pb-2 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 flex-wrap items-center justify-center">
          {["all", "pending", "approved", "completed", "rejected"].map(
            (filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter as any)}
                className={`px-7 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap  ${
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
                {filter !== "all" &&
                  filter === "approved" &&
                  stats.approved > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                      {stats.approved}
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
              const IconComponent = getTypeIcon(request.type);
              const typeColor = getTypeColor(request.type);
              const statusColor = getStatusColor(request.status);
              const date = new Date(request.date);
              const needsPopUpload = needsReceiptUpload(request);
              const needsRepayment =
                request.status === "completed" &&
                !request.isPaid &&
                request.remainingBalance &&
                request.remainingBalance > 0 &&
                !request.hasPendingRepayment;
              const hasOutstanding =
                request.remainingBalance &&
                request.remainingBalance > 0 &&
                !request.isPaid;

              return (
                <div
                  key={request.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowDetailModal(true);
                  }}
                >
                  <div className="flex flex-col items-start gap-3 justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeColor}`}
                      >
                        {IconComponent && <IconComponent className="w-5 h-5" />}
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

                  <div className="flex justify-between items-between mb-3">
                    <div>
                      <p className="text-2xl font-bold text-[#01312D]">
                        R{request.amount.toLocaleString()}
                      </p>
                      {hasOutstanding && request.type !== "carwash" && (
                        <p className="text-xs text-red-600 mt-1">
                          Outstanding Loan: R
                          {(request.remainingBalance || 0).toLocaleString()}
                        </p>
                      )}
                      {request.type === "carwash" &&
                        (request.serviceCharge ?? 0) > 0 && (
                          <p className="text-xs text-[#3A7717] mt-1">
                            Total due: R
                            {(
                              request.totalDue ?? request.amount
                            ).toLocaleString()}
                          </p>
                        )}
                      {request.hasPendingRepayment && (
                        <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                          <Hourglass className="w-3 h-3" />
                          Repayment pending verification: R
                          {request.pendingRepaymentAmount?.toLocaleString()}
                        </p>
                      )}
                      {/* <p className="text-xs text-gray-500">
                        {date.toLocaleDateString()} at{" "}
                        {date.toLocaleTimeString()}
                      </p> */}
                    </div>
                    {request.otp &&
                      (request.status === "approved" ||
                        request.status === "sent") && (
                        <div className="bg-[#bff202]/20 rounded-lg h-fit px-5 py-2">
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
                    {needsPopUpload && (
                      <button
                        className="flex-1 py-2 bg-[#3A7717] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#2d5a12] transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequestForPop(request);
                          setShowPopModal(true);
                        }}
                      >
                        <Receipt className="w-4 h-4" />
                        Upload Receipt
                      </button>
                    )}
                    {needsRepayment && (
                      <button
                        className="flex-1 py-2 bg-[#01312D] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#3A7717] transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequestForRepayment(request);
                          setShowRepaymentModal(true);
                        }}
                      >
                        <Banknote className="w-4 h-4" />
                        Repay Loan
                      </button>
                    )}
                    {(request.popUrl || request.status === "completed") && (
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
      {/* Modals */}
      {showDetailModal && selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setShowDetailModal(false)}
        />
      )}
      {showPopModal && selectedRequestForPop && (
        <PopUploadModal
          isOpen={showPopModal}
          onClose={() => {
            setShowPopModal(false);
            setSelectedRequestForPop(null);
          }}
          requestId={selectedRequestForPop.id}
          requestType={selectedRequestForPop.type}
          requestedAmount={selectedRequestForPop.amount}
          serviceCharge={selectedRequestForPop.serviceCharge ?? 0}
          // For car wash, use totalRepayable which already includes service charge
          // For other services, use totalDue or amount
          totalDue={
            selectedRequestForPop.type === "carwash"
              ? selectedRequestForPop.totalRepayable ||
                selectedRequestForPop.amount
              : (selectedRequestForPop.totalDue ?? selectedRequestForPop.amount)
          }
          packageName={selectedRequestForPop.package}
          onSuccess={() => {
            fetchRequests();
            setShowPopModal(false);
            setSelectedRequestForPop(null);
            setSuccessMessage(
              "Your receipt has been uploaded successfully! Our admin will verify it shortly.",
            );
            setShowSuccessModal(true);
          }}
        />
      )}
      {showRepaymentModal && selectedRequestForRepayment && (
        <RepaymentProofModal
          isOpen={showRepaymentModal}
          onClose={() => {
            setShowRepaymentModal(false);
            setSelectedRequestForRepayment(null);
          }}
          requestId={selectedRequestForRepayment.id}
          requestedAmount={selectedRequestForRepayment.amount}
          remainingBalance={
            selectedRequestForRepayment.remainingBalance ||
            selectedRequestForRepayment.totalRepayable ||
            selectedRequestForRepayment.amount
          }
          totalRepayable={
            selectedRequestForRepayment.totalRepayable ||
            selectedRequestForRepayment.amount
          }
          onSuccess={() => {
            fetchRequests();
            setShowRepaymentModal(false);
            setSelectedRequestForRepayment(null);
            setSuccessMessage(
              "Your Proof of Repayment has been submitted for approval!",
            );
            setShowSuccessModal(true);
          }}
        />
      )}
      <SuccessModal />
      <ErrorModal />
      {/* Bottom Navigation with Notification Badge */}
      <BottomNavigation approvedCount={stats.approved} isAdmin={false} />
    </div>
  );
}
