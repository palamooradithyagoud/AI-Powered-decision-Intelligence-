"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { fetchProjects, fetchHealth } from "@/lib/api";
import { Project, UserRole } from "@/types";
import { 
  Sparkles, 
  LayoutDashboard, 
  PlusCircle, 
  Layers, 
  Users, 
  FolderKanban, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  Briefcase, 
  Activity, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldAlert,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, switchRole, logout } = useAuth();
  const { isCollapsed, toggleCollapse, isMobileOpen, closeMobile } = useSidebar();
  
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  // Load recent projects on mount
  useEffect(() => {
    async function loadSidebarData() {
      try {
        const projs = await fetchProjects().catch(() => []);
        if (projs && Array.isArray(projs)) {
          setRecentProjects(projs.slice(0, 5));
        }
      } catch (err) {
        // Fallback quiet
      }
    }
    loadSidebarData();
  }, [pathname]);

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
    setRoleSwitcherOpen(false);
    closeMobile();
    router.push(targetPath);
  };

  const handleLogout = () => {
    logout();
    closeMobile();
    router.push("/login");
  };

  // Main navigation items for manager
  const navItems = [
    {
      title: "Manager Dashboard",
      subtitle: "Portfolio Overview & KPIs",
      path: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
      badge: "Live",
      badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    {
      title: "Create Project",
      subtitle: "AI Feasibility Planner",
      path: "/create",
      icon: PlusCircle,
      active: pathname === "/create",
      badge: "AI Scoper",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    },
    {
      title: "Sprint Command Center",
      subtitle: "Milestones & Delivery",
      path: "/lead",
      icon: Layers,
      active: pathname === "/lead",
      badge: null,
      badgeColor: "",
    },
    {
      title: "Team Task Hub",
      subtitle: "Workforce Execution",
      path: "/employee",
      icon: CheckCircle2,
      active: pathname === "/employee",
      badge: null,
      badgeColor: "",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "no-print fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#080c16]/95 backdrop-blur-xl border-r border-slate-800/80 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Top Header: Brand Logo & Collapse Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-slate-900/40">
          <Link
            href="/"
            onClick={closeMobile}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="relative flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5 text-white" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0 transition-opacity duration-200">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white">
                    PlanPulse<span className="text-blue-500">.AI</span>
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    MANAGER
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 truncate font-medium">
                  AI Planning & Governance
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse / Mobile Close Button */}
          <div className="flex items-center">
            <button
              onClick={closeMobile}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Close Menu"
            >
              <X className="h-5 w-5" />
            </button>

            <button
              onClick={toggleCollapse}
              className="hidden md:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
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

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6 scrollbar-thin">
          
          {/* Main Navigation Section */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-slate-400">
                Control Hub
              </div>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={closeMobile}
                  title={isCollapsed ? item.title : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200",
                    item.active
                      ? "bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white shadow-md shadow-blue-500/20 font-bold border border-blue-400/20"
                      : "text-slate-300 hover:bg-slate-800/70 hover:text-white hover:border-slate-700/50 border border-transparent"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-lg p-1 transition-transform group-hover:scale-110",
                      item.active ? "text-white" : "text-slate-400 group-hover:text-blue-400"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                  </div>

                  {!isCollapsed && (
                    <div className="flex flex-1 items-center justify-between min-w-0">
                      <div className="truncate">
                        <div className="leading-tight">{item.title}</div>
                        <div className={cn(
                          "text-[10px] truncate font-normal",
                          item.active ? "text-blue-100/80" : "text-slate-500"
                        )}>
                          {item.subtitle}
                        </div>
                      </div>

                      {item.badge && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[9px] font-bold border ml-2 flex-shrink-0",
                            item.active ? "bg-white/20 text-white border-white/30" : item.badgeColor
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Quick Portfolio Blueprints Section */}
          {!isCollapsed && (
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between px-3">
                <button
                  onClick={() => setProjectsOpen(!projectsOpen)}
                  className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-slate-400 hover:text-slate-300 transition-colors"
                >
                  <FolderKanban className="h-3 w-3 text-slate-400" />
                  <span>Recent Blueprints</span>
                  {projectsOpen ? (
                    <ChevronUp className="h-3 w-3 ml-0.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-3 w-3 ml-0.5 text-slate-400" />
                  )}
                </button>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-bold">
                  {recentProjects.length}
                </span>
              </div>

              {projectsOpen && (
                <div className="space-y-1 pl-1">
                  {recentProjects.length === 0 ? (
                    <div className="px-3 py-2 text-[11px] text-slate-500 italic">
                      No active blueprints yet
                    </div>
                  ) : (
                    recentProjects.map((p) => {
                      const isActive = pathname === `/projects/${p.id}`;
                      const score = p.analysis?.feasibility?.feasibility_score ?? 80;
                      const status = p.analysis?.feasibility?.status ?? "FEASIBLE";
                      
                      const dotColor = 
                        status === "FEASIBLE" 
                          ? "bg-emerald-400 shadow-emerald-500/50" 
                          : status === "FEASIBLE WITH CHANGES" 
                          ? "bg-amber-400 shadow-amber-500/50" 
                          : "bg-rose-400 shadow-rose-500/50";

                      return (
                        <Link
                          key={p.id}
                          href={`/projects/${p.id}`}
                          onClick={closeMobile}
                          className={cn(
                            "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-all group",
                            isActive
                              ? "bg-blue-950/40 text-blue-300 font-semibold border border-blue-800/40"
                              : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0 shadow-sm", dotColor)} />
                            <span className="truncate text-[11px]">{p.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300 ml-1.5 flex-shrink-0">
                            {score}%
                          </span>
                        </Link>
                      );
                    })
                  )}

                  <Link
                    href="/create"
                    onClick={closeMobile}
                    className="flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 px-3 py-1.5 font-medium hover:underline"
                  >
                    <PlusCircle className="h-3 w-3" />
                    <span>Scope New Project Blueprint</span>
                  </Link>
                </div>
              )}
            </div>
          )}



        </div>

        {/* Bottom Section: User Profile & Role Switcher */}
        <div className="border-t border-slate-800/80 bg-slate-900/80 p-3 space-y-2">
          
          {/* User Profile Button */}
          <div className="relative">
            <button
              onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
              className={cn(
                "w-full flex items-center rounded-xl p-2 transition-all hover:bg-slate-800 border border-slate-800/80",
                isCollapsed ? "justify-center" : "justify-between"
              )}
              title={isCollapsed ? `${user?.name} (${role})` : undefined}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm flex-shrink-0",
                    user?.avatar_color || "bg-blue-600"
                  )}
                >
                  {user?.name ? user.name[0] : "A"}
                </div>

                {!isCollapsed && (
                  <div className="text-left min-w-0">
                    <div className="text-xs font-bold text-slate-200 truncate leading-tight">
                      {user?.name || "Alexander Vance"}
                    </div>
                    <div className="text-[10px] text-blue-400 font-semibold truncate capitalize">
                      {role ? role.replace("_", " ") : "Manager"}
                    </div>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <ChevronDown className={cn(
                  "h-3.5 w-3.5 text-slate-400 transition-transform",
                  roleSwitcherOpen && "rotate-180"
                )} />
              )}
            </button>

            {/* Role Switcher Popover */}
            {roleSwitcherOpen && (
              <div className={cn(
                "absolute bottom-14 z-50 w-64 rounded-2xl border border-slate-700 bg-[#0c1220] p-3 shadow-2xl backdrop-blur-md space-y-2",
                isCollapsed ? "left-16" : "left-0 right-0"
              )}>
                <div className="px-2 py-1 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Role Navigation (Demo)
                  </span>
                  <button
                    onClick={() => setRoleSwitcherOpen(false)}
                    className="text-slate-500 hover:text-slate-300 text-xs"
                  >
                    <X className="h-3 w-3" />
                  </button>
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
                          "w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-all",
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
                    className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out / Change Role</span>
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
