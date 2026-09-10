"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { bootstrapped, isAuthenticated, user } = useAuth();

  // Guard: if not authenticated, send to login
  useEffect(() => {
    if (!bootstrapped) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    // Ensure only admins can access admin panel
    if (user?.role && user.role !== "ADMIN") {
      router.replace("/login");
    }
  }, [bootstrapped, isAuthenticated, user?.role, router]);

  // Close sidebar on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Full-width topbar */}
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex">
        {/* Sidebar (fixed on desktop) */}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main area (offset for fixed sidebar on desktop) */}
        <div className="min-w-0 flex-1 md:pl-72">
          <main className="mx-auto w-full px-4 py-6 md:pl-0 md:pr-6">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm md:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

