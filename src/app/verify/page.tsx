// src/app/verify/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Car,
  User,
  MapPin,
  Calendar,
  Shield,
  Camera,
  X,
  Loader2,
} from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: "",
    dateOfBirth: "",
    address: "",
    city: "",
    pincode: "",

    // Vehicle Information
    carRegistrationNumber: "",
    carModel: "",
    carYear: "",
    carColor: "",

    // Documents
    driversLicense: null as File | null,
    carRegistration: null as File | null,
    profilePhoto: null as File | null,
  });

  const [previews, setPreviews] = useState({
    driversLicense: "",
    carRegistration: "",
    profilePhoto: "",
  });

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, [field]: file });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews({ ...previews, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (field: string) => {
    setFormData({ ...formData, [field]: null });
    setPreviews({ ...previews, [field]: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call to submit verification
    setTimeout(() => {
      setLoading(false);
      setSubmitSuccess(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/");
      }, 3000);
    }, 2000);
  };

  const nextStep = () => {
    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

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
          <div className="bg-white rounded-2xl p-4 mb-6 text-left">
            <p className="text-sm text-[#01312D] font-semibold mb-2">
              What's Next?
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                • Admin will review your documents
              </li>
              <li className="flex items-center gap-2">
                • You'll receive an email notification
              </li>
              <li className="flex items-center gap-2">
                • Once verified, you can access all services
              </li>
            </ul>
          </div>
          <button
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white px-6 py-3 rounded-xl font-semibold"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eafde7] pb-24">
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
                Driver Verification
              </h1>
              <p className="text-xs text-gray-500">
                Complete verification to access services
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  step >= s
                    ? "bg-[#3A7717] text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded ${
                    step > s ? "bg-[#3A7717]" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between px-2 mb-6">
          <span className="text-xs text-[#01312D] font-semibold">
            Personal Info
          </span>
          <span className="text-xs text-[#01312D] font-semibold">
            Vehicle Info
          </span>
          <span className="text-xs text-[#01312D] font-semibold">
            Documents
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* STEP 1: Personal Information */}
        {step === 1 && (
          <div className="px-5 space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/20">
              <h2 className="text-lg font-bold text-[#01312D] mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#3A7717]" />
                Personal Information
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
                    className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] focus:ring-2 focus:ring-[#72bf00]/20"
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
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] focus:ring-2 focus:ring-[#72bf00]/20"
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
                    className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] focus:ring-2 focus:ring-[#72bf00]/20"
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
                      className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
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
                      className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#eafde7] rounded-xl p-4 border border-[#bff202]/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#72bf00] mt-0.5" />
                <p className="text-xs text-gray-600">
                  Your personal information will be verified against your
                  driver's license. Please ensure accuracy.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={nextStep}
              className="w-full bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white py-3 rounded-xl font-semibold mt-4"
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 2: Vehicle Information */}
        {step === 2 && (
          <div className="px-5 space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/20">
              <h2 className="text-lg font-bold text-[#01312D] mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-[#3A7717]" />
                Vehicle Information
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
                    className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] uppercase"
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
                    placeholder="e.g., Toyota Innova, Hyundai i20"
                    className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
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
                      className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
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
                      placeholder="e.g., White, Black"
                      className="w-full px-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00]"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 bg-gray-200 text-[#01312D] py-3 rounded-xl font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white py-3 rounded-xl font-semibold"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Document Upload */}
        {step === 3 && (
          <div className="px-5 space-y-4 pb-24">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#bff202]/20">
              <h2 className="text-lg font-bold text-[#01312D] mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#3A7717]" />
                Document Upload
              </h2>

              <div className="space-y-5">
                {/* Driver's License */}
                <div>
                  <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                    Driver's License <span className="text-red-500">*</span>
                  </label>
                  {!previews.driversLicense ? (
                    <div className="border-2 border-dashed border-[#bff202]/30 rounded-xl p-6 text-center hover:border-[#72bf00] transition-colors">
                      <input
                        type="file"
                        id="driversLicense"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "driversLicense")}
                        className="hidden"
                      />
                      <label
                        htmlFor="driversLicense"
                        className="cursor-pointer block"
                      >
                        <Camera className="w-10 h-10 text-[#72bf00] mx-auto mb-2" />
                        <p className="text-sm text-[#01312D] font-semibold">
                          Upload Driver's License
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG or PNG (Max 5MB)
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative bg-[#eafde7] rounded-xl p-3">
                      <img
                        src={previews.driversLicense}
                        alt="Driver's License"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile("driversLicense")}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Car Registration */}
                <div>
                  <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                    Car Registration Certificate{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  {!previews.carRegistration ? (
                    <div className="border-2 border-dashed border-[#bff202]/30 rounded-xl p-6 text-center hover:border-[#72bf00] transition-colors">
                      <input
                        type="file"
                        id="carRegistration"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "carRegistration")}
                        className="hidden"
                      />
                      <label
                        htmlFor="carRegistration"
                        className="cursor-pointer block"
                      >
                        <FileText className="w-10 h-10 text-[#72bf00] mx-auto mb-2" />
                        <p className="text-sm text-[#01312D] font-semibold">
                          Upload RC
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG or PNG (Max 5MB)
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative bg-[#eafde7] rounded-xl p-3">
                      <img
                        src={previews.carRegistration}
                        alt="Car Registration"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile("carRegistration")}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Profile Photo */}
                <div>
                  <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                    Profile Photo <span className="text-red-500">*</span>
                  </label>
                  {!previews.profilePhoto ? (
                    <div className="border-2 border-dashed border-[#bff202]/30 rounded-xl p-6 text-center hover:border-[#72bf00] transition-colors">
                      <input
                        type="file"
                        id="profilePhoto"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "profilePhoto")}
                        className="hidden"
                      />
                      <label
                        htmlFor="profilePhoto"
                        className="cursor-pointer block"
                      >
                        <Camera className="w-10 h-10 text-[#72bf00] mx-auto mb-2" />
                        <p className="text-sm text-[#01312D] font-semibold">
                          Upload Profile Photo
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG or PNG (Max 2MB)
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative inline-block">
                      <img
                        src={previews.profilePhoto}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-[#bff202]"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile("profilePhoto")}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Declaration */}
            <div className="bg-[#eafde7] rounded-xl p-4 border border-[#bff202]/20">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="declaration"
                  className="mt-1 w-4 h-4 text-[#3A7717] rounded"
                  required
                />
                <label htmlFor="declaration" className="text-xs text-gray-600">
                  I hereby declare that all the information provided is true and
                  correct. I understand that providing false information may
                  lead to permanent account suspension.
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 bg-gray-200 text-[#01312D] py-3 rounded-xl font-semibold"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={
                  loading ||
                  !formData.driversLicense ||
                  !formData.carRegistration ||
                  !formData.profilePhoto
                }
                className="flex-1 bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Verification"
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
