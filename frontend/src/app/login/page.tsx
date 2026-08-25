"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole, EmployeeProfile } from "@/types";
import { fetchEmployees } from "@/lib/api";
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
  Search,
  KeyRound,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  Flame,
  Check,
  Building2,
  BadgeAlert,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY_DEMO_ROLES: {
  role: UserRole;
  title: string;
  empId: string;
  name: string;
  email: string;
  desc: string;
  badgeColor: string;
  targetPath: string;
  icon: any;
}[] = [
  {
    role: "manager",
    empId: "emp_01",
    title: "Project Manager",
    name: "Arjun Reddy",
    email: "emp_01@company.ai",
    desc: "AI Project Planning, Feasibility Analysis, Resource Estimation & Blueprint Hub",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    targetPath: "/",
    icon: Briefcase,
  },
  {
    role: "project_lead",
    empId: "emp_18",
    title: "Project / Product Lead",
    name: "Ishita Rao",
    email: "emp_18@company.ai",
    desc: "Sprint Execution, Milestone Tracking, Phase Workload & Team Management",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    targetPath: "/lead",
    icon: Layers,
  },
  {
    role: "employee",
    empId: "emp_03",
    title: "Frontend Developer",
    name: "Rahul Kumar",
    email: "emp_03@company.ai",
    desc: "My Assigned Deliverables, Task Execution Board & Milestone Status",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    targetPath: "/employee",
    icon: Users,
  },
];

const CATEGORIES = [
  "All (40)",
  "Management & Leads",
  "Engineering / Devs",
  "AI & Data Science",
  "DevOps & Cloud",
  "QA & Testing",
  "Design & Product"
];

