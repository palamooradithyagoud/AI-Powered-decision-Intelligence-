"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import FeasibilityBadge from "@/components/FeasibilityBadge";
import { 
  fetchProjects, 
  fetchTasks, 
  updateTaskStatus, 
  leadActionProject, 
  runAIWorkAllocation, 
  confirmTaskAllocation, 
  fetchEmployees,
  fetchActivities,
  EmployeeProfile
} from "@/lib/api";
import { Project, TaskItem, TaskStatus, ActivityLog } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { 
  Layers, 
  CheckCircle2, 
  Clock, 
  Users, 
  AlertTriangle, 
  Calendar, 
  FolderKanban, 
  Activity, 
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  RefreshCw,
  Cpu,
  Inbox,
  X,
  ThumbsUp,
  ThumbsDown,
  UserCheck,
  ShieldCheck,
  Zap,
  Sliders,
  ChevronDown,
  CheckCheck,
  Eye,
  Info,
  AlertOctagon,
  TrendingUp,
  Search
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export default function ProjectLeadDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [allEmployees, setAllEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [leadTaskView, setLeadTaskView] = useState<"table" | "kanban">("kanban");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [projectToReject, setProjectToReject] = useState<Project | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // AI Work Allocation Suite Modal / Drawer State
  const [aiAllocationModalOpen, setAiAllocationModalOpen] = useState(false);
  const [activeAllocationProject, setActiveAllocationProject] = useState<Project | null>(null);
  const [allocatedTasks, setAllocatedTasks] = useState<TaskItem[]>([]);
  const [allocationSummary, setAllocationSummary] = useState("");
  const [isAllocating, setIsAllocating] = useState(false);
  const [isSavingAllocation, setIsSavingAllocation] = useState(false);
  const [allocationSuccessMessage, setAllocationSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [projs, taskList, empList, actList] = await Promise.all([
        fetchProjects(),
        fetchTasks({
          project_id: selectedProjectId !== "ALL" ? selectedProjectId : undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
        }),
        fetchEmployees().catch(() => []),
        fetchActivities({ limit: 15 }).catch(() => [])
      ]);
      setProjects(projs);
      setTasks(taskList);
      setAllEmployees(empList);
      setActivities(actList);
    } catch (err) {
      console.error("Error loading lead data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-polling every 4 seconds for real-time synchronization with employees
    const interval = setInterval(() => {
      loadData();
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedProjectId, statusFilter]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      loadData();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  // Lead Project Action: Accept Project
  const handleAcceptProject = async (project: Project) => {
    setIsSubmittingAction(true);
    try {
      const updated = await leadActionProject(project.id, "accept");
      setProjects((prev) => prev.map((p) => (p.id === project.id ? updated : p)));
      
      // Immediately open AI Smart Work Allocation Suite
      await handleOpenAIAllocation(updated);
    } catch (err: any) {
      alert(err.message || "Failed to accept project");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Lead Project Action: Open Reject Modal
  const handleOpenRejectModal = (project: Project) => {
    setProjectToReject(project);
    setRejectionReason(
      `Deliverable scope requires timeline expansion (+15 days) and 2 additional backend engineers with FastAPI/PostgreSQL skills.`
    );
    setRejectModalOpen(true);
  };

  // Lead Project Action: Submit Rejection
  const handleSubmitReject = async () => {
    if (!projectToReject) return;
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason so the manager can refine the project parameters.");
      return;
    }
    setIsSubmittingAction(true);
    try {
      const updated = await leadActionProject(projectToReject.id, "reject", rejectionReason);
      setProjects((prev) => prev.map((p) => (p.id === projectToReject.id ? updated : p)));
      setRejectModalOpen(false);
      setProjectToReject(null);
      setRejectionReason("");
    } catch (err: any) {
      alert(err.message || "Failed to submit rejection feedback");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Open AI Allocation Suite
  const handleOpenAIAllocation = async (project: Project) => {
    setActiveAllocationProject(project);
    setAiAllocationModalOpen(true);
    setIsAllocating(true);
    setAllocationSuccessMessage(null);
    try {
      const res = await runAIWorkAllocation(project.id);
      setAllocatedTasks(res.tasks);
      setAllocationSummary(res.summary);
    } catch (err: any) {
      console.error("AI allocation error:", err);
      // Fallback: use existing tasks for this project
      const existing = tasks.filter((t) => t.project_id === project.id);
      setAllocatedTasks(existing);
      setAllocationSummary("Showing current deliverable assignments.");
    } finally {
      setIsAllocating(false);
    }
  };

  // Override Task Assignee
  const handleAssigneeOverride = (taskIndex: number, empId: string) => {
    const selectedEmp = allEmployees.find((e) => e.id === empId);
    if (!selectedEmp) return;

    setAllocatedTasks((prev) => {
      const copy = [...prev];
      const task = copy[taskIndex];
      const isMatch = selectedEmp.skills.some((s) =>
        task.title.toLowerCase().includes(s.toLowerCase()) ||
        task.phase_name.toLowerCase().includes(s.toLowerCase())
      );
      const newScore = isMatch ? 92 : 78;
      const headroom = Math.max(0, 100 - selectedEmp.workload);

      copy[taskIndex] = {
        ...task,
        assigned_emp_id: selectedEmp.id,
        assigned_to: selectedEmp.name,
        assigned_role: selectedEmp.designation,
        match_score: newScore,
        ai_rationale: `Manual Lead Override: Assigned to ${selectedEmp.name} (${selectedEmp.designation}, ${selectedEmp.experience} exp, ${headroom}% bandwidth headroom).`,
      };
      return copy;
    });
  };

  // Confirm and Dispatch Allocated Tasks
  const handleConfirmAndDispatch = async () => {
    if (!activeAllocationProject) return;
    setIsSavingAllocation(true);
    try {
      await confirmTaskAllocation(activeAllocationProject.id, allocatedTasks);
      setAllocationSuccessMessage(
        `🎉 Successfully dispatched ${allocatedTasks.length} deliverables to team members! Work is now visible on Employee Workbenches.`
      );
      await loadData();
      setTimeout(() => {
        setAiAllocationModalOpen(false);
        setActiveAllocationProject(null);
      }, 1800);
    } catch (err: any) {
      alert(err.message || "Failed to confirm task allocations");
    } finally {
      setIsSavingAllocation(false);
    }
  };

  // Filter tasks by Employee & Search
  const filteredTasks = tasks.filter((t) => {
    const matchesEmp = selectedEmployeeFilter === "ALL" || 
      t.assigned_emp_id === selectedEmployeeFilter || 
      t.assigned_to.toLowerCase().includes(selectedEmployeeFilter.toLowerCase());
    const matchesSearch = !searchQuery.trim() || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assigned_to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phase_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesEmp && matchesSearch;
  });

  // Metrics
  const pendingReviewProjects = projects.filter(
    (p) => p.lead_status === "Pending Review" || p.status === "Pending Lead Review"
  );
  const activeExecutionProjects = projects.filter(
    (p) => p.lead_status === "Accepted" || p.status === "Active"
  );

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const todoTasks = tasks.filter((t) => t.status === "To Do").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      <Navbar />

      {/* Reject Project Feedback Modal */}
      {rejectModalOpen && projectToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
                  <ThumbsDown className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Reject Project Feasibility</h3>
                  <p className="text-xs text-slate-500">Provide required parameter refinements for Manager review.</p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Project</span>
                <h4 className="text-sm font-bold text-slate-900">{projectToReject.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{projectToReject.description}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Rejection Reason & Required Refinements:
                </label>
                <textarea
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this project is not feasible and what adjustments are needed..."
                  className="w-full rounded-2xl border border-slate-200 p-3.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={handleSubmitReject}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-md transition-all disabled:opacity-50"
              >
                {isSubmittingAction ? "Submitting..." : "Submit Project Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Smart Work Allocation Suite Modal */}
      {aiAllocationModalOpen && activeAllocationProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-md">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black tracking-tight">AI Smart Work Allocation Suite</h2>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold">
                      Multi-Factor Optimization
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Project: <strong className="text-white">{activeAllocationProject.name}</strong> • Intelligent skill & bandwidth matching across 40 employees
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAiAllocationModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isAllocating ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6366f1] border-t-transparent" />
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900">Running AI Multi-Factor Matching Algorithm</h3>
                    <p className="text-xs text-slate-500 max-w-md">
                      Analyzing technical skill tags, seniority, previous project domain experience, and bandwidth headroom across all 40 corporate employees...
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Allocation AI Summary */}
                  {allocationSummary && (
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                        <Cpu className="h-4 w-4 text-indigo-600" />
                        <span>AI Optimization Analysis:</span>
                      </div>
                      <p className="text-xs text-indigo-950 leading-relaxed font-medium">
                        {allocationSummary}
                      </p>
                    </div>
                  )}

                  {allocationSuccessMessage && (
                    <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 animate-in fade-in">
                      {allocationSuccessMessage}
                    </div>
                  )}

                  {/* Tasks Allocation Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">
                        Generated Deliverables & Skill-Matched Workers ({allocatedTasks.length})
                      </h3>
                      <span className="text-xs text-slate-500">
                        Lead override is enabled for all task assignments.
                      </span>
                    </div>

                    <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                          <tr>
                            <th className="px-4 py-3">Phase & Deliverable</th>
                            <th className="px-4 py-3">AI Matched Worker</th>
                            <th className="px-4 py-3">Match Score</th>
                            <th className="px-4 py-3">Priority / Due</th>
                            <th className="px-4 py-3">Lead Assignee Override</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {allocatedTasks.map((t, idx) => {
                            const match = t.match_score || 94;
                            return (
                              <tr key={t.id || idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3.5 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 text-[10px] font-bold">
                                      {t.phase_name}
                                    </span>
                                    <strong className="text-slate-900 text-xs font-bold">{t.title}</strong>
                                  </div>
                                  <p className="text-[11px] text-slate-500 line-clamp-1">{t.description}</p>
                                  {t.ai_rationale && (
                                    <span className="text-[10px] text-indigo-600 block bg-indigo-50/50 rounded px-2 py-0.5 mt-0.5">
                                      💡 {t.ai_rationale}
                                    </span>
                                  )}
                                </td>

                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                                      {t.assigned_to.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-900 text-xs">{t.assigned_to}</div>
                                      <div className="text-[10px] text-slate-500">{t.assigned_role}</div>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-extrabold">
                                    <Sparkles className="h-3 w-3 text-emerald-600" />
                                    {match}%
                                  </span>
                                </td>

                                <td className="px-4 py-3.5 whitespace-nowrap space-y-1">
                                  <span className={cn(
                                    "rounded px-2 py-0.5 text-[9px] font-bold uppercase",
                                    t.priority === "High" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  )}>
                                    {t.priority}
                                  </span>
                                  <div className="text-[10px] text-slate-500">Day {t.due_day}</div>
                                </td>

                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <select
                                    value={t.assigned_emp_id || ""}
                                    onChange={(e) => handleAssigneeOverride(idx, e.target.value)}
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                  >
                                    <option value="" disabled>Select Employee</option>
                                    {allEmployees.map((emp) => (
                                      <option key={emp.id} value={emp.id}>
                                        {emp.name} ({emp.designation})
                                      </option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setAiAllocationModalOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isAllocating || isSavingAllocation}
                  onClick={() => handleOpenAIAllocation(activeAllocationProject)}
                  className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isAllocating && "animate-spin")} />
                  <span>Re-run AI Optimizer</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAndDispatch}
                  disabled={isAllocating || isSavingAllocation || allocatedTasks.length === 0}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isSavingAllocation ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Dispatching Tasks...</span>
                    </>
                  ) : (
                    <>
                      <CheckCheck className="h-4 w-4" />
                      <span>🚀 Confirm & Dispatch Tasks to Team</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
                Project Lead Command Center
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Execution & AI Work Allocation Portal
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Welcome back, <strong className="text-slate-800">{user?.name || "Ishita Rao"}</strong> • Live multi-role sync with all 40 employees and Project Manager (Arjun Reddy).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-2xl text-xs font-bold text-emerald-700 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Sync Active</span>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              <span>Refresh Pipeline</span>
            </button>
          </div>
        </div>

        {/* Lead KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-amber-700">
              <span>Inbound Approvals</span>
              <Inbox className="h-5 w-5 text-amber-600" />
            </div>
            <div className="mt-2 text-3xl font-black text-slate-900">
              {pendingReviewProjects.length}
            </div>
            <p className="text-[11px] text-amber-700 mt-1 font-medium">
              {pendingReviewProjects.length === 1 ? "1 project awaiting review" : `${pendingReviewProjects.length} projects awaiting review`}
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-indigo-700">
              <span>Sprint Completion</span>
              <Activity className="h-5 w-5 text-[#6366f1]" />
            </div>
            <div className="mt-2 text-3xl font-black text-slate-900">
              {completionRate}%
            </div>
            <p className="text-[11px] text-indigo-600/90 mt-1 font-medium">
              {completedTasks} of {totalTasks} deliverables done
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-blue-700">
              <span>In Progress Work</span>
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="mt-2 text-3xl font-black text-slate-900">
              {inProgressTasks}
            </div>
            <p className="text-[11px] text-blue-600/90 mt-1 font-medium">Active tasks in current sprint</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-emerald-700">
              <span>Active Pipelines</span>
              <FolderKanban className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="mt-2 text-3xl font-black text-slate-900">
              {activeExecutionProjects.length}
            </div>
            <p className="text-[11px] text-emerald-600/90 mt-1 font-medium">In execution & assigned</p>
          </div>
        </div>

        {/* 1. INBOUND PROJECT APPROVALS INBOX (Accept / Reject) */}
        {pendingReviewProjects.length > 0 && (
          <div className="rounded-3xl border-2 border-amber-300 bg-gradient-to-b from-amber-50/70 via-white to-white p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
                  <Inbox className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Inbound Project Approvals Inbox ({pendingReviewProjects.length})
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300 animate-pulse">
                      Action Required
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Projects sent by the Manager for Lead feasibility sign-off and AI team allocation.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {pendingReviewProjects.map((p) => {
                const analysis = p.analysis;
                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm space-y-4 hover:border-amber-300 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Project Basic Info */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            Sent by Manager: Arjun Reddy
                          </span>
                          <h4 className="text-base font-bold text-slate-900">{p.name}</h4>
                          {analysis?.feasibility && (
                            <FeasibilityBadge
                              status={analysis.feasibility.status}
                              score={analysis.feasibility.feasibility_score}
                              size="sm"
                            />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                          <span>Timeline: <strong className="text-slate-800">{p.expected_days} Days</strong></span>
                          <span>•</span>
                          <span>Staffing: <strong className="text-slate-800">{p.available_employees} Allocated</strong></span>
                          <span>•</span>
                          <span>Phases: <strong className="text-slate-800">{analysis?.timeline_breakdown?.phases?.length || 4} Phases</strong></span>
                        </div>
                      </div>

                      {/* Lead Action Decision Buttons */}
                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <Link
                          href={`/projects/${p.id}`}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Review Specs</span>
                        </Link>

                        <button
                          onClick={() => handleOpenRejectModal(p)}
                          disabled={isSubmittingAction}
                          className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                          <span>Reject Project</span>
                        </button>

                        <button
                          onClick={() => handleAcceptProject(p)}
                          disabled={isSubmittingAction}
                          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md hover:from-emerald-700 hover:to-teal-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                        >
                          <Check className="h-4 w-4" />
                          <span>✅ Accept & Allocate Team</span>
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. LIVE EMPLOYEE WORK UPDATES & ACTIVITY STREAM WIDGET */}
        <div className="rounded-3xl border border-indigo-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Live Employee Work Updates & Real-Time Sync Stream
              </h3>
            </div>
            <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl">
              {activities.length} Recent Team Updates
            </span>
          </div>

          {activities.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              No recent employee updates logged yet. When employees update deliverables, events will stream here live.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activities.slice(0, 6).map((act) => {
                const isCompleted = act.event_type === "task_completed";
                const isStarted = act.event_type === "task_started";
                const isClaimed = act.event_type === "task_claimed";
                return (
                  <div
                    key={act.id}
                    className={cn(
                      "rounded-2xl border p-3.5 space-y-2 transition-all shadow-2xs flex flex-col justify-between",
                      isCompleted ? "border-emerald-200 bg-emerald-50/40" :
                      isStarted ? "border-indigo-200 bg-indigo-50/40" :
                      isClaimed ? "border-purple-200 bg-purple-50/40" :
                      "border-slate-200 bg-slate-50/60"
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn(
                          "rounded-md px-2 py-0.5 text-[9px] font-bold uppercase border",
                          isCompleted ? "bg-emerald-100 text-emerald-800 border-emerald-300" :
                          isStarted ? "bg-indigo-100 text-indigo-800 border-indigo-300" :
                          "bg-slate-200 text-slate-700 border-slate-300"
                        )}>
                          {isCompleted ? "COMPLETED ✅" : isStarted ? "STARTED ⚡" : isClaimed ? "CLAIMED 📌" : "STATUS CHANGE"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {act.timestamp ? formatDate(act.timestamp) : "Recently"}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{act.message}</h4>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="truncate font-semibold text-slate-700 max-w-[140px]">{act.project_name}</span>
                      {act.employee_name && (
                        <span className="font-bold text-indigo-700 truncate max-w-[110px]">{act.employee_name}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Lead Projects Overview Strip & AI Allocation Triggers */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-[#6366f1]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Active Project Pipelines & AI Work Allocations
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {projects.length} Total Projects
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((p) => {
              const projTasks = tasks.filter((t) => t.project_id === p.id);
              const done = projTasks.filter((t) => t.status === "Completed").length;
              const rate = projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 0;

              const isPending = p.lead_status === "Pending Review" || p.status === "Pending Lead Review";
              const isRejected = p.lead_status === "Rejected" || p.status === "Rejected by Lead";
              const isAccepted = p.lead_status === "Accepted" || (!isPending && !isRejected);

              return (
                <div
                  key={p.id}
                  className={cn(
                    "rounded-2xl border p-4 space-y-3 transition-all shadow-sm flex flex-col justify-between",
                    isPending
                      ? "border-amber-300 bg-amber-50/40 ring-1 ring-amber-200"
                      : isRejected
                      ? "border-rose-200 bg-rose-50/30"
                      : "border-slate-200 bg-white hover:border-indigo-300"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                            Pending Lead Review
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                            Rejected by Lead
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            ✓ Accepted & Active
                          </span>
                        )}
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">{p.name}</h4>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>

                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span>Sprint Deliverables Progress:</span>
                        <strong className="text-slate-900">{done}/{projTasks.length} ({rate}%)</strong>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#6366f1] h-1.5 rounded-full transition-all duration-300" style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenAIAllocation(p)}
                      className="flex items-center gap-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 text-xs font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      <span>{p.ai_work_allocated ? "Re-allocate Team" : "AI Work Allocation"}</span>
                    </button>

                    <Link
                      href={`/projects/${p.id}`}
                      className="text-xs font-semibold text-[#6366f1] hover:text-[#4f46e5] flex items-center gap-0.5"
                    >
                      <span>Blueprint</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Sprint Task Board & Filter Bar (Dual View: Table or Kanban) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#6366f1]" />
                <h3 className="text-base font-bold text-slate-900">
                  Sprint Deliverables & Employee Kanban Board ({filteredTasks.length})
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Inspect deliverable progress across any project or specific employee board.
              </p>
            </div>

            {/* View Mode & Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* View Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setLeadTaskView("kanban")}
                  className={cn(
                    "px-3 py-1 rounded-lg font-bold transition-all cursor-pointer",
                    leadTaskView === "kanban"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Kanban Board
                </button>
                <button
                  onClick={() => setLeadTaskView("table")}
                  className={cn(
                    "px-3 py-1 rounded-lg font-bold transition-all cursor-pointer",
                    leadTaskView === "table"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Table View
                </button>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={cn(
                    "rounded-xl px-2.5 py-1 font-semibold transition-all cursor-pointer",
                    statusFilter === "ALL" 
                      ? "bg-[#6366f1] text-white shadow-sm font-bold" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  )}
                >
                  All ({tasks.length})
                </button>
                <button
                  onClick={() => setStatusFilter("To Do")}
                  className={cn(
                    "rounded-xl px-2.5 py-1 font-semibold transition-all cursor-pointer",
                    statusFilter === "To Do" 
                      ? "bg-amber-600 text-white font-bold" 
                      : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                  )}
                >
                  To Do ({todoTasks})
                </button>
                <button
                  onClick={() => setStatusFilter("In Progress")}
                  className={cn(
                    "rounded-xl px-2.5 py-1 font-semibold transition-all cursor-pointer",
                    statusFilter === "In Progress" 
                      ? "bg-indigo-600 text-white font-bold" 
                      : "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                  )}
                >
                  In Progress ({inProgressTasks})
                </button>
                <button
                  onClick={() => setStatusFilter("Completed")}
                  className={cn(
                    "rounded-xl px-2.5 py-1 font-semibold transition-all cursor-pointer",
                    statusFilter === "Completed" 
                      ? "bg-emerald-600 text-white font-bold" 
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                  )}
                >
                  Completed ({completedTasks})
                </button>
              </div>
            </div>
          </div>

          {/* Employee & Project Dropdown Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Project Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700">
                <FolderKanban className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer font-bold text-slate-800"
                >
                  <option value="ALL">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700">
                <Users className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <select
                  value={selectedEmployeeFilter}
                  onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer font-bold text-slate-800"
                >
                  <option value="ALL">All 40 Employees</option>
                  {allEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search deliverables by name or worker..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Showing <strong className="text-slate-800">{filteredTasks.length}</strong> tasks
            </span>
          </div>

          {/* VIEW A: KANBAN BOARD */}
          {leadTaskView === "kanban" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              {/* TO DO COLUMN */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-4 min-h-[450px] flex flex-col shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    To Do
                  </span>
                  <span className="rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 text-xs font-bold">
                    {filteredTasks.filter(t => t.status === "To Do").length}
                  </span>
                </div>
                <div className="space-y-3 flex-1 flex flex-col justify-start">
                  {filteredTasks.filter(t => t.status === "To Do").map(task => (
                    <div key={task.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-3 hover:border-indigo-300 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {task.phase_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{task.project_name}</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">{task.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-indigo-600 text-white font-bold text-[9px] flex items-center justify-center">
                            {task.assigned_to.charAt(0)}
                          </div>
                          <div>
                            <span className="text-slate-800 font-bold text-[11px] truncate max-w-[90px] block">{task.assigned_to}</span>
                            <span className="text-[9px] text-slate-400 block">{task.assigned_role}</span>
                          </div>
                        </div>
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                          className="text-[11px] font-semibold bg-slate-50 border border-slate-200 text-slate-700 rounded-lg py-1 px-1.5 focus:outline-none cursor-pointer"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  {filteredTasks.filter(t => t.status === "To Do").length === 0 && (
                    <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400 flex-1 flex items-center justify-center">
                      No deliverables in To Do
                    </div>
                  )}
                </div>
              </div>

              {/* IN PROGRESS COLUMN */}
              <div className="bg-indigo-50/40 border border-indigo-200 rounded-3xl p-4 space-y-4 min-h-[450px] flex flex-col shadow-xs">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#6366f1] animate-ping" />
                    In Progress
                  </span>
                  <span className="rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300 px-2 py-0.5 text-xs font-bold">
                    {filteredTasks.filter(t => t.status === "In Progress").length}
                  </span>
                </div>
                <div className="space-y-3 flex-1 flex flex-col justify-start">
                  {filteredTasks.filter(t => t.status === "In Progress").map(task => (
                    <div key={task.id} className="bg-white border-2 border-indigo-200 p-4 rounded-2xl shadow-sm space-y-3 hover:border-indigo-400 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {task.phase_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{task.project_name}</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">{task.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-indigo-600 text-white font-bold text-[9px] flex items-center justify-center">
                            {task.assigned_to.charAt(0)}
                          </div>
                          <div>
                            <span className="text-slate-800 font-bold text-[11px] truncate max-w-[90px] block">{task.assigned_to}</span>
                            <span className="text-[9px] text-slate-400 block">{task.assigned_role}</span>
                          </div>
                        </div>
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                          className="text-[11px] font-bold bg-indigo-50 border border-indigo-300 text-indigo-700 rounded-lg py-1 px-1.5 focus:outline-none cursor-pointer"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  {filteredTasks.filter(t => t.status === "In Progress").length === 0 && (
                    <div className="p-8 border border-dashed border-indigo-200 rounded-2xl text-center text-xs text-slate-400 flex-1 flex items-center justify-center">
                      No active tasks in progress
                    </div>
                  )}
                </div>
              </div>

              {/* COMPLETED COLUMN */}
              <div className="bg-emerald-50/40 border border-emerald-200 rounded-3xl p-4 space-y-4 min-h-[450px] flex flex-col shadow-xs">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                    Completed
                  </span>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-xs font-bold">
                    {filteredTasks.filter(t => t.status === "Completed").length}
                  </span>
                </div>
                <div className="space-y-3 flex-1 flex flex-col justify-start">
                  {filteredTasks.filter(t => t.status === "Completed").map(task => (
                    <div key={task.id} className="bg-white border-2 border-emerald-300 p-4 rounded-2xl shadow-sm space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ {task.phase_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{task.project_name}</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-700 line-through leading-snug">{task.title}</h4>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center">
                            {task.assigned_to.charAt(0)}
                          </div>
                          <div>
                            <span className="text-slate-800 font-bold text-[11px] truncate max-w-[90px] block">{task.assigned_to}</span>
                            <span className="text-[9px] text-slate-400 block">{task.assigned_role}</span>
                          </div>
                        </div>
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                          className="text-[11px] font-bold bg-emerald-50 border border-emerald-300 text-emerald-700 rounded-lg py-1 px-1.5 focus:outline-none cursor-pointer"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  {filteredTasks.filter(t => t.status === "Completed").length === 0 && (
                    <div className="p-8 border border-dashed border-emerald-200 rounded-2xl text-center text-xs text-slate-400 flex-1 flex items-center justify-center">
                      No completed tasks yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW B: TABLE VIEW */}
          {leadTaskView === "table" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-[#f8fafc] text-slate-500 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="px-4 py-3">Deliverable / Task</th>
                    <th className="px-4 py-3">Project & Phase</th>
                    <th className="px-4 py-3">Assigned Worker</th>
                    <th className="px-4 py-3">Match Score</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Due Day</th>
                    <th className="px-4 py-3 text-right">Status Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((task) => {
                    const match = task.match_score || 94;
                    return (
                      <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">{task.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{task.description}</div>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{task.project_name}</div>
                          <span className="text-[10px] text-[#4f46e5] bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                            {task.phase_name}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                              {task.assigned_to.charAt(0)}
                            </div>
                            <div>
                              <div className="text-slate-900 font-bold text-xs">{task.assigned_to}</div>
                              <div className="text-[10px] text-slate-500">{task.assigned_role}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold">
                            <Sparkles className="h-3 w-3 text-emerald-600" />
                            {match}%
                          </span>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                              task.priority === "High"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            )}
                          >
                            {task.priority}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                          Day {task.due_day}
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                            className={cn(
                              "rounded-xl px-2.5 py-1 text-xs font-semibold focus:outline-none border cursor-pointer shadow-sm",
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
