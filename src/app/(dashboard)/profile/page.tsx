// src/app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
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
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "loans" | "settings">(
    "profile",
  );
  const [profile, setProfile] = useState<any>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>("");
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    carRegistration: "",
    carModel: "",
    carYear: "",
    isVerified: false,
    verificationStatus: "not_submitted",
    memberSince: "",
    totalRequests: 0,
    totalSpent: 0,
    totalLoans: 0,
    rating: 0,
    activeLoan: null,
  });

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.push("/auth/sign-in");
      } else {
        fetchProfile();
      }
    }
  }, [session, isPending]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(
        `/api/driver/profile?userId=${session?.user?.id}`,
      );
      if (response.ok) {
        const data = await response.json();
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

        setUserData({
          name: data?.fullName || session?.user?.name || "",
          email: session?.user?.email || "",
          phone: data?.phone || session?.user?.phone || "",
          address: data?.address
            ? `${data.address}, ${data.city} - ${data.pincode}`
            : "Not provided",
          carRegistration: data?.carRegistrationNumber || "Not provided",
          carModel: data?.carModel || "Not provided",
          carYear: data?.carYear || "Not provided",
          isVerified: data?.isVerified || false,
          verificationStatus: data?.verificationStatus || "not_submitted",
          memberSince: memberSince,
          totalRequests: data?.totalRequests || 0,
          totalSpent: data?.totalSpent || 0,
          totalLoans: 0,
          rating: data?.rating || 0,
          activeLoan: data?.activeLoan || null,
        });
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

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      alert("Only JPG and PNG files are allowed");
      return;
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File too large. Max size is 2MB");
      return;
    }

    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "profile");
      formData.append("userId", session?.user?.id || "");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload photo");
      }

      // Update profile with new photo URL
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

  if (isPending || loading) {
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
    return null;
  }

  return (
    <div className="min-h-screen bg-[#eafde7] pb-24">
      {/* Header with Cover Photo */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-32 bg-gradient-to-r from-[#01312D] to-[#3A7717] relative">
          <button className="absolute bottom-2 right-2 bg-black/50 p-1.5 rounded-full">
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Profile Avatar - Now with actual driver image */}
        <div className="absolute -bottom-12 left-5">
          <div className="relative">
            <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-white overflow-hidden">
              {profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#01312D] to-[#3A7717] rounded-xl flex items-center justify-center">
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
      <div className="px-5 pt-16 pb-4 bg-white border-b border-[#bff202]/20">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-[#01312D]">
              {userData.name}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-gray-500 text-sm">{userData.email}</p>
              {getStatusBadge(userData.verificationStatus)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="bg-[#eafde7] px-2 py-1 rounded-lg">
                <p className="text-xs text-[#01312D]">
                  Member since {userData.memberSince}
                </p>
              </div>
            </div>
          </div>
          <button className="bg-[#eafde7] p-2 rounded-full">
            <Edit2 className="w-5 h-5 text-[#3A7717]" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2 p-5">
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#bff202]/20">
          <div className="w-8 h-8 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-1">
            <History className="w-4 h-4 text-[#3A7717]" />
          </div>
          <p className="text-lg font-bold text-[#01312D]">
            {userData.totalRequests}
          </p>
          <p className="text-xs text-gray-500">Requests</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#bff202]/20">
          <div className="w-8 h-8 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-1">
            <Wallet className="w-4 h-4 text-[#3A7717]" />
          </div>
          <p className="text-lg font-bold text-[#01312D]">
            R{userData.totalSpent.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">Spent</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#bff202]/20">
          <div className="w-8 h-8 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-1">
            <TrendingUp className="w-4 h-4 text-[#3A7717]" />
          </div>
          <p className="text-lg font-bold text-[#01312D]">
            {userData.totalLoans}
          </p>
          <p className="text-xs text-gray-500">Loans</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#bff202]/20">
          <div className="w-8 h-8 bg-[#eafde7] rounded-full flex items-center justify-center mx-auto mb-1">
            <Star className="w-4 h-4 text-[#3A7717]" />
          </div>
          <p className="text-lg font-bold text-[#01312D]">
            {userData.rating || "N/A"}
          </p>
          <p className="text-xs text-gray-500">Rating</p>
        </div>
      </div>

      {/* Verification Banner for unverified users */}
      {userData.verificationStatus !== "approved" && (
        <div className="px-5 mb-4">
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
      <div className="px-5 border-b border-[#bff202]/20 bg-white">
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

      {/* Tab Content - Same as before, keeping the existing content */}
      <div className="p-5">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-4">
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
                    <p className="text-sm text-[#01312D]">{userData.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#72bf00]" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-[#01312D]">{userData.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#72bf00]" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm text-[#01312D]">{userData.address}</p>
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
                  <span className="text-sm font-semibold text-[#01312D]">
                    {userData.carRegistration}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Car Model</span>
                  <span className="text-sm font-semibold text-[#01312D]">
                    {userData.carModel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Year</span>
                  <span className="text-sm font-semibold text-[#01312D]">
                    {userData.carYear}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-[#01312D]">Recent Activity</h3>
                <button className="text-[#72bf00] text-xs font-semibold">
                  View All
                </button>
              </div>
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            </div>
          </div>
        )}

        {/* Loans & History Tab - Keep existing */}
        {activeTab === "loans" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-[#bff202]/20">
              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="font-semibold text-[#01312D] mb-2">
                No Active Loans
              </h3>
              <p className="text-sm text-gray-500">
                You don't have any active loans at the moment.
              </p>
              <button className="mt-4 text-[#72bf00] text-sm font-semibold">
                Request a Loan →
              </button>
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

        {/* Settings Tab - Keep existing */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bff202]/20">
              <h3 className="font-bold text-[#01312D] mb-3">
                Account Settings
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between py-2">
                  <span className="text-[#01312D]">Change Password</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between py-2">
                  <span className="text-[#01312D]">Change Phone Number</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between py-2">
                  <span className="text-[#01312D]">Update Email</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between py-2">
                  <span className="text-[#01312D]">Update Vehicle Details</span>
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
              className="w-full bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 mt-4"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-[#bff202]/20 px-6 py-2 z-50 shadow-lg">
        <div className="flex justify-around items-center">
          {[
            { icon: HomeIcon, label: "Home", path: "/" },
            { icon: ClipboardIcon, label: "Requests", path: "/requests" },
            { icon: HistoryIcon, label: "History", path: "/requests/history" },
            {
              icon: UserIcon,
              label: "Profile",
              active: true,
              path: "/profile",
            },
          ].map((item, index) => {
            const IconComponent = item.icon;
            return (
              <button
                key={index}
                onClick={() => router.push(item.path)}
                className="flex flex-col items-center gap-0.5 py-1 group"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    item.active
                      ? "bg-[#bff202] scale-110 shadow-md"
                      : "bg-[#eafde7] group-hover:bg-[#bff202]/50"
                  }`}
                >
                  <IconComponent
                    className={`w-5 h-5 ${
                      item.active
                        ? "text-[#01312D]"
                        : "text-[#3A7717] group-hover:text-[#01312D]"
                    }`}
                  />
                </div>
                <span
                  className={`text-xs ${
                    item.active
                      ? "text-[#01312D] font-bold"
                      : "text-[#3A7717] group-hover:text-[#01312D]"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// Icon Components
function HomeIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function ClipboardIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  );
}

function HistoryIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function UserIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}
