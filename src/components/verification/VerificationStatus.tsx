// src/components/verification/VerificationStatus.tsx
"use client";

import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

interface VerificationStatusProps {
  status: "pending" | "approved" | "rejected" | "not_submitted";
  rejectionReason?: string;
}

export default function VerificationStatus({
  status,
  rejectionReason,
}: VerificationStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "approved":
        return {
          icon: CheckCircle,
          title: "Verified",
          message:
            "Your account has been verified. You can now access all services.",
          color: "text-[#3A7717]",
          bgColor: "bg-[#3A7717]/10",
          borderColor: "border-[#3A7717]",
        };
      case "pending":
        return {
          icon: Clock,
          title: "Verification Pending",
          message:
            "Your documents are being reviewed by admin. This usually takes 24-48 hours.",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
        };
      case "rejected":
        return {
          icon: XCircle,
          title: "Verification Failed",
          message:
            rejectionReason ||
            "Your documents were not approved. Please re-submit with correct information.",
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        };
      default:
        return {
          icon: AlertCircle,
          title: "Not Verified",
          message: "Please complete verification to access driver services.",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className={`rounded-2xl p-4 border ${config.bgColor} ${config.borderColor}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bgColor}`}
        >
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-bold ${config.color}`}>{config.title}</h3>
          <p className="text-xs text-gray-600 mt-1">{config.message}</p>
        </div>
      </div>

      {status === "rejected" && (
        <button className="mt-3 w-full bg-red-600 text-white py-2 rounded-lg text-sm font-semibold active:scale-[0.98] transition-transform">
          Re-submit Documents
        </button>
      )}

      {status === "not_submitted" && (
        <button className="mt-3 w-full bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white py-2 rounded-lg text-sm font-semibold active:scale-[0.98] transition-transform">
          Start Verification
        </button>
      )}
    </div>
  );
}
