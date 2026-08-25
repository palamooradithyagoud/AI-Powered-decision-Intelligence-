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
  claimTask,
  fetchProjects,
  fetchActivities,
  EmployeeProfile
} from "@/lib/api";
import { Project, TaskItem, TaskStatus, ActivityLog } from "@/types";
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
  RefreshCw,
  Home,
  FolderKanban,
  User as UserIcon,
  X,
  Check,
  Search,
  Filter,
  HandMetal,
  PlusCircle,
  TrendingUp,
  ShieldCheck,
  Activity
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

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
  const activeTab = tabParam || "home";

  const setTab = (tab: string) => {
    router.push(`/employee?tab=${tab}`);
  };

  const [empNum, setEmpNum] = useState<number | null>(null);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<Record<string, string>>({});
  const [allEmployees, setAllEmployees] = useState<EmployeeProfile[]>([]);
  const [myTasks, setMyTasks] = useState<TaskItem[]>([]);
  const [teamTasks, setTeamTasks] = useState<TaskItem[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  
  // Kanban & Filter state
  const [kanbanMode, setKanbanMode] = useState<"my_tasks" | "team_catalog" | "stages">("my_tasks");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>("ALL");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>("ALL");
  const [taskSearchQuery, setTaskSearchQuery] = useState<string>("");
  const [syncToast, setSyncToast] = useState<{ message: string; taskId?: string } | null>(null);
  const [isClaimingId, setIsClaimingId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtered personal tasks
  const filteredMyTasks = myTasks.filter((t) => {
    const matchesProj = selectedProjectFilter === "ALL" || t.project_id === selectedProjectFilter;
    const matchesPriority = selectedPriorityFilter === "ALL" || t.priority === selectedPriorityFilter;
    const matchesSearch = !taskSearchQuery.trim() || 
      t.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
      t.phase_name.toLowerCase().includes(taskSearchQuery.toLowerCase());
    return matchesProj && matchesPriority && matchesSearch;
  });

  // Task breakdown metrics for assigned employee
  const myTodoTasks = filteredMyTasks.filter((t) => t.status === "To Do");
  const myInProgressTasks = filteredMyTasks.filter((t) => t.status === "In Progress");
  const myCompletedTasks = filteredMyTasks.filter((t) => t.status === "Completed");
  const myTaskCompletionRate = myTasks.length > 0 ? Math.round((myTasks.filter(t => t.status === "Completed").length / myTasks.length) * 100) : 0;

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
      router.push("/login");
    }
  }, [user]);

  // Load all dashboard data
  const loadDashboardData = async () => {
    if (empNum === null) return;
    try {
      const empIdStr = `emp_${String(empNum).padStart(2, '0')}`;
      const [profData, projData, taskList, projList, actList] = await Promise.all([
        fetchEmployeeProfile(empNum),
        fetchEmployeeProject(empNum),
        fetchTasks({ assigned_emp_id: empIdStr }).catch(() => []),
        fetchProjects().catch(() => []),
        fetchActivities({ limit: 20 }).catch(() => [])
      ]);
      setProfile(profData);
      setProject(projData);
      setMyTasks(taskList);
      setAllProjects(projList);
      setActivities(actList);
      
      if (projData && projData.id) {
        const [stageData, allProjTasks] = await Promise.all([
          fetchProjectStages(projData.id),
          fetchTasks({ project_id: projData.id }).catch(() => [])
        ]);
        setStages(stageData);
        setTeamTasks(allProjTasks);
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
    // Auto-sync polling every 5 seconds so updates propagate seamlessly
    const interval = setInterval(() => {
      loadDashboardData();
    }, 5000);
    return () => clearInterval(interval);
  }, [empNum]);

  // Handle task status update directly from employee workbench
  const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      setMyTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      setTeamTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      const isDone = newStatus === "Completed";
      setSyncToast({
        message: isDone
          ? `🎉 Task marked COMPLETED! Real-time status and sprint metrics updated on Project Lead (Ishita Rao) & Manager (Arjun Reddy) dashboards.`
          : `✓ Task moved to "${newStatus}". Real-time status synced with Project Lead & Manager.`,
        taskId
      });
      setTimeout(() => setSyncToast(null), 5000);
    } catch (err) {
      alert("Failed to update task status");
    }
  };

  // Handle self-claiming deliverable
  const handleClaimTask = async (task: TaskItem) => {
    if (!profile) return;
    setIsClaimingId(task.id);
    try {
      const updated = await claimTask(task.id, profile.id, profile.name);
      setMyTasks((prev) => [updated, ...prev.filter(t => t.id !== task.id)]);
      setTeamTasks((prev) => prev.map(t => t.id === task.id ? updated : t));
      setSyncToast({
        message: `📌 You claimed deliverable "${task.title}". Added to your personal Kanban board and synced with Project Lead!`,
        taskId: task.id
      });
      setTimeout(() => setSyncToast(null), 5000);
    } catch (err: any) {
      alert(err.message || "Failed to claim task");
    } finally {
      setIsClaimingId(null);
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
      setSyncToast({
        message: `✓ Stage "${stageName}" updated to "${newStatus}". Synced with Lead dashboard.`,
      });
      setTimeout(() => setSyncToast(null), 3500);
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
          <span className="text-sm font-semibold text-slate-500">Loading your personal portal...</span>
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
            className="w-full rounded-xl bg-[#6366f1] py-2.5 text-sm font-semibold text-white hover:bg-[#4f46e5] transition-all cursor-pointer"
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
              Switch User:
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

        {/* Real-time Multi-Role Synchronization Beacon Ribbon */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-3.5 px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-indigo-800/40">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <div className="text-xs">
              <span className="font-bold text-emerald-400">Live Multi-Role Synchronization Active:</span>{" "}
              <span className="text-slate-300">
                When you start or finish deliverables, progress & completion metrics instantly broadcast to the <strong>Project Lead</strong> and <strong>Project Manager</strong>.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium shrink-0 bg-white/10 px-3 py-1 rounded-xl">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Synced with DB</span>
          </div>
        </div>

        {/* Workspace Tab Switcher Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "home", label: "Home Overview", icon: Home, count: myTasks.length > 0 ? myTasks.length : null },
            { id: "project", label: "Assigned Project", icon: Briefcase, count: project ? "Active" : null },
            { id: "progress", label: "Personal Kanban", icon: FolderKanban, count: `${myCompletedTasks.length}/${filteredMyTasks.length}` },
            { id: "notifications", label: "Live Activity & Alerts", icon: Bell, count: activities.length > 0 ? activities.length : null },
            { id: "profile", label: "My Profile", icon: UserIcon, count: null },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id || (tab.id === "progress" && activeTab === "kanban");
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer",
                  isCurrent
                    ? "bg-indigo-600 text-white shadow-indigo-600/20 shadow-md ring-2 ring-indigo-600/20 font-extrabold"
                    : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200"
                )}
              >
                <Icon className={cn("h-4 w-4", isCurrent ? "text-white" : "text-slate-400")} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-extrabold ml-0.5",
                      isCurrent
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <div className="space-y-8">
          
          {/* SECTION 1: HOME PORTAL */}
          {activeTab === "home" && (
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
                    <button
                      onClick={() => setTab("project")}
                      className="flex items-center gap-1 text-xs font-bold text-[#6366f1] hover:text-[#4f46e5] text-left cursor-pointer transition-colors"
                    >
                      <span>View Specifications</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
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
                        Deliverables distributed to you based on your skill profile ({profile.designation}).
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setTab("progress")}
                    className="text-xs font-bold text-[#6366f1] hover:text-[#4f46e5] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Open in Kanban</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {myTasks.length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2 bg-slate-50/50">
                    <CheckCircle2 className="h-8 w-8 text-slate-400 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800">No Deliverables Assigned Yet</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Deliverables matched to your skill profile ({profile.designation}) will appear here automatically. You can also explore and claim tasks from the Kanban tab.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myTasks.map((task) => {
                      const matchScore = task.match_score || 94;
                      const isCompleted = task.status === "Completed";
                      const isInProgress = task.status === "In Progress";
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "rounded-2xl border p-4 space-y-3 shadow-sm transition-all flex flex-col justify-between",
                            isCompleted
                              ? "border-emerald-300 bg-emerald-50/20"
                              : isInProgress
                              ? "border-indigo-300 bg-indigo-50/20"
                              : "border-slate-200 bg-white hover:border-indigo-200"
                          )}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <span className="rounded-md bg-indigo-50 border border-indigo-100 text-[#4f46e5] px-2 py-0.5 text-[10px] font-bold">
                                  {task.phase_name}
                                </span>
                                <h4 className={cn("text-sm font-bold mt-1", isCompleted ? "line-through text-slate-500" : "text-slate-900")}>
                                  {task.title}
                                </h4>
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

                          <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                            <div className="flex items-center justify-between">
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

                            {/* One-click Action Buttons */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              {task.status === "To Do" && (
                                <button
                                  onClick={() => handleTaskStatusChange(task.id, "In Progress")}
                                  className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 text-xs font-bold shadow-xs transition-all cursor-pointer"
                                >
                                  <Zap className="h-3.5 w-3.5" />
                                  <span>Start Work ⚡</span>
                                </button>
                              )}
                              {task.status === "In Progress" && (
                                <button
                                  onClick={() => handleTaskStatusChange(task.id, "Completed")}
                                  className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white py-1.5 text-xs font-bold shadow-xs transition-all cursor-pointer"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Mark Completed & Sync Lead/Manager ✅</span>
                                </button>
                              )}
                              {task.status === "Completed" && (
                                <button
                                  onClick={() => handleTaskStatusChange(task.id, "In Progress")}
                                  className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 text-xs font-bold transition-all cursor-pointer"
                                >
                                  <RefreshCw className="h-3 w-3 text-slate-500" />
                                  <span>Reopen Task ↺</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2: ASSIGNED PROJECT SPECIFICATIONS */}
          {activeTab === "project" && (
            project ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900">Assigned Project Specifications</h1>
                  <p className="text-xs text-slate-500 mt-1">Review parameters, technical stack, and architecture of your active project assignment.</p>
                </div>

                {/* Title & Priority Badge */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-[#6366f1] uppercase tracking-widest block">Project ID: {project.id.slice(0, 8)}</span>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">{project.name}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Status:</span>
                    <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-0.5 text-xs font-bold">
                      {project.status}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider text-[11px]">Description & Goal</h3>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                    {project.description}
                  </p>
                </div>

                {/* Roles and Timelines Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Execution Scope</h3>
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
                        <span className="text-slate-500">Assigned Project Lead</span>
                        <strong className="text-slate-800">{project.lead_assigned || "Ishita Rao"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Required Stack & Skills</h3>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {profile.skills.map((skill: string) => (
                        <span key={skill} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 border border-slate-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 shadow-sm text-center space-y-4">
                <Briefcase className="h-12 w-12 text-[#6366f1] mx-auto opacity-70" />
                <h2 className="text-xl font-bold text-slate-900">No Project Assigned Yet</h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  You are currently on standby with {profile.availability}. Once a project is assigned to you, its scope and deliverables will appear here.
                </p>
              </div>
            )
          )}

          {/* SECTION 3: PERSONAL KANBAN SYSTEM (EVERY USER HAS A PERSONALIZED BOARD) */}
          {(activeTab === "progress" || activeTab === "kanban") && (
            <div className="space-y-6">
              
              {/* Header & Metrics Banner */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Personalized Workspace
                      </span>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {profile.name}&apos;s Kanban System
                      </h1>
                    </div>
                    <p className="text-xs text-slate-500">
                      Deliverables tailored to your role (<strong>{profile.designation}</strong>). When you mark work complete, updates automatically notify <strong>Project Lead (Ishita Rao)</strong> and <strong>Manager (Arjun Reddy)</strong>.
                    </p>
                  </div>

                  {/* Mode Toggle Buttons */}
                  <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 shrink-0 self-start lg:self-auto">
                    <button
                      onClick={() => setKanbanMode("my_tasks")}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer",
                        kanbanMode === "my_tasks"
                          ? "bg-white text-indigo-700 shadow-sm font-black"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
                      <span>My Assigned Tasks ({myTasks.length})</span>
                    </button>
                    <button
                      onClick={() => setKanbanMode("team_catalog")}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer",
                        kanbanMode === "team_catalog"
                          ? "bg-white text-indigo-700 shadow-sm font-black"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      <Users className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Team Catalog & Claim ({teamTasks.length})</span>
                    </button>
                    <button
                      onClick={() => setKanbanMode("stages")}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer",
                        kanbanMode === "stages"
                          ? "bg-white text-indigo-700 shadow-sm font-black"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      <Layers className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Milestones (5)</span>
                    </button>
                  </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                    {/* Project Filter */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700">
                      <Briefcase className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <select
                        value={selectedProjectFilter}
                        onChange={(e) => setSelectedProjectFilter(e.target.value)}
                        className="bg-transparent focus:outline-none cursor-pointer font-bold text-slate-800"
                      >
                        <option value="ALL">All Assigned Projects</option>
                        {allProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Priority Filter */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700">
                      <Filter className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <select
                        value={selectedPriorityFilter}
                        onChange={(e) => setSelectedPriorityFilter(e.target.value)}
                        className="bg-transparent focus:outline-none cursor-pointer font-bold text-slate-800"
                      >
                        <option value="ALL">All Priorities</option>
                        <option value="High">High Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="Low">Low Priority</option>
                      </select>
                    </div>

                    {/* Search Bar */}
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search deliverables..."
                        value={taskSearchQuery}
                        onChange={(e) => setTaskSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <span className="text-xs text-slate-500 font-medium">
                    Showing <strong className="text-slate-800">{filteredMyTasks.length}</strong> deliverables
                  </span>
                </div>

                {/* Progress & Stat Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Deliverables</span>
                    <div className="text-xl font-black text-slate-900">{filteredMyTasks.length}</div>
                    <span className="text-[10px] text-slate-500 block">Personal Workload</span>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">To Do</span>
                    <div className="text-xl font-black text-amber-900">{myTodoTasks.length}</div>
                    <span className="text-[10px] text-amber-700 block">Pending kickoff</span>
                  </div>

                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-[#6366f1] uppercase tracking-wider block">In Progress</span>
                    <div className="text-xl font-black text-indigo-900">{myInProgressTasks.length}</div>
                    <span className="text-[10px] text-indigo-600 block">Active execution</span>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Completed</span>
                    <div className="text-xl font-black text-emerald-900">{myCompletedTasks.length}</div>
                    <span className="text-[10px] text-emerald-700 font-bold block">{myTaskCompletionRate}% Complete</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Personal Deliverable Completion Rate:</span>
                    <strong className="text-indigo-600 font-black">{myTaskCompletionRate}% ({myCompletedTasks.length} of {myTasks.length} Done)</strong>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#6366f1] via-indigo-600 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${myTaskCompletionRate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* MODE 1: MY ASSIGNED TASKS KANBAN BOARD */}
              {kanbanMode === "my_tasks" && (
                <div>
                  {filteredMyTasks.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center space-y-3 shadow-sm">
                      <CheckCircle2 className="h-12 w-12 text-slate-400 mx-auto" />
                      <h3 className="text-base font-bold text-slate-800">No Matching Deliverables Found</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        You can claim open deliverables from the <strong>Team Catalog & Claim</strong> tab or switch to another user profile.
                      </p>
                      <button
                        onClick={() => setKanbanMode("team_catalog")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer shadow-sm"
                      >
                        <HandMetal className="h-4 w-4" />
                        <span>Explore Open Team Deliverables</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                      
                      {/* COLUMN 1: TO DO */}
                      <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-4 sm:p-5 space-y-4 min-h-[500px] flex flex-col shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-sm" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">To Do</h3>
                          </div>
                          <span className="rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 text-xs font-bold">
                            {myTodoTasks.length}
                          </span>
                        </div>

                        <div className="space-y-3.5 flex-1 flex flex-col justify-start">
                          {myTodoTasks.map((task) => {
                            const match = task.match_score || 94;
                            return (
                              <div
                                key={task.id}
                                className="bg-white border border-slate-200 p-4 space-y-3 rounded-2xl shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="rounded-md bg-indigo-50 border border-indigo-100 text-[#4f46e5] px-2 py-0.5 text-[10px] font-bold">
                                      {task.phase_name}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold shrink-0">
                                      <Sparkles className="h-3 w-3 text-emerald-600" />
                                      {match}% Match
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">{task.title}</h4>
                                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                    {task.description}
                                  </p>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                                  <span className={cn(
                                    "rounded px-2 py-0.5 text-[9px] font-bold uppercase",
                                    task.priority === "High" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  )}>
                                    {task.priority}
                                  </span>
                                  <span>Due Day {task.due_day}</span>
                                </div>

                                {/* Fast Transition Buttons */}
                                <div className="pt-2 border-t border-slate-100 space-y-2">
                                  <button
                                    onClick={() => handleTaskStatusChange(task.id, "In Progress")}
                                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 text-xs font-bold shadow-xs transition-all cursor-pointer"
                                  >
                                    <Zap className="h-3.5 w-3.5" />
                                    <span>Start Work ⚡</span>
                                  </button>
                                  <button
                                    onClick={() => handleTaskStatusChange(task.id, "Completed")}
                                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 py-1.5 text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                    <span>Quick Mark Done ✓</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {myTodoTasks.length === 0 && (
                            <div className="border border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-slate-400 flex-1 min-h-[160px]">
                              <CheckCircle2 className="h-7 w-7 text-slate-300 mb-1" />
                              <span className="text-xs font-bold text-slate-600">No Tasks in To Do</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">All tasks are underway or completed!</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* COLUMN 2: IN PROGRESS */}
                      <div className="bg-indigo-50/40 border border-indigo-200 rounded-3xl p-4 sm:p-5 space-y-4 min-h-[500px] flex flex-col shadow-xs">
                        <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#6366f1] shadow-sm animate-ping" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">In Progress</h3>
                          </div>
                          <span className="rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300 px-2.5 py-0.5 text-xs font-bold">
                            {myInProgressTasks.length}
                          </span>
                        </div>

                        <div className="space-y-3.5 flex-1 flex flex-col justify-start">
                          {myInProgressTasks.map((task) => {
                            const match = task.match_score || 94;
                            return (
                              <div
                                key={task.id}
                                className="bg-white border-2 border-indigo-200/90 p-4 space-y-3 rounded-2xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all group"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="rounded-md bg-indigo-50 border border-indigo-100 text-[#4f46e5] px-2 py-0.5 text-[10px] font-bold">
                                      {task.phase_name}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold shrink-0">
                                      <Sparkles className="h-3 w-3 text-emerald-600" />
                                      {match}%
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">{task.title}</h4>
                                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                    {task.description}
                                  </p>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                                  <span className={cn(
                                    "rounded px-2 py-0.5 text-[9px] font-bold uppercase",
                                    task.priority === "High" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  )}>
                                    {task.priority}
                                  </span>
                                  <span>Due Day {task.due_day}</span>
                                </div>

                                {/* Fast Transition Buttons */}
                                <div className="pt-2 border-t border-slate-100 space-y-2">
                                  <button
                                    onClick={() => handleTaskStatusChange(task.id, "Completed")}
                                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2 text-xs font-black shadow-sm transition-all cursor-pointer hover:scale-[1.01]"
                                  >
                                    <Check className="h-4 w-4" />
                                    <span>Complete Deliverable & Sync Dashboards ✅</span>
                                  </button>
                                  <button
                                    onClick={() => handleTaskStatusChange(task.id, "To Do")}
                                    className="w-full flex items-center justify-center gap-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-1.5 text-[11px] font-semibold transition-all cursor-pointer"
                                  >
                                    <span>← Move Back to To Do</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {myInProgressTasks.length === 0 && (
                            <div className="border border-dashed border-indigo-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-slate-400 flex-1 min-h-[160px]">
                              <Zap className="h-7 w-7 text-indigo-300 mb-1" />
                              <span className="text-xs font-bold text-indigo-900">No Active Tasks</span>
                              <span className="text-[10px] text-slate-500 mt-0.5">Click &apos;Start Work&apos; on any To Do task to begin execution.</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* COLUMN 3: COMPLETED */}
                      <div className="bg-emerald-50/40 border border-emerald-200 rounded-3xl p-4 sm:p-5 space-y-4 min-h-[500px] flex flex-col shadow-xs">
                        <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 shadow-sm" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">Completed</h3>
                          </div>
                          <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold">
                            {myCompletedTasks.length}
                          </span>
                        </div>

                        <div className="space-y-3.5 flex-1 flex flex-col justify-start">
                          {myCompletedTasks.map((task) => {
                            return (
                              <div
                                key={task.id}
                                className="bg-white border-2 border-emerald-300/80 p-4 space-y-3 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">
                                      {task.phase_name}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-black shrink-0">
                                      ✓ DONE
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-through text-slate-600">{task.title}</h4>
                                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                                    {task.description}
                                  </p>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-emerald-700 pt-1 border-t border-slate-100">
                                  <span className="font-semibold">Synced with Lead & Manager</span>
                                  <span>Day {task.due_day}</span>
                                </div>

                                {/* Reopen button */}
                                <div className="pt-2 border-t border-slate-100">
                                  <button
                                    onClick={() => handleTaskStatusChange(task.id, "In Progress")}
                                    className="w-full flex items-center justify-center gap-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-1.5 text-[11px] font-semibold transition-all cursor-pointer"
                                  >
                                    <RefreshCw className="h-3 w-3 text-slate-500" />
                                    <span>Reopen Task / Resume Work</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {myCompletedTasks.length === 0 && (
                            <div className="border border-dashed border-emerald-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-slate-400 flex-1 min-h-[160px]">
                              <CheckCircle2 className="h-7 w-7 text-emerald-300 mb-1" />
                              <span className="text-xs font-bold text-emerald-900">No Completed Tasks Yet</span>
                              <span className="text-[10px] text-slate-500 mt-0.5">Finish in-progress tasks to log your deliverables.</span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: TEAM DELIVERABLES & TASK CLAIMING */}
              {kanbanMode === "team_catalog" && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-sm">
                  <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        All Project Deliverables Catalog ({teamTasks.length})
                      </h3>
                      <p className="text-xs text-slate-500">
                        View team deliverables and claim unassigned tasks to add them to your personal Kanban board.
                      </p>
                    </div>
                    <span className="text-xs font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-xl self-start sm:self-auto">
                      Active Project: {project?.name || "None"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teamTasks.map((task) => {
                      const isAssignedToMe = task.assigned_emp_id === profile.id || task.assigned_to.toLowerCase().includes(profile.name.toLowerCase());
                      const isClaiming = isClaimingId === task.id;
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "rounded-2xl border p-4 space-y-3 shadow-xs flex flex-col justify-between transition-all",
                            isAssignedToMe ? "border-indigo-300 bg-indigo-50/20" : "border-slate-200 bg-white"
                          )}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <span className="rounded-md bg-indigo-50 border border-indigo-100 text-[#4f46e5] px-2 py-0.5 text-[10px] font-bold">
                                {task.phase_name}
                              </span>
                              <span className={cn(
                                "rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                                task.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                task.status === "In Progress" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                                "bg-amber-50 text-amber-700 border-amber-200"
                              )}>
                                {task.status}
                              </span>
                            </div>

                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{task.title}</h4>
                            <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Assignee</span>
                              <strong className={cn("text-xs", isAssignedToMe ? "text-indigo-700 font-extrabold" : "text-slate-800")}>
                                {task.assigned_to} ({task.assigned_role})
                              </strong>
                            </div>

                            {isAssignedToMe ? (
                              <span className="rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-[11px] font-bold">
                                Assigned to You ✓
                              </span>
                            ) : (
                              <button
                                disabled={isClaiming}
                                onClick={() => handleClaimTask(task)}
                                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                              >
                                <HandMetal className="h-3.5 w-3.5" />
                                <span>{isClaiming ? "Claiming..." : "Claim Task 📌"}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MODE 3: 5-STAGE PROJECT MILESTONES BOARD */}
              {kanbanMode === "stages" && (
                <div>
                  {project ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                      {STATUS_OPTIONS.map((colStatus) => {
                        const stagesInCol = STAGES_ORDER.filter(s => (stages[s] || "To Do") === colStatus);
                        return (
                          <div 
                            key={colStatus} 
                            className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-4 min-h-[450px] flex flex-col shadow-xs"
                          >
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                              <span className={cn(
                                "text-xs font-bold uppercase tracking-wider rounded-md px-2 py-0.5 border",
                                colStatus === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : colStatus === "Review" ? "bg-orange-50 text-orange-700 border-orange-200" : colStatus === "In Progress" ? "bg-indigo-50 text-[#6366f1] border-indigo-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                              )}>
                                {colStatus}
                              </span>
                              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600">
                                {stagesInCol.length}
                              </span>
                            </div>

                            <div className="space-y-3 flex-1 flex flex-col justify-start">
                              {stagesInCol.map((s) => (
                                <div 
                                  key={s} 
                                  className="bg-white border border-slate-200 p-4 space-y-3.5 rounded-2xl shadow-sm hover:border-slate-300 transition-all"
                                >
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Project Stage</span>
                                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{s}</h4>
                                    <p className="text-xs text-slate-500 leading-normal line-clamp-3">
                                      {STAGE_DESCRIPTIONS[s]}
                                    </p>
                                  </div>

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

                                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                                      <button
                                        disabled={colStatus === "To Do"}
                                        onClick={() => moveStage(s, "left")}
                                        className="flex items-center justify-center gap-1 rounded-md border border-slate-200 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                                      >
                                        <span>← Move Back</span>
                                      </button>
                                      <button
                                        disabled={colStatus === "Completed"}
                                        onClick={() => moveStage(s, "right")}
                                        className="flex items-center justify-center gap-1 rounded-md border border-slate-200 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
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
                  ) : (
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-12 shadow-sm text-center space-y-4">
                      <CheckCircle2 className="h-12 w-12 text-[#6366f1] mx-auto opacity-70" />
                      <h2 className="text-xl font-bold text-slate-900">No Active Project Stages</h2>
                      <p className="text-sm text-slate-500 max-w-md mx-auto">
                        Once a project is assigned to you, the 5-phase Kanban stage workflow will appear here.
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* SECTION 4: MY PROFILE */}
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
                    <span className="rounded-full bg-blue-50 border border-blue-200 text-blue-700 px-3 py-0.5 text-xs font-bold inline-block">
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
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Previous Project Portfolio</h3>
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

          {/* SECTION 5: LIVE NOTIFICATIONS & ACTIVITY AUDIT STREAM */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900">Live Multi-Role Notifications & Audit Stream</h1>
                  <p className="text-xs text-slate-500 mt-1">Real-time log of deliverable completions, claims, and sprint state changes.</p>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">
                  {activities.length} Events Synced
                </span>
              </div>

              {activities.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">All Caught Up</h3>
                    <p className="text-xs text-slate-500 max-w-sm">No recent activity events yet. When team members finish work, updates appear here.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((act) => {
                    const isCompleted = act.event_type === "task_completed";
                    const isClaimed = act.event_type === "task_claimed";
                    const isStarted = act.event_type === "task_started";
                    return (
                      <div
                        key={act.id}
                        className={cn(
                          "rounded-2xl border p-4 flex items-start justify-between gap-4 transition-all shadow-xs",
                          isCompleted ? "border-emerald-200 bg-emerald-50/30" :
                          isStarted ? "border-indigo-200 bg-indigo-50/30" :
                          isClaimed ? "border-purple-200 bg-purple-50/30" :
                          "border-slate-200 bg-slate-50/50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold shadow-xs",
                            isCompleted ? "bg-emerald-500 text-white" :
                            isStarted ? "bg-indigo-600 text-white" :
                            isClaimed ? "bg-purple-600 text-white" :
                            "bg-slate-700 text-white"
                          )}>
                            {isCompleted ? "✓" : isStarted ? "⚡" : isClaimed ? "📌" : "ℹ"}
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">{act.message}</h4>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              <span className="font-semibold text-slate-700">Project: {act.project_name}</span>
                              {act.employee_name && (
                                <span>• By <strong className="text-slate-800">{act.employee_name}</strong> ({act.employee_role})</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-semibold text-slate-400 shrink-0 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-2xs">
                          {act.timestamp ? formatDate(act.timestamp) : "Recently"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Real-time Sync Toast Notification */}
        {syncToast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-slate-900 text-white px-5 py-3.5 shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5 duration-300 max-w-md">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500 text-white font-bold shrink-0 text-xs">
              ✓
            </div>
            <div className="text-xs font-medium pr-2">
              {syncToast.message}
            </div>
            <button
              onClick={() => setSyncToast(null)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

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
