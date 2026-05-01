// src/components/PopUploadModal.tsx
"use client";

import { useState, useEffect } from "react";
import { CldUploadWidget } from "next-cloudinary";
import {
  DollarSign,
  Upload,
  Loader2,
  XCircle,
  AlertCircle,
  FileText,
  CheckCircle,
  X,
} from "lucide-react";
import type { CloudinaryUploadWidgetInfo } from "next-cloudinary";

interface PopUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  requestedAmount: number;
  onSuccess: () => void;
}

const UPLOAD_PRESET = "driver_documents";

export function PopUploadModal({
  isOpen,
  onClose,
  requestId,
  requestedAmount,
  onSuccess,
}: PopUploadModalProps) {
  const [actualAmount, setActualAmount] = useState<string>("");
  const [popUrl, setPopUrl] = useState<string>("");
  const [popPublicId, setPopPublicId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [calculatedRepayment, setCalculatedRepayment] = useState<{
    interest: number;
    totalRepayable: number;
    dailyPayment: number;
  } | null>(null);

  // Debug logging
  console.log("PopUploadModal - requestId:", requestId);
  console.log("PopUploadModal - requestedAmount:", requestedAmount);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Calculate repayment based on actual amount
  const calculateRepayment = (amount: number) => {
    const interestRate = 0.13; // 13%
    const interest = amount * interestRate;
    const totalRepayable = amount + interest;
    const dailyPayment = totalRepayable / 7; // 7 days default
    return { interest, totalRepayable, dailyPayment: Math.ceil(dailyPayment) };
  };

  const handleAmountChange = (value: string) => {
    setActualAmount(value);
    const amountNum = parseFloat(value);
    if (!isNaN(amountNum) && amountNum > 0) {
      setCalculatedRepayment(calculateRepayment(amountNum));
    } else {
      setCalculatedRepayment(null);
    }
  };

  const handleSubmit = async () => {
    console.log("Submitting POP - requestId:", requestId);

    if (!requestId) {
      setError("Missing request ID. Please try again.");
      return;
    }

    if (!actualAmount || parseFloat(actualAmount) <= 0) {
      setError("Please enter the actual amount paid");
      return;
    }

    if (!popUrl) {
      setError("Please upload proof of payment");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const amountNum = parseFloat(actualAmount);
      const { interest, totalRepayable, dailyPayment } =
        calculateRepayment(amountNum);

      const requestData = {
        requestId: requestId,
        actualAmount: amountNum,
        popUrl: popUrl,
        popPublicId: popPublicId,
        interest: interest,
        totalRepayable: totalRepayable,
        dailyPayment: dailyPayment,
        repaymentDays: 7,
      };

      console.log("Sending POP data:", requestData);

      const response = await fetch("/api/driver/requests/pop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log("Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit POP");
      }

      alert("POP uploaded successfully!");
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.message || "Failed to submit POP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setActualAmount("");
    setPopUrl("");
    setPopPublicId("");
    setCalculatedRepayment(null);
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto">
      {/* Header - Sticky at top */}
      <div className="sticky top-0 bg-white border-b border-[#bff202]/20 px-5 py-4 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#01312D]">
              Upload Proof of Payment
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Request ID: {requestId}
            </p>
          </div>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="w-10 h-10 bg-[#eafde7] rounded-full flex items-center justify-center active:scale-95 transition-all"
          >
            <X className="w-5 h-5 text-[#01312D]" />
          </button>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="px-5 py-6 pb-32">
        {/* Info Banner */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-blue-800 font-semibold">
                Requested Amount: R{requestedAmount.toLocaleString()}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Please upload your bank transfer receipt or proof of payment. If
                the actual amount differs, enter the correct amount below.
              </p>
            </div>
          </div>
        </div>

        {/* Actual Amount Input */}
        <div className="mb-6">
          <label className="block text-[#01312D] font-semibold mb-2 text-sm">
            Actual Amount Paid <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#72bf00]" />
            <input
              type="number"
              value={actualAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Enter actual amount paid"
              className="w-full pl-10 pr-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] text-base"
              required
            />
          </div>
        </div>

        {/* Repayment Calculation Preview */}
        {calculatedRepayment && (
          <div className="bg-[#eafde7] rounded-xl p-4 mb-6">
            <p className="font-semibold text-[#01312D] mb-3">
              Repayment Summary
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Actual Amount:</span>
                <span className="font-semibold text-[#01312D]">
                  R{parseFloat(actualAmount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Interest (13%):</span>
                <span className="font-semibold text-[#3A7717]">
                  + R{calculatedRepayment.interest.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#bff202]/20">
                <span className="font-semibold text-[#01312D]">
                  Total Repayable:
                </span>
                <span className="font-bold text-[#01312D]">
                  R{calculatedRepayment.totalRepayable.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between bg-white/50 rounded-lg p-2">
                <span className="text-sm text-[#01312D]">
                  Daily Payment (7 days):
                </span>
                <span className="font-bold text-[#3A7717]">
                  R{calculatedRepayment.dailyPayment.toLocaleString()}/day
                </span>
              </div>
            </div>
          </div>
        )}

        {/* POP Upload */}
        <div className="mb-6">
          <label className="block text-[#01312D] font-semibold mb-2 text-sm">
            Upload Proof of Payment <span className="text-red-500">*</span>
          </label>

          {!popUrl ? (
            <CldUploadWidget
              uploadPreset={UPLOAD_PRESET}
              onSuccess={(result) => {
                const info = result.info as CloudinaryUploadWidgetInfo;
                if (info) {
                  console.log("Upload success:", info);
                  setPopUrl(info.secure_url);
                  setPopPublicId(info.public_id);
                }
                setUploading(false);
              }}
              onQueuesStart={() => setUploading(true)}
              onError={(error) => {
                console.error("Upload error:", error);
                setUploading(false);
                setError("Upload failed. Please try again.");
              }}
              options={{
                maxFileSize: 5242880,
                clientAllowedFormats: ["jpg", "jpeg", "png", "pdf"],
                folder: `fuelex/pop/${requestId}`,
                resourceType: "auto",
              }}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  disabled={uploading}
                  className="w-full border-2 border-dashed border-[#bff202]/30 rounded-xl p-8 text-center hover:border-[#72bf00] transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="w-12 h-12 text-[#72bf00] mx-auto mb-3 animate-spin" />
                  ) : (
                    <Upload className="w-12 h-12 text-[#72bf00] mx-auto mb-3" />
                  )}
                  <p className="text-sm text-[#01312D] font-semibold">
                    {uploading ? "Uploading..." : "Click to upload POP"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, or PDF (Max 5MB)
                  </p>
                </button>
              )}
            </CldUploadWidget>
          ) : (
            <div className="relative bg-[#eafde7] rounded-xl p-4">
              {popUrl.includes(".pdf") ? (
                <div className="text-center py-4">
                  <FileText className="w-12 h-12 text-[#3A7717] mx-auto" />
                  <p className="text-sm text-[#01312D] mt-2">PDF uploaded</p>
                  <a
                    href={popUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#72bf00] mt-2 inline-block"
                  >
                    View PDF
                  </a>
                </div>
              ) : (
                <img
                  src={popUrl}
                  alt="POP Preview"
                  className="w-full h-40 object-cover rounded-lg"
                />
              )}
              <button
                onClick={() => {
                  setPopUrl("");
                  setPopPublicId("");
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 mb-6">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Fixed Footer with Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#bff202]/20 p-4 shadow-lg z-10">
        <div className="flex gap-3 max-w-md mx-auto">
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="flex-1 bg-gray-200 text-[#01312D] py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !popUrl || !actualAmount}
            className="flex-1 bg-[#3A7717] text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-[#2d5a12] transition-all active:scale-95"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Submit POP
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
