"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import { 
  Sparkles, 
  LayoutDashboard, 
  PlusCircle, 
  Layers, 
  Users, 
  LogOut, 
  ChevronDown, 
  UserCheck,
  Briefcase,
  FolderKanban,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, switchRole, logout } = useAuth();
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

  return (
    <header className="no-print sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <Link href={role === "project_lead" ? "/lead" : role === "employee" ? "/employee" : "/"} className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-lg">
                  PlanPulse<span className="text-blue-500 font-extrabold">.AI</span>
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border",
                    role === "manager"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      : role === "project_lead"
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  )}
                >
                  {role ? role.replace("_", " ") : "Manager"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                AI Project Planning & Feasibility System
              </p>
            </div>
          </Link>
        </div>

        {/* Dynamic Navigation Tabs based on Role */}
        <nav className="hidden md:flex items-center gap-1.5">
          {role === "manager" && (
            <>
              <Link
                href="/"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all",
                  pathname === "/"
                    ? "bg-blue-600 text-white shadow-sm font-bold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Manager Dashboard</span>
              </Link>
              <Link
                href="/create"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all",
                  pathname === "/create"
                    ? "bg-blue-600 text-white shadow-sm font-bold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                )}
              >
                <PlusCircle className="h-4 w-4" />
                <span>+ Create Project</span>
              </Link>
            </>
          )}

          {role === "project_lead" && (
            <>
              <Link
                href="/lead"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all",
                  pathname === "/lead"
                    ? "bg-purple-600 text-white shadow-sm font-bold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                )}
              >
                <Layers className="h-4 w-4" />
                <span>Sprint Command Center</span>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              >
                <FolderKanban className="h-4 w-4" />
                <span>All Blueprints</span>
              </Link>
            </>
          )}

          {role === "employee" && (
            <>
              <Link
                href="/employee"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all",
                  pathname === "/employee"
                    ? "bg-emerald-600 text-white shadow-sm font-bold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                )}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>My Assigned Tasks</span>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              >
                <FolderKanban className="h-4 w-4" />
                <span>Project Blueprints</span>
              </Link>
            </>
          )}
        </nav>

        {/* User Profile & 1-Click Role Switcher */}
        <div className="relative flex items-center gap-3">
          
          {/* Active User Pill Button */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 hover:border-slate-700 hover:bg-slate-800 transition-all text-left group"
          >
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm",
                user?.avatar_color || "bg-blue-600"
              )}
            >
              {user?.name ? user.name[0] : "U"}
            </div>

            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-200 leading-tight">
                {user?.name || "Alexander Vance"}
              </div>
              <div className="text-[10px] text-slate-400 capitalize">
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
    </header>
  );
}
