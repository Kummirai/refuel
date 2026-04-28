// src/app/admin/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Shield,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const session = sessionStorage.getItem("userSession");

    if (!session) {
      router.push("/auth/sign-in");
      setIsLoading(false);
      return;
    }

    try {
      const userSession = JSON.parse(session);

      // Check if user is admin
      if (userSession.role !== "admin") {
        router.push("/");
        setIsLoading(false);
        return;
      }

      // Check if session is expired
      if (userSession.expiresAt < Date.now()) {
        sessionStorage.removeItem("userSession");
        router.push("/auth/sign-in");
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);
      setAdminName(userSession.name || "Admin");
    } catch (error) {
      sessionStorage.removeItem("userSession");
      router.push("/auth/sign-in");
    }

    setIsLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("userSession");
    router.push("/auth/sign-in");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#eafde7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3A7717] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#01312D]">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

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
      icon: Settings,
      label: "Settings",
      path: "/admin/settings",
      active: pathname === "/admin/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-[#eafde7]">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#01312D] rounded-lg text-white"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#01312D] z-40 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-5">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8 pt-10 lg:pt-5">
            <div className="w-10 h-10 bg-[#bff202] rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#01312D]" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">
                Drive<span className="text-[#bff202]">Hub</span>
              </h1>
              <p className="text-[#72bf00] text-xs">Admin Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    item.active
                      ? "bg-[#bff202] text-[#01312D]"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-500 transition-all mt-8"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white border-b border-[#bff202]/20 sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#01312D] hidden lg:block">
              {navItems.find((i) => i.active)?.label || "Dashboard"}
            </h2>
            <div className="flex items-center gap-4 ml-auto">
              <button className="relative">
                <Bell className="w-5 h-5 text-[#3A7717]" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#eafde7] rounded-full flex items-center justify-center">
                  <span className="text-[#01312D] font-bold">
                    {adminName.charAt(0)}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-[#01312D]">
                    {adminName}
                  </p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
