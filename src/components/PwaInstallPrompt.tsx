"use client";

import { useEffect, useState } from "react";

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#01312D] text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3 border border-[#bff202]/20">
        <div className="w-10 h-10 bg-[#3A7717] rounded-xl flex items-center justify-center shrink-0">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v12m0 0l-4-4m4 4l4-4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">Install Kapuka</p>
          <p className="text-xs text-white/60">Add to your home screen</p>
        </div>
        <button
          onClick={async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const result = await deferredPrompt.userChoice;
            if (result.outcome === "accepted") {
              setShowPrompt(false);
            }
            setDeferredPrompt(null);
          }}
          className="bg-[#bff202] text-[#01312D] px-5 py-2 rounded-xl font-black text-sm hover:bg-[#d4e84a] transition-all active:scale-95 shrink-0"
        >
          Install
        </button>
        <button
          onClick={() => { setShowPrompt(false); setDeferredPrompt(null); }}
          className="text-white/40 hover:text-white transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
