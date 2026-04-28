// src/components/layout/Header.tsx
"use client";

import { Menu, Bell, User, LogOut } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface HeaderProps {
  user: any;
}

export default function Header({ user }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="bg-primary px-4 py-3 sticky top-0 z-50 shadow-md">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-highlight rounded-lg flex items-center justify-center">
            <span className="text-primary font-bold text-xl">D</span>
          </div>
          <h1 className="text-white font-bold text-xl">
            Drive<span className="text-highlight">Hub</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <button className="relative">
                <Bell className="text-white w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-highlight text-primary text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  3
                </span>
              </button>
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)}>
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                      <User className="text-primary w-4 h-4" />
                    </div>
                  )}
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <button
                      onClick={() => router.push("/profile")}
                      className="w-full text-left px-4 py-2 hover:bg-light text-gray-700"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="w-full text-left px-4 py-2 hover:bg-light text-gray-700"
                    >
                      Dashboard
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 hover:bg-light text-red-600 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {!user && (
            <button
              onClick={() => router.push("/sign-in")}
              className="bg-highlight text-primary px-4 py-1.5 rounded-lg font-semibold text-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
