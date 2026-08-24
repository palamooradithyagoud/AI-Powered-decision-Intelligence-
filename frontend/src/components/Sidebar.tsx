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
  Calendar,
  Settings,
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

  // Main navigation items matching reference
  const navItems = [
    {
      title: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      title: "Tasks",
      path: "/employee",
      icon: CheckCircle2,
      active: pathname === "/employee",
    },
    {
      title: "Projects",
      path: "/",
      icon: FolderKanban,
      active: pathname === "/" && false,
    },
    {
      title: "Team",
      path: "/lead",
      icon: Users,
      active: pathname === "/lead",
    },
    {
      title: "Analytics",
      path: "/",
      icon: BarChart3,
      active: false,
    },
    {
      title: "Calendar",
      path: "/lead",
      icon: Calendar,
      active: false,
    },
    {
      title: "Settings",
      path: "/login",
      icon: Settings,
      active: pathname === "/login",
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
          "no-print fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0b0f19] backdrop-blur-xl border-r border-slate-800/80 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Top Header: Brand Logo & Collapse Toggle */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-slate-800/60">
          <Link
            href="/"
            onClick={closeMobile}
            className="flex items-center gap-3 overflow-hidden group py-2"
          >
            <div className="relative flex-shrink-0 flex items-center justify-center">
              <img 
                src={isCollapsed ? "/kuiper-mark.png" : "/kuiper-logo.png"} 
                alt="Kuiper" 
                className={cn(
                  "object-contain transition-all duration-200",
                  isCollapsed ? "h-10 w-10" : "h-10 w-auto max-w-[170px]"
                )} 
              />
            </div>
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
              className="hidden md:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
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
                    "group flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                    item.active
                      ? "bg-indigo-600/15 text-indigo-400 font-semibold border border-indigo-500/20 shadow-sm"
                      : "text-slate-400 hover:bg-slate-850 hover:text-slate-200 hover:bg-slate-900/60"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center transition-colors",
                      item.active ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"
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
          {!isCollapsed && (
            <div className="space-y-2 pt-3 border-t border-slate-800/60">
              <div className="flex items-center justify-between px-3">
                <button
                  onClick={() => setProjectsOpen(!projectsOpen)}
                  className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-slate-400 hover:text-slate-300 transition-colors"
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
                              ? "bg-indigo-950/40 text-indigo-300 font-semibold border border-indigo-800/40"
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
                    className="flex items-center gap-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 px-3 py-1.5 font-medium hover:underline"
                  >
                    <PlusCircle className="h-3 w-3" />
                    <span>+ New Project Blueprint</span>
                  </Link>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Bottom Section: Team Orion Card matching Reference */}
        <div className="p-3 border-t border-slate-800/60 bg-slate-900/40">
          
          <div className="relative">
            <button
              onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
              className={cn(
                "w-full flex items-center rounded-2xl p-2.5 transition-all bg-gradient-to-r from-slate-900 to-[#0c1220] border border-slate-800 hover:border-slate-700 shadow-md group",
                isCollapsed ? "justify-center" : "justify-between"
              )}
              title={isCollapsed ? "Team Orion • 12 members" : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Glowing sphere avatar */}
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 shadow-md shadow-indigo-500/25 flex-shrink-0">
                  <div className="h-4 w-4 rounded-full bg-white/20 blur-[1px]" />
                </div>

                {!isCollapsed && (
                  <div className="text-left min-w-0">
                    <div className="text-xs font-bold text-white truncate leading-tight group-hover:text-indigo-300 transition-colors">
                      Team Orion
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      12 members • {role ? role.replace("_", " ") : "Manager"}
                    </div>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <ChevronRight className={cn(
                  "h-4 w-4 text-slate-400 group-hover:text-white transition-transform",
                  roleSwitcherOpen && "rotate-90"
                )} />
              )}
            </button>

            {/* Role Switcher Popover */}
            {roleSwitcherOpen && (
              <div className={cn(
                "absolute bottom-16 z-50 w-64 rounded-2xl border border-slate-700 bg-[#0c1220] p-3 shadow-2xl backdrop-blur-md space-y-2",
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
                          <span className="h-2 w-2 rounded-full bg-indigo-500" />
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
