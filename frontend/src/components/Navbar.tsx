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
    <header className="no-print sticky top-0 z-30 w-full border-b border-slate-200/90 bg-white/90 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        
        {/* Left Side: Mobile Hamburger & Search Input matching Reference */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          {/* Mobile Sidebar Hamburger Toggle */}
          <button
            onClick={toggleMobile}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors flex-shrink-0"
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
              className="w-full h-10 rounded-2xl border border-slate-200/80 bg-[#f8fafc] pl-10 pr-12 text-xs text-slate-900 placeholder-slate-400 focus:border-[#6366f1] focus:bg-white focus:outline-none transition-all shadow-inner"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-400 shadow-sm">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Side: Quick Action, Calendar, Notifications & User Avatar Profile */}
        <div className="flex items-center gap-3 relative">
          
          {/* Create Button shortcut */}
          {pathname !== "/create" && role === "manager" && (
            <Link
              href="/create"
              className="hidden lg:flex items-center gap-1.5 rounded-xl bg-[#6366f1] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#4f46e5] transition-all active:scale-95"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>+ New Project</span>
            </Link>
          )}

          {/* Calendar Widget Button */}
          <div className="relative">
            <button
              onClick={() => {
                setIsCalendarOpen(!isCalendarOpen);
                setIsNotificationsOpen(false);
                setIsDropdownOpen(false);
              }}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm",
                isCalendarOpen && "border-[#6366f1] bg-[#ede9fe] text-[#6366f1]"
              )}
              title="Calendar & Milestones"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>

            {/* Calendar Popover Dropdown */}
            {isCalendarOpen && (
              <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl space-y-3 text-slate-800">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-900">August 2026</span>
                  <div className="flex items-center gap-1">
                    <button className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100">
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                    <span key={d} className="font-semibold text-slate-400 py-0.5">{d}</span>
                  ))}
                  {[...Array(31)].map((_, i) => {
                    const day = i + 1;
                    const isToday = day === 24;
                    const hasEvent = day === 23 || day === 24 || day === 28;
                    return (
                      <button
                        key={day}
                        className={cn(
                          "h-7 w-7 rounded-lg flex items-center justify-center transition-colors relative mx-auto text-xs font-medium",
                          isToday 
                            ? "bg-[#6366f1] text-white font-bold shadow-md shadow-indigo-500/20" 
                            : "text-slate-700 hover:bg-slate-100",
                          hasEvent && !isToday && "text-[#4f46e5] font-bold"
                        )}
                      >
                        {day}
                        {hasEvent && !isToday && (
                          <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#6366f1]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Event indicator */}
                <div className="rounded-xl border border-indigo-100 bg-[#ede9fe]/40 p-2.5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#4f46e5] flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#6366f1]" />
                      Re-branding Discussion
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">1:30 PM</span>
                  </div>
                  <p className="text-[10px] text-slate-500 pl-3">Design • Meeting</p>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsCalendarOpen(false);
                setIsDropdownOpen(false);
              }}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm",
                isNotificationsOpen && "border-[#6366f1] bg-[#ede9fe] text-[#6366f1]"
              )}
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#6366f1]" />
            </button>

            {/* Notifications Popover */}
            {isNotificationsOpen && (
              <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl space-y-3 text-slate-800">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-[#4f46e5]">
                      3 New
                    </span>
                  </div>
                  <button className="text-[11px] text-[#6366f1] hover:underline font-medium">Mark all read</button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 rounded-xl p-2 hover:bg-slate-50 transition-colors">
                    <div className="h-7 w-7 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bell className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-xs min-w-0">
                      <div className="font-semibold text-slate-900">Deadline approaching</div>
                      <div className="text-[11px] text-slate-500">Re-branding meeting in 1 hour.</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">5m ago</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl p-2 hover:bg-slate-50 transition-colors">
                    <div className="h-7 w-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-xs min-w-0">
                      <div className="font-semibold text-slate-900">Task update</div>
                      <div className="text-[11px] text-slate-500">2 completed, 3 pending.</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">1h ago</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl p-2 hover:bg-slate-50 transition-colors">
                    <div className="h-7 w-7 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-xs min-w-0">
                      <div className="font-semibold text-slate-900">New message</div>
                      <div className="text-[11px] text-slate-500">Sarah: "Design files are ready."</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">3h ago</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar with PR / AV Circle Pill */}
          <div className="relative">
            <button
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                setIsCalendarOpen(false);
                setIsNotificationsOpen(false);
              }}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1 hover:border-slate-300 transition-all text-left group shadow-sm"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f172a] text-xs font-bold text-white shadow-sm">
                PR
              </div>

              <div className="hidden sm:block pr-1">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.name || "Alexander Vance"}
                </div>
              </div>

              <ChevronDown className={cn(
                "h-3.5 w-3.5 text-slate-400 group-hover:text-slate-800 transition-transform mr-1",
                isDropdownOpen && "rotate-180"
              )} />
            </button>

            {/* Role Switcher Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl space-y-2 text-slate-800">
                <div className="px-2 py-1 border-b border-slate-100">
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
                            ? "bg-[#ede9fe] font-bold text-[#4f46e5]"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={cn("flex h-6 w-6 items-center justify-center rounded-md text-white text-[10px]", opt.color)}>
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
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
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
