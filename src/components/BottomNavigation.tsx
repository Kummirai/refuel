// src/components/BottomNavigation.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, ClipboardList, History, UserCircle } from "lucide-react";

interface BottomNavigationProps {
  approvedCount?: number;
  isAdmin?: boolean;
}

export default function BottomNavigation({
  approvedCount = 0,
  isAdmin = false,
}: BottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show bottom navigation for admin users on admin pages
  if (isAdmin && pathname?.startsWith("/admin")) {
    return null;
  }

  const navItems = [
    { icon: Home, label: "Home", path: "/", exact: true },
    { icon: ClipboardList, label: "Requests", path: "/requests", exact: true },
    { icon: History, label: "History", path: "/requests/history", exact: true },
    { icon: UserCircle, label: "Profile", path: "/profile", exact: true },
  ];

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) {
      return pathname === item.path;
    }
    return pathname?.startsWith(item.path);
  };

  // If admin, don't show navigation
  if (isAdmin) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl bg-white/95 backdrop-blur-lg border-t border-[#bff202]/20 px-4 py-2 shadow-lg safe-bottom">
        <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const showBadge =
            item.path === "/requests/history" && approvedCount > 0;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-200 active:scale-95 active:bg-[#bff202]/20 touch-manipulation group relative"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                  active
                    ? "bg-[#bff202] shadow-md active:shadow-inner"
                    : "bg-[#eafde7] group-hover:bg-[#bff202]/50 active:bg-[#bff202]/50"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${
                    active
                      ? "text-[#01312D]"
                      : "text-[#3A7717] group-hover:text-[#01312D]"
                  }`}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse shadow-md">
                    {approvedCount > 99 ? "99+" : approvedCount}
                  </span>
                )}
              </div>
              <span
                className={`text-xs font-medium transition-all duration-200 ${
                  active
                    ? "text-[#01312D] font-bold"
                    : "text-[#3A7717] group-hover:text-[#01312D]"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
