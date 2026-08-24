"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import { 
  Sparkles, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Layers, 
  Briefcase, 
  CheckCircle2,
  Users,
  Compass
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_ROLES: {
  role: UserRole;
  title: string;
  name: string;
  email: string;
  desc: string;
  badgeColor: string;
  borderHover: string;
  targetPath: string;
  icon: any;
}[] = [
  {
    role: "manager",
    title: "Project Manager",
    name: "Alexander Vance",
    email: "manager@company.ai",
    desc: "AI Project Planning, Feasibility Analysis, Resource Estimation & Blueprint Hub",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    borderHover: "hover:border-blue-500/60 hover:bg-blue-950/20",
    targetPath: "/",
    icon: Briefcase,
  },
  {
    role: "project_lead",
    title: "Project Lead",
    name: "Elena Rostova",
    email: "lead@company.ai",
    desc: "Sprint Execution, Milestone Tracking, Phase Workload & Risk Management",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    borderHover: "hover:border-purple-500/60 hover:bg-purple-950/20",
    targetPath: "/lead",
    icon: Layers,
  },
  {
    role: "employee",
    title: "Employee / Developer",
    name: "Devon Chen",
    email: "employee@company.ai",
    desc: "My Assigned Deliverables, Task Execution Board & Milestone Status",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    borderHover: "hover:border-emerald-500/60 hover:bg-emerald-950/20",
    targetPath: "/employee",
    icon: Users,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, switchRole } = useAuth();

  const [email, setEmail] = useState("manager@company.ai");
  const [password, setPassword] = useState("password123");
  const [selectedRole, setSelectedRole] = useState<UserRole>("manager");
  const [isLoading, setIsLoading] = useState(false);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password, selectedRole);
      const target = selectedRole === "project_lead" ? "/lead" : selectedRole === "employee" ? "/employee" : "/";
      router.push(target);
    } catch {
      alert("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFastLogin = async (demo: typeof DEMO_ROLES[0]) => {
    setIsLoading(true);
    switchRole(demo.role);
    router.push(demo.targetPath);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex items-center justify-center p-1">
            <img 
              src="/kuiper-logo-dark.png" 
              alt="Kuiper" 
              className="h-16 sm:h-20 w-auto object-contain mx-auto drop-shadow-sm" 
            />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Enterprise AI Decision Intelligence, Feasibility Evaluation & Sprint Platform
          </p>
        </div>

        {/* 1-Click Fast Role Selection Panel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[#6366f1]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                1-Click Quick Role Access (Demo)
              </span>
            </div>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-[#4f46e5] border border-indigo-100">
              3 Roles Available
            </span>
          </div>

          <div className="space-y-3">
            {DEMO_ROLES.map((demo) => {
              const Icon = demo.icon;
              return (
                <button
                  key={demo.role}
                  onClick={() => handleFastLogin(demo)}
                  className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-[#f8fafc] p-4 text-left transition-all duration-200 hover:bg-slate-50 hover:border-indigo-300 group shadow-sm"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 group-hover:scale-105 transition-transform text-slate-800 shadow-sm">
                      <Icon className="h-5 w-5 text-[#6366f1]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {demo.name}
                        </span>
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border",
                            demo.badgeColor
                          )}
                        >
                          {demo.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {demo.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-[#6366f1] shrink-0 ml-2">
                    <span className="hidden sm:inline">Enter Portal</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Standard Manual Login Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Or Sign In with Credentials
            </span>
          </div>

          <form onSubmit={handleManualLogin} className="space-y-4">
            {/* Role Tab Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Sign in as:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole("manager");
                    setEmail("manager@company.ai");
                  }}
                  className={cn(
                    "rounded-lg py-2 text-xs font-bold transition-all border",
                    selectedRole === "manager"
                      ? "bg-[#6366f1] text-white border-[#6366f1] shadow-sm"
                      : "bg-[#f8fafc] border-slate-200 text-slate-600 hover:text-slate-900"
                  )}
                >
                  Manager
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole("project_lead");
                    setEmail("lead@company.ai");
                  }}
                  className={cn(
                    "rounded-lg py-2 text-xs font-bold transition-all border",
                    selectedRole === "project_lead"
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-[#f8fafc] border-slate-200 text-slate-600 hover:text-slate-900"
                  )}
                >
                  Project Lead
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole("employee");
                    setEmail("employee@company.ai");
                  }}
                  className={cn(
                    "rounded-lg py-2 text-xs font-bold transition-all border",
                    selectedRole === "employee"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-[#f8fafc] border-slate-200 text-slate-600 hover:text-slate-900"
                  )}
                >
                  Employee
                </button>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-[#6366f1] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-[#6366f1] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-[#6366f1] py-3 text-sm font-bold text-white shadow-md hover:bg-[#4f46e5] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : `Sign In as ${selectedRole.replace("_", " ").toUpperCase()}`}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
