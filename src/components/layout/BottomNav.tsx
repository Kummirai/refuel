"use client";

import { Home, ClipboardList, User, Bell, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: ClipboardList, label: "Requests", path: "/requests" },
    { icon: Bell, label: "Activity", path: "/activity" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center gap-1 py-1"
            >
              <Icon
                className={`w-5 h-5 ${isActive ? "text-secondary" : "text-gray-400"}`}
              />
              <span
                className={`text-xs ${isActive ? "text-secondary font-semibold" : "text-gray-400"}`}
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
