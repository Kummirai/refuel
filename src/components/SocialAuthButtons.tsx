"use client";

import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type SocialProvider = "google" | "github";

const providers: {
  id: SocialProvider;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "google",
    label: "Google",
    icon: (
      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.29a7.19 7.19 0 0 1 0-4.58V6.62H1.29a12.01 12.01 0 0 0 0 10.76l3.98-3.09Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A11.99 11.99 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
        />
      </svg>
    ),
  },
  {
    id: "github",
    label: "GitHub",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="w-[18px] h-[18px] fill-[#111827]"
        aria-hidden="true"
      >
        <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.11.79-.25.79-.56v-2.17c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.78 1.05.78 2.12v3.14c0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
      </svg>
    ),
  },
];

export default function SocialAuthButtons() {
  const [active, setActive] = useState<SocialProvider | null>(null);
  const [error, setError] = useState("");

  const handleSocial = async (provider: SocialProvider) => {
    setActive(provider);
    setError("");
    try {
      const { error: authError } = await authClient.signIn.social({
        provider,
        callbackURL: "/",
      });
      if (authError) {
        setError(
          authError.message ||
            "This sign-in method is not available right now. Please try again.",
        );
        setActive(null);
      }
      // On success Better Auth redirects to the provider.
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "This sign-in method is not available right now. Please try again.",
      );
      setActive(null);
    }
  };

  return (
    <div className="mb-6">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => handleSocial(provider.id)}
            disabled={active !== null}
            aria-label={`Continue with ${provider.label}`}
            className="flex items-center justify-center gap-2 py-3 px-3 bg-white border border-[#01312D]/10 rounded-xl font-semibold text-sm text-[#01312D] shadow-sm hover:bg-[#f7fff1] hover:border-[#bff202]/60 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {active === provider.id ? (
              <Loader2 className="w-[18px] h-[18px] animate-spin text-[#3A7717]" />
            ) : (
              provider.icon
            )}
            <span className="truncate">{provider.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-5">
        <div className="h-px flex-1 bg-[#01312D]/10" />
        <span className="text-xs font-medium text-gray-400">
          or continue with email
        </span>
        <div className="h-px flex-1 bg-[#01312D]/10" />
      </div>
    </div>
  );
}
