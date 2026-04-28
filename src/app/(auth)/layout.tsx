// src/app/(auth)/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const user = localStorage.getItem("user");
    if (user) {
      router.push("/");
    }
  }, [router]);

  return <div className="min-h-screen">{children}</div>;
}
