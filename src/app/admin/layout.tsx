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

  const [pendingVerificationsCount, setPendingVerificationsCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [pendingRepaymentsCount, setPendingRepaymentsCount] = useState(0);

  const fetchAllCounts = async () => {
    try {
      const [verificationsRes, requestsRes, repaymentsRes] = await Promise.all([
        fetch("/api/admin/verifications/count"),
        fetch("/api/admin/requests/count"),
        fetch("/api/admin/repayments/count"),
      ]);

      const verifications = await verificationsRes.json();
      const requests = await requestsRes.json();
      const repayments = await repaymentsRes.json();

      setPendingVerificationsCount(verifications.pending || 0);
      setPendingRequestsCount(requests.pending || 0);
      setPendingRepaymentsCount(repayments.pending || 0);
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchAllCounts();
      const interval = setInterval(fetchAllCounts, 30000);

      const handleVisibilityChange = () => {
        if (!document.hidden) {
          fetchAllCounts();
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      const handleRefresh = () => fetchAllCounts();
      window.addEventListener("refreshAdminCounts", handleRefresh);

      return () => {
        clearInterval(interval);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        window.removeEventListener("refreshAdminCounts", handleRefresh);
      };
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (!isPending) {
      checkAuth();
    }
  }, [session, isPending]);

  const checkAuth = () => {
    if (!session) {
      router.push("/auth/sign-in");
      return;
    }

    const user = session.user as any;
    if (user?.role !== "admin") {
      router.push("/");
      return;
    }

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
  const totalNotifications =
    pendingVerificationsCount + pendingRequestsCount + pendingRepaymentsCount;

  const navItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/admin/dashboard",
      active: pathname === "/admin/dashboard",
      badge: null,
    },
    {
      icon: Users,
      label: "Verifications",
      path: "/admin/verifications",
      active: pathname === "/admin/verifications",
      badge: pendingVerificationsCount,
      badgeColor: "bg-yellow-500",
    },
    {
      icon: ClipboardList,
      label: "Service Requests",
      path: "/admin/service-requests",
      active: pathname === "/admin/service-requests",
      badge: pendingRequestsCount,
      badgeColor: "bg-blue-500",
    },
    {
      icon: DollarSign,
      label: "Repayments",
      path: "/admin/repayments",
      active: pathname === "/admin/repayments",
      badge: pendingRepaymentsCount,
      badgeColor: "bg-green-500",
    },
    {
      icon: Settings,
      label: "Settings",
      path: "/admin/settings",
      active: pathname === "/admin/settings",
      badge: null,
    },
  ];

  return (
    <div className="min-h-screen bg-[#eafde7]">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-[#01312D] rounded-lg text-white shadow-lg active:scale-95 transition-all duration-200"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-[#01312D] z-40 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } lg:translate-x-0`}
      >
        <div className="p-5 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-8 pt-10 lg:pt-5">
            <div className="w-10 h-10 bg-[#bff202] rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#01312D]" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">Kapuka</h1>
              <p className="text-[#72bf00] text-xs">Admin Panel</p>
            </div>
          </div>

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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    item.active
                      ? "bg-[#bff202] text-[#01312D] shadow-md"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium flex-1 text-left">
                    {item.label}
                  </span>
                  {item.badge !== null && item.badge > 0 && (
                    <span
                      className={`${item.badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center`}
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                  {item.active && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#01312D]" />
                  )}
                </button>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-500 transition-all duration-200 mt-4"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <div className="lg:ml-72">
        <header className="bg-white border-b border-[#bff202]/20 sticky top-0 z-30 shadow-sm">
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#01312D] hidden lg:block">
              {navItems.find((i) => i.active)?.label || "Dashboard"}
            </h2>
            <div className="flex items-center gap-2 sm:gap-4 ml-auto">
              <button
                className="relative p-2 rounded-full hover:bg-[#eafde7] transition-all duration-200"
                onClick={() => {
                  if (totalNotifications > 0) {
                    alert(
                      `📋 Pending Items:\n\n✅ Verifications: ${pendingVerificationsCount}\n📝 Service Requests: ${pendingRequestsCount}\n💰 Repayments: ${pendingRepaymentsCount}`,
                    );
                  } else {
                    alert("✨ No pending items");
                  }
                }}
              >
                <Bell className="w-5 h-5 text-[#3A7717]" />
                {totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {totalNotifications > 99 ? "99+" : totalNotifications}
                  </span>
                )}
              </button>

              <button
                className="flex items-center gap-2 sm:gap-3 p-1.5 rounded-lg hover:bg-[#eafde7] transition-all duration-200"
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

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
