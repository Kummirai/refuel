// src/components/RepaymentProofModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
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
import { compressImage } from "@/lib/utils/image-compression";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";

interface RepaymentProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  requestedAmount: number;
  remainingBalance: number;
  totalRepayable: number;
  onSuccess: () => void;
}

export function RepaymentProofModal({
  isOpen,
  onClose,
  requestId,
  requestedAmount,
  remainingBalance,
  totalRepayable,
  onSuccess,
}: RepaymentProofModalProps) {
  const [repaymentAmount, setRepaymentAmount] = useState<string>("");
  const [proofUrl, setProofUrl] = useState<string>("");
  const [proofPublicId, setProofPublicId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [newRemainingBalance, setNewRemainingBalance] =
    useState(remainingBalance);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const compressedBlob = await compressImage(file);
      const compressedFile = new File([compressedBlob], file.name, {
        type: compressedBlob.type || file.type,
      });

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("type", "repayment");
      formData.append("requestId", requestId);

      const response = await fetch("/api/driver/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setProofUrl(data.url);
      setProofPublicId(data.publicId);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    const amountNum = parseFloat(repaymentAmount);
    if (!isNaN(amountNum) && amountNum > 0) {
      const newBalance = remainingBalance - amountNum;
      setNewRemainingBalance(newBalance > 0 ? newBalance : 0);
    } else {
      setNewRemainingBalance(remainingBalance);
    }
  }, [repaymentAmount, remainingBalance]);

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!repaymentAmount || parseFloat(repaymentAmount) <= 0) {
      setError("Please enter the repayment amount");
      return;
    }

    if (parseFloat(repaymentAmount) > remainingBalance) {
      setError(
        `Amount cannot exceed remaining balance of R${remainingBalance.toLocaleString()}`,
      );
      return;
    }

    if (!proofUrl) {
      setError("Please upload proof of repayment");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const amountNum = parseFloat(repaymentAmount);
      const newBalance = remainingBalance - amountNum;
      const isFullyPaid = newBalance <= 0;

      const response = await fetch("/api/driver/repayment-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          amount: amountNum,
          remainingBalance: newBalance > 0 ? newBalance : 0,
          isFullyPaid,
          proofUrl,
          proofPublicId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit repayment proof");
      }

      onSuccess();
      onClose();
      resetForm();
      // alert(
      //   `✅ Repayment of R${amountNum.toLocaleString()} submitted for approval!`,
      // );
    } catch (err: any) {
      setError(
        err.message || "Failed to submit repayment proof. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRepaymentAmount("");
    setProofUrl("");
    setProofPublicId("");
    setError("");
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-[#BFF202]/20 px-5 py-4 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#01312D]">
              Make a Repayment
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
            className="w-10 h-10 bg-[#EAFDE7] rounded-full flex items-center justify-center active:scale-95 transition-all"
          >
            <X className="w-5 h-5 text-[#01312D]" />
          </button>
        </div>
      </div>

      <div className="px-5 py-6 pb-32">
        <div className="bg-[#EAFDE7] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Requested Amount:</span>
            <span className="font-semibold text-[#01312D]">
              R{requestedAmount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Repayable:</span>
            <span className="font-semibold text-[#01312D]">
              R{totalRepayable.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#BFF202]/20">
            <span className="text-gray-600 text-sm font-semibold">
              Outstanding Balance:
            </span>
            <span className="text-2xl font-bold text-[#3A7717]">
              R{remainingBalance.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-[#01312D] font-semibold mb-2 text-sm">
            Repayment Amount (R) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#72BF00]" />
            <input
              type="number"
              value={repaymentAmount}
              onChange={(e) => setRepaymentAmount(e.target.value)}
              placeholder="Enter amount you're paying"
              className="w-full pl-10 pr-4 py-3 bg-white border border-[#BFF202]/20 rounded-xl focus:outline-none focus:border-[#72BF00] text-base"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Max: R{remainingBalance.toLocaleString()}
          </p>
        </div>

        {repaymentAmount && parseFloat(repaymentAmount) > 0 && (
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="font-semibold text-[#01312D] mb-2">Updated Balance</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Balance:</span>
                <span className="font-semibold text-red-600">
                  R{remainingBalance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Amount:</span>
                <span className="font-semibold text-[#3A7717]">
                  - R{parseFloat(repaymentAmount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-200">
                <span className="font-semibold">New Balance:</span>
                <span
                  className={`font-bold ${newRemainingBalance <= 0 ? "text-[#3A7717]" : "text-[#01312D]"}`}
                >
                  {newRemainingBalance <= 0
                    ? "R0.00 (Fully Paid!)"
                    : `R${newRemainingBalance.toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-[#01312D] font-semibold mb-2 text-sm">
            Upload Proof of Repayment <span className="text-red-500">*</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!proofUrl ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-[#BFF202]/30 rounded-xl p-8 text-center hover:border-[#72BF00] transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-12 h-12 text-[#72BF00] mx-auto mb-3 animate-spin" />
                  <p className="text-sm text-[#01312D] font-semibold">
                    Compressing & uploading...
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-[#72BF00] mx-auto mb-3" />
                  <p className="text-sm text-[#01312D] font-semibold">
                    Click to upload proof of repayment
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Bank transfer receipt, cash deposit slip, or payment
                    confirmation (JPG or PNG, automatically compressed)
                  </p>
                </>
              )}
            </button>
          ) : (
            <div className="relative bg-[#EAFDE7] rounded-xl p-4">
              {proofUrl.includes(".pdf") ? (
                <div className="text-center py-4">
                  <FileText className="w-12 h-12 text-[#3A7717] mx-auto" />
                  <p className="text-sm text-[#01312D] mt-2">PDF uploaded</p>
                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#72BF00] mt-2 inline-block"
                  >
                    View Document
                  </a>
                </div>
              ) : (
                <img
                  src={proofUrl}
                  alt="Proof Preview"
                  className="w-full h-40 object-cover rounded-lg"
                />
              )}
              <button
                onClick={() => {
                  setProofUrl("");
                  setProofPublicId("");
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

        <div className="bg-blue-50 rounded-xl p-3 mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-blue-800 font-semibold">
                How it works:
              </p>
              <ul className="text-xs text-blue-700 mt-1 space-y-0.5 list-disc list-inside">
                <li>
                  Upload proof of your repayment (bank transfer receipt, cash
                  deposit slip)
                </li>
                <li>Our admin will verify the payment within 24-48 hours</li>
                <li>
                  Once verified, your balance will be updated automatically
                </li>
                <li>
                  You'll receive a notification when your payment is confirmed
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#BFF202]/20 p-4 shadow-lg z-10">
        <div className="flex flex-col gap-3 max-w-md mx-auto">
          <button
            onClick={handleSubmit}
            disabled={submitting || !proofUrl || !repaymentAmount}
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
                Submit Repayment Proof
              </>
            )}
          </button>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="flex-1 bg-gray-200 text-[#01312D] py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
