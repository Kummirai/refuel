// src/app/(auth)/forgot-password/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle,
  Send,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Simulate password reset - will be replaced with Supabase
    setTimeout(() => {
      if (email) {
        setSuccess(true);
      } else {
        setError("Please enter a valid email address");
      }
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eafde7] to-white relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#bff202]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#3A7717]/5 rounded-full blur-3xl"></div>

      {/* Back Button */}
      <div className="relative z-10 px-5 pt-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          ←
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-5 pt-8 pb-12">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#01312D] to-[#3A7717] rounded-2xl shadow-xl mb-4">
            <Sparkles className="w-10 h-10 text-[#bff202]" />
          </div>
          <h1 className="text-3xl font-bold text-[#01312D] mb-2">
            Reset Password
          </h1>
          <p className="text-gray-500 text-sm">
            We'll send you a reset link to your email
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-600">
                  Reset Link Sent!
                </p>
                <p className="text-xs text-green-600 mt-1">
                  We've sent a password reset link to {email}. Please check your
                  email.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/auth/sign-in")}
              className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg text-sm font-semibold"
            >
              Back to Sign In
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && !success && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Reset Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-[#01312D] font-semibold mb-2 text-sm">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#72bf00]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#bff202]/20 rounded-xl focus:outline-none focus:border-[#72bf00] focus:ring-2 focus:ring-[#72bf00]/20 text-[#01312D]"
                  required
                />
              </div>
            </div>

            {/* Reset Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#01312D] to-[#3A7717] text-white py-3 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  Send Reset Link
                  <Send className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Back to Sign In Link */}
        {!success && (
          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm">
              Remember your password?{" "}
              <Link
                href="/auth/sign-in"
                className="text-[#3A7717] font-semibold hover:underline"
              >
                Back to Sign In
              </Link>
            </p>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 p-4 bg-[#eafde7] rounded-xl border border-[#bff202]/20">
          <p className="text-xs text-gray-600 text-center">
            Didn't receive the email? Check your spam folder or contact support
            at{" "}
            <span className="text-[#3A7717] font-semibold">
              support@Kapuka.com
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
