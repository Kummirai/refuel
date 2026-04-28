// src/app/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Note: Metadata export needs to be in a separate server component
// For client component, we'll handle title in the component

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Update document title
    document.title = "DriveHub - Driver Services";

    checkAuth();
  }, [pathname]);

  const checkAuth = () => {
    const session = sessionStorage.getItem("userSession");

    // Public routes that don't require authentication
    const publicRoutes = [
      "/",
      "/auth/sign-in",
      "/auth/sign-up",
      "/auth/forgot-password",
    ];

    if (
      !session &&
      !publicRoutes.includes(pathname) &&
      !pathname.startsWith("/verify")
    ) {
      router.push("/auth/sign-in");
      return;
    }

    if (session) {
      try {
        const userSession = JSON.parse(session);

        // Check if session expired
        if (userSession.expiresAt < Date.now()) {
          sessionStorage.removeItem("userSession");
          if (!publicRoutes.includes(pathname)) {
            router.push("/auth/sign-in");
          }
          return;
        }

        // Role-based route protection
        if (userSession.role === "admin") {
          // Admin can access admin routes, home, and dashboard
          if (pathname.startsWith("/admin")) {
            return; // Admin allowed in admin routes
          }
          if (pathname === "/" || pathname === "/dashboard") {
            return; // Admin can see home
          }
          if (pathname.startsWith("/auth")) {
            router.push("/admin/dashboard");
          }
          // Block drivers from accessing admin routes
        } else if (userSession.role === "driver") {
          // Drivers cannot access admin routes
          if (pathname.startsWith("/admin")) {
            router.push("/");
          }
          // Block auth pages when logged in
          if (pathname.startsWith("/auth")) {
            router.push("/");
          }
        }
      } catch (error) {
        console.error("Invalid session");
        sessionStorage.removeItem("userSession");
      }
    }
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