export default function LoginPage() {
  const router = useRouter();
  const { login, loginAsEmployee, switchRole } = useAuth();

  const [activeTab, setActiveTab] = useState<"quick" | "directory" | "credentials">("quick");
  
  // Credentials Form State
  const [identifier, setIdentifier] = useState("emp_01");
  const [password, setPassword] = useState("emp_01");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("manager");
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Employee Directory State
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All (40)");
  const [directoryLoading, setDirectoryLoading] = useState(true);

  useEffect(() => {
    async function loadDirectory() {
      try {
        setDirectoryLoading(true);
        const data = await fetchEmployees();
        setEmployees(data);
      } catch (err) {
        console.error("Failed to load employee directory:", err);
      } finally {
        setDirectoryLoading(false);
      }
    }
    loadDirectory();
  }, []);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    try {
      const user = await login(identifier, password, selectedRole);
      const target = user.role === "project_lead" ? "/lead" : user.role === "employee" ? "/employee" : "/";
      router.push(target);
    } catch (err: any) {
      setAuthError(err.message || "Invalid credentials. Please verify your Employee ID and password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFastRoleLogin = (demo: typeof PRIMARY_DEMO_ROLES[0]) => {
    setIsLoading(true);
    loginAsEmployee({
      id: demo.empId,
      name: demo.name,
      email: demo.email,
      role: demo.role,
      title: demo.title,
    });
    router.push(demo.targetPath);
  };

  const handleEmployeeDirectoryLogin = (emp: EmployeeProfile) => {
    setIsLoading(true);
    const empRole: UserRole = emp.role || (emp.id === "emp_01" ? "manager" : ["emp_18", "emp_36", "emp_15", "emp_33"].includes(emp.id || "") ? "project_lead" : "employee");
    loginAsEmployee({
      id: emp.id || `emp_${emp.serial_no}`,
      name: emp.name,
      email: emp.email || `${emp.id}@company.ai`,
      role: empRole,
      title: emp.designation,
      avatar_color: emp.avatar_color || "bg-indigo-600",
    });

    const target = empRole === "project_lead" ? "/lead" : empRole === "employee" ? "/employee" : "/";
    router.push(target);
  };

  // Filter employees for directory
  const filteredEmployees = employees.filter((emp) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      !searchTerm || 
      emp.name.toLowerCase().includes(q) ||
      (emp.id && emp.id.toLowerCase().includes(q)) ||
      emp.designation.toLowerCase().includes(q) ||
      (emp.skills && emp.skills.some(s => s.toLowerCase().includes(q)));

    if (!matchesSearch) return false;

    if (selectedCategory === "All (40)") return true;
    const des = emp.designation.toLowerCase();
    if (selectedCategory === "Management & Leads") {
      return des.includes("manager") || des.includes("architect") || des.includes("lead");
    }
    if (selectedCategory === "Engineering / Devs") {
      return des.includes("developer") || des.includes("engineer") && !des.includes("devops") && !des.includes("cloud") && !des.includes("qa") && !des.includes("security") && !des.includes("data") && !des.includes("learning");
    }
    if (selectedCategory === "AI & Data Science") {
      return des.includes("ai") || des.includes("learning") || des.includes("data");
    }
    if (selectedCategory === "DevOps & Cloud") {
      return des.includes("devops") || des.includes("cloud") || des.includes("reliability");
    }
    if (selectedCategory === "QA & Testing") {
      return des.includes("qa") || des.includes("test");
    }
    if (selectedCategory === "Design & Product") {
      return des.includes("designer") || des.includes("ui/ux") || des.includes("product") || des.includes("writer");
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex items-center justify-center p-1">
            <img 
              src="/kuiper-logo-dark.png" 
              alt="Kuiper" 
              className="h-14 sm:h-18 w-auto object-contain mx-auto drop-shadow-sm" 
            />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mx-auto">
            AI Project Planning, Feasibility Intelligence & 40-Employee Sprint Platform
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              Connected to EMPLOYEE_ID.xlsx (40 Real Corporate Profiles)
            </span>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-200/80 p-1.5 rounded-2xl shadow-inner gap-1.5 max-w-xl mx-auto">
          <button
            onClick={() => setActiveTab("quick")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2",
              activeTab === "quick"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Sparkles className="w-4 h-4" />
            1-Click Demo
          </button>

          <button
            onClick={() => setActiveTab("directory")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 relative",
              activeTab === "directory"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Users className="w-4 h-4" />
            40-Employee Directory
            <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
              40
            </span>
          </button>

          <button
            onClick={() => setActiveTab("credentials")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2",
              activeTab === "credentials"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <KeyRound className="w-4 h-4" />
            Manual Login
          </button>
        </div>

        {/* TAB 1: 1-Click Fast Role Selection Panel */}
        {activeTab === "quick" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-[#6366f1]" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Select a Portal to Enter
                </span>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                Instant 1-Click Access
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {PRIMARY_DEMO_ROLES.map((demo) => {
                const Icon = demo.icon;
                return (
                  <button
                    key={demo.role}
                    onClick={() => handleFastRoleLogin(demo)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-[#f8fafc] p-4 text-left transition-all duration-200 hover:bg-slate-50 hover:border-indigo-300 group shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 group-hover:scale-105 transition-transform text-slate-800 shadow-sm">
                        <Icon className="h-6 w-6 text-[#6366f1]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm sm:text-base truncate">
                            {demo.name}
                          </span>
                          <span className="font-mono text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {demo.empId}
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
                        <p className="text-xs text-slate-500 mt-1">
                          {demo.desc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-[#6366f1] shrink-0 ml-3">
                      <span className="hidden sm:inline">Launch Portal</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-500" />
                Want to test a specific developer, QA, ML engineer, or DevOps?
              </span>
              <button
                onClick={() => setActiveTab("directory")}
                className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                Browse All 40 Employees <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: 40-Employee Directory & Instant Login Grid */}
        {activeTab === "directory" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in-50 duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Corporate Employee Directory (EMPLOYEE_ID.xlsx)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click on any employee card to instantly sign in with their full profile, assigned deliverables, and skill set.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, emp_ID, skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Department / Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 flex-shrink-0" />
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all border",
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Employee Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[520px] overflow-y-auto pr-1">
              {filteredEmployees.map((emp) => {
                const isAvailable = emp.availability_status === "Available";
                const isPartial = emp.availability_status === "Partial";

                return (
                  <div
                    key={emp.id || emp.serial_no}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 hover:bg-white hover:border-indigo-300 transition-all group flex flex-col justify-between shadow-sm hover:shadow-md space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0",
                            emp.avatar_color || "bg-indigo-600"
                          )}>
                            {emp.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                {emp.name}
                              </h3>
                              <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded">
                                {emp.id}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">
                              {emp.designation}
                            </p>
                          </div>
                        </div>

                        {/* Availability Pill */}
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0",
                          isAvailable
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isPartial
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        )}>
                          {emp.availability_status || "Available"}
                        </span>
                      </div>

                      {/* Stats & Workload */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Experience:</span>
                          <span className="font-semibold text-slate-800">{emp.experience}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Workload:</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full",
                                  emp.workload > 85 ? "bg-rose-500" : emp.workload > 60 ? "bg-amber-500" : "bg-emerald-500"
                                )}
                                style={{ width: `${emp.workload}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-slate-700">{emp.workload}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Skills Tags */}
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {emp.skills.slice(0, 4).map((sk, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-700 text-[10px] font-medium px-1.5 py-0.5 rounded border border-slate-200"
                          >
                            {sk}
                          </span>
                        ))}
                        {emp.skills.length > 4 && (
                          <span className="text-[10px] font-semibold text-slate-400 self-center">
                            +{emp.skills.length - 4} more
                          </span>
                        )}
                      </div>

                      {/* Previous Projects */}
                      {emp.prev_projects && emp.prev_projects.length > 0 && (
                        <p className="mt-2 text-[10px] text-slate-500 truncate">
                          <strong className="text-slate-600">Past Projects:</strong> {emp.prev_projects.join(", ")}
                        </p>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleEmployeeDirectoryLogin(emp)}
                      disabled={isLoading}
                      className="w-full mt-2 py-2 px-3 bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 hover:border-indigo-600 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 group-hover:scale-[1.01]"
                    >
                      <span>Sign In as {emp.name.split(" ")[0]} ({emp.id})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {filteredEmployees.length === 0 && !directoryLoading && (
                <div className="col-span-full py-12 text-center text-slate-400">
                  <p className="text-sm font-semibold">No employees found matching "{searchTerm}"</p>
                  <p className="text-xs mt-1">Try clearing filters or search by role/skill.</p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Showing {filteredEmployees.length} of 40 employees</span>
              <span className="font-mono text-[11px] text-indigo-600 font-semibold">
                Password equals Employee ID (e.g. emp_04)
              </span>
            </div>
          </div>
        )}

        {/* TAB 3: Standard Manual Login Form */}
        {activeTab === "credentials" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in-50 duration-200 max-w-xl mx-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Sign In with Credentials
                </span>
              </div>
              <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                Any emp_01 to emp_40
              </span>
            </div>

            {/* Quick Fill Bar */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-500">
                Quick Fill Employee Credentials:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "emp_01", label: "emp_01 (Manager)", role: "manager" as UserRole },
                  { id: "emp_04", label: "emp_04 (Backend Dev)", role: "employee" as UserRole },
                  { id: "emp_10", label: "emp_10 (ML Engineer)", role: "employee" as UserRole },
                  { id: "emp_18", label: "emp_18 (Project Lead)", role: "project_lead" as UserRole },
                  { id: "emp_28", label: "emp_28 (UI/UX)", role: "employee" as UserRole },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setIdentifier(item.id);
                      setPassword(item.id);
                      setSelectedRole(item.role);
                    }}
                    className="text-[11px] font-mono px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 rounded-lg border border-slate-200 text-slate-700 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                <BadgeAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
                {authError}
              </div>
            )}

            <form onSubmit={handleManualLogin} className="space-y-4">
              {/* Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Sign In Role:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("manager")}
                    className={cn(
                      "rounded-xl py-2.5 text-xs font-bold transition-all border",
                      selectedRole === "manager"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-[#f8fafc] border-slate-200 text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Manager
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole("project_lead")}
                    className={cn(
                      "rounded-xl py-2.5 text-xs font-bold transition-all border",
                      selectedRole === "project_lead"
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "bg-[#f8fafc] border-slate-200 text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Project Lead
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole("employee")}
                    className={cn(
                      "rounded-xl py-2.5 text-xs font-bold transition-all border",
                      selectedRole === "employee"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-[#f8fafc] border-slate-200 text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Employee
                  </button>
                </div>
              </div>

              {/* Identifier Field (Employee ID or Email) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Employee ID / Work Email / Full Name
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. emp_01, emp_04, emp_04@company.ai, Sneha Patel"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-[#6366f1] focus:bg-white focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Valid Employee IDs range from <strong className="text-slate-600">emp_01</strong> through <strong className="text-slate-600">emp_40</strong>.
                </p>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-600">
                    Password
                  </label>
                  <span className="text-[10px] text-indigo-600 font-medium">
                    (Default: Same as Employee ID)
                  </span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] pl-9 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-[#6366f1] focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? "Signing in..." : `Sign In as ${selectedRole.replace("_", " ").toUpperCase()}`}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
