"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { TaskProvider } from "@/context/TaskContext";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [isLoggedIn, setIsLoggedIn] =
    useState(false);

  useEffect(() => {
    const loggedIn =
      localStorage.getItem("isLoggedIn") === "true";

    if (!loggedIn) {
      router.replace("/login");
      return;
    }

    setIsLoggedIn(true);
    setCheckingAuth(false);
  }, [router]);

  // Wait while checking login status
  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="mt-3 text-sm text-gray-500">
            Checking authentication...
          </p>
        </div>
      </main>
    );
  }

  // Don't render dashboard if not logged in
  if (!isLoggedIn) {
    return null;
  }

  return (
    <TaskProvider>
      <main className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="flex">
          <Sidebar />

          <section className="flex-1">
            {children}
          </section>
        </div>
      </main>
    </TaskProvider>
  );
}