"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { UserRole } from "@/types";
import { 
  Sparkles, 
  Search,
  Calendar as CalendarIcon,
  Bell,
  ChevronDown, 
  Menu,
  Briefcase, 
  Layers, 
  Users, 
  LogOut, 
  PlusCircle, 
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  MessageSquare,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, switchRole, logout } = useAuth();
  const { toggleMobile } = useSidebar();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const roleOptions: { role: UserRole; title: string; name: string; path: string; icon: any; color: string }[] = [
    {
      role: "manager",
      title: "Manager",
      name: "Alexander Vance",
      path: "/",
      icon: Briefcase,
      color: "bg-indigo-600",
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
    <header className="no-print sticky top-0 z-30 w-full border-b border-slate-800/60 bg-[#090d16]/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        
        {/* Left Side: Mobile Hamburger & Search Input matching Reference */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          {/* Mobile Sidebar Hamburger Toggle */}
          <button
            onClick={toggleMobile}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition-colors flex-shrink-0"
            title="Open Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search Bar matching Reference UI */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks, projects, or people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-800/80 bg-slate-900/60 pl-10 pr-12 text-xs text-slate-200 placeholder-slate-400 focus:border-indigo-500/80 focus:bg-slate-900 focus:outline-none transition-all shadow-inner"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-700/80 bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Side: Calendar, Notifications & User Avatar Profile */}
        <div className="flex items-center gap-3 relative">
          
          {/* Create Button shortcut */}
          {pathname !== "/create" && role === "manager" && (
            <Link
              href="/create"
              className="hidden lg:flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>+ New Project</span>
            </Link>
          )}

          {/* Calendar Widget Button matching Reference */}
          <div className="relative">
            <button
              onClick={() => {
                setIsCalendarOpen(!isCalendarOpen);
                setIsNotificationsOpen(false);
                setIsDropdownOpen(false);
              }}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:border-slate-700 transition-all",
                isCalendarOpen && "border-indigo-500/50 bg-indigo-950/30 text-indigo-400"
              )}
              title="Calendar & Milestones"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>

            {/* Calendar Popover Dropdown matching Reference Screenshot */}
            {isCalendarOpen && (
              <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-slate-700/90 bg-[#0c1220] p-4 shadow-2xl backdrop-blur-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white">August 2026</span>
                  <div className="flex items-center gap-1">
                    <button className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800">
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                    <span key={d} className="font-semibold text-slate-500 py-0.5">{d}</span>
                  ))}
                  {[...Array(31)].map((_, i) => {
                    const day = i + 1;
                    const isToday = day === 24;
                    const hasEvent = day === 23 || day === 24 || day === 28;
                    return (
                      <button
                        key={day}
                        className={cn(
                          "h-7 w-7 rounded-lg flex items-center justify-center transition-colors relative mx-auto text-xs",
                          isToday ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30" : "text-slate-300 hover:bg-slate-800",
                          hasEvent && !isToday && "text-indigo-400 font-semibold"
                        )}
                      >
                        {day}
                        {hasEvent && !isToday && (
                          <span className="absolute bottom-1 h-1 w-1 rounded-full bg-indigo-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Event indicator */}
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/40 p-2.5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      Sprint Review & Planning
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">1:30 PM</span>
                  </div>
                  <p className="text-[10px] text-slate-400 pl-3">Design & AI architecture alignment meeting</p>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Bell matching Reference */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsCalendarOpen(false);
                setIsDropdownOpen(false);
              }}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:border-slate-700 transition-all",
                isNotificationsOpen && "border-indigo-500/50 bg-indigo-950/30 text-indigo-400"
              )}
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            </button>

            {/* Notifications Popover */}
            {isNotificationsOpen && (
              <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-700/90 bg-[#0c1220] p-4 shadow-2xl backdrop-blur-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Notifications</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      3 New
                    </span>
                  </div>
                  <button className="text-[11px] text-indigo-400 hover:underline">Mark all read</button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 rounded-xl p-2 hover:bg-slate-850 transition-colors">
                    <div className="h-7 w-7 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-xs min-w-0">
                      <div className="font-semibold text-slate-200">Deadline approaching</div>
                      <div className="text-[11px] text-slate-400">Sprint planning meeting in 1 hour</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">5m ago</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl p-2 hover:bg-slate-850 transition-colors">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-xs min-w-0">
                      <div className="font-semibold text-slate-200">Task update</div>
                      <div className="text-[11px] text-slate-400">2 completed, 3 pending review</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">1h ago</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl p-2 hover:bg-slate-850 transition-colors">
                    <div className="h-7 w-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BarChart3 className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-xs min-w-0">
                      <div className="font-semibold text-slate-200">Weekly report</div>
                      <div className="text-[11px] text-slate-400">Portfolio productivity increased by 12%</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">1d ago</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar with PR / AV Circle Pill matching Reference */}
          <div className="relative">
            <button
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                setIsCalendarOpen(false);
                setIsNotificationsOpen(false);
              }}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 p-1.5 hover:border-slate-700 hover:bg-slate-800 transition-all text-left group"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-extrabold text-white shadow-sm">
                AV
              </div>

              <div className="hidden sm:block pr-1">
                <div className="text-xs font-bold text-slate-200 leading-tight">
                  {user?.name || "Alexander Vance"}
                </div>
              </div>

              <ChevronDown className={cn(
                "h-3.5 w-3.5 text-slate-400 group-hover:text-white transition-transform",
                isDropdownOpen && "rotate-180"
              )} />
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
                          <span className="h-2 w-2 rounded-full bg-indigo-500" />
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
                    <span>Sign Out / Switch Account</span>
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
