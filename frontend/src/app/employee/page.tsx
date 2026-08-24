"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  fetchEmployeeProfile, 
  fetchEmployeeProject, 
  fetchProjectStages, 
  updateProjectStage,
  EmployeeProfile
} from "@/lib/api";
import { Project } from "@/types";
import Navbar from "@/components/Navbar";
import { 
  Clock, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  BookOpen,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: "Project Milestone Shifted",
    description: "Elena Rostova (Project Lead) adjusted the testing timeline. The UAT review has been scheduled for Day 40.",
    time: "2 hours ago",
    type: "info"
  },
  {
    id: 2,
    title: "AI Analysis Complete",
    description: "Gemini Reasoning engine evaluated the project feasibility. Current status: Feasible.",
    time: "1 day ago",
    type: "success"
  },
  {
    id: 3,
    title: "Task Assigned",
    description: "You have been assigned to lead the Development phase execution.",
    time: "3 days ago",
    type: "warning"
  },
  {
    id: 4,
    title: "Welcome to Kuiper",
    description: "Your employee dashboard workspace is active. Explore your project dashboard and Kanban board.",
    time: "5 days ago",
    type: "system"
  }
];

const STAGE_DESCRIPTIONS: Record<string, string> = {
  "Planning": "Requirements gathering, tech stack selection, resource planning, and architecture design docs.",
  "Development": "Coding backend services, developing user interfaces, API integrations, and database migrations.",
  "Testing": "Executing unit tests, automated integration test pipelines, and user acceptance testing (UAT).",
  "Review": "Conducting peer code reviews, performance benchmarking, and security compliance audits.",
  "Deployment": "Configuring CI/CD pipelines, container orchestration, and deploying to production cloud servers."
};

const STAGES_ORDER = ["Planning", "Development", "Testing", "Review", "Deployment"];
const STATUS_OPTIONS = ["To Do", "In Progress", "Review", "Completed"];

function EmployeeDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams ? searchParams.get("tab") : "home";

  const [empNum, setEmpNum] = useState<number | null>(null);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [stages, setStages] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"home" | "project" | "progress" | "profile" | "notifications">("home");

  // Parse employee number from logged-in user
  useEffect(() => {
    if (user && user.id) {
      if (user.id.startsWith("emp_")) {
        const num = parseInt(user.id.split("_")[1]);
        if (!isNaN(num)) {
          setEmpNum(num);
          return;
        }
      }
      // Default fallback to emp_10 if logged in as default 'employee' role
      setEmpNum(10);
    } else {
      // Redirect if not authenticated
      router.push("/login");
    }
  }, [user]);

  // Sync tab with URL search parameter
  useEffect(() => {
    if (tabParam) {
      const validTabs = ["home", "project", "progress", "profile", "notifications"];
      if (validTabs.includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
  }, [tabParam]);

  // Load all dashboard data
  const loadDashboardData = async () => {
    if (empNum === null) return;
    setLoading(true);
    setError(null);
    try {
      const [profData, projData] = await Promise.all([
        fetchEmployeeProfile(empNum),
        fetchEmployeeProject(empNum)
      ]);
      setProfile(profData);
      setProject(projData);
      
      if (projData && projData.id) {
        const stageData = await fetchProjectStages(projData.id);
        setStages(stageData);
      }
    } catch (err: any) {
      console.error("Error loading employee data:", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [empNum]);

  // Calculate completed stages and overall progress percentage
  const completedStagesCount = STAGES_ORDER.filter(s => stages[s] === "Completed").length;
  const progressPercent = (completedStagesCount / STAGES_ORDER.length) * 100;

  // Handle stage status changes in Kanban
  const handleStageStatusChange = async (stageName: string, newStatus: string) => {
    if (!project) return;
    try {
      const updatedStages = await updateProjectStage(project.id, stageName, newStatus);
      setStages(updatedStages);
    } catch (err) {
      alert("Failed to update stage status. Please try again.");
    }
  };

  // Move stage status left/right in Kanban columns
  const moveStage = (stageName: string, direction: "left" | "right") => {
    const currentStatus = stages[stageName] || "To Do";
    const currentIndex = STATUS_OPTIONS.indexOf(currentStatus);
    let nextIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex >= 0 && nextIndex < STATUS_OPTIONS.length) {
      handleStageStatusChange(stageName, STATUS_OPTIONS[nextIndex]);
    }
  };

  // Find the current active project stage
  const getCurrentStage = () => {
    for (const s of STAGES_ORDER) {
      if (stages[s] === "In Progress" || stages[s] === "Review") {
        return s;
      }
    }
    for (const s of [...STAGES_ORDER].reverse()) {
      if (stages[s] === "Completed") {
        return s;
      }
    }
    return "Planning";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#6366f1] border-t-transparent" />
          <span className="text-sm font-semibold text-slate-500">Loading your portal...</span>
        </div>
      </div>
    );
  }

  if (error || !profile || !project) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-4 shadow-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Workspace Unavailable</h2>
          <p className="text-sm text-slate-500">
            {error || "Could not retrieve employee details or project assignments."}
          </p>
          <button 
            onClick={loadDashboardData}
            className="w-full rounded-xl bg-[#6366f1] py-2.5 text-sm font-semibold text-white hover:bg-[#4f46e5] transition-all"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Dashboard Header Ribbon */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Developer Workbench
              </h1>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                {profile.designation}
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Manage deliverables, track timelines, and update sprint progress.
            </p>
          </div>
        </div>

        {/* TAB content area */}
        <div className="transition-all duration-200">
          
          {/* TAB 1: HOME PORTAL */}
          {activeTab === "home" && (
            <div className="space-y-6">
              {/* Grid Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Project Overview Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assigned Project</span>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">{project.name}</h3>
                  </div>
                  <button 
                    onClick={() => {
                      router.push("/employee?tab=project");
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-[#6366f1] hover:text-[#4f46e5] transition-colors w-max"
                  >
                    <span>View Specifications</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Timeline Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Project Deadline</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-3xl font-black text-slate-900">{project.expected_days}</span>
                      <span className="text-sm font-semibold text-slate-500">Days</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span>Estimated delivery day buffer included</span>
                  </div>
                </div>

                {/* Personal Bandwidth Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Workload & Allocation</span>
                      <span className="text-xs font-bold text-[#6366f1]">{profile.workload}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-[#6366f1] h-2 rounded-full" style={{ width: `${profile.workload}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-bold text-emerald-600">{profile.availability}</span>
                  </div>
                </div>
              </div>

              {/* Progress & Current Phase Tracker Section */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900">Project Stage Tracking</h3>
                    <p className="text-xs text-slate-500">Overall status calculated based on completed execution phases.</p>
                  </div>
                  <span className="rounded-full bg-indigo-50 border border-indigo-100 text-[#6366f1] px-3 py-1 text-xs font-bold">
                    {progressPercent}% Complete ({completedStagesCount}/5 Stages)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div className="bg-[#6366f1] h-3 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                </div>

                {/* Timeline Step Indicators */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
                  {STAGES_ORDER.map((s, idx) => {
                    const status = stages[s] || "To Do";
                    const isActive = s === getCurrentStage();
                    return (
                      <div 
                        key={s} 
                        className={cn(
                          "p-3 rounded-xl border text-center space-y-1.5 transition-all",
                          status === "Completed" 
                            ? "border-emerald-200 bg-emerald-50/50 text-emerald-700" 
                            : status === "In Progress"
                            ? "border-indigo-200 bg-indigo-50/50 text-[#6366f1]"
                            : status === "Review"
                            ? "border-orange-200 bg-orange-50/50 text-orange-700"
                            : "border-slate-200 bg-slate-50 text-slate-500",
                          isActive && "ring-2 ring-[#6366f1] ring-offset-2 ring-offset-white"
                        )}
                      >
                        <span className="text-[10px] font-bold text-slate-400 block">Stage 0{idx + 1}</span>
                        <h4 className="text-xs font-bold text-slate-800">{s}</h4>
                        <span 
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-[9px] font-bold border",
                            status === "Completed" 
                              ? "bg-emerald-55 text-emerald-700 border-emerald-200" 
                              : status === "In Progress"
                              ? "bg-indigo-55 text-[#6366f1] border-indigo-200"
                              : status === "Review"
                              ? "bg-orange-55 text-orange-700 border-orange-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          )}
                        >
                          {status}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-slate-500">Current Phase Focus: <strong className="text-slate-900">{getCurrentStage()}</strong></span>
                  <button 
                    onClick={() => {
                      router.push("/employee?tab=progress");
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-[#6366f1] hover:text-[#4f46e5]"
                  >
                    <span>Update Kanban Board</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Quick Details Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profile Snapshot */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">My Profile Info</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 font-semibold uppercase text-[9px] block">Role Designation</span>
                      <span className="font-bold text-slate-800">{profile.designation}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold uppercase text-[9px] block">Experience Level</span>
                      <span className="font-bold text-slate-800">{profile.experience}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 font-semibold uppercase text-[9px] block">Top Competencies</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {profile.skills.slice(0, 4).map((skill: string) => (
                          <span key={skill} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-650 border border-slate-200">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notifications Preview */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Recent Alerts</h3>
                    <Bell className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="space-y-3">
                    {MOCK_NOTIFICATIONS.slice(0, 2).map(n => (
                      <div key={n.id} className="flex gap-2.5 items-start text-xs">
                        <div className="h-2 w-2 rounded-full bg-[#6366f1] mt-1.5 shrink-0" />
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-800 truncate">{n.title}</h4>
                          <p className="text-slate-500 text-[11px] truncate">{n.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ASSIGNED PROJECT SPECIFICATIONS */}
          {activeTab === "project" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">Assigned Project Specifications</h1>
                <p className="text-xs text-slate-550 mt-1">Review the complete parameters and scope of your active workspace assignment.</p>
              </div>

              {/* Title & Priority Badge */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-[#6366f1] uppercase tracking-widest block">Project Identifier: {project.id.slice(0, 8)}</span>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">{project.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Priority:</span>
                  <span className="rounded-full bg-red-50 text-red-750 border border-red-200 px-3 py-0.5 text-xs font-bold">
                    High Priority
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider text-[11px]">Description & Goal</h3>
                <p className="text-sm text-slate-655 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                  {project.description}
                </p>
              </div>

              {/* Roles and Timelines Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Execution Information</h3>
                  <div className="divide-y divide-slate-200 text-xs">
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-500">Your Assigned Role</span>
                      <strong className="text-slate-800">{profile.designation}</strong>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-500">Allocated Timeline</span>
                      <strong className="text-slate-800">{project.expected_days} Days</strong>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-555">Baseline Team Capacity</span>
                      <strong className="text-slate-800">{project.available_employees} Engineers</strong>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Required Stack & Competencies</h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {profile.skills.map((skill: string) => (
                      <span key={skill} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 border border-slate-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Phases of timeline */}
              {project.analysis?.timeline_breakdown?.phases && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-[11px]">Sprint Timeline & Deliverables Breakdown</h3>
                  <div className="space-y-3">
                    {project.analysis.timeline_breakdown.phases.map((p: any) => (
                      <div key={p.phase_name} className="border border-slate-200 bg-slate-50/50 rounded-xl p-4 space-y-2.5 hover:bg-slate-105/40 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <h4 className="font-bold text-slate-800 text-xs sm:text-sm">{p.phase_name}</h4>
                          <span className="text-xs font-bold text-[#6366f1] bg-indigo-50 border border-indigo-100 rounded-md px-2 py-0.5">
                            Day {p.start_day} - Day {p.end_day} ({p.duration_days} days)
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{p.description}</p>
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Deliverables:</span>
                          <div className="flex flex-wrap gap-2">
                            {p.key_deliverables?.map((deliv: string) => (
                              <span key={deliv} className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2.5 py-1 text-xs text-slate-600 shadow-sm">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#6366f1]" />
                                <span>{deliv}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROJECT PROGRESS (5-STAGE KANBAN BOARD) */}
          {activeTab === "progress" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900">Sprint Kanban Workflow</h1>
                  <p className="text-xs text-slate-500">Track and update the status of the 5 project execution stages in real-time.</p>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 flex items-center gap-3 shrink-0">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-[#6366f1] uppercase tracking-widest block">Overall Progress</span>
                    <strong className="text-base font-extrabold text-[#6366f1]">{progressPercent}% Completed</strong>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <span className="text-xs font-bold text-slate-500">{completedStagesCount} / 5 Stages Done</span>
                </div>
              </div>

              {/* Kanban Columns Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                {STATUS_OPTIONS.map(colStatus => {
                  // Filter stages with this status
                  const stagesInCol = STAGES_ORDER.filter(s => (stages[s] || "To Do") === colStatus);
                  
                  return (
                    <div 
                      key={colStatus} 
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 min-h-[450px] flex flex-col"
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className={cn(
                          "text-xs font-bold uppercase tracking-wider rounded-md px-2 py-0.5 border",
                          colStatus === "Completed" 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-250" 
                            : colStatus === "Review"
                            ? "bg-orange-50 text-orange-700 border-orange-250"
                            : colStatus === "In Progress"
                            ? "bg-indigo-50 text-[#6366f1] border-indigo-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        )}>
                          {colStatus}
                        </span>
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600">
                          {stagesInCol.length}
                        </span>
                      </div>

                      {/* Column Content - Cards */}
                      <div className="space-y-3 flex-1 flex flex-col justify-start">
                        {stagesInCol.map((s) => (
                          <div 
                            key={s} 
                            className="bg-white border border-slate-200 p-4 space-y-3.5 rounded-2xl shadow-sm hover:border-slate-300 transition-all group"
                          >
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Stage</span>
                              <h4 className="font-bold text-slate-900 text-sm leading-tight">{s}</h4>
                              <p className="text-xs text-slate-500 leading-normal line-clamp-3">
                                {STAGE_DESCRIPTIONS[s]}
                              </p>
                            </div>

                            {/* Dropdown status update controls */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                              <div className="flex items-center justify-between gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Change Status:</label>
                                <select 
                                  value={colStatus}
                                  onChange={(e) => handleStageStatusChange(s, e.target.value)}
                                  className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-md py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-[#6366f1] cursor-pointer"
                                >
                                  {STATUS_OPTIONS.map(opt => (
                                    <option key={opt} value={opt} className="bg-white text-slate-800">{opt}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Manual Arrow Shift Controls */}
                              <div className="grid grid-cols-2 gap-1.5 pt-1">
                                <button
                                  disabled={colStatus === "To Do"}
                                  onClick={() => moveStage(s, "left")}
                                  className="flex items-center justify-center gap-1 rounded-md border border-slate-200 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                  <span>← Move Back</span>
                                </button>
                                <button
                                  disabled={colStatus === "Completed"}
                                  onClick={() => moveStage(s, "right")}
                                  className="flex items-center justify-center gap-1 rounded-md border border-slate-200 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                  <span>Advance →</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {stagesInCol.length === 0 && (
                          <div className="border border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center text-slate-500 flex-1 min-h-[150px]">
                            <span className="text-xs font-bold">No Stages</span>
                            <span className="text-[10px] block mt-0.5">Change stage status to place cards here.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: MY PROFILE */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-8">
              <div className="border-b border-slate-100 pb-4">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">My Professional Profile</h1>
                <p className="text-xs text-slate-500 mt-1">Review your core credentials, designation details, allocation status, and historical projects.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Profile Identity Column */}
                <div className="rounded-2xl border border-slate-200 p-5 text-center space-y-4 bg-slate-50/50 flex flex-col items-center justify-center">
                  <div className={cn("h-20 w-20 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-md", user?.avatar_color || "bg-[#6366f1]")}>
                    {profile.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">{profile.name}</h2>
                    <span className="rounded-full bg-blue-50 border border-blue-200 text-blue-705 px-3 py-0.5 text-xs font-bold inline-block">
                      {profile.designation}
                    </span>
                  </div>
                  <div className="w-full border-t border-slate-200 pt-4 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Employee ID</span>
                      <strong className="text-slate-800">{user?.id}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Experience</span>
                      <strong className="text-slate-800">{profile.experience}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Email Address</span>
                      <strong className="text-slate-800 truncate max-w-[130px]">{user?.email}</strong>
                    </div>
                  </div>
                </div>

                {/* Right Profile Details columns */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Bandwidth / Allocation */}
                  <div className="rounded-2xl border border-slate-200 p-4 space-y-4 bg-slate-50/50">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Resource Allocation Status</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2 bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Load Factor</span>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-black text-slate-900">{profile.workload}%</span>
                          <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-[#6366f1] h-2.5 rounded-full" style={{ width: `${profile.workload}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 bg-white border border-slate-200 p-3 rounded-lg shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Availability band</span>
                        <span className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                          <UserCheck className="h-4 w-4" />
                          <span>{profile.availability}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Skills tags list */}
                  <div className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Core Stack & Skillset Tags</h3>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {profile.skills.map((skill: string) => (
                        <span key={skill} className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 border border-slate-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Previous project contributions */}
                  <div className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Previous Project Contributions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {profile.prev_projects.map((projName: string) => (
                        <div key={projName} className="flex items-center gap-2 border border-slate-200 rounded-xl p-3 bg-white shadow-sm">
                          <BookOpen className="h-4 w-4 text-[#6366f1] shrink-0" />
                          <span className="text-xs font-bold text-slate-700 truncate">{projName}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900">Notifications & Alerts</h1>
                  <p className="text-xs text-slate-500 mt-1">Review historical notifications, task assignments, and direct system updates.</p>
                </div>
                <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-bold text-orange-700 border border-orange-200">
                  {MOCK_NOTIFICATIONS.length} New Alerts
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {MOCK_NOTIFICATIONS.map(n => (
                  <div key={n.id} className="py-4 first:pt-0 last:pb-0 flex gap-3.5 items-start">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border",
                      n.type === "success" 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                        : n.type === "warning"
                        ? "bg-orange-50 border-orange-200 text-orange-700"
                        : "bg-blue-50 border-blue-200 text-blue-700"
                    )}>
                      {n.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : 
                       n.type === "warning" ? <AlertCircle className="h-4 w-4 text-orange-600" /> : <Bell className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm">{n.title}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold">{n.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {n.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default function EmployeeDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#6366f1] border-t-transparent" />
      </div>
    }>
      <EmployeeDashboardContent />
    </Suspense>
  );
}
