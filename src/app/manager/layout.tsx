"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  LayoutDashboard,
  Clock,
  CheckCircle,
  LogOut,
  Menu,
  X,
  Loader2,
  User,
  Calendar,
} from "lucide-react";

export default function ManagerLayout({
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
    if (!session) {
      router.push("/auth/sign-in");
      return;
    }
    const user = session.user as any;
    if (user?.role !== "manager") {
      router.push("/");
      return;
    }
    setIsAuthorized(true);
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/");
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#eafde7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#3A7717] animate-spin mx-auto" />
          <p className="mt-4 text-[#01312D] font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  const user = session?.user as any;

  const navItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/manager/dashboard",
      active: pathname === "/manager/dashboard",
    },
    {
      icon: Clock,
      label: "Pending",
      path: "/manager/pending",
      active: pathname === "/manager/pending",
    },
    {
      icon: CheckCircle,
      label: "Completed",
      path: "/manager/completed",
      active: pathname === "/manager/completed",
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
              <User className="w-5 h-5 text-[#01312D]" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">Kapuka</h1>
              <p className="text-[#72bf00] text-xs">Manager Panel</p>
            </div>
          </div>

          <nav className="space-y-2 sm:space-y-1 flex-1">
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
              <div className="flex items-center gap-2 sm:gap-3 p-1.5 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-[#01312D] to-[#3A7717] rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">
                    {user?.name?.charAt(0) || "M"}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-[#01312D]">
                    {user?.name || "Manager"}
                  </p>
                  <p className="text-xs text-gray-500">Manager</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
