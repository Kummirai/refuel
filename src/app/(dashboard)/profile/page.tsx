// src/app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { authClient } from "@/lib/auth-client";
import { fetcher } from "@/lib/fetch";
import {
  formatDepositDate,
  formatDepositMoney,
  getDepositTierConfig,
  type DriverDepositSummary,
} from "@/lib/deposit-ui";
import BottomNavigation from "@/components/BottomNavigation";
import { compressImage } from "@/lib/utils/image-compression";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import {
  User,
  Car,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Shield,
  AlertCircle,
  Edit2,
  Camera,
  TrendingUp,
  Wallet,
  History,
  Star,
  ThumbsUp,
  Loader2,
  Image as ImageIcon,
  Fuel,
  Smartphone,
  SprayCan,
  DollarSign,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import ConnectingScreen from "@/components/ConnectingScreen";
import { formatMoney, toMoney } from "@/lib/money";
import { useSessionPending } from "@/lib/hooks/useSessionPending";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const sessionPending = useSessionPending(isPending);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "loans" | "settings">(
    "profile",
  );
  const { data: deposit } = useSWR<DriverDepositSummary>(
    session?.user?.id
      ? `/api/driver/deposit?userId=${session.user.id}`
      : null,
    fetcher,
    { refreshInterval: 60_000 },
  );
  const [profile, setProfile] = useState<any>(null);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>("");
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    dateOfBirth: "",
    carRegistration: "",
    carModel: "",
    carYear: "",
    carColor: "",
    drivingLicenseUrl: "",
    carRegistrationUrl: "",
    isVerified: false,
    verificationStatus: "not_submitted",
    memberSince: "",
    totalRequests: 0,
    totalSpent: 0,
    totalLoans: 0,
    rating: 0,
    activeLoan: null,
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    branchCode: "",
  });

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangePhone, setShowChangePhone] = useState(false);
  const [showUpdateVehicle, setShowUpdateVehicle] = useState(false);
  const [showUpdateBanking, setShowUpdateBanking] = useState(false);
  useBodyScrollLock(showChangePassword || showChangePhone || showUpdateVehicle || showUpdateBanking);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [phoneForm, setPhoneForm] = useState({ phone: "" });
  const [vehicleForm, setVehicleForm] = useState({
    carRegistrationNumber: "",
    carModel: "",
    carYear: "",
    carColor: "",
  });
  const [bankingForm, setBankingForm] = useState({
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    branchCode: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.push("/auth/sign-in");
      } else {
        fetchProfile();
      }
    }
  }, [session, isPending]);

  // Never leave the profile skeletons up forever if a request stalls.
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 15_000);
    return () => clearTimeout(timer);
  }, [loading]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const signal = AbortSignal.timeout(15_000);
      const [profileRes, requestsRes] = await Promise.all([
        fetch(`/api/driver/profile?userId=${session?.user?.id}`, { signal }),
        fetch(`/api/driver/requests?userId=${session?.user?.id}`, { signal }),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data);

        // Set profile photo URL if exists
        if (data?.profilePhotoUrl && data.profilePhotoUrl !== "pending") {
          setProfilePhotoUrl(data.profilePhotoUrl);
        }

        // Calculate member since from createdAt
        const memberSince = data?.createdAt
          ? new Date(data.createdAt).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })
          : "Recently";

        setUserData((prev) => ({
          ...prev,
          name: data?.fullName || session?.user?.name || "",
          email: session?.user?.email || "",
          phone: data?.phone || "",
          address: data?.address || "Not provided",
          city: data?.city || "Not provided",
          pincode: data?.pincode || "Not provided",
          dateOfBirth: data?.dateOfBirth || "Not provided",
          carRegistration: data?.carRegistrationNumber || "Not provided",
          carModel: data?.carModel || "Not provided",
          carYear: data?.carYear || "Not provided",
          carColor: data?.carColor || "Not provided",
          drivingLicenseUrl: data?.drivingLicenseUrl || "",
          carRegistrationUrl: data?.carRegistrationUrl || "",
          isVerified: data?.isVerified || false,
          verificationStatus: data?.verificationStatus || "not_submitted",
          memberSince: memberSince,
          totalRequests: data?.totalRequests || 0,
          totalSpent: data?.totalSpent || 0,
          rating: data?.rating || 0,
          bankName: data?.bankName || "",
          accountHolder: data?.accountHolder || "",
          accountNumber: data?.accountNumber || "",
          branchCode: data?.branchCode || "",
        }));
      }

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setAllRequests(requestsData);

        // Calculate total spent from fulfilled requests only
        const totalSpent = toMoney(requestsData
          .filter(
            (r: any) =>
              r.status === "approved" ||
              r.status === "sent" ||
              r.status === "completed",
          )
          .reduce((sum: number, r: any) => sum + (r.actualAmount || r.amount || 0), 0));

        // Calculate total active loans (where balance > 0)
        const activeLoansCount = requestsData.filter(
          (r: any) =>
            (r.status === "approved" ||
              r.status === "sent" ||
              r.status === "completed") &&
            r.remainingBalance > 0,
        ).length;

        setUserData((prev) => ({
          ...prev,
          totalSpent,
          totalLoans: activeLoansCount,
          totalRequests: requestsData.length,
        }));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      alert("Only JPG and PNG files are allowed");
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File too large. Max size is 2MB");
      return;
    }

    setUploadingPhoto(true);

    try {
      const compressedBlob = await compressImage(file);
      const compressedFile = new File([compressedBlob], file.name, {
        type: compressedBlob.type || file.type,
      });

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("type", "profilePhoto");

      const response = await fetch("/api/driver/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload photo");
      }

      const updateResponse = await fetch("/api/driver/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id,
          profilePhotoUrl: data.url,
        }),
      });

      if (updateResponse.ok) {
        setProfilePhotoUrl(data.url);
        alert("Profile photo updated successfully!");
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error.message || "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleChangePassword = async () => {
    setSaveError("");
    setSaveSuccess("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setSaveError("All fields are required");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setSaveError("New password must be at least 6 characters");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSaveError("New passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/driver/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setSaveSuccess("Password changed successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => {
        setShowChangePassword(false);
        setSaveSuccess("");
      }, 1500);
    } catch (error: any) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePhone = async () => {
    setSaveError("");
    setSaveSuccess("");

    if (!phoneForm.phone.trim()) {
      setSaveError("Phone number is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/driver/update-credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneForm.phone.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update phone number");
      }

      setUserData((prev) => ({ ...prev, phone: phoneForm.phone.trim() }));
      setSaveSuccess("Phone number updated successfully");
      setTimeout(() => {
        setShowChangePhone(false);
        setSaveSuccess("");
      }, 1500);
    } catch (error: any) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateVehicle = async () => {
    setSaveError("");
    setSaveSuccess("");

    if (!vehicleForm.carRegistrationNumber.trim()) {
      setSaveError("Car registration number is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/driver/update-vehicle", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicleForm),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update vehicle details");
      }

      setUserData((prev) => ({
        ...prev,
        carRegistration: vehicleForm.carRegistrationNumber || prev.carRegistration,
        carModel: vehicleForm.carModel || prev.carModel,
        carYear: vehicleForm.carYear || prev.carYear,
        carColor: vehicleForm.carColor || prev.carColor,
      }));
      setSaveSuccess("Vehicle details updated successfully");
      setTimeout(() => {
        setShowUpdateVehicle(false);
        setSaveSuccess("");
      }, 1500);
    } catch (error: any) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBanking = async () => {
    setSaveError("");
    setSaveSuccess("");

    setSaving(true);
    try {
      const res = await fetch("/api/driver/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id,
          bankName: bankingForm.bankName.trim() || undefined,
          accountHolder: bankingForm.accountHolder.trim() || undefined,
          accountNumber: bankingForm.accountNumber.trim() || undefined,
          branchCode: bankingForm.branchCode.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update banking details");
      }

      setUserData((prev) => ({
        ...prev,
        bankName: bankingForm.bankName.trim(),
        accountHolder: bankingForm.accountHolder.trim(),
        accountNumber: bankingForm.accountNumber.trim(),
        branchCode: bankingForm.branchCode.trim(),
      }));
      setSaveSuccess("Banking details updated successfully");
      setTimeout(() => {
        setShowUpdateBanking(false);
        setSaveSuccess("");
      }, 1500);
    } catch (error: any) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const openChangePassword = () => {
    setSaveError("");
    setSaveSuccess("");
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setShowChangePassword(true);
  };

  const openChangePhone = () => {
    setSaveError("");
    setSaveSuccess("");
    setPhoneForm({ phone: userData.phone === "Not provided" ? "" : userData.phone });
    setShowChangePhone(true);
  };

  const openUpdateVehicle = () => {
    setSaveError("");
    setSaveSuccess("");
    setVehicleForm({
      carRegistrationNumber:
        userData.carRegistration === "Not provided"
          ? ""
          : userData.carRegistration,
      carModel: userData.carModel === "Not provided" ? "" : userData.carModel,
      carYear: userData.carYear === "Not provided" ? "" : userData.carYear,
      carColor: userData.carColor === "Not provided" ? "" : userData.carColor,
    });
    setShowUpdateVehicle(true);
  };

  const openUpdateBanking = () => {
    setSaveError("");
    setSaveSuccess("");
    setBankingForm({
      bankName: userData.bankName || "",
      accountHolder: userData.accountHolder || "",
      accountNumber: userData.accountNumber || "",
      branchCode: userData.branchCode || "",
    });
    setShowUpdateBanking(true);
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="text-[#3A7717] bg-[#3A7717]/10 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Verified
          </span>
        );
      case "pending":
        return (
          <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case "rejected":
        return (
          <span className="text-red-600 bg-red-50 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded-lg text-xs font-semibold">
            Not Verified
          </span>
        );
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case "fuel":
        return <Fuel className="w-4 h-4 text-green-600" />;
      case "airtime":
        return <Smartphone className="w-4 h-4 text-blue-600" />;
      case "carwash":
        return <SprayCan className="w-4 h-4 text-purple-600" />;
      case "cash":
        return <DollarSign className="w-4 h-4 text-yellow-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  if (sessionPending) {
    return (
      <div className="min-h-screen bg-[#eafde7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#3A7717] animate-spin mx-auto mb-4" />
          <p className="text-[#01312D]">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return isPending ? <ConnectingScreen message="Still loading your profile…" /> : null;
  }

  // Format full address
  const fullAddress =
    userData.address !== "Not provided"
      ? `${userData.address}, ${userData.city} - ${userData.pincode}`
      : "Not provided";

  // Filter for active loans and recent activity
  const activeLoans = allRequests.filter(
    (r: any) =>
      (r.status === "approved" ||
        r.status === "sent" ||
        r.status === "completed") &&
      r.remainingBalance > 0,
  );

  const recentActivity = allRequests.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#eafde7] pb-24">
      {/* Header with Cover Photo */}
      <div className="relative max-w-3xl mx-auto">
        <div className="h-32 bg-gradient-to-r from-[#01312D] to-[#3A7717] relative">
          <button className="absolute bottom-2 right-2 bg-black/50 p-1.5 rounded-full">
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Profile Avatar */}
        <div className="absolute -bottom-12 left-5">
          <div className="relative">
            <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-white overflow-hidden">
              {profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt="Profile"
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#01312D] to-[#3A7717] rounded-full flex items-center justify-center">
                  <span className="text-4xl text-white font-bold">
                    {userData.name.charAt(0) || "U"}
                  </span>
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-[#bff202] p-1.5 rounded-full shadow-md cursor-pointer hover:bg-[#d4e84a] transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleProfilePhotoUpload}
                disabled={uploadingPhoto}
                className="hidden"
              />
              {uploadingPhoto ? (
                <Loader2 className="w-3 h-3 text-[#01312D] animate-spin" />
              ) : (
                <Camera className="w-3 h-3 text-[#01312D]" />
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-5 pt-16 pb-4 bg-white border-b border-[#bff202]/20 max-w-3xl mx-auto w-full">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-2xl font-bold text-[#01312D]">
              {loading ? <Skeleton className="h-8 w-48" /> : userData.name}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {loading ? <Skeleton className="h-5 w-56" /> : <p className="text-gray-500 text-sm">{userData.email}</p>}
              {!loading && getStatusBadge(userData.verificationStatus)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="bg-[#eafde7] px-2 py-1 rounded-lg">
                <div className="text-xs text-[#01312D]">
                  {loading ? <Skeleton className="h-4 w-36" /> : <>Member since {userData.memberSince}</>}
                </div>
              </div>
            </div>
          </div>
          <button className="bg-[#eafde7] p-2 rounded-full">
            <Edit2 className="w-5 h-5 text-[#3A7717]" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2 p-5 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#bff202]/20">
          <div className="w-8 h-8 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-1">
            <History className="w-4 h-4 text-[#3A7717]" />
          </div>
          <div className="text-lg font-bold text-[#01312D]">
            {loading ? <Skeleton className="h-6 w-10 mx-auto" /> : userData.totalRequests}
          </div>
          <p className="text-xs text-gray-500">Requests</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#bff202]/20">
          <div className="w-8 h-8 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-1">
            <Wallet className="w-4 h-4 text-[#3A7717]" />
          </div>
          <div className="text-lg font-bold text-[#01312D]">
            {loading ? <Skeleton className="h-6 w-20 mx-auto" /> : <>{formatMoney(userData.totalSpent)}</>}
          </div>
          <p className="text-xs text-gray-500">Spent</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#bff202]/20">
          <div className="w-8 h-8 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-1">
            <TrendingUp className="w-4 h-4 text-[#3A7717]" />
          </div>
          <div className="text-lg font-bold text-[#01312D]">
            {loading ? <Skeleton className="h-6 w-10 mx-auto" /> : userData.totalLoans}
          </div>
          <p className="text-xs text-gray-500">Loans</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#bff202]/20">
          <div className="w-8 h-8 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-1">
            <Star className="w-4 h-4 text-[#3A7717]" />
          </div>
          <div className="text-lg font-bold text-[#01312D]">
            {loading ? <Skeleton className="h-6 w-10 mx-auto" /> : (userData.rating || "N/A")}
          </div>
          <p className="text-xs text-gray-500">Rating</p>
        </div>
      </div>

      {/* Verification Banner for unverified users */}
      {loading ? (
        <div className="px-5 mb-4 max-w-3xl mx-auto w-full">
          <div className="rounded-2xl p-4">
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      ) : userData.verificationStatus !== "approved" && (
        <div className="px-5 mb-4 max-w-3xl mx-auto w-full">
          <div className="bg-gradient-to-r from-[#bff202] to-[#72bf00] rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#01312D] text-sm font-semibold">
                  {userData.verificationStatus === "pending"
                    ? "⏳ Verification Pending"
                    : userData.verificationStatus === "rejected"
                      ? "❌ Verification Failed"
                      : "⚠️ Verification Required"}
                </p>
                <p className="text-[#01312D] text-xs mt-1">
                  {userData.verificationStatus === "pending"
                    ? "Your documents are being reviewed. You'll be notified once verified."
                    : userData.verificationStatus === "rejected"
                      ? "Your verification was rejected. Please re-submit your documents."
                      : "Complete verification to access all services including fuel, cash, airtime & car wash."}
                </p>
              </div>
              <button
                onClick={() => router.push("/verify")}
                className="bg-[#01312D] text-white px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ml-3"
              >
                {userData.verificationStatus === "pending"
                  ? "Check Status"
                  : "Verify Now"}{" "}
                →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-5 border-b border-[#bff202]/20 bg-white max-w-3xl mx-auto w-full">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-3 px-1 font-semibold transition-all relative ${
              activeTab === "profile" ? "text-[#3A7717]" : "text-gray-500"
            }`}
          >
            Profile
            {activeTab === "profile" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3A7717] rounded-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("loans")}
            className={`pb-3 px-1 font-semibold transition-all relative ${
              activeTab === "loans" ? "text-[#3A7717]" : "text-gray-500"
            }`}
          >
            Loans & History
            {activeTab === "loans" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3A7717] rounded-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 px-1 font-semibold transition-all relative ${
              activeTab === "settings" ? "text-[#3A7717]" : "text-gray-500"
            }`}
          >
            Settings
            {activeTab === "settings" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3A7717] rounded-full"></div>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-5 max-w-3xl mx-auto w-full">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            {!deposit ? (
              <Skeleton className="h-40 w-full rounded-2xl" />
            ) : !deposit.tier ? (
              <button
                onClick={() => router.push("/deposit")}
                className="w-full text-left rounded-2xl bg-linear-to-br from-[#01312D] to-[#3A7717] p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#bff202] flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-[#01312D]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold">Security deposit</p>
                    <p className="text-white/70 text-xs mt-1">
                      Choose R1,500 or R2,500 to unlock your weekly fuel credit.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#bff202]" />
                </div>
              </button>
            ) : (
              <button
                onClick={() => router.push("/deposit")}
                className="w-full text-left rounded-2xl bg-linear-to-br from-[#01312D] to-[#3A7717] p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#bff202]" />
                    <p className="text-white font-bold">Security deposit</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white">
                    {getDepositTierConfig(deposit.tier)?.name ?? deposit.tier}
                  </span>
                </div>
                <p className="text-white text-2xl font-extrabold mt-3">
                  {formatDepositMoney(deposit.securityDepositBalance)}
                </p>
                <p className="text-white/60 text-xs">
                  of {formatDepositMoney(deposit.targetDepositAmount)} target
                </p>
                <div className="h-1.5 rounded-full bg-white/15 mt-3 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-[#bff202]"
                    style={{
                      width: `${Math.min(
                        100,
                        deposit.targetDepositAmount > 0
                          ? (deposit.securityDepositBalance /
                              deposit.targetDepositAmount) *
                              100
                          : 0,
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-white/70 text-xs">
                    {formatDepositMoney(deposit.weeklyDepositInstallment)} weekly ·{" "}
                    {deposit.weeksPaid}/{getDepositTierConfig(deposit.tier)?.totalWeeks ?? 0}{" "}
                    weeks paid
                  </p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      deposit.weeklyInstallmentPaid
                        ? "bg-[#bff202] text-[#01312D]"
                        : "bg-red-500/20 text-red-100"
                    }`}
                  >
                    {deposit.depositComplete
                      ? "Complete"
                      : deposit.weeklyInstallmentPaid
                        ? "This week paid"
                        : deposit.currentWeek.pendingProofId
                          ? "In review"
                          : `Due ${formatDepositDate(deposit.currentWeek.start)}`}
                  </span>
                </div>
              </button>
            )}

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <h3 className="font-bold text-[#01312D] mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[#3A7717]" />
                Personal Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#72bf00]" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    {loading ? <Skeleton className="h-5 w-48 mt-1" /> : <p className="text-sm text-[#01312D]">{userData.email}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#72bf00]" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    {loading ? <Skeleton className="h-5 w-36 mt-1" /> : <p className="text-sm text-[#01312D]">{userData.phone || "Not provided"}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#72bf00]" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Address</p>
                    {loading ? <Skeleton className="h-5 w-56 mt-1" /> : <p className="text-sm text-[#01312D]">{fullAddress}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-[#72bf00]" />
                  <div>
                    <p className="text-xs text-gray-500">Date of Birth</p>
                    {loading ? <Skeleton className="h-5 w-36 mt-1" /> : <p className="text-sm text-[#01312D]">{userData.dateOfBirth !== "Not provided" ? new Date(userData.dateOfBirth).toLocaleDateString() : "Not provided"}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <h3 className="font-bold text-[#01312D] mb-3 flex items-center gap-2">
                <Car className="w-4 h-4 text-[#3A7717]" />
                Vehicle Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">
                    Registration Number
                  </span>
                  {loading ? <Skeleton className="h-5 w-32" /> : <span className="text-sm font-semibold text-[#01312D]">{userData.carRegistration}</span>}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Car Model</span>
                  {loading ? <Skeleton className="h-5 w-32" /> : <span className="text-sm font-semibold text-[#01312D]">{userData.carModel}</span>}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Year</span>
                  {loading ? <Skeleton className="h-5 w-20" /> : <span className="text-sm font-semibold text-[#01312D]">{userData.carYear}</span>}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Color</span>
                  {loading ? <Skeleton className="h-5 w-20" /> : <span className="text-sm font-semibold text-[#01312D]">{userData.carColor}</span>}
                </div>
              </div>
            </div>

            {(userData.bankName || userData.accountNumber) && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
                <h3 className="font-bold text-[#01312D] mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#3A7717]" />
                  Banking Details
                </h3>
                <div className="space-y-3">
                  {userData.bankName && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Bank</span>
                      <span className="text-sm font-semibold text-[#01312D]">{userData.bankName}</span>
                    </div>
                  )}
                  {userData.accountHolder && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Account Holder</span>
                      <span className="text-sm font-semibold text-[#01312D]">{userData.accountHolder}</span>
                    </div>
                  )}
                  {userData.accountNumber && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Account Number</span>
                      <span className="text-sm font-semibold text-[#01312D]">{userData.accountNumber.replace(/\d(?=\d{4})/g, '*')}</span>
                    </div>
                  )}
                  {userData.branchCode && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Branch Code</span>
                      <span className="text-sm font-semibold text-[#01312D]">{userData.branchCode}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {userData.isVerified && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
                <h3 className="font-bold text-[#01312D] mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#3A7717]" />
                  Verified Documents
                </h3>
                <div className="space-y-2">
                  {userData.drivingLicenseUrl && (
                    <a
                      href={userData.drivingLicenseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-between p-3 bg-[#eafde7] rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-[#3A7717]" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-[#01312D]">
                            Driving License
                          </p>
                          <p className="text-xs text-gray-500">View Document</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </a>
                  )}
                  {userData.carRegistrationUrl && (
                    <a
                      href={userData.carRegistrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-between p-3 bg-[#eafde7] rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-[#3A7717]" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-[#01312D]">
                            Vehicle Registration
                          </p>
                          <p className="text-xs text-gray-500">View Document</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-[#01312D]">Recent Activity</h3>
                <button
                  onClick={() => router.push("/requests/history")}
                  className="text-[#72bf00] text-xs font-semibold"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-lg" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <Skeleton className="h-4 w-16 ml-auto" />
                          <Skeleton className="h-3 w-12 ml-auto" />
                        </div>
                      </div>
                    ))}
                  </>
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((req, idx) => (
                    <div
                      key={req.id || idx}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#eafde7] rounded-lg flex items-center justify-center">
                          {getServiceIcon(req.type)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#01312D] capitalize">
                            {req.type} Service
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(req.requestDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#01312D]">
                          {formatMoney(req.actualAmount || req.amount)}
                        </p>
                        <p
                          className={`text-[10px] font-bold uppercase ${
                            req.status === "approved" ||
                            req.status === "sent" ||
                            req.status === "completed"
                              ? "text-green-600"
                              : req.status === "rejected"
                                ? "text-red-600"
                                : "text-yellow-600"
                          }`}
                        >
                          {req.status}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loans & History Tab */}
        {activeTab === "loans" && (
          <div className="space-y-4">
            {/* Active Loans Section */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <h3 className="font-bold text-[#01312D] mb-3 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#3A7717]" />
                Active Loans & Balances
              </h3>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-3 bg-[#eafde7] rounded-xl border border-[#bff202]/10">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="w-8 h-8 rounded-lg" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Balance</p>
                          <Skeleton className="h-5 w-16 mt-1 ml-auto" />
                        </div>
                      </div>
                      <Skeleton className="w-full h-1.5 rounded-full mb-2" />
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-14" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeLoans.length > 0 ? (
                <div className="space-y-3">
                  {activeLoans.map((loan, idx) => (
                    <div
                      key={loan.id || idx}
                      className="p-3 bg-[#eafde7] rounded-xl border border-[#bff202]/10"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {getServiceIcon(loan.type)}
                          <span className="font-bold text-[#01312D] capitalize">
                            {loan.type}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Balance</p>
                          <p className="text-sm font-black text-[#01312D]">
                            {formatMoney(loan.remainingBalance)}
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-white/50 rounded-full h-1.5 mb-2">
                        <div
                          className="bg-[#3A7717] h-1.5 rounded-full"
                          style={{
                            width: `${Math.max(5, (1 - loan.remainingBalance / (loan.totalRepayable || loan.amount)) * 100)}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-gray-500">
                            Total: {formatMoney(loan.totalRepayable || loan.amount)}
                        </span>
                        <button
                          onClick={() => router.push("/requests/history")}
                          className="text-[#3A7717] font-bold"
                        >
                          Pay Now →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-10 h-10 text-green-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">All loans paid up!</p>
                  <button
                    onClick={() => router.push("/requests")}
                    className="mt-2 text-[#72bf00] text-xs font-bold"
                  >
                    Request New Service →
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <h3 className="font-bold text-[#01312D] mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#3A7717]" />
                Payment Methods
              </h3>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-between p-3 bg-[#eafde7] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <span className="text-xl">🏦</span>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-[#01312D]">
                        Add Bank Account
                      </p>
                      <p className="text-xs text-gray-500">
                        For loan repayments
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-[#eafde7] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <span className="text-xl">💳</span>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-[#01312D]">Add UPI ID</p>
                      <p className="text-xs text-gray-500">
                        For quick payments
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <h3 className="font-bold text-[#01312D] mb-3">
                Account Settings
              </h3>
              <div className="space-y-3">
                <button
                  onClick={openChangePassword}
                  className="w-full flex items-center justify-between py-2"
                >
                  <span className="text-[#01312D]">Change Password</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={openChangePhone}
                  className="w-full flex items-center justify-between py-2"
                >
                  <span className="text-[#01312D]">Change Phone Number</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={openUpdateVehicle}
                  className="w-full flex items-center justify-between py-2"
                >
                  <span className="text-[#01312D]">Update Vehicle Details</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={openUpdateBanking}
                  className="w-full flex items-center justify-between py-2"
                >
                  <span className="text-[#01312D]">Update Banking Details</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <h3 className="font-bold text-[#01312D] mb-3">Notifications</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#01312D]">
                      Push Notifications
                    </p>
                    <p className="text-xs text-gray-500">
                      Get alerts about requests and payments
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      defaultChecked
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3A7717]"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#01312D]">
                      Email Notifications
                    </p>
                    <p className="text-xs text-gray-500">
                      Receive email for important updates
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      defaultChecked
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3A7717]"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <h3 className="font-bold text-[#01312D] mb-3">Support & Legal</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between py-2">
                  <span className="text-[#01312D]">Help Center</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between py-2">
                  <span className="text-[#01312D]">Terms & Conditions</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between py-2">
                  <span className="text-[#01312D]">Privacy Policy</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between py-2">
                  <span className="text-[#01312D]">About Us</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
              <h3 className="font-bold text-red-600 mb-3">Danger Zone</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-between py-2 text-red-600">
                  <span>Delete Account</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button className="w-full flex items-center justify-between py-2 text-red-600">
                  <span>Deactivate Account</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full px-4 bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 mt-4"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </button>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowChangePassword(false); setSaveError(""); setSaveSuccess(""); }}
          ></div>
          <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#01312D] to-[#3A7717] rounded-t-2xl p-5">
              <h2 className="text-xl font-bold text-white">Change Password</h2>
              <p className="text-white/80 text-sm mt-1">Enter your current and new password</p>
            </div>
            <div className="p-5 space-y-4">
              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{saveError}</div>
              )}
              {saveSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">{saveSuccess}</div>
              )}
              <div>
                <label className="block text-[#01312D] font-semibold mb-1.5 text-sm">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#3A7717]"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-1.5 text-sm">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#3A7717]"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-1.5 text-sm">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#3A7717]"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <div className="border-t border-gray-100 p-5 flex gap-3">
              <button
                onClick={() => { setShowChangePassword(false); setSaveError(""); setSaveSuccess(""); }}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={saving}
                className="flex-1 px-3 bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Phone Modal */}
      {showChangePhone && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowChangePhone(false); setSaveError(""); setSaveSuccess(""); }}
          ></div>
          <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#01312D] to-[#3A7717] rounded-t-2xl p-5">
              <h2 className="text-xl font-bold text-white">Change Phone Number</h2>
              <p className="text-white/80 text-sm mt-1">Update your phone number</p>
            </div>
            <div className="p-5 space-y-4">
              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{saveError}</div>
              )}
              {saveSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">{saveSuccess}</div>
              )}
              <div>
                <label className="block text-[#01312D] font-semibold mb-1.5 text-sm">Phone Number</label>
                <input
                  type="tel"
                  value={phoneForm.phone}
                  onChange={(e) => setPhoneForm({ phone: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#3A7717]"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            <div className="border-t border-gray-100 p-5 flex gap-3">
              <button
                onClick={() => { setShowChangePhone(false); setSaveError(""); setSaveSuccess(""); }}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePhone}
                disabled={saving}
                className="flex-1 px-3 bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Update Phone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Vehicle Modal */}
      {showUpdateVehicle && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowUpdateVehicle(false); setSaveError(""); setSaveSuccess(""); }}
          ></div>
          <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#01312D] to-[#3A7717] rounded-t-2xl p-5">
              <h2 className="text-xl font-bold text-white">Update Vehicle Details</h2>
              <p className="text-white/80 text-sm mt-1">Update your car information</p>
            </div>
            <div className="p-5 space-y-4">
              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{saveError}</div>
              )}
              {saveSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">{saveSuccess}</div>
              )}
              <div>
                <label className="block text-[#01312D] font-semibold mb-1.5 text-sm">Car Registration <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={vehicleForm.carRegistrationNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, carRegistrationNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#3A7717]"
                  placeholder="e.g. ABC 123 GP"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-1.5 text-sm">Car Model</label>
                <input
                  type="text"
                  value={vehicleForm.carModel}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, carModel: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#3A7717]"
                  placeholder="e.g. Toyota Corolla"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-1.5 text-sm">Year</label>
                <input
                  type="text"
                  value={vehicleForm.carYear}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, carYear: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#3A7717]"
                  placeholder="e.g. 2020"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-1.5 text-sm">Color</label>
                <input
                  type="text"
                  value={vehicleForm.carColor}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, carColor: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#3A7717]"
                  placeholder="e.g. White"
                />
              </div>
            </div>
            <div className="border-t border-gray-100 p-5 flex gap-3">
              <button
                onClick={() => { setShowUpdateVehicle(false); setSaveError(""); setSaveSuccess(""); }}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateVehicle}
                disabled={saving}
                className="flex-1 px-3 bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Update Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Banking Details Modal */}
      {showUpdateBanking && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowUpdateBanking(false); setSaveError(""); setSaveSuccess(""); }}
          ></div>
          <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#01312D] to-[#3A7717] rounded-t-2xl p-5">
              <h2 className="text-xl font-bold text-white">Update Banking Details</h2>
              <p className="text-white/80 text-sm mt-1">For cash loan disbursements</p>
            </div>
            <div className="p-5 space-y-4">
              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{saveError}</div>
              )}
              {saveSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">{saveSuccess}</div>
              )}
              <div>
                <label className="block text-[#01312D] font-semibold mb-1.5 text-sm">Bank Name</label>
                <input
                  type="text"
                  value={bankingForm.bankName}
                  onChange={(e) => setBankingForm({ ...bankingForm, bankName: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#3A7717]"
                  placeholder="e.g. Capitec Bank"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-1.5 text-sm">Account Holder Name</label>
                <input
                  type="text"
                  value={bankingForm.accountHolder}
                  onChange={(e) => setBankingForm({ ...bankingForm, accountHolder: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#3A7717]"
                  placeholder="Name on bank account"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-1.5 text-sm">Account Number</label>
                <input
                  type="text"
                  value={bankingForm.accountNumber}
                  onChange={(e) => setBankingForm({ ...bankingForm, accountNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#3A7717]"
                  placeholder="Bank account number"
                />
              </div>
              <div>
                <label className="block text-[#01312D] font-semibold mb-1.5 text-sm">Branch Code</label>
                <input
                  type="text"
                  value={bankingForm.branchCode}
                  onChange={(e) => setBankingForm({ ...bankingForm, branchCode: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#3A7717]"
                  placeholder="Branch code"
                />
              </div>
            </div>
            <div className="border-t border-gray-100 p-5 flex gap-3">
              <button
                onClick={() => { setShowUpdateBanking(false); setSaveError(""); setSaveSuccess(""); }}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateBanking}
                disabled={saving}
                className="flex-1 px-3 bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save Banking Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation
        approvedCount={
          allRequests.filter(
            (r) => r.status === "approved" || r.status === "sent",
          ).length
        }
        isAdmin={false}
      />
    </div>
  );
}
