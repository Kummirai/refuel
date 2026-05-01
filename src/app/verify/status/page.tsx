// src/app/verify/status/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  FileCheck,
  FileText,
  User,
  Car,
  Calendar,
  Loader2,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Shield,
  Eye,
  Download,
} from "lucide-react";

export default function VerificationStatusPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "approved" | "pending" | "rejected" | "not_submitted"
  >("not_submitted");
  const [rejectionReason, setRejectionReason] = useState<string>("");

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.push("/auth/sign-in");
      } else {
        fetchVerificationStatus();
      }
    }
  }, [session, isPending]);

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch(
        `/api/driver/profile?userId=${session?.user?.id}`,
      );
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setVerificationStatus(data?.verificationStatus || "not_submitted");
        setRejectionReason(data?.rejectionReason || "");
      }
    } catch (error) {
      console.error("Error fetching status:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVerificationStatus();
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case "approved":
        return <CheckCircle className="w-16 h-16 text-[#3A7717]" />;
      case "pending":
        return <Clock className="w-16 h-16 text-yellow-500" />;
      case "rejected":
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return <AlertCircle className="w-16 h-16 text-gray-400" />;
    }
  };

  const getStatusTitle = () => {
    switch (verificationStatus) {
      case "approved":
        return "Verification Approved!";
      case "pending":
        return "Verification Pending";
      case "rejected":
        return "Verification Failed";
      default:
        return "Verification Not Started";
    }
  };

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case "approved":
        return "Congratulations! Your account has been verified. You can now access all driver services including fuel, cash advances, airtime, and car wash.";
      case "pending":
        return "Your verification is being reviewed by our admin team. This usually takes 24-48 hours. You will be notified via email once the review is complete.";
      case "rejected":
        return `Your verification was not approved. ${rejectionReason ? `Reason: ${rejectionReason}` : "Please check your documents and re-submit with correct information."}`;
      default:
        return "You haven't started the verification process yet. Complete verification to access all driver services.";
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case "approved":
        return "bg-green-50 border-green-200";
      case "pending":
        return "bg-yellow-50 border-yellow-200";
      case "rejected":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getActionButton = () => {
    switch (verificationStatus) {
      case "approved":
        return (
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2 bg-[#3A7717] text-white rounded-lg font-semibold hover:bg-[#2d5e12] transition-colors"
          >
            Go to Dashboard
          </button>
        );
      case "pending":
        return (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Check Status"}
          </button>
        );
      case "rejected":
        return (
          <button
            onClick={() => router.push("/verify")}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Re-submit Verification
          </button>
        );
      default:
        return (
          <button
            onClick={() => router.push("/verify")}
            className="px-6 py-2 bg-[#01312D] text-white rounded-lg font-semibold hover:bg-[#3A7717] transition-colors"
          >
            Start Verification
          </button>
        );
    }
  };

  const getTimelineItems = () => {
    const items = [];

    // Account Creation
    items.push({
      status: "completed",
      title: "Account Created",
      description: profile?.createdAt
        ? new Date(profile.createdAt).toLocaleDateString()
        : "Completed",
      icon: <User className="w-5 h-5" />,
    });

    // Documents Submitted
    const hasDocuments =
      profile?.drivingLicenseUrl &&
      profile?.carRegistrationUrl &&
      profile?.profilePhotoUrl;
    items.push({
      status: hasDocuments
        ? "completed"
        : verificationStatus === "pending"
          ? "pending"
          : "pending",
      title: "Documents Submitted",
      description: hasDocuments
        ? "All documents uploaded"
        : "Awaiting document submission",
      icon: <FileText className="w-5 h-5" />,
    });

    // Admin Review
    items.push({
      status:
        verificationStatus === "approved"
          ? "completed"
          : verificationStatus === "pending"
            ? "in-progress"
            : "pending",
      title: "Admin Review",
      description:
        verificationStatus === "approved"
          ? "Approved"
          : verificationStatus === "pending"
            ? "In progress"
            : "Not started",
      icon: <Shield className="w-5 h-5" />,
    });

    // Account Verified
    items.push({
      status: verificationStatus === "approved" ? "completed" : "pending",
      title: "Account Verified",
      description:
        verificationStatus === "approved"
          ? "Verification complete"
          : "Waiting for approval",
      icon: <CheckCircle className="w-5 h-5" />,
    });

    return items;
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-[#eafde7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3A7717] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#01312D]">Loading verification status...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const timelineItems = getTimelineItems();

  return (
    <div className="min-h-screen bg-[#eafde7] pb-12">
      {/* Header */}
      <div className="bg-white border-b border-[#bff202]/20 sticky top-0 z-20">
        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 bg-[#eafde7] rounded-full flex items-center justify-center active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5 text-[#01312D]" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#01312D]">
                Verification Status
              </h1>
              <p className="text-xs text-gray-500">
                Track your verification progress
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 pt-6 pb-24">
        {/* Status Card */}
        <div className={`rounded-2xl p-6 border ${getStatusColor()} mb-6`}>
          <div className="text-center">
            <div className="flex justify-center mb-4">{getStatusIcon()}</div>
            <h2 className="text-2xl font-bold text-[#01312D] mb-2">
              {getStatusTitle()}
            </h2>
            <p className="text-sm text-gray-600 mb-6">{getStatusMessage()}</p>
            {getActionButton()}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/20 mb-6">
          <h3 className="font-bold text-[#01312D] mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#3A7717]" />
            Verification Timeline
          </h3>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gray-200"></div>

            {/* Timeline items */}
            <div className="space-y-6">
              {timelineItems.map((item, index) => (
                <div key={index} className="relative flex gap-4">
                  <div
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.status === "completed"
                        ? "bg-[#3A7717] text-white"
                        : item.status === "in-progress"
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 pt-1">
                    <h4
                      className={`font-semibold ${
                        item.status === "completed"
                          ? "text-[#3A7717]"
                          : item.status === "in-progress"
                            ? "text-yellow-600"
                            : "text-gray-500"
                      }`}
                    >
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.description}
                    </p>
                  </div>
                  {item.status === "completed" && (
                    <CheckCircle className="w-5 h-5 text-[#3A7717] flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submitted Information */}
        {profile &&
          (verificationStatus === "pending" ||
            verificationStatus === "approved") && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/20 mb-6">
              <h3 className="font-bold text-[#01312D] mb-4 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#3A7717]" />
                Submitted Information
              </h3>

              <div className="space-y-4">
                {/* Personal Info */}
                <div>
                  <h4 className="text-sm font-semibold text-[#01312D] mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#72bf00]" />
                    Personal Information
                  </h4>
                  <div className="bg-[#eafde7] rounded-xl p-3 space-y-1 text-sm">
                    <p>
                      <span className="text-gray-500">Name:</span>{" "}
                      {profile.fullName || session?.user?.name}
                    </p>
                    <p>
                      <span className="text-gray-500">Date of Birth:</span>{" "}
                      {profile.dateOfBirth || "Not provided"}
                    </p>
                    <p>
                      <span className="text-gray-500">Address:</span>{" "}
                      {profile.address}, {profile.city} - {profile.pincode}
                    </p>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div>
                  <h4 className="text-sm font-semibold text-[#01312D] mb-2 flex items-center gap-2">
                    <Car className="w-4 h-4 text-[#72bf00]" />
                    Vehicle Information
                  </h4>
                  <div className="bg-[#eafde7] rounded-xl p-3 space-y-1 text-sm">
                    <p>
                      <span className="text-gray-500">Registration:</span>{" "}
                      {profile.carRegistrationNumber}
                    </p>
                    <p>
                      <span className="text-gray-500">Model:</span>{" "}
                      {profile.carModel}
                    </p>
                    <p>
                      <span className="text-gray-500">Year:</span>{" "}
                      {profile.carYear}
                    </p>
                    <p>
                      <span className="text-gray-500">Color:</span>{" "}
                      {profile.carColor}
                    </p>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h4 className="text-sm font-semibold text-[#01312D] mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#72bf00]" />
                    Uploaded Documents
                  </h4>
                  <div className="space-y-2">
                    {profile.drivingLicenseUrl &&
                      profile.drivingLicenseUrl !== "pending" && (
                        <div className="flex items-center justify-between bg-[#eafde7] rounded-xl p-3">
                          <div className="flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-[#3A7717]" />
                            <span className="text-sm">Driver's License</span>
                          </div>
                          <a
                            href={profile.drivingLicenseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#72bf00] text-sm font-semibold flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </a>
                        </div>
                      )}
                    {profile.carRegistrationUrl &&
                      profile.carRegistrationUrl !== "pending" && (
                        <div className="flex items-center justify-between bg-[#eafde7] rounded-xl p-3">
                          <div className="flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-[#3A7717]" />
                            <span className="text-sm">Car Registration</span>
                          </div>
                          <a
                            href={profile.carRegistrationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#72bf00] text-sm font-semibold flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </a>
                        </div>
                      )}
                    {profile.profilePhotoUrl &&
                      profile.profilePhotoUrl !== "pending" && (
                        <div className="flex items-center justify-between bg-[#eafde7] rounded-xl p-3">
                          <div className="flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-[#3A7717]" />
                            <span className="text-sm">Profile Photo</span>
                          </div>
                          <a
                            href={profile.profilePhotoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#72bf00] text-sm font-semibold flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </a>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Help Section */}
        <div className="bg-[#eafde7] rounded-2xl p-5 border border-[#bff202]/20">
          <h3 className="font-bold text-[#01312D] mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#72bf00]" />
            Need Help?
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            If you have any questions about your verification status or need
            assistance, please contact our support team.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() =>
                (window.location.href = "mailto:support@Kapuka.com")
              }
              className="flex-1 px-4 py-2 bg-[#01312D] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Email Support
            </button>
            <button
              onClick={() => (window.location.href = "tel:+919876543210")}
              className="flex-1 px-4 py-2 bg-[#3A7717] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Call Support
            </button>
          </div>
        </div>

        {/* Rejection Reason Section (if rejected) */}
        {verificationStatus === "rejected" && rejectionReason && (
          <div className="mt-4 bg-red-50 rounded-2xl p-5 border border-red-200">
            <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Rejection Reason
            </h3>
            <p className="text-sm text-red-700">{rejectionReason}</p>
            <p className="text-xs text-red-600 mt-2">
              Please correct the issues above and re-submit your verification.
            </p>
          </div>
        )}

        {/* Estimated Time Section (if pending) */}
        {verificationStatus === "pending" && (
          <div className="mt-4 bg-blue-50 rounded-2xl p-5 border border-blue-200">
            <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Estimated Processing Time
            </h3>
            <p className="text-sm text-blue-700">
              Our team typically reviews verification applications within 24-48
              hours. You will receive an email notification once your account is
              verified.
            </p>
          </div>
        )}

        {/* Verified Benefits Section (if not yet verified) */}
        {verificationStatus !== "approved" && (
          <div className="mt-4 bg-gradient-to-r from-[#bff202] to-[#72bf00] rounded-2xl p-5">
            <h3 className="font-bold text-[#01312D] mb-3">
              Benefits After Verification
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#01312D]" />
                <span className="text-xs text-[#01312D]">Request Fuel</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#01312D]" />
                <span className="text-xs text-[#01312D]">Get Airtime</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#01312D]" />
                <span className="text-xs text-[#01312D]">Cash Advances</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#01312D]" />
                <span className="text-xs text-[#01312D]">
                  Car Wash Services
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
