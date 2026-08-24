"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { UserRole } from "@/types";
import { 
  Sparkles, 
  LayoutDashboard, 
  PlusCircle, 
  Layers, 
  Users, 
  LogOut, 
  ChevronDown, 
  Menu,
  Briefcase, 
  FolderKanban, 
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  Zap,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, switchRole, logout } = useAuth();
  const { toggleMobile } = useSidebar();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const roleOptions: { role: UserRole; title: string; name: string; path: string; icon: any; color: string }[] = [
    {
      role: "manager",
      title: "Manager",
      name: "Alexander Vance",
      path: "/",
      icon: Briefcase,
      color: "bg-blue-600",
    },
    {
      role: "project_lead",
      title: "Project Lead",
      name: "Elena Rostova",
      path: "/lead",
      icon: Layers,
      color: "bg-purple-600",
    },
    {
      role: "employee",
      title: "Employee",
      name: "Devon Chen",
      path: "/employee",
      icon: Users,
      color: "bg-emerald-600",
    },
  ];

  const handleRoleSwitch = (newRole: UserRole, targetPath: string) => {
    switchRole(newRole);
    setIsDropdownOpen(false);
    router.push(targetPath);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Get current breadcrumb label
  const getPageTitle = () => {
    if (pathname === "/") return { title: "Manager Dashboard", sub: "Portfolio KPIs & Live Feasibility" };
    if (pathname === "/create") return { title: "AI Blueprint Studio", sub: "Automated Project Estimation" };
    if (pathname === "/lead") return { title: "Sprint Command Center", sub: "Execution Tracking" };
    if (pathname === "/employee") return { title: "My Task Hub", sub: "Sprint Deliverables" };
    if (pathname.startsWith("/projects/")) return { title: "Project Blueprint", sub: "Full AI Architecture & Analysis" };
    return { title: "Control Hub", sub: "PlanPulse.AI" };
  };

  const pageInfo = getPageTitle();

  return (
    <header className="no-print sticky top-0 z-30 w-full border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left Side: Mobile Hamburger & Breadcrumb Title */}
        <div className="flex items-center gap-3">
          {/* Mobile Sidebar Hamburger Toggle */}
          <button
            onClick={toggleMobile}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            title="Open Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumb Info */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span className="text-slate-500">PlanPulse.AI</span>
              <ChevronRight className="h-3 w-3 text-slate-600" />
              <span className="text-blue-400 font-semibold capitalize">
                {role ? role.replace("_", " ") : "Manager"} Hub
              </span>
              <ChevronRight className="h-3 w-3 text-slate-600" />
            </div>

            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {pageInfo.title}
            </h2>
          </div>
        </div>

        {/* Right Side: Quick Action & Profile / Switcher */}
        <div className="flex items-center gap-3">
          


          {/* Create Button shortcut (when not on /create) */}
          {pathname !== "/create" && role === "manager" && (
            <Link
              href="/create"
              className="hidden sm:flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>+ Create Project</span>
            </Link>
          )}

          {/* User Profile & 1-Click Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 hover:border-slate-700 hover:bg-slate-800 transition-all text-left group"
            >
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm",
                  user?.avatar_color || "bg-blue-600"
                )}
              >
                {user?.name ? user.name[0] : "A"}
              </div>

              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-200 leading-tight">
                  {user?.name || "Alexander Vance"}
                </div>
                <div className="text-[10px] text-blue-400 capitalize font-medium">
                  {role ? role.replace("_", " ") : "Manager"}
                </div>
              </div>

              <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-white transition-colors" />
            </button>

            {/* Role Switcher Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-slate-700/80 bg-[#0c1220] p-3 shadow-2xl backdrop-blur-md space-y-2">
                <div className="px-2 py-1 border-b border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Switch Active Role (Demo)
                  </span>
                </div>

                <div className="space-y-1">
                  {roleOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isCurrent = role === opt.role;

                    return (
                      <button
                        key={opt.role}
                        onClick={() => handleRoleSwitch(opt.role, opt.path)}
                        className={cn(
                          "w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-all",
                          isCurrent
                            ? "bg-slate-800 font-bold text-white border border-slate-700"
                            : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={cn("flex h-6 w-6 items-center justify-center rounded-md text-white text-[10px]", opt.color)}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="text-slate-200 font-bold">{opt.title}</div>
                            <div className="text-[10px] text-slate-500">{opt.name}</div>
                          </div>
                        </div>
                        {isCurrent && (
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out / Change Account</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
