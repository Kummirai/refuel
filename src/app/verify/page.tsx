// src/app/verify/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import ConnectingScreen from "@/components/ConnectingScreen";
import { useBoundedFlag, useSessionPending } from "@/lib/hooks/useSessionPending";
import { compressImage } from "@/lib/utils/image-compression";
import {
  ArrowLeft,
  CheckCircle,
  Car,
  User,
  Shield,
  Loader2,
  Home,
  Clock,
  Upload,
  X,
  AlertCircle,
} from "lucide-react";

interface UploadSectionProps {
  label: string;
  type: string;
  onUploadComplete: (url: string, publicId: string) => void;
  currentUrl?: string;
  currentPublicId?: string;
}

function UploadSection({
  label,
  type,
  onUploadComplete,
  currentUrl,
  currentPublicId,
}: UploadSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentUrl || null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (localObjectUrlRef.current) {
        URL.revokeObjectURL(localObjectUrlRef.current);
      }
    };
  }, []);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPEG, PNG, etc.)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setError(null);
    setUploading(true);

    const compressedBlob = await compressImage(file);
    const compressedFile = new File([compressedBlob], file.name, {
      type: compressedBlob.type || file.type,
    });

    if (localObjectUrlRef.current) {
      URL.revokeObjectURL(localObjectUrlRef.current);
    }
    const localPreview = URL.createObjectURL(compressedFile);
    localObjectUrlRef.current = localPreview;
    setPreviewUrl(localPreview);

    try {
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("type", type);

      const response = await fetch("/api/driver/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      if (localObjectUrlRef.current) {
        URL.revokeObjectURL(localObjectUrlRef.current);
        localObjectUrlRef.current = null;
      }
      setPreviewUrl(data.url);
      onUploadComplete(data.url, data.publicId);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Upload failed. Please try again.");
      if (localObjectUrlRef.current) {
        URL.revokeObjectURL(localObjectUrlRef.current);
        localObjectUrlRef.current = null;
      }
      setPreviewUrl(currentUrl || null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    if (localObjectUrlRef.current) {
      URL.revokeObjectURL(localObjectUrlRef.current);
      localObjectUrlRef.current = null;
    }
    setPreviewUrl(null);
    onUploadComplete("", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-[#01312D] font-semibold text-sm">
        {label} <span className="text-red-500">*</span>
      </label>

      {!previewUrl ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-[#3A7717] bg-[#eafde7]"
              : "border-gray-300 bg-gray-50 hover:border-[#72bf00] hover:bg-[#eafde7]/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-[#3A7717] animate-spin mb-2" />
              <p className="text-sm text-gray-500">Uploading...</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                <Upload className="w-8 h-8 text-[#3A7717]" />
              </div>
              <p className="text-[#01312D] font-medium mb-1">
                Click or drag to upload
              </p>
              <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
            </>
          )}
        </div>
      ) : (
        <div className="relative bg-[#eafde7] rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-white shadow-sm flex-shrink-0">
              <img
                src={previewUrl}
                alt={label}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#01312D] truncate">{label}</p>
              <p className="text-xs text-gray-500 mt-1">
                Click to replace or drag new file
              </p>
            </div>
            <button
              onClick={handleRemove}
              className="p-2 bg-white rounded-full shadow-sm hover:bg-red-50 transition-colors"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>

          {/* Hidden file input for replacement */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 cursor-pointer"
          />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-xs mt-1">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const sessionPending = useSessionPending(isPending);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const boundedFetchingProfile = useBoundedFlag(fetchingProfile, 15_000);
  const [verificationStatus, setVerificationStatus] = useState<string>("");
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    address: "",
    city: "",
    pincode: "",
    carRegistrationNumber: "",
    carModel: "",
    carYear: "",
    carColor: "",
    ownershipStatus: "own",
    referenceName: "",
    referencePhone: "",
    carOwnerName: "",
    carOwnerPhone: "",
    carOwnerAddress: "",
    agreeAccuracy: false,
    agreeRefTenure: false,
    agreeOwnerContact: false,
    agreeRepayment: false,
    agreeEscalation: false,
  });

  const [uploadedUrls, setUploadedUrls] = useState({
    driversLicense: "",
    carRegistration: "",
    profilePhoto: "",
  });

  const [uploadedPublicIds, setUploadedPublicIds] = useState({
    driversLicense: "",
    carRegistration: "",
    profilePhoto: "",
  });

  // Check if steps are completed
  const isStep1Completed = () => {
    return !!(
      formData.fullName &&
      formData.dateOfBirth &&
      formData.address &&
      formData.city &&
      formData.pincode
    );
  };

  const allAgreed = () => {
    const basic = formData.agreeAccuracy && formData.agreeRefTenure && formData.agreeRepayment && formData.agreeEscalation;
    if (formData.ownershipStatus === "rent") return basic && formData.agreeOwnerContact;
    return basic;
  };

  const isStep2Completed = () => {
    const basicVehicle = !!(
      formData.carRegistrationNumber &&
      formData.carModel &&
      formData.carYear &&
      formData.carColor
    );
    
    if (!basicVehicle) return false;

    const hasRef = !!(formData.referenceName && formData.referencePhone);
    if (!hasRef) return false;

    if (formData.ownershipStatus === "own") return allAgreed();

    const hasOwner = !!(formData.carOwnerName && formData.carOwnerPhone && formData.carOwnerAddress);
    return hasOwner && allAgreed();
  };

  const isStep3Completed = () => {
    return !!(
      uploadedUrls.driversLicense &&
      uploadedUrls.carRegistration &&
      uploadedUrls.profilePhoto
    );
  };

  // Fetch existing driver profile
  useEffect(() => {
    if (session?.user?.id) {
      fetchDriverProfile();
    } else if (!isPending && !session) {
      router.push("/auth/sign-in");
    }
  }, [session, isPending]);

  // Handle redirects
  useEffect(() => {
    if (shouldRedirect) {
      router.push("/");
    }
  }, [shouldRedirect, router]);

  // Handle approved status redirect
  useEffect(() => {
    if (verificationStatus === "approved" && !fetchingProfile) {
      setShouldRedirect(true);
    }
  }, [verificationStatus, fetchingProfile]);

  const fetchDriverProfile = async () => {
    try {
      const response = await fetch(
        `/api/driver/profile?userId=${session?.user?.id}`,
        { signal: AbortSignal.timeout(15_000) },
      );
      if (response.ok) {
        const profile = await response.json();
        setVerificationStatus(profile?.verificationStatus || "not_submitted");

        if (profile?.verificationStatus === "pending") {
          setFetchingProfile(false);
          return;
        }

        // Pre-fill form if profile exists
        if (profile && profile._id) {
          setFormData({
            fullName: profile.fullName || session?.user?.name || "",
            dateOfBirth: profile.dateOfBirth || "",
            address: profile.address || "",
            city: profile.city || "",
            pincode: profile.pincode || "",
            carRegistrationNumber: profile.carRegistrationNumber || "",
            carModel: profile.carModel || "",
            carYear: profile.carYear || "",
            carColor: profile.carColor || "",
            ownershipStatus: profile.ownershipStatus || "own",
            referenceName: profile.referenceName || "",
            referencePhone: profile.referencePhone || "",
            carOwnerName: profile.carOwnerName || "",
            carOwnerPhone: profile.carOwnerPhone || "",
            carOwnerAddress: profile.carOwnerAddress || "",
            agreeAccuracy: profile.agreeAccuracy || false,
            agreeRefTenure: profile.agreeRefTenure || false,
            agreeOwnerContact: profile.agreeOwnerContact || false,
            agreeRepayment: profile.agreeRepayment || false,
            agreeEscalation: profile.agreeEscalation || false,
          });

          if (
            profile.drivingLicenseUrl &&
            profile.drivingLicenseUrl !== "pending"
          ) {
            setUploadedUrls((prev) => ({
              ...prev,
              driversLicense: profile.drivingLicenseUrl,
            }));
            setUploadedPublicIds((prev) => ({
              ...prev,
              driversLicense: profile.drivingLicensePublicId || "",
            }));
          }
          if (
            profile.carRegistrationUrl &&
            profile.carRegistrationUrl !== "pending"
          ) {
            setUploadedUrls((prev) => ({
              ...prev,
              carRegistration: profile.carRegistrationUrl,
            }));
            setUploadedPublicIds((prev) => ({
              ...prev,
              carRegistration: profile.carRegistrationPublicId || "",
            }));
          }
          if (
            profile.profilePhotoUrl &&
            profile.profilePhotoUrl !== "pending"
          ) {
            setUploadedUrls((prev) => ({
              ...prev,
              profilePhoto: profile.profilePhotoUrl,
            }));
            setUploadedPublicIds((prev) => ({
              ...prev,
              profilePhoto: profile.profilePhotoPublicId || "",
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setFetchingProfile(false);
    }
  };

  const handleUploadComplete = (
    type: string,
    url: string,
    publicId: string,
  ) => {
    setUploadedUrls((prev) => ({ ...prev, [type]: url }));
    setUploadedPublicIds((prev) => ({ ...prev, [type]: publicId }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/driver/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session?.user?.id,
          fullName: formData.fullName,
          email: session?.user?.email || "",
          phone: (session?.user as any)?.phone || "",
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
          city: formData.city,
          pincode: formData.pincode,
          carRegistrationNumber: formData.carRegistrationNumber,
          carModel: formData.carModel,
          carYear: formData.carYear,
          carColor: formData.carColor,
          ownershipStatus: formData.ownershipStatus,
          referenceName: formData.referenceName,
          referencePhone: formData.referencePhone,
          carOwnerName: formData.carOwnerName,
          carOwnerPhone: formData.carOwnerPhone,
          carOwnerAddress: formData.carOwnerAddress,
          agreeAccuracy: formData.agreeAccuracy,
          agreeRefTenure: formData.agreeRefTenure,
          agreeOwnerContact: formData.agreeOwnerContact,
          agreeRepayment: formData.agreeRepayment,
          agreeEscalation: formData.agreeEscalation,
          drivingLicenseUrl: uploadedUrls.driversLicense,
          carRegistrationUrl: uploadedUrls.carRegistration,
          profilePhotoUrl: uploadedUrls.profilePhoto,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitSuccess(true);
        // Scroll to top to show success message
        window.scrollTo({ top: 0 });
      } else {
        alert(data.error || "Failed to submit verification");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && isStep1Completed()) {
      setStep(2);
      window.scrollTo({ top: 0 });
    } else if (step === 2 && isStep2Completed()) {
      setStep(3);
      window.scrollTo({ top: 0 });
    } else if (step === 1 && !isStep1Completed()) {
      alert("Please fill in all required fields");
    } else if (step === 2 && !isStep2Completed()) {
      alert("Please fill in all vehicle information");
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo({ top: 0 });
  };

  // PENDING STATUS
  if (verificationStatus === "pending" && !fetchingProfile) {
    return (
      <div className="min-h-screen bg-[#eafde7] flex items-center justify-center px-5">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#01312D] mb-2">
            Verification Pending
          </h2>
          <p className="text-gray-600 mb-6">
            Your verification documents have been submitted and are currently
            under review. This usually takes 24-48 hours.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/verify/status")}
              className="flex-1 bg-[#72bf00] text-white px-4 py-2 rounded-lg font-semibold"
            >
              Check Status
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex-1 bg-[#01312D] text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go Back Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Wait for redirect
  if (shouldRedirect) {
    return (
      <div className="min-h-screen bg-[#eafde7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#3A7717] animate-spin mx-auto mb-4" />
          <p className="text-[#01312D]">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (sessionPending || boundedFetchingProfile) {
    return (
      <div className="min-h-screen bg-[#eafde7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#3A7717] animate-spin mx-auto mb-4" />
          <p className="text-[#01312D]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return isPending ? <ConnectingScreen message="Still loading your account…" /> : null;
  }

  // Submit success
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-[#eafde7] flex items-center justify-center px-5">
        <div className="text-center">
          <div className="w-20 h-20 bg-[#3A7717]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-[#3A7717]" />
          </div>
          <h2 className="text-2xl font-bold text-[#01312D] mb-2">
            Verification Submitted!
          </h2>
          <p className="text-gray-600 mb-6">
            Your documents have been submitted successfully. Our admin will
            review your application within 24-48 hours.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white px-6 py-3 rounded-xl font-semibold"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Main form render
  return (
    <div className="min-h-screen bg-[#eafde7] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10">
        <div className="bg-white border-b border-[#bff202]/20 px-5 py-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-10 h-10 bg-[#eafde7] rounded-full flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-[#01312D]" />
              </button>
            <div>
              <h1 className="text-xl font-bold text-[#01312D]">
                Driver Verification
              </h1>
              <p className="text-xs text-gray-500">
                Complete verification to access services
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-6 pb-24 max-w-3xl mx-auto w-full">
        <div className="max-w-3xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-10">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step === 1
                      ? "bg-[#3A7717] text-white ring-2 ring-[#bff202] ring-offset-2"
                      : isStep1Completed()
                        ? "bg-[#3A7717] text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isStep1Completed() ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    "1"
                  )}
                </div>
                <span className="text-xs text-center mt-1 text-[#01312D]">
                  Personal
                </span>
              </div>
              <div className="flex-1 h-0.5 mx-2 rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full transition-all bg-[#3A7717]"
                  style={{ width: isStep1Completed() ? "100%" : "0%" }}
                />
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step === 2
                      ? "bg-[#3A7717] text-white ring-2 ring-[#bff202] ring-offset-2"
                      : isStep2Completed()
                        ? "bg-[#3A7717] text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isStep2Completed() ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    "2"
                  )}
                </div>
                <span className="text-xs text-center mt-1 text-[#01312D]">
                  Vehicle
                </span>
              </div>
              <div className="flex-1 h-0.5 mx-2 rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full transition-all bg-[#3A7717]"
                  style={{ width: isStep2Completed() ? "100%" : "0%" }}
                />
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step === 3
                      ? "bg-[#3A7717] text-white ring-2 ring-[#bff202] ring-offset-2"
                      : isStep3Completed()
                        ? "bg-[#3A7717] text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isStep3Completed() ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    "3"
                  )}
                </div>
                <span className="text-xs text-center mt-1 text-[#01312D]">
                  Documents
                </span>
              </div>
            </div>
          </div>

          {/* Step 1 - Personal Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/20">
                <h2 className="text-lg font-bold text-[#01312D] mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#3A7717]" /> Personal
                  Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      placeholder="Enter your full name as per license"
                      className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dateOfBirth: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="Enter your full address"
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        placeholder="City"
                        className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                        Pincode
                      </label>
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={(e) =>
                          setFormData({ ...formData, pincode: e.target.value })
                        }
                        placeholder="Pincode"
                        className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={nextStep}
                disabled={!isStep1Completed()}
                className="w-full bg-[#3A7717] text-white py-3 rounded-xl font-semibold disabled:opacity-50"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2 - Vehicle & Reference Info */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Vehicle Information */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/20">
                <h2 className="text-lg font-bold text-[#01312D] mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5 text-[#3A7717]" /> Vehicle Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                      Car Registration Number{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.carRegistrationNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          carRegistrationNumber: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="e.g., ABC123GP"
                      className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                      Car Model <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.carModel}
                      onChange={(e) =>
                        setFormData({ ...formData, carModel: e.target.value })
                      }
                      placeholder="e.g., Toyota Corolla"
                      className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                        Year
                      </label>
                      <input
                        type="number"
                        value={formData.carYear}
                        onChange={(e) =>
                          setFormData({ ...formData, carYear: e.target.value })
                        }
                        placeholder="2020"
                        className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                        Color
                      </label>
                      <input
                        type="text"
                        value={formData.carColor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            carColor: e.target.value,
                          })
                        }
                        placeholder="e.g., White"
                        className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                      />
                    </div>
                  </div>
                </div>

                <div className="my-6 border-t border-gray-100" />

                <h2 className="text-md font-bold text-[#01312D] mb-4">
                  Ownership Details
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ownershipStatus: "own" })}
                    className={`flex-1 py-3 rounded-xl font-semibold border transition-all ${
                      formData.ownershipStatus === "own"
                        ? "bg-[#01312D] text-white border-[#01312D]"
                        : "bg-white text-[#01312D] border-gray-200"
                    }`}
                  >
                    I own the car
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ownershipStatus: "rent" })}
                    className={`flex-1 py-3 rounded-xl font-semibold border transition-all ${
                      formData.ownershipStatus === "rent"
                        ? "bg-[#01312D] text-white border-[#01312D]"
                        : "bg-white text-[#01312D] border-gray-200"
                    }`}
                  >
                    I am renting
                  </button>
                </div>
              </div>

              {/* Reference Information */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/20">
                <h2 className="text-lg font-bold text-[#01312D] mb-1 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#3A7717]" /> Kapuka Member Reference
                </h2>
                <p className="text-xs text-gray-500 mb-4">Provide details of an existing Kapuka member (1+ month member).</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                      Member Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.referenceName}
                      onChange={(e) =>
                        setFormData({ ...formData, referenceName: e.target.value })
                      }
                      placeholder="Enter member's full name"
                      className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                      Member Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.referencePhone}
                      onChange={(e) =>
                        setFormData({ ...formData, referencePhone: e.target.value })
                      }
                      placeholder="Enter member's phone number"
                      className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                    />
                  </div>
                </div>
              </div>

              {/* Car Owner Information (Only if renting) */}
              {formData.ownershipStatus === "rent" && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/20">
                  <h2 className="text-lg font-bold text-[#01312D] mb-4">
                    Car Owner Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                        Owner Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.carOwnerName}
                        onChange={(e) =>
                          setFormData({ ...formData, carOwnerName: e.target.value })
                        }
                        placeholder="Enter owner's full name"
                        className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                        Owner Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.carOwnerPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, carOwnerPhone: e.target.value })
                        }
                        placeholder="Enter owner's phone number"
                        className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                        Owner Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.carOwnerAddress}
                        onChange={(e) =>
                          setFormData({ ...formData, carOwnerAddress: e.target.value })
                        }
                        placeholder="Enter owner's address"
                        rows={2}
                        className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Policy Agreement Checklist */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/20">
                <h2 className="text-lg font-bold text-[#01312D] mb-1 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#3A7717]" /> Policy Agreement Checklist
                </h2>
                <p className="text-xs text-gray-500 mb-4">Please read and acknowledge each point below.</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <input
                      type="checkbox"
                      checked={formData.agreeAccuracy}
                      onChange={() => setFormData({ ...formData, agreeAccuracy: !formData.agreeAccuracy })}
                      className="mt-1 w-5 h-5 accent-[#3A7717] rounded"
                    />
                    <label className="text-sm text-[#01312D] font-medium leading-tight cursor-pointer">
                      I certify that all information provided is true and accurate.
                    </label>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <input
                      type="checkbox"
                      checked={formData.agreeRefTenure}
                      onChange={() => setFormData({ ...formData, agreeRefTenure: !formData.agreeRefTenure })}
                      className="mt-1 w-5 h-5 accent-[#3A7717] rounded"
                    />
                    <label className="text-sm text-[#01312D] font-medium leading-tight cursor-pointer">
                      I understand that my Kapuka Member Reference must have been active for at least 1 month.
                    </label>
                  </div>
                  {formData.ownershipStatus === "rent" && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <input
                        type="checkbox"
                        checked={formData.agreeOwnerContact}
                        onChange={() => setFormData({ ...formData, agreeOwnerContact: !formData.agreeOwnerContact })}
                        className="mt-1 w-5 h-5 accent-[#3A7717] rounded"
                      />
                      <label className="text-sm text-[#01312D] font-medium leading-tight cursor-pointer">
                        I consent to Kapuka contacting my car owner to verify my payment history.
                      </label>
                    </div>
                  )}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <input
                      type="checkbox"
                      checked={formData.agreeRepayment}
                      onChange={() => setFormData({ ...formData, agreeRepayment: !formData.agreeRepayment })}
                      className="mt-1 w-5 h-5 accent-[#3A7717] rounded"
                    />
                    <label className="text-sm text-[#01312D] font-medium leading-tight cursor-pointer">
                      I agree to follow the repayment schedule and cooperate with the Kapuka team.
                    </label>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <input
                      type="checkbox"
                      checked={formData.agreeEscalation}
                      onChange={() => setFormData({ ...formData, agreeEscalation: !formData.agreeEscalation })}
                      className="mt-1 w-5 h-5 accent-[#3A7717] rounded"
                    />
                    <label className="text-sm text-[#01312D] font-medium leading-tight cursor-pointer">
                      I acknowledge that failing to cooperate in paying back will result in a 2-week grace period before escalation.
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 bg-gray-200 text-[#01312D] py-3 rounded-xl font-semibold"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStep2Completed()}
                  className="flex-1 bg-[#3A7717] text-white py-3 rounded-xl font-semibold disabled:opacity-50"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 - Documents */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/20">
                <h2 className="text-lg font-bold text-[#01312D] mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#3A7717]" /> Document Upload
                </h2>
                <div className="space-y-6">
                  <UploadSection
                    label="Driver's License"
                    type="drivingLicense"
                    onUploadComplete={(url, publicId) =>
                      handleUploadComplete("driversLicense", url, publicId)
                    }
                    currentUrl={uploadedUrls.driversLicense}
                  />

                  <UploadSection
                    label="Car Registration Certificate"
                    type="carRegistration"
                    onUploadComplete={(url, publicId) =>
                      handleUploadComplete("carRegistration", url, publicId)
                    }
                    currentUrl={uploadedUrls.carRegistration}
                  />

                  <UploadSection
                    label="Profile Photo"
                    type="profilePhoto"
                    onUploadComplete={(url, publicId) =>
                      handleUploadComplete("profilePhoto", url, publicId)
                    }
                    currentUrl={uploadedUrls.profilePhoto}
                  />
                </div>
              </div>

              <div className="bg-[#eafde7] rounded-xl p-4 border border-[#bff202]/20">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="declaration"
                    className="mt-1 w-4 h-4 text-[#3A7717] rounded"
                    required
                  />
                  <label
                    htmlFor="declaration"
                    className="text-xs text-gray-600"
                  >
                    I hereby declare that all the information provided is true
                    and correct. I understand that providing false information
                    may result in rejection of my application.
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 bg-gray-200 text-[#01312D] py-3 rounded-xl font-semibold"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !isStep3Completed()}
                  className="flex-1 bg-[#3A7717] text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Submit Verification →"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
