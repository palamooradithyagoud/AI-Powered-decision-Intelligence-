"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  fetchEmployeeProfile, 
  fetchEmployeeProject, 
  fetchProjectStages, 
  updateProjectStage,
  fetchEmployees,
  fetchTasks,
  updateTaskStatus,
  EmployeeProfile
} from "@/lib/api";
import { Project, TaskItem, TaskStatus } from "@/types";
import Navbar from "@/components/Navbar";
import { 
  Clock, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  BookOpen,
  Bell,
  Briefcase,
  Users,
  ChevronDown,
  Sparkles,
  Layers,
  CheckCheck,
  Zap,
  Tag,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const { user, loginAsEmployee } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams ? searchParams.get("tab") : "home";

  const [empNum, setEmpNum] = useState<number | null>(null);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [stages, setStages] = useState<Record<string, string>>({});
  const [allEmployees, setAllEmployees] = useState<EmployeeProfile[]>([]);
  const [myTasks, setMyTasks] = useState<TaskItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // Load list of all employees for quick switching
  useEffect(() => {
    async function loadEmpList() {
      try {
        const list = await fetchEmployees();
        setAllEmployees(list);
      } catch (err) {
        console.error("Failed to load employee list:", err);
      }
    }
    loadEmpList();
  }, []);

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
      // Default fallback to emp_03 (Rahul Kumar)
      setEmpNum(3);
    } else {
      // Redirect if not authenticated
      router.push("/login");
    }
  }, [user]);




  // Load all dashboard data
  const loadDashboardData = async () => {
    if (empNum === null) return;
    setLoading(true);
    setError(null);
    try {
      const empIdStr = `emp_${String(empNum).padStart(2, '0')}`;
      const [profData, projData, taskList] = await Promise.all([
        fetchEmployeeProfile(empNum),
        fetchEmployeeProject(empNum),
        fetchTasks({ assigned_emp_id: empIdStr }).catch(() => [])
      ]);
      setProfile(profData);
      setProject(projData);
      setMyTasks(taskList);
      
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

  // Handle task status update directly from employee workbench
  const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      setMyTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      alert("Failed to update task status");
    }
  };

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

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-4 shadow-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Workspace Unavailable</h2>
          <p className="text-sm text-slate-500">
            {error || "Could not retrieve employee details."}
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
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md shadow-xs">
                {profile.id || `emp_${empNum}`}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {profile.name}
              </h1>
              <span className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                {profile.designation}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Corporate ID: <strong className="text-slate-700">{profile.id || `emp_${empNum}`}</strong> • Experience: <strong className="text-slate-700">{profile.experience}</strong> • Status: <strong className="text-slate-700">{profile.availability}</strong>
            </p>
          </div>

          {/* Quick Switch Employee Selector (1-40) */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm shrink-0">
            <Users className="w-4 h-4 text-indigo-600 ml-2" />
            <label className="text-[11px] font-bold text-slate-600 hidden sm:inline">
              Switch Employee:
            </label>
            <select
              value={profile.id || `emp_${String(empNum).padStart(2, '0')}`}
              onChange={(e) => {
                const targetEmp = allEmployees.find(emp => emp.id === e.target.value);
                if (targetEmp) {
                  loginAsEmployee(targetEmp);
                }
              }}
              className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {allEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.id}: {emp.name} ({emp.designation})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content area */}
        <div className="space-y-8">
          
          {/* SECTION 1: HOME PORTAL */}
          {(
            <div className="space-y-6">
              {/* Grid Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Project Overview Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assigned Project</span>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {project?.name || "No Active Project"}
                    </h3>
                  </div>
                  {project ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-[#6366f1]">
                      <span>View Specifications Below</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Awaiting project assignment</span>
                  )}
                </div>

                {/* Timeline Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Project Deadline</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-3xl font-black text-slate-900">{project?.expected_days || 0}</span>
                      <span className="text-sm font-semibold text-slate-500">Days</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span>{project ? "Estimated delivery day buffer included" : "No active sprint deadline"}</span>
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

              {/* MY ASSIGNED SPRINT DELIVERABLES SECTION */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-[#6366f1]">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        My Assigned Sprint Deliverables ({myTasks.length})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Deliverables distributed to you via AI multi-factor competence & bandwidth matching.
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-[#6366f1] flex items-center gap-1">
                    <span>All Tasks Below</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>

                {myTasks.length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2 bg-slate-50/50">
                    <CheckCircle2 className="h-8 w-8 text-slate-400 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800">No Deliverables Assigned Yet</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Once the Project Lead accepts the project blueprint and runs AI Work Allocation, tasks matched to your skill profile ({profile.designation}) will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myTasks.map((task) => {
                      const matchScore = task.match_score || 94;
                      return (
                        <div
                          key={task.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm hover:border-indigo-200 transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <span className="rounded-md bg-indigo-50 border border-indigo-100 text-[#4f46e5] px-2 py-0.5 text-[10px] font-bold">
                                  {task.phase_name}
                                </span>
                                <h4 className="text-sm font-bold text-slate-900 mt-1">{task.title}</h4>
                              </div>
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-extrabold shrink-0">
                                <Sparkles className="h-3 w-3 text-emerald-600" />
                                <span>{matchScore}% Match</span>
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>

                            {task.ai_rationale && (
                              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-[11px] text-slate-600 leading-normal">
                                <strong className="text-indigo-700 font-bold block mb-0.5">AI Matching Reason:</strong>
                                <span>{task.ai_rationale}</span>
                              </div>
                            )}
                          </div>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                                    task.priority === "High"
                                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                                      : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  )}
                                >
                                  {task.priority}
                                </span>
                                <span className="text-slate-400 font-medium">Due Day {task.due_day}</span>
                              </div>

                              <select
                                value={task.status}
                                onChange={(e) => handleTaskStatusChange(task.id, e.target.value as TaskStatus)}
                                className={cn(
                                  "rounded-xl px-2.5 py-1 text-xs font-bold focus:outline-none border cursor-pointer shadow-xs",
                                  task.status === "Completed"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                    : task.status === "In Progress"
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-300"
                                    : "bg-slate-50 text-slate-700 border-slate-300"
                                )}
                              >
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                    <h3 className="text-sm font-bold text-slate-900">System Activity</h3>
                    <Bell className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="py-2 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span>All project channels are up to date.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: MY ASSIGNED DELIVERABLES */}
          {(
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                    My Assigned Sprint Deliverables ({myTasks.length})
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Direct AI assignments matched to your skillset ({profile.designation}) with live progress controls.
                  </p>
                </div>
                <button
                  onClick={loadDashboardData}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors self-start sm:self-auto shadow-xs cursor-pointer"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                  <span>Refresh Tasks</span>
                </button>
              </div>

              {myTasks.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-3xl p-16 text-center space-y-3 bg-slate-50/50">
                  <CheckCircle2 className="h-10 w-10 text-slate-400 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">No Deliverables Assigned</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    There are currently no active tasks assigned to your employee ID. Once the Lead dispatches project deliverables, they will be listed here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myTasks.map((task) => {
                    const matchScore = task.match_score || 94;
                    return (
                      <div
                        key={task.id}
                        className="rounded-2xl border border-slate-200 p-5 space-y-4 bg-white hover:border-indigo-300 transition-all shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-indigo-50 border border-indigo-100 text-[#4f46e5] px-2.5 py-0.5 text-[10px] font-bold">
                                {task.phase_name}
                              </span>
                              <span className="text-xs font-semibold text-slate-400">
                                {task.project_name}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mt-1">{task.title}</h3>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-black shadow-xs">
                              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                              <span>{matchScore}% Match</span>
                            </span>

                            <select
                              value={task.status}
                              onChange={(e) => handleTaskStatusChange(task.id, e.target.value as TaskStatus)}
                              className={cn(
                                "rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none border cursor-pointer shadow-xs",
                                task.status === "Completed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : task.status === "In Progress"
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-300"
                                  : "bg-white text-slate-700 border-slate-300"
                              )}
                            >
                              <option value="To Do">To Do</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {task.description}
                        </p>

                        {task.ai_rationale && (
                          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-700 space-y-0.5">
                            <strong className="text-indigo-700 font-bold block text-[11px] uppercase tracking-wider">
                              AI Allocation Rationale:
                            </strong>
                            <p className="text-[11px] text-slate-600 leading-relaxed">{task.ai_rationale}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                          <span>Priority: <strong className="text-slate-800">{task.priority}</strong></span>
                          <span>Due Day: <strong className="text-slate-800">Day {task.due_day}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: ASSIGNED PROJECT SPECIFICATIONS */}
          {(
            project ? (
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
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 shadow-sm text-center space-y-4">
                <Briefcase className="h-12 w-12 text-[#6366f1] mx-auto opacity-70" />
                <h2 className="text-xl font-bold text-slate-900">No Project Assigned Yet</h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  You are currently on standby with {profile.availability}. Once a project blueprint is created and assigned to you, its scope, technical stack, and deliverables will appear here.
                </p>
              </div>
            )
          )}

          {/* SECTION 3: PROJECT PROGRESS (5-STAGE KANBAN BOARD) */}
          {(
            project ? (
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
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 shadow-sm text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-[#6366f1] mx-auto opacity-70" />
                <h2 className="text-xl font-bold text-slate-900">No Active Sprint Workflow</h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Once a project is assigned to you, the 5-phase Kanban stage workflow will appear here for updating progress.
                </p>
              </div>
            )
          )}

          {/* SECTION 4: MY PROFILE */}
          {(
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
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Previous Project Portfolio & Deliverables</h3>
                    {profile.prev_projects && profile.prev_projects.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {profile.prev_projects.map((projName: string) => (
                          <div key={projName} className="flex items-center gap-2.5 border border-slate-200 rounded-xl p-3 bg-white shadow-sm hover:border-indigo-200 transition-colors">
                            <BookOpen className="h-4 w-4 text-[#6366f1] shrink-0" />
                            <span className="text-xs font-bold text-slate-800 truncate">{projName}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 bg-white">
                        No previous projects logged in corporate records.
                      </div>
                    )}
                  </div>


                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: NOTIFICATIONS */}
          {(
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900">Notifications & Alerts</h1>
                  <p className="text-xs text-slate-500 mt-1">Review historical notifications, task assignments, and direct system updates.</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  0 New Alerts
                </span>
              </div>

              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">All Caught Up</h3>
                  <p className="text-xs text-slate-500 max-w-sm">You have no pending alerts or milestone changes at this moment.</p>
                </div>
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
