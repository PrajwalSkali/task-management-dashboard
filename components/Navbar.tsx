"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LoggedInUser = {
  name: string;
  email: string;
};

export default function Navbar() {
  const router = useRouter();

  const [user, setUser] =
    useState<LoggedInUser | null>(null);

  const [loggingOut, setLoggingOut] =
    useState(false);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("loggedInUser");

    if (storedUser) {
      try {
        const parsedUser: LoggedInUser =
          JSON.parse(storedUser);

        setUser(parsedUser);
      } catch {
        localStorage.removeItem("loggedInUser");
      }
    }
  }, []);

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error(
        "Logout request failed:",
        error
      );
    } finally {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("loggedInUser");

      router.replace("/login");
    }
  };

  const displayName =
    user?.name || "User";

  const initial =
    displayName
      .charAt(0)
      .toUpperCase();

  return (
    <nav className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">

      <div className="flex h-16 min-w-0 items-center justify-between px-4 sm:px-6">

        {/* ======================================
            BRAND
        ====================================== */}

        <div className="flex min-w-0 items-center gap-2.5">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-base font-bold text-white shadow-sm">
            ✓
          </div>

          <div className="min-w-0">
            <h1 className="truncate bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-lg font-bold text-transparent sm:text-xl">
              TaskFlow
            </h1>

            <p className="hidden text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:block">
              Productivity workspace
            </p>
          </div>

        </div>

        {/* ======================================
            USER SECTION
        ====================================== */}

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">

          {/* Welcome */}

          <div className="hidden text-right sm:block">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Welcome back
            </p>

            <p className="max-w-[180px] truncate text-sm font-semibold text-slate-700">
              {displayName}
            </p>
          </div>

          {/* Avatar */}

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm ring-2 ring-blue-50">
            {initial}
          </div>

          {/* Logout */}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="group flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="text-base">
              ↪
            </span>

            <span className="hidden sm:inline">
              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </span>
          </button>

        </div>

      </div>
    </nav>
  );
}