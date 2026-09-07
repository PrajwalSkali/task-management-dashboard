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

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn =
      localStorage.getItem("isLoggedIn") === "true";

    if (!loggedIn) {
      router.replace("/login");
      setCheckingAuth(false);
      return;
    }

    setIsLoggedIn(true);
    setCheckingAuth(false);
  }, [router]);

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Checking authentication...
          </p>
        </div>
      </main>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <TaskProvider>
      <main className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-slate-50">
        <Navbar />

        <div className="flex w-full min-w-0 max-w-full">
          <div className="shrink-0">
            <Sidebar />
          </div>

          <section className="min-w-0 flex-1">
            {children}
          </section>
        </div>
      </main>
    </TaskProvider>
  );
}