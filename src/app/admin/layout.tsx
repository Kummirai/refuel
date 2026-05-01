// src/app/admin/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Shield,
  Loader2,
} from "lucide-react";

// Define extended user type locally
interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  role?: string;
  image?: string | null;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isPending) {
      checkAuth();
    }
  }, [session, isPending]);

  const checkAuth = () => {
    // Check if user is logged in
    if (!session) {
      console.log("No session, redirecting to sign in");
      router.push("/auth/sign-in");
      return;
    }

    // Cast to any to access role property
    const user = session.user as any;

    // Check if user is admin
    if (user?.role !== "admin") {
      console.log("User is not admin, role:", user?.role);
      router.push("/");
      return;
    }

    console.log("Admin authorized:", user?.email);
    setIsAuthorized(true);
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/");
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#eafde7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#3A7717] animate-spin mx-auto mb-4" />
          <p className="text-[#01312D]">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  const user = session?.user as any;

  const navItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/admin/dashboard",
      active: pathname === "/admin/dashboard",
    },
    {
      icon: Users,
      label: "Verifications",
      path: "/admin/verifications",
      active: pathname === "/admin/verifications",
    },
    {
      icon: ClipboardList,
      label: "Service Requests",
      path: "/admin/service-requests",
      active: pathname === "/admin/service-requests",
    },
    {
      icon: DollarSign,
      label: "Repayments",
      path: "/admin/repayments",
      active: pathname === "/admin/repayments",
    },
    {
      icon: Settings,
      label: "Settings",
      path: "/admin/settings",
      active: pathname === "/admin/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-[#eafde7]">
      {/* Mobile Menu Button - Enhanced touch */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-[#01312D] rounded-lg text-white shadow-lg active:scale-95 transition-all duration-200 touch-manipulation"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-[#01312D] z-40 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } lg:translate-x-0`}
      >
        <div className="p-5 h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8 pt-10 lg:pt-5">
            <div className="w-10 h-10 bg-[#bff202] rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#01312D]" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">
                Kapuka
              </h1>
              <p className="text-[#72bf00] text-xs">Admin Panel</p>
            </div>
          </div>

          {/* Navigation - Enhanced touch feedback */}
          <nav className="space-y-2 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 active:scale-98 touch-manipulation ${
                    item.active
                      ? "bg-[#bff202] text-[#01312D] shadow-md"
                      : "text-white/70 hover:bg-white/10 hover:text-white active:bg-white/20"
                  }`}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#01312D]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Logout Button - Enhanced touch */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-500 transition-all duration-200 active:scale-98 touch-manipulation mt-4"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Top Bar - Enhanced touch for mobile */}
        <header className="bg-white border-b border-[#bff202]/20 sticky top-0 z-30 shadow-sm">
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#01312D] hidden lg:block">
              {navItems.find((i) => i.active)?.label || "Dashboard"}
            </h2>
            <div className="flex items-center gap-2 sm:gap-4 ml-auto">
              {/* Notifications Button */}
              <button
                className="relative p-2 rounded-full hover:bg-[#eafde7] transition-all duration-200 active:scale-95 touch-manipulation"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <Bell className="w-5 h-5 text-[#3A7717]" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {/* Profile Section */}
              <button
                className="flex items-center gap-2 sm:gap-3 p-1.5 rounded-lg hover:bg-[#eafde7] transition-all duration-200 active:bg-[#bff202]/20 touch-manipulation"
                style={{ WebkitTapHighlightColor: "transparent" }}
                onClick={() => router.push("/admin/profile")}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-[#01312D] to-[#3A7717] rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">
                    {user?.name?.charAt(0) || "A"}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-[#01312D]">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6">{children}</main>
      </div>

      {/* Add global styles for touch feedback */}
      <style jsx global>{`
        .touch-manipulation {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        .active\\:scale-98:active {
          transform: scale(0.98);
        }

        /* Smooth scrolling for mobile */
        @media (max-width: 768px) {
          html {
            scroll-behavior: smooth;
          }
        }

        /* Better touch targets for mobile */
        @media (max-width: 640px) {
          button,
          [role="button"],
          .touch-target {
            min-height: 44px;
            min-width: 44px;
          }
        }
      `}</style>
    </div>
  );
}
