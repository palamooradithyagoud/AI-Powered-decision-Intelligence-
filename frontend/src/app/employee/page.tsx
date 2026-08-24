"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { fetchTasks, updateTaskStatus } from "@/lib/api";
import { TaskItem, TaskStatus } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Sparkles, 
  FolderKanban, 
  Calendar, 
  ArrowRight,
  RefreshCw,
  Check,
  Zap,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmployeePortal() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const loadTasks = async () => {
    setLoading(true);
    try {
      // Fetch tasks assigned to employee
      const data = await fetchTasks({
        assigned_to: user?.name || "Devon Chen",
        status: filterStatus !== "ALL" ? filterStatus : undefined,
      });
      setTasks(data);
    } catch (err) {
      console.error("Error loading employee tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [filterStatus]);

  const handleToggleStatus = async (taskId: string, currentStatus: TaskStatus) => {
    const nextStatus: TaskStatus = currentStatus === "To Do" ? "In Progress" : currentStatus === "In Progress" ? "Completed" : "To Do";
    try {
      await updateTaskStatus(taskId, nextStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
      );
    } catch (err) {
      alert("Failed to update task status");
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const todoTasks = tasks.filter((t) => t.status === "To Do").length;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                Employee Workspace
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                My Assigned Deliverables & Execution Board
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Welcome back, <strong>{user?.name || "Devon Chen"}</strong> ({user?.title || "Full-Stack & AI Engineer"}) • Execute assigned deliverables on schedule.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadTasks}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              <span>Refresh Tasks</span>
            </button>
          </div>
        </div>

        {/* Employee Metrics Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-600/15 to-emerald-900/10 p-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
              <span>Completed Deliverables</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-white">
              {completedTasks}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Verified & shipped phase items</p>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-600/15 to-blue-900/10 p-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
              <span>Active Sprint Focus</span>
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-white">
              {inProgressTasks}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Currently in progress</p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-600/15 to-amber-900/10 p-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
              <span>Upcoming Queue</span>
              <Target className="h-5 w-5 text-amber-400" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-white">
              {todoTasks}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Scheduled for upcoming sprint days</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400 mr-2">Filter By Status:</span>
            
            <button
              onClick={() => setFilterStatus("ALL")}
              className={cn(
                "rounded-lg px-3 py-1.5 font-semibold transition-all",
                filterStatus === "ALL" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
              )}
            >
              All Tasks ({totalTasks})
            </button>

            <button
              onClick={() => setFilterStatus("In Progress")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all",
                filterStatus === "In Progress" ? "bg-blue-600 text-white" : "bg-blue-950/40 text-blue-400 border border-blue-500/20"
              )}
            >
              <span>⚡ In Progress</span>
              <span>({inProgressTasks})</span>
            </button>

            <button
              onClick={() => setFilterStatus("To Do")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all",
                filterStatus === "To Do" ? "bg-amber-600 text-white" : "bg-amber-950/40 text-amber-400 border border-amber-500/20"
              )}
            >
              <span>⏳ To Do</span>
              <span>({todoTasks})</span>
            </button>

            <button
              onClick={() => setFilterStatus("Completed")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all",
                filterStatus === "Completed" ? "bg-emerald-600 text-white" : "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
              )}
            >
              <span>✅ Completed</span>
              <span>({completedTasks})</span>
            </button>
          </div>
        </div>

        {/* Task Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => {
            const isDone = task.status === "Completed";
            const isInProgress = task.status === "In Progress";

            return (
              <div
                key={task.id}
                className={cn(
                  "rounded-2xl border bg-slate-900/70 p-5 backdrop-blur-sm space-y-4 transition-all duration-200 hover:shadow-lg",
                  isDone
                    ? "border-emerald-500/30 bg-emerald-950/10"
                    : isInProgress
                    ? "border-blue-500/30 bg-blue-950/10"
                    : "border-slate-800"
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                      {task.project_name}
                    </span>
                    <span className="text-[10px] text-blue-400 font-semibold">
                      {task.phase_name}
                    </span>
                  </div>

                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                      isDone
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : isInProgress
                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    )}
                  >
                    {task.status}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h4 className="text-sm font-bold text-white leading-snug">
                    {task.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {task.description}
                  </p>
                </div>

                {/* Metadata & Role */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Role: <strong className="text-slate-200">{task.assigned_role}</strong></span>
                  <span>Due: <strong className="text-slate-200">Day {task.due_day}</strong></span>
                </div>

                {/* Interactive Status Toggle Action */}
                <button
                  onClick={() => handleToggleStatus(task.id, task.status)}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all shadow-sm",
                    isDone
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : isInProgress
                      ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/30"
                      : "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/30"
                  )}
                >
                  {isDone ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Completed (Click to Reset)</span>
                    </>
                  ) : isInProgress ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Mark as Complete</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      <span>Start Working (In Progress)</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}
