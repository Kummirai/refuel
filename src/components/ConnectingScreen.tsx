"use client";

import { Loader2, RefreshCw } from "lucide-react";

/**
 * Shown when the session request has outlived the bounded loading window but
 * is still in flight, so the user is never left on a blank screen.
 */
export default function ConnectingScreen({
  message = "Still connecting…",
}: {
  message?: string;
}) {
  return (
    <div className="min-h-screen bg-[#eafde7] flex items-center justify-center px-5">
      <div className="text-center max-w-sm">
        <Loader2 className="w-10 h-10 text-[#3A7717] animate-spin mx-auto" />
        <p className="mt-3 font-semibold text-[#01312D]">{message}</p>
        <p className="text-sm text-gray-600 mt-1">
          Your session is taking longer than usual. Check your connection and
          try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3A7717] text-white text-sm font-semibold active:scale-95 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  );
}
