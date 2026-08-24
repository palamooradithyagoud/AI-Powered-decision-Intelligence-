"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import Sidebar from "./Sidebar";
import { cn } from "@/lib/utils";

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  // If on login page, don't show default sidebar
  const isExcludedPage = pathname === "/login";

  if (isExcludedPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex">
      {/* Sidebar on desktop / mobile drawer */}
      <React.Suspense fallback={<div className="hidden md:block w-20 flex-shrink-0 bg-[#080c16]" />}>
        <Sidebar />
      </React.Suspense>

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          isCollapsed ? "md:pl-20" : "md:pl-64"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ShellInner>{children}</ShellInner>
    </SidebarProvider>
  );
}
