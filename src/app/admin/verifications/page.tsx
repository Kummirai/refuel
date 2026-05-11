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
  MapPin,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Image as ImageIcon,
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
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedForAction, setSelectedForAction] = useState<any>(null);
  const [fetchingProfile, setFetchingProfile] = useState(false);

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const response = await fetch("/api/admin/drivers");
      if (response.ok) {
        const data = await response.json();

        // Only fetch basic info for the list (no profile details yet)
        const mappedDrivers = (data.drivers || []).map((driver: any) => ({
          id: driver.id || driver._id,
          userId: driver.userId,
          name: driver.name || driver.fullName,
          email: driver.email,
          verificationStatus: driver.verificationStatus,
          carRegistration:
            driver.carRegistration || driver.carRegistrationNumber,
          profilePhotoUrl: driver.profilePhotoUrl,
        }));

        const pendingDrivers = mappedDrivers.filter(
          (d: any) => d.verificationStatus === "pending",
        );
        const approvedDrivers = mappedDrivers.filter(
          (d: any) => d.verificationStatus === "approved",
        );
        const rejectedDrivers = mappedDrivers.filter(
          (d: any) => d.verificationStatus === "rejected",
        );

        setVerifications(mappedDrivers);
        setStats({
          pending: pendingDrivers.length,
          approved: approvedDrivers.length,
          rejected: rejectedDrivers.length,
          total: mappedDrivers.length,
        });
      }
    } catch (error) {
      console.error("Error fetching verifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDriverProfile = async (userId: string) => {
    console.log(`front end ${userId}`);

    setFetchingProfile(true);
    try {
      const response = await fetch(
        `/api/admin/drivers/profile?userId=${userId}`,
      );

      if (response.ok) {
        const data = await response.json();
        
        return data.profile;
      }
      return null;
    } catch (error) {
      console.error("Error fetching driver profile:", error);
      return null;
    } finally {
      setFetchingProfile(false);
    }
  };

  const handleViewDetails = async (driver: any) => {
    setSelectedDriver(driver);
    setShowModal(true);

    // Fetch full profile details
    const fullProfile = await fetchDriverProfile(driver.id);
    if (fullProfile) {
      setSelectedDriver((prev: any) => ({
        ...prev,
        ...fullProfile,
      }));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVerifications();
  };

  const openApproveModal = (driver: any) => {
    setSelectedForAction(driver);
    setShowApproveModal(true);
    setShowModal(false);
  };

  const openRejectModal = (driver: any) => {
    setSelectedForAction(driver);
    setRejectReason("");
    setShowRejectModal(true);
    setShowModal(false);
  };

  const handleConfirmApprove = async () => {
    if (!selectedForAction) return;

    console.log(selectedForAction);

    setApproving(true);
    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId: selectedForAction.id,
          action: "approve",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // alert(`✅ Approved ${selectedForAction.name}'s verification`);
        fetchVerifications();
        setShowApproveModal(false);
        setSelectedForAction(null);
      } else {
        alert(data.error || "Failed to approve verification");
      }
    } catch (error) {
      console.error("Error approving verification:", error);
      alert("Failed to approve verification");
    } finally {
      setApproving(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedForAction) return;

    if (!rejectReason.trim()) {
      alert("Please enter a reason for rejection");
      return;
    }

    setRejecting(true);
    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId: selectedForAction.userId,
          action: "reject",
          reason: rejectReason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`❌ Rejected ${selectedForAction.name}'s verification`);
        fetchVerifications();
        setShowRejectModal(false);
        setSelectedForAction(null);
        setRejectReason("");
      } else {
        alert(data.error || "Failed to reject verification");
      }
    } catch (error) {
      console.error("Error rejecting verification:", error);
      alert("Failed to reject verification");
    } finally {
      setRejecting(false);
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

  // Approval Modal Component
  const ApproveModal = () => {
    if (!showApproveModal || !selectedForAction) return null;

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => !approving && setShowApproveModal(false)}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-t-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Confirm Approval
                </h2>
                <p className="text-white/80 text-sm">
                  Verify driver application
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="bg-[#eafde7] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-[#3A7717]" />
                <h3 className="font-semibold text-[#01312D]">Driver Summary</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Driver:</span>
                  <span className="font-semibold text-[#01312D]">
                    {selectedForAction.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-semibold text-[#01312D]">
                    {selectedForAction.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Car Registration:</span>
                  <span className="font-semibold text-[#01312D]">
                    {selectedForAction.carRegistration || "Not provided"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-xs text-green-800">
                    Are you sure you want to approve this driver?
                  </p>
                  <ul className="text-xs text-green-700 mt-1 space-y-0.5 list-disc list-inside">
                    <li>The driver will be notified via email</li>
                    <li>They can start requesting services immediately</li>
                    <li>This action can be reversed later</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t grid border-gray-100 p-5 gap-5">
            <button
              onClick={handleConfirmApprove}
              disabled={approving}
              className="flex-1 bg-linear-to-r from-green-500 to-green-600 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
            >
              {approving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirm Approval
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowApproveModal(false);
                setSelectedForAction(null);
              }}
              disabled={approving}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Rejection Modal
  const renderRejectionModal = () => {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => !rejecting && setShowRejectModal(false)}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Confirm Rejection
                </h2>
                <p className="text-white/80 text-sm">
                  Provide rejection reason
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="bg-[#eafde7] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-[#3A7717]" />
                <h3 className="font-semibold text-[#01312D]">Driver Summary</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Driver:</span>
                  <span className="font-semibold text-[#01312D]">
                    {selectedForAction.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-semibold text-[#01312D]">
                    {selectedForAction.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Car Registration:</span>
                  <span className="font-semibold text-[#01312D]">
                    {selectedForAction.carRegistration || "Not provided"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please explain why this verification is being rejected..."
                className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl focus:outline-none focus:border-red-500 resize-none"
                rows={4}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will be sent to the driver via email
              </p>
            </div>

            <div className="bg-red-50 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-xs text-red-800">
                    Are you sure you want to reject this verification?
                  </p>
                  <ul className="text-xs text-red-700 mt-1 space-y-0.5 list-disc list-inside">
                    <li>This action cannot be undone</li>
                    <li>The driver will be notified via email</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 p-5 flex gap-3">
            <button
              onClick={() => {
                setShowRejectModal(false);
                setSelectedForAction(null);
                setRejectReason("");
              }}
              disabled={rejecting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              disabled={rejecting}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
            >
              {rejecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Confirm Rejection
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ViewDetailsModal = ({
    driver,
    onClose,
  }: {
    driver: any;
    onClose: () => void;
  }) => {
    if (fetchingProfile && !driver.fullName) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          ></div>
          <div className="relative bg-white rounded-2xl max-w-md w-full p-8 text-center">
            <Loader2 className="w-12 h-12 text-[#3A7717] animate-spin mx-auto mb-4" />
            <p className="text-[#01312D]">Loading driver details...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        ></div>
        <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-[#bff202]/20 p-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {driver.profilePhotoUrl &&
              driver.profilePhotoUrl !== "pending" ? (
                <img
                  src={driver.profilePhotoUrl}
                  alt={driver.name}
                  className="w-12 h-12 rounded-full object-cover object-top border-2 border-[#72bf00]"
                />
              ) : (
                <div className="w-12 h-12 bg-[#eafde7] rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-[#01312D]">
                    {driver.name?.charAt(0) || "U"}
                  </span>
                </div>
              )}
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
                  <span className="text-gray-500">Full Name:</span>{" "}
                  <span className="font-semibold text-[#01312D]">
                    {driver.fullName || driver.name || "Not provided"}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-500">Email:</span>
                  <span className="font-semibold text-[#01312D]">
                    {driver.email || "Not provided"}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-semibold text-[#01312D]">
                    {driver.phone || "Not provided"}
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <MapPin className="w-3 h-3 text-gray-400 mt-0.5" />
                  <span className="text-gray-500">Address:</span>
                  <span className="font-semibold text-[#01312D]">
                    {driver.address ? (
                      <>
                        {driver.address}
                        <br />
                        {driver.city && `${driver.city}`}
                        {driver.pincode && ` - ${driver.pincode}`}
                      </>
                    ) : (
                      "Not provided"
                    )}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-500">Date of Birth:</span>
                  <span className="font-semibold text-[#01312D]">
                    {driver.dateOfBirth
                      ? new Date(driver.dateOfBirth).toLocaleDateString()
                      : "Not provided"}
                  </span>
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
                  <span className="font-semibold text-[#01312D]">
                    {driver.carRegistration ||
                      driver.carRegistrationNumber ||
                      "Not provided"}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Model:</span>{" "}
                  <span className="font-semibold text-[#01312D]">
                    {driver.carModel || "Not provided"}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Year:</span>{" "}
                  <span className="font-semibold text-[#01312D]">
                    {driver.carYear || "Not provided"}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Color:</span>{" "}
                  <span className="font-semibold text-[#01312D]">
                    {driver.carColor || "Not provided"}
                  </span>
                </p>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#3A7717]" />
                Uploaded Documents
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#72bf00]" />
                    <span className="text-sm font-medium">
                      Driver's License
                    </span>
                  </div>
                  {driver.drivingLicenseUrl &&
                  driver.drivingLicenseUrl !== "pending" ? (
                    <a
                      href={driver.drivingLicenseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#72bf00] text-sm font-semibold hover:underline flex items-center gap-1"
                    >
                      View Document →
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Not uploaded</span>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-[#72bf00]" />
                    <span className="text-sm font-medium">
                      RC Document (Car Registration)
                    </span>
                  </div>
                  {driver.carRegistrationUrl &&
                  driver.carRegistrationUrl !== "pending" ? (
                    <a
                      href={driver.carRegistrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#72bf00] text-sm font-semibold hover:underline flex items-center gap-1"
                    >
                      View Document →
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Not uploaded</span>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#72bf00]" />
                    <span className="text-sm font-medium">Profile Photo</span>
                  </div>
                  {driver.profilePhotoUrl &&
                  driver.profilePhotoUrl !== "pending" ? (
                    <a
                      href={driver.profilePhotoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#72bf00] text-sm font-semibold hover:underline flex items-center gap-1"
                    >
                      View Photo →
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Not uploaded</span>
                  )}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-[#eafde7] rounded-xl p-4">
              <h3 className="font-semibold text-[#01312D] mb-3">Statistics</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center bg-white rounded-lg p-3">
                  <p className="text-2xl font-bold text-[#01312D]">
                    {driver.totalRequests || 0}
                  </p>
                  <p className="text-xs text-gray-500">Total Requests</p>
                </div>
                <div className="text-center bg-white rounded-lg p-3">
                  <p className="text-2xl font-bold text-[#3A7717]">
                    R{(driver.totalSpent || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Total Spent</p>
                </div>
              </div>
            </div>

            {/* Rejection Reason if rejected */}
            {driver.verificationStatus === "rejected" &&
              driver.rejectionReason && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Rejection Reason
                  </h3>
                  <p className="text-sm text-red-700">
                    {driver.rejectionReason}
                  </p>
                </div>
              )}
          </div>

          <div className="sticky bottom-0 bg-white border-t border-[#bff202]/20 p-5 flex gap-3">
            {driver.verificationStatus === "pending" && (
              <>
                <button
                  onClick={() => openApproveModal(driver)}
                  className="flex-1 bg-[#3A7717] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#72bf00] transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => openRejectModal(driver)}
                  className="flex-1 bg-red-500 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}
            {driver.verificationStatus !== "pending" && (
              <button
                onClick={onClose}
                className="w-full bg-gray-500 text-white py-2 rounded-xl font-semibold hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

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
              <span className="ml-1 px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
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
                  {driver.profilePhotoUrl &&
                  driver.profilePhotoUrl !== "pending" ? (
                    <img
                      src={driver.profilePhotoUrl}
                      alt={driver.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#72bf00]"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-[#eafde7] rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-[#3A7717]" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-[#01312D]">
                      {driver.name}
                    </p>
                    <p className="text-xs text-gray-500">{driver.email}</p>
                    <p className="text-xs text-gray-500">
                      {driver.carRegistration || "No car registered"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(driver.verificationStatus)}
                  <button
                    onClick={() => handleViewDetails(driver)}
                    className="px-3 py-1.5 bg-[#eafde7] text-[#01312D] rounded-lg text-sm font-semibold flex items-center gap-1 hover:bg-[#bff202]/30 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {showModal && selectedDriver && (
        <ViewDetailsModal
          driver={selectedDriver}
          onClose={() => setShowModal(false)}
        />
      )}
      <ApproveModal />
      {showRejectModal && selectedForAction && renderRejectionModal()}
    </div>
  );
}
