// src/app/(auth)/layout.tsx - Updated

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is already logged in
    const user = localStorage.getItem("user");
    const needsVerification = localStorage.getItem("needsVerification");

    if (user) {
      // If user is on sign-in or sign-up page but needs verification
      if (
        needsVerification === "true" &&
        (pathname === "/auth/sign-in" || pathname === "/auth/sign-up")
      ) {
        router.push("/verify");
      }
      // If user is verified, redirect to home
      else if (needsVerification !== "true") {
        router.push("/");
      }
    }
  }, [router, pathname]);

  return <div className="min-h-screen">{children}</div>;
}
