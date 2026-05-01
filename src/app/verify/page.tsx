// src/app/verify/page.tsx - Fixed scrolling and touch feedback
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { CloudinaryUpload } from "@/components/CloudinaryUpload";
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertCircle,
  Car,
  User,
  Shield,
  Loader2,
  Image as ImageIcon,
  Home,
  Clock,
} from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<string>("");
  const [existingProfile, setExistingProfile] = useState<any>(null);
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

  const isStep2Completed = () => {
    return !!(
      formData.carRegistrationNumber &&
      formData.carModel &&
      formData.carYear &&
      formData.carColor
    );
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
      );
      if (response.ok) {
        const profile = await response.json();
        setExistingProfile(profile);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/driver/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id,
          fullName: formData.fullName,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
          city: formData.city,
          pincode: formData.pincode,
          carRegistrationNumber: formData.carRegistrationNumber,
          carModel: formData.carModel,
          carYear: parseInt(formData.carYear),
          carColor: formData.carColor,
          drivingLicenseUrl: uploadedUrls.driversLicense || "pending",
          carRegistrationUrl: uploadedUrls.carRegistration || "pending",
          profilePhotoUrl: uploadedUrls.profilePhoto || "pending",
          drivingLicensePublicId: uploadedPublicIds.driversLicense,
          carRegistrationPublicId: uploadedPublicIds.carRegistration,
          profilePhotoPublicId: uploadedPublicIds.profilePhoto,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit verification");
      }

      setSubmitSuccess(true);

      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (error: any) {
      console.error("Submission error:", error);
      alert(
        error.message || "Failed to submit verification. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && isStep1Completed()) {
      setStep(2);
      // Scroll to top of the form container
      const formContainer = document.querySelector(".form-container");
      if (formContainer) {
        formContainer.scrollTop = 0;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (step === 2 && isStep2Completed()) {
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (step === 1 && !isStep1Completed()) {
      alert("Please fill in all required fields");
    } else if (step === 2 && !isStep2Completed()) {
      alert("Please fill in all vehicle information");
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
              onClick={() => router.push("/verify/status")}
              className="flex-1 bg-[#72bf00] text-white px-4 py-2 rounded-lg font-semibold active:scale-95 transition-transform touch-manipulation"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              Check Status
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex-1 bg-[#01312D] text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform touch-manipulation"
              style={{ WebkitTapHighlightColor: "transparent" }}
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

  if (isPending || fetchingProfile) {
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
    return null;
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
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform touch-manipulation"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Main form render - with proper scrolling container
  return (
    <div className="min-h-screen bg-[#eafde7] flex flex-col overflow-y-auto">
      {/* Sticky Header */}
      <div className="bg-white border-b border-[#bff202]/20 sticky top-0 z-20 shadow-sm flex-shrink-0">
        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 bg-[#eafde7] rounded-full flex items-center justify-center active:scale-95 transition-transform touch-manipulation"
              style={{ WebkitTapHighlightColor: "transparent" }}
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

      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-32 form-container">
        <div className="max-w-3xl mx-auto">
          {/* Progress Steps with working checkmarks */}
          <div className="mb-10">
            <div className="flex items-center justify-between">
              {/* Step 1 */}
              <div className="flex-1 flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                    step === 1
                      ? "bg-[#3A7717] text-white ring-4 ring-[#bff202] ring-offset-2"
                      : isStep1Completed()
                        ? "bg-[#3A7717] text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isStep1Completed() ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    "1"
                  )}
                </div>
                <span className="text-xs text-center mt-2 font-medium text-[#01312D]">
                  Personal
                </span>
                {step === 1 && (
                  <div className="w-16 h-0.5 bg-[#3A7717] mt-2 rounded-full" />
                )}
              </div>

              {/* Connector Line 1-2 */}
              <div className="flex-1 h-0.5 mx-2 rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: isStep1Completed() ? "100%" : "0%",
                    backgroundColor: "#3A7717",
                  }}
                />
              </div>

              {/* Step 2 */}
              <div className="flex-1 flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                    step === 2
                      ? "bg-[#3A7717] text-white ring-4 ring-[#bff202] ring-offset-2"
                      : isStep2Completed()
                        ? "bg-[#3A7717] text-white"
                        : isStep1Completed()
                          ? "bg-gray-200 text-gray-500"
                          : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isStep2Completed() ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    "2"
                  )}
                </div>
                <span className="text-xs text-center mt-2 font-medium text-[#01312D]">
                  Vehicle
                </span>
                {step === 2 && (
                  <div className="w-16 h-0.5 bg-[#3A7717] mt-2 rounded-full" />
                )}
              </div>

              {/* Connector Line 2-3 */}
              <div className="flex-1 h-0.5 mx-2 rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: isStep2Completed() ? "100%" : "0%",
                    backgroundColor: "#3A7717",
                  }}
                />
              </div>

              {/* Step 3 */}
              <div className="flex-1 flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                    step === 3
                      ? "bg-[#3A7717] text-white ring-4 ring-[#bff202] ring-offset-2"
                      : isStep3Completed()
                        ? "bg-[#3A7717] text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isStep3Completed() ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    "3"
                  )}
                </div>
                <span className="text-xs text-center mt-2 font-medium text-[#01312D]">
                  Documents
                </span>
                {step === 3 && (
                  <div className="w-16 h-0.5 bg-[#3A7717] mt-2 rounded-full" />
                )}
              </div>
            </div>
          </div>

          {/* Step 1 - Personal Info */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
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
                      className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] focus:ring-2 focus:ring-[#72bf00]/20 transition-all"
                      required
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
                      className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] focus:ring-2 focus:ring-[#72bf00]/20 transition-all"
                      required
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
                      className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] focus:ring-2 focus:ring-[#72bf00]/20 transition-all resize-none"
                      required
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
                        className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] focus:ring-2 focus:ring-[#72bf00]/20 transition-all"
                        required
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
                        className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] focus:ring-2 focus:ring-[#72bf00]/20 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={nextStep}
                disabled={!isStep1Completed()}
                className="w-full bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg active:scale-98 touch-manipulation"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2 - Vehicle Info */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
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
                      placeholder="e.g., KA01AB1234"
                      className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] focus:ring-2 focus:ring-[#72bf00]/20 transition-all uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                      Car Model
                    </label>
                    <input
                      type="text"
                      value={formData.carModel}
                      onChange={(e) =>
                        setFormData({ ...formData, carModel: e.target.value })
                      }
                      placeholder="e.g., Toyota Innova"
                      className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] focus:ring-2 focus:ring-[#72bf00]/20 transition-all"
                      required
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
                        placeholder="2024"
                        className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] focus:ring-2 focus:ring-[#72bf00]/20 transition-all"
                        required
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
                          setFormData({ ...formData, carColor: e.target.value })
                        }
                        placeholder="e.g., White"
                        className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] focus:ring-2 focus:ring-[#72bf00]/20 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={prevStep}
                  className="flex-1 bg-gray-200 text-[#01312D] py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all active:scale-98 touch-manipulation"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  ← Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={!isStep2Completed()}
                  className="flex-1 bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg active:scale-98 touch-manipulation"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 - Documents */}
          {step === 3 && (
            <div className="space-y-4 pb-24 animate-fadeIn">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/20">
                <h2 className="text-lg font-bold text-[#01312D] mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#3A7717]" /> Document Upload
                </h2>
                <div className="space-y-6">
                  <CloudinaryUpload
                    label="Driver's License"
                    type="drivingLicense"
                    onUploadComplete={(url, publicId) =>
                      handleUploadComplete("driversLicense", url, publicId)
                    }
                    currentUrl={uploadedUrls.driversLicense}
                    currentPublicId={uploadedPublicIds.driversLicense}
                  />

                  <CloudinaryUpload
                    label="Car Registration Certificate"
                    type="carRegistration"
                    onUploadComplete={(url, publicId) =>
                      handleUploadComplete("carRegistration", url, publicId)
                    }
                    currentUrl={uploadedUrls.carRegistration}
                    currentPublicId={uploadedPublicIds.carRegistration}
                  />

                  <CloudinaryUpload
                    label="Profile Photo"
                    type="profilePhoto"
                    onUploadComplete={(url, publicId) =>
                      handleUploadComplete("profilePhoto", url, publicId)
                    }
                    currentUrl={uploadedUrls.profilePhoto}
                    currentPublicId={uploadedPublicIds.profilePhoto}
                  />
                </div>
              </div>

              <div className="bg-[#eafde7] rounded-xl p-4 border border-[#bff202]/20">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="declaration"
                    className="mt-1 w-4 h-4 text-[#3A7717] rounded focus:ring-[#3A7717]"
                    required
                  />
                  <label
                    htmlFor="declaration"
                    className="text-xs text-gray-600"
                  >
                    I hereby declare that all the information provided is true
                    and correct.
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={prevStep}
                  className="flex-1 bg-gray-200 text-[#01312D] py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all active:scale-98 touch-manipulation"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !isStep3Completed()}
                  className="flex-1 bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-98 touch-manipulation"
                  style={{ WebkitTapHighlightColor: "transparent" }}
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

      {/* CSS for animations and touch feedback */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        /* Touch feedback styles */
        .touch-manipulation {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        .active\\:scale-98:active {
          transform: scale(0.98);
        }

        /* Ensure proper scrolling on mobile */
        .form-container {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }

        /* Better input focus styles for mobile */
        input:focus,
        textarea:focus,
        select:focus {
          outline: none;
        }

        /* Prevent zoom on input focus on iOS */
        @media (max-width: 768px) {
          input,
          textarea,
          select {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}
