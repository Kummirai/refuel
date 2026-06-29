"use client";

import { useState, useRef } from "react";
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
import { formatMoney, toMoney } from "@/lib/money";

interface BulkRequest {
  id: string;
  type: string;
  carNumber: string;
  amount: number;
  totalRepayable: number;
  remainingBalance: number;
}

interface BulkRepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRequests: BulkRequest[];
  onSuccess: () => void;
  discountPercent?: number;
}

export function BulkRepaymentModal({
  isOpen,
  onClose,
  selectedRequests,
  onSuccess,
  discountPercent,
}: BulkRepaymentModalProps) {
  const [repaymentAmount, setRepaymentAmount] = useState<string>("");
  const [proofUrl, setProofUrl] = useState<string>("");
  const [proofPublicId, setProofPublicId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const discountMultiplier = discountPercent != null ? 1 - discountPercent / 100 : 1;

  const totalRemaining = selectedRequests.reduce(
    (sum, r) => sum + r.remainingBalance,
    0,
  );

  const totalDiscounted = totalRemaining * discountMultiplier;

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("File size must be less than 20MB");
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
      formData.append("requestId", selectedRequests[0].id);

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

  const handleSubmit = async () => {
    const amountNum = parseFloat(repaymentAmount);
    if (!repaymentAmount || amountNum <= 0) {
      setError("Please enter the repayment amount");
      return;
    }

    const maxAllowed = discountPercent != null ? totalDiscounted : totalRemaining;
    if (amountNum > maxAllowed) {
      setError(
        `Amount cannot exceed total outstanding of ${formatMoney(maxAllowed)}`,
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
      const newBalance = toMoney(totalRemaining - amountNum);
      const isFullyPaid = newBalance <= 0;

      const response = await fetch("/api/driver/repayment-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestIds: selectedRequests.map((r) => r.id),
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
    } catch (err: any) {
      setError(
        err.message || "Failed to submit repayment proof. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-[#BFF202]/20 px-5 py-4 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#01312D]">
              Repay Loan
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedRequests.length} request{selectedRequests.length > 1 ? "s" : ""} selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-[#EAFDE7] rounded-full flex items-center justify-center active:scale-95 transition-all"
          >
            <X className="w-5 h-5 text-[#01312D]" />
          </button>
        </div>
      </div>

      <div className="px-5 py-6 pb-32">
        {/* Selected Requests Summary */}
        <div className="bg-[#EAFDE7] rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-[#01312D] text-sm mb-3">
            Selected Requests
          </h3>
          {discountPercent != null && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3 flex items-center gap-2">
              <span className="text-xs font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                {discountPercent}% OFF
              </span>
              <span className="text-xs text-gray-600">
                Discount applied to all amounts
              </span>
            </div>
          )}
          <div className="space-y-2 mb-3">
            {selectedRequests.map((req) => (
              <div
                key={req.id}
                className="flex justify-between items-center bg-white rounded-lg p-2"
              >
                <div>
                  <p className="text-sm font-semibold text-[#01312D] capitalize">
                    {req.type} - {req.carNumber}
                  </p>
                  <p className="text-xs text-gray-500">ID: {req.id.slice(-8).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">
                    {discountPercent != null ? (
                      <span className="flex items-center gap-1">
                        <span className="text-xs text-gray-400 line-through">{formatMoney(req.remainingBalance)}</span>
                        <span>{formatMoney(req.remainingBalance * discountMultiplier)}</span>
                      </span>
                    ) : formatMoney(req.remainingBalance)}
                  </p>
                  <p className="text-xs text-gray-500">outstanding</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#BFF202]/20">
            <span className="text-gray-600 text-sm font-semibold">
              Total Outstanding:
            </span>
            <span className="text-2xl font-bold text-[#3A7717]">
              {discountPercent != null ? (
                <span className="flex items-center gap-1">
                  <span className="text-base text-gray-400 line-through">{formatMoney(totalRemaining)}</span>
                  <span>{formatMoney(totalDiscounted)}</span>
                </span>
              ) : formatMoney(totalRemaining)}
            </span>
          </div>
        </div>

        {/* Repayment Amount */}
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
              placeholder="Enter total amount you are paying"
              className="w-full pl-10 pr-4 py-3 bg-white border border-[#BFF202]/20 rounded-xl focus:outline-none focus:border-[#72BF00] text-base"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Max: {formatMoney(discountPercent != null ? totalDiscounted : totalRemaining)} (total outstanding)
          </p>
        </div>

        {/* Updated Balance Preview */}
        {repaymentAmount && parseFloat(repaymentAmount) > 0 && (
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="font-semibold text-[#01312D] mb-2">
              Updated Balance Preview
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Total Outstanding:</span>
                <span className="font-semibold text-red-600">
                  {discountPercent != null ? (
                    <span className="flex items-center gap-1">
                      <span className="text-gray-400 line-through text-xs">{formatMoney(totalRemaining)}</span>
                      <span>{formatMoney(totalDiscounted)}</span>
                    </span>
                  ) : formatMoney(totalRemaining)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Amount:</span>
                <span className="font-semibold text-[#3A7717]">
                  - {formatMoney(parseFloat(repaymentAmount))}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-200">
                <span className="font-semibold">Remaining Total:</span>
                <span
                  className={`font-bold ${
                    toMoney((discountPercent != null ? totalDiscounted : totalRemaining) - parseFloat(repaymentAmount)) <= 0
                      ? "text-[#3A7717]"
                      : "text-[#01312D]"
                  }`}
                >
                  {toMoney((discountPercent != null ? totalDiscounted : totalRemaining) - parseFloat(repaymentAmount)) <= 0
                    ? "R0.00 (Fully Paid!)"
                    : formatMoney(
                        toMoney((discountPercent != null ? totalDiscounted : totalRemaining) - parseFloat(repaymentAmount)),
                      )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Upload Proof */}
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
                    One POP covering all selected requests
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
                  One POP covering all {selectedRequests.length} selected outstanding requests
                </li>
                <li>Our admin will verify the payment within 24-48 hours</li>
                <li>
                  Once verified, the amount will be distributed across your outstanding balances
                </li>
                <li>
                  You&apos;ll receive a notification when your payment is confirmed
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
                Repay Loan
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-[#01312D] py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}