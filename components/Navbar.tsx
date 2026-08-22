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

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("loggedInUser");

    router.push("/login");
  };

  const displayName = user?.name || "User";

  const initial =
    displayName.charAt(0).toUpperCase();

  return (
    <nav className="flex h-16 items-center justify-between border-b bg-white px-6">

      {/* Logo */}
      <h1 className="text-xl font-bold text-gray-900">
        TaskFlow
      </h1>

      {/* User Section */}
      <div className="flex items-center gap-4">

        <span className="text-sm text-gray-600">
          Welcome, {displayName}
        </span>

        {/* Avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
          {initial}
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Logout
        </button>

      </div>
    </nav>
  );
}