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
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex items-center justify-center p-2">
            <img 
              src="/kuiper-logo.png" 
              alt="Kuiper" 
              className="h-16 sm:h-20 w-auto object-contain mx-auto filter drop-shadow-[0_0_20px_rgba(249,115,22,0.2)]" 
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-wider text-white">
            KUIPER<span className="text-orange-500 font-black">.</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Enterprise AI Decision Intelligence, Feasibility Evaluation & Sprint Platform
          </p>
        </div>

        {/* 1-Click Fast Role Selection Panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                1-Click Quick Role Access (Demo)
              </span>
            </div>
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
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
                  className={cn(
                    "w-full flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left transition-all duration-200 group",
                    demo.borderHover
                  )}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 group-hover:scale-105 transition-transform text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm truncate">
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
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {demo.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-blue-400 shrink-0 ml-2">
                    <span className="hidden sm:inline">Enter Portal</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Standard Manual Login Form */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-sm shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Or Sign In with Credentials
            </span>
          </div>

          <form onSubmit={handleManualLogin} className="space-y-4">
            {/* Role Tab Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
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
                      ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
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
                      ? "bg-purple-600 text-white border-purple-500 shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
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
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  )}
                >
                  Employee
                </button>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : `Sign In as ${selectedRole.replace("_", " ").toUpperCase()}`}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
