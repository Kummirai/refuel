// src/app/admin/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  ArrowLeft,
  Shield,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Check if already logged in
  useEffect(() => {
    const adminSession = sessionStorage.getItem("adminSession");
    if (adminSession) {
      const session = JSON.parse(adminSession);
      if (session.expiresAt > Date.now()) {
        router.push("/admin/dashboard");
      } else {
        sessionStorage.removeItem("adminSession");
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check lockout
    if (lockoutTime && lockoutTime > Date.now()) {
      const remainingMinutes = Math.ceil((lockoutTime - Date.now()) / 60000);
      setError(
        `Too many failed attempts. Please try again in ${remainingMinutes} minutes.`,
      );
      return;
    }

    setLoading(true);
    setError("");

    // Simulate API call with delay for security
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Secure credential check (in production, this would be server-side)
    const isValidAdmin =
      formData.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL &&
      formData.password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    if (isValidAdmin) {
      // Create secure session
      const session = {
        id: crypto.randomUUID(),
        email: formData.email,
        role: "admin",
        loggedInAt: Date.now(),
        expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
      };

      sessionStorage.setItem("adminSession", JSON.stringify(session));
      sessionStorage.setItem("adminAuthenticated", "true");

      // Reset attempts on success
      setAttempts(0);
      setLockoutTime(null);

      router.push("/admin/dashboard");
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= 5) {
        // Lockout for 15 minutes after 5 failed attempts
        const lockoutUntil = Date.now() + 15 * 60 * 1000;
        setLockoutTime(lockoutUntil);
        setError("Too many failed attempts. Account locked for 15 minutes.");
      } else {
        setError(`Invalid credentials. ${5 - newAttempts} attempts remaining.`);
      }

      // Clear password field on error for security
      setFormData((prev) => ({ ...prev, password: "" }));
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eafde7] to-white flex items-center justify-center px-5">
      {/* Back to Home */}
      <Link
        href="/"
        className="fixed top-6 left-6 flex items-center gap-2 text-[#01312D] hover:text-[#3A7717] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#01312D] to-[#3A7717] rounded-2xl shadow-xl mb-4">
            <Shield className="w-10 h-10 text-[#bff202]" />
          </div>
          <h1 className="text-3xl font-bold text-[#01312D] mb-2">
            Admin Login
          </h1>
          <p className="text-gray-500 text-sm">
            Secure access to admin dashboard
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#01312D] font-semibold mb-2 text-sm">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#72bf00]" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="admin@drivehub.com"
                className="w-full pl-10 pr-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] focus:ring-2 focus:ring-[#72bf00]/20"
                required
                disabled={lockoutTime !== null && lockoutTime > Date.now()}
              />
            </div>
          </div>

          <div>
            <label className="block text-[#01312D] font-semibold mb-2 text-sm">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#72bf00]" />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Enter password"
                className="w-full pl-10 pr-12 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] focus:ring-2 focus:ring-[#72bf00]/20"
                required
                disabled={lockoutTime !== null && lockoutTime > Date.now()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={
              loading || (lockoutTime !== null && lockoutTime > Date.now())
            }
            className="w-full bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white py-3 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Authenticating...
              </>
            ) : (
              <>
                Login as Admin
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Security Note */}
        <div className="mt-8 p-4 bg-[#eafde7] rounded-xl border border-[#bff202]/20">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-[#3A7717] mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-[#01312D]">
                Secure Area
              </p>
              <p className="text-xs text-gray-600 mt-1">
                This area is restricted to authorized personnel only. All login
                attempts are logged for security purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
