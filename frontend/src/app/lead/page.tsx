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
  EmployeeProfile
} from "@/lib/api";
import { Project, TaskItem, TaskStatus } from "@/types";
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
  AlertOctagon
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProjectLeadDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [allEmployees, setAllEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

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
    setLoading(true);
    try {
      const [projs, taskList, empList] = await Promise.all([
        fetchProjects(),
        fetchTasks({
          project_id: selectedProjectId !== "ALL" ? selectedProjectId : undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
        }),
        fetchEmployees().catch(() => []),
      ]);
      setProjects(projs);
      setTasks(taskList);
      setAllEmployees(empList);
    } catch (err) {
      console.error("Error loading lead data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProjectId, statusFilter]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
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
                  <h3 className="text-lg font-bold text-slate-900">Reject Inbound Project</h3>
                  <p className="text-xs text-slate-500">Provide structured refinement feedback for the Manager</p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Project</span>
                <h4 className="text-sm font-bold text-slate-900">{projectToReject.name}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                  <span>Timeline: <strong>{projectToReject.expected_days}d</strong></span>
                  <span>•</span>
                  <span>Staff: <strong>{projectToReject.available_employees} Allocated</strong></span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Lead Refinement Feedback & Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  placeholder="Explain why this project cannot proceed as scoped (e.g. unrealistic timeline, skill shortage, missing architecture prerequisites)..."
                  className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-xs text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 leading-tight">
                  This structured feedback will be returned to the Manager dashboard with actionable suggestions.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReject}
                disabled={isSubmittingAction}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition-all disabled:opacity-50"
              >
                {isSubmittingAction ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <ThumbsDown className="h-3.5 w-3.5" />
                    <span>Confirm Rejection & Return</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Smart Work Allocation & Team Assignment Suite Modal */}
      {aiAllocationModalOpen && activeAllocationProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5 shrink-0 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/50 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 text-[10px] uppercase tracking-wider">
                      AI Multi-Factor Engine
                    </span>
                    <span className="text-xs text-slate-400 font-medium">40-Employee Dataset Match</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                    AI Smart Work Allocation: {activeAllocationProject.name}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setAiAllocationModalOpen(false)}
                className="rounded-2xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Subheader & Engine Weights Banner */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Zap className="h-4 w-4 text-[#6366f1]" />
                <span className="font-semibold">Evaluation Factors:</span>
                <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-indigo-700">40% Skill Match</span>
                <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-blue-700">30% Bandwidth</span>
                <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-purple-700">20% Experience</span>
                <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">10% Availability</span>
              </div>

              <div className="text-slate-500 font-medium">
                {allocatedTasks.length} Deliverables Across {activeAllocationProject.analysis?.timeline_breakdown?.phases?.length || 4} Phases
              </div>
            </div>

            {/* Modal Body - Deliverables List */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-[#f8fafc]/50">
              {allocationSuccessMessage && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>{allocationSuccessMessage}</span>
                </div>
              )}

              {isAllocating ? (
                <div className="py-20 text-center space-y-4">
                  <div className="relative flex h-16 w-16 mx-auto items-center justify-center">
                    <div className="h-14 w-14 rounded-full border-4 border-slate-200 border-t-[#6366f1] animate-spin" />
                    <Sparkles className="absolute h-6 w-6 text-[#6366f1]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-800">
                      Evaluating 40 Corporate Employees...
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Matching tech stack competencies, available bandwidth headroom, previous project experience, and availability levels for optimal workload distribution.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {allocatedTasks.map((task, idx) => {
                    const matchScore = task.match_score || 94;
                    const scoreColor =
                      matchScore >= 90
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : matchScore >= 75
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-amber-50 text-amber-700 border-amber-200";

                    return (
                      <div
                        key={task.id || idx}
                        className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-3.5 hover:border-indigo-300 transition-all"
                      >
                        {/* Task Header & Match Pill */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-indigo-50 text-[#4f46e5] px-2 py-0.5 text-[10px] font-bold border border-indigo-100">
                                {task.phase_name}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-400">
                                Due Day {task.due_day}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mt-1">{task.title}</h4>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className={cn("rounded-full px-3 py-1 text-xs font-black border shadow-xs flex items-center gap-1", scoreColor)}>
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>{matchScore}% Match</span>
                            </span>
                          </div>
                        </div>

                        {/* Assignee & AI Rationale Card */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          {/* Worker Assignment Selector */}
                          <div className="md:col-span-5 space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Assigned Worker (Auto-Matched):
                            </label>
                            <div className="relative">
                              <select
                                value={task.assigned_emp_id || (allEmployees.find((e) => e.name === task.assigned_to)?.id || "emp_03")}
                                onChange={(e) => handleAssigneeOverride(idx, e.target.value)}
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3.5 pr-8 text-xs font-bold text-slate-800 focus:border-[#6366f1] focus:bg-white focus:outline-none cursor-pointer"
                              >
                                {allEmployees.map((emp) => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.id}: {emp.name} — {emp.designation} ({emp.workload}% load)
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            </div>
                          </div>

                          {/* AI Rationale Box */}
                          <div className="md:col-span-7 rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-[10px] uppercase">
                              <Info className="h-3.5 w-3.5" />
                              <span>AI Allocation Rationale</span>
                            </div>
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              {task.ai_rationale ||
                                `Optimal technical alignment in required stack, positive headroom bandwidth, and matching past project experience.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer Bar */}
            <div className="border-t border-slate-200 px-6 py-4 bg-white rounded-b-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenAIAllocation(activeAllocationProject)}
                disabled={isAllocating || isSavingAllocation}
                className="flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-bold text-[#4f46e5] hover:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isAllocating && "animate-spin")} />
                <span>Re-Run AI Allocation</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setAiAllocationModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndDispatch}
                  disabled={isAllocating || isSavingAllocation || allocatedTasks.length === 0}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] via-indigo-600 to-purple-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-md hover:from-[#4f46e5] hover:to-purple-700 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
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
              Welcome back, <strong className="text-slate-800">{user?.name || "Ishita Rao"}</strong> • Review inbound manager project requests, run multi-factor AI worker allocation, and coordinate team execution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
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
                          className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                          <span>Reject Project</span>
                        </button>

                        <button
                          onClick={() => handleAcceptProject(p)}
                          disabled={isSubmittingAction}
                          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md hover:from-emerald-700 hover:to-teal-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
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

        {/* 2. Lead Projects Overview Strip & AI Allocation Triggers */}
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
                            <Check className="h-3 w-3 text-emerald-600" />
                            Accepted & In Execution
                          </span>
                        )}
                        <h5 className="font-bold text-slate-900 text-sm truncate">{p.name}</h5>
                      </div>
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-[#4f46e5] border border-indigo-200 shrink-0">
                        {p.expected_days}d
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Sprint Progress</span>
                        <strong className="text-[#4f46e5]">{rate}%</strong>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          style={{ width: `${rate}%` }}
                          className="h-full bg-gradient-to-r from-[#6366f1] to-purple-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenAIAllocation(p)}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[11px] font-bold text-[#4f46e5] hover:bg-indigo-100 transition-colors"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>AI Allocation</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedProjectId(selectedProjectId === p.id ? "ALL" : p.id)}
                        className={cn(
                          "text-[11px] font-bold px-2 py-1 rounded-md transition-colors",
                          selectedProjectId === p.id 
                            ? "bg-slate-800 text-white" 
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {selectedProjectId === p.id ? "Filtering" : "Filter Tasks"}
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
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Sprint Task Board & Filter Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#6366f1]" />
              <h3 className="text-base font-bold text-slate-900">
                Sprint Deliverables & Assigned Workers ({tasks.length})
              </h3>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold mr-1">Status:</span>
              <button
                onClick={() => setStatusFilter("ALL")}
                className={cn(
                  "rounded-xl px-2.5 py-1 font-semibold transition-all",
                  statusFilter === "ALL" 
                    ? "bg-[#6366f1] text-white shadow-sm" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                )}
              >
                All ({tasks.length})
              </button>
              <button
                onClick={() => setStatusFilter("To Do")}
                className={cn(
                  "rounded-xl px-2.5 py-1 font-semibold transition-all",
                  statusFilter === "To Do" 
                    ? "bg-amber-600 text-white" 
                    : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                )}
              >
                To Do ({todoTasks})
              </button>
              <button
                onClick={() => setStatusFilter("In Progress")}
                className={cn(
                  "rounded-xl px-2.5 py-1 font-semibold transition-all",
                  statusFilter === "In Progress" 
                    ? "bg-indigo-600 text-white" 
                    : "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                )}
              >
                In Progress ({inProgressTasks})
              </button>
              <button
                onClick={() => setStatusFilter("Completed")}
                className={cn(
                  "rounded-xl px-2.5 py-1 font-semibold transition-all",
                  statusFilter === "Completed" 
                    ? "bg-emerald-600 text-white" 
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                )}
              >
                Completed ({completedTasks})
              </button>
            </div>
          </div>

          {/* Task Table */}
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
                {tasks.map((task) => {
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
        </div>

      </main>
    </div>
  );
}
