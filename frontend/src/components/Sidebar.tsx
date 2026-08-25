"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { fetchProjects } from "@/lib/api";
import { Project, UserRole } from "@/types";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CheckCircle2,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Activity,
  Layers,
  Briefcase,
  X,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Zap,
  LogOut,
  Home,
  Bell,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, switchRole, logout } = useAuth();
  const { isCollapsed, toggleCollapse, isMobileOpen, closeMobile } = useSidebar();
  
  const [mounted, setMounted] = useState(false);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeRole = mounted ? role : "manager";

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await fetchProjects();
        setRecentProjects(data.slice(0, 5));
      } catch (err) {
        console.error("Failed to load sidebar projects:", err);
      }
    }
    loadProjects();
  }, [pathname]);

  const searchParams = useSearchParams();
  const tabParam = searchParams ? searchParams.get("tab") : null;

  const navItems = activeRole === "employee"
    ? [
        {
          title: "Home",
          icon: Home,
          path: "/employee?tab=home",
          active: pathname === "/employee" && (tabParam === "home" || !tabParam),
        },
        {
          title: "Assigned Project",
          icon: Briefcase,
          path: "/employee?tab=project",
          active: pathname === "/employee" && tabParam === "project",
        },
        {
          title: "Kanban System",
          icon: FolderKanban,
          path: "/employee?tab=progress",
          active: pathname === "/employee" && (tabParam === "progress" || tabParam === "kanban"),
        },
        {
          title: "Notifications",
          icon: Bell,
          path: "/employee?tab=notifications",
          active: pathname === "/employee" && tabParam === "notifications",
        },
        {
          title: "My Profile",
          icon: User,
          path: "/employee?tab=profile",
          active: pathname === "/employee" && tabParam === "profile",
        },
      ]
    : activeRole === "project_lead"
    ? [
        {
          title: "Lead Workbench",
          icon: Layers,
          path: "/lead",
          active: pathname === "/lead",
        },
        {
          title: "Portfolio Hub",
          icon: LayoutDashboard,
          path: "/",
          active: pathname === "/",
        },
        {
          title: "Team Execution",
          icon: CheckCircle2,
          path: "/employee",
          active: pathname === "/employee",
        },
        {
          title: "Sprint Calendar",
          icon: Calendar,
          path: "/calendar",
          active: pathname === "/calendar",
        },
      ]
    : [
        {
          title: "Portfolio Hub",
          icon: LayoutDashboard,
          path: "/",
          active: pathname === "/",
        },
        {
          title: "New AI Scope",
          icon: PlusCircle,
          path: "/create",
          active: pathname === "/create",
        },
        {
          title: "Lead Review Hub",
          icon: Layers,
          path: "/lead",
          active: pathname === "/lead",
        },
        {
          title: "Task Workbench",
          icon: CheckCircle2,
          path: "/employee",
          active: pathname === "/employee",
        },
        {
          title: "Sprint Calendar",
          icon: Calendar,
          path: "/calendar",
          active: pathname === "/calendar",
        },
      ];

  const roleOptions: { role: UserRole; title: string; name: string; path: string; icon: any; color: string }[] = [
    {
      role: "manager",
      title: "Manager",
      name: "Arjun Reddy",
      path: "/",
      icon: Briefcase,
      color: "bg-indigo-600",
    },
    {
      role: "project_lead",
      title: "Project Lead",
      name: "Ishita Rao",
      path: "/lead",
      icon: Layers,
      color: "bg-purple-600",
    },
    {
      role: "employee",
      title: "Employee",
      name: "Rahul Kumar",
      path: "/employee",
      icon: Users,
      color: "bg-emerald-600",
    },
  ];

  const handleRoleSwitch = (newRole: UserRole, targetPath: string) => {
    switchRole(newRole);
    setRoleSwitcherOpen(false);
    closeMobile();
    router.push(targetPath);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "no-print fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200/90 shadow-sm transition-all duration-300 ease-in-out font-sans",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Top Header: Brand Logo & Collapse Toggle */}
        <div className="h-24 sm:h-28 flex items-center justify-between px-5 border-b border-slate-100/60">
          <Link
            href="/"
            onClick={closeMobile}
            className="flex items-center gap-2 overflow-hidden group py-1"
          >
            <div className="relative flex-shrink-0 flex items-center justify-center">
              <img 
                src={isCollapsed ? "/kuiper-mark-dark.png" : "/kuiper-logo-dark.png"} 
                alt="Kuiper" 
                className={cn(
                  "object-contain transition-all duration-200",
                  isCollapsed ? "h-11 w-11" : "h-16 sm:h-20 w-auto max-w-[165px]"
                )} 
              />
            </div>
          </Link>

          {/* Desktop Collapse / Mobile Close Button */}
          <div className="flex items-center">
            <button
              onClick={closeMobile}
              className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              title="Close Menu"
            >
              <X className="h-5 w-5" />
            </button>

            <button
              onClick={toggleCollapse}
              className="hidden md:flex p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6 scrollbar-thin">
          
          {/* Nav List */}
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.path}
                  onClick={closeMobile}
                  title={isCollapsed ? item.title : undefined}
                  className={cn(
                    "group flex items-center gap-3.5 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                    item.active
                      ? "bg-[#ede9fe] text-[#6366f1] font-bold shadow-sm"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center transition-colors",
                      item.active ? "text-[#6366f1]" : "text-slate-400 group-hover:text-slate-700"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5 flex-shrink-0" />
                  </div>

                  {!isCollapsed && (
                    <span className="truncate">{item.title}</span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Quick Portfolio Blueprints Section */}
          {!isCollapsed && activeRole === "manager" && (
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between px-3">
                <button
                  onClick={() => setProjectsOpen(!projectsOpen)}
                  suppressHydrationWarning
                  className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FolderKanban className="h-3 w-3 text-slate-400" />
                  <span>Recent Blueprints</span>
                  {projectsOpen ? (
                    <ChevronUp className="h-3 w-3 ml-0.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-3 w-3 ml-0.5 text-slate-400" />
                  )}
                </button>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-bold">
                  {recentProjects.length}
                </span>
              </div>

              {projectsOpen && (
                <div className="space-y-1 pl-1">
                  {recentProjects.length === 0 ? (
                    <div className="px-3 py-2 text-[11px] text-slate-400 italic">
                      No active blueprints yet
                    </div>
                  ) : (
                    recentProjects.map((p) => {
                      const isActive = pathname === `/projects/${p.id}`;
                      const score = p.analysis?.feasibility?.feasibility_score ?? 80;
                      const status = p.analysis?.feasibility?.status ?? "FEASIBLE";
                      
                      const dotColor = 
                        status === "FEASIBLE" 
                          ? "bg-emerald-500 shadow-emerald-500/50" 
                          : status === "FEASIBLE WITH CHANGES" 
                          ? "bg-amber-500 shadow-amber-500/50" 
                          : "bg-rose-500 shadow-rose-500/50";

                      return (
                        <Link
                          key={p.id}
                          href={`/projects/${p.id}`}
                          onClick={closeMobile}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-3 py-1.5 text-xs transition-all group",
                            isActive
                              ? "bg-indigo-50 text-[#4f46e5] font-semibold"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0 shadow-sm", dotColor)} />
                            <span className="truncate text-[11px]">{p.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-600 ml-1.5 flex-shrink-0 font-medium">
                            {score}%
                          </span>
                        </Link>
                      );
                    })
                  )}

                  <Link
                    href="/create"
                    onClick={closeMobile}
                    className="flex items-center gap-1.5 text-[11px] text-[#6366f1] hover:text-[#4f46e5] px-3 py-1.5 font-semibold hover:underline"
                  >
                    <PlusCircle className="h-3 w-3" />
                    <span>+ New Project Blueprint</span>
                  </Link>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Bottom Section: Team Orion User Profile Card */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/40">
          
          <div className="relative">
            <button
              onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
              suppressHydrationWarning
              className={cn(
                "w-full flex items-center rounded-2xl p-2.5 transition-all bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 shadow-sm text-slate-900 group",
                isCollapsed ? "justify-center" : "justify-between"
              )}
              title={isCollapsed ? "Team Orion • 12 members" : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Logo-matched avatar */}
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 border border-slate-200/80 p-1 flex-shrink-0 group-hover:border-indigo-200 group-hover:bg-indigo-50/40 transition-colors">
                  <img 
                    src="/kuiper-mark-dark.png" 
                    alt="Kuiper" 
                    className="h-6 w-6 object-contain" 
                  />
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#f97316] border-2 border-white shadow-xs" />
                </div>

                {!isCollapsed && (
                  <div className="text-left min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate leading-tight group-hover:text-[#6366f1] transition-colors">
                      Team Orion
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      12 members • <span className="capitalize">{activeRole.replace("_", " ")}</span>
                    </div>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <ChevronRight className={cn(
                  "h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-transform",
                  roleSwitcherOpen && "rotate-90"
                )} />
              )}
            </button>

            {/* Role Switcher Popover */}
            {roleSwitcherOpen && (
              <div className={cn(
                "absolute bottom-16 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xl backdrop-blur-md space-y-2.5 text-slate-800",
                isCollapsed ? "left-16" : "left-0 right-0"
              )}>
                <div className="px-1 py-1 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Workspace Role
                  </span>
                  <button
                    onClick={() => setRoleSwitcherOpen(false)}
                    className="text-slate-400 hover:text-slate-700 text-xs p-1 rounded-md hover:bg-slate-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {roleOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isCurrent = activeRole === opt.role;

                    return (
                      <button
                        key={opt.role}
                        onClick={() => handleRoleSwitch(opt.role, opt.path)}
                        className={cn(
                          "w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-all",
                          isCurrent
                            ? "bg-[#ede9fe] font-bold text-[#4f46e5] border border-indigo-200/60 shadow-xs"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={cn("flex h-6 w-6 items-center justify-center rounded-lg text-white text-[10px] shadow-xs", opt.color)}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="font-bold">{opt.title}</div>
                            <div className="text-[10px] text-slate-400">{opt.name}</div>
                          </div>
                        </div>
                        {isCurrent && (
                          <span className="h-2 w-2 rounded-full bg-[#6366f1]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-all shadow-xs"
                  >
                    <LogOut className="h-3.5 w-3.5 text-rose-500" />
                    <span>Sign Out / Switch Account</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </aside>
    </>
  );
}
