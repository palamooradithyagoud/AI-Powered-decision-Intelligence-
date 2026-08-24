"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { fetchProjects, fetchTasks, updateTaskStatus } from "@/lib/api";
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
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProjectLeadDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const [projs, taskList] = await Promise.all([
        fetchProjects(),
        fetchTasks({
          project_id: selectedProjectId !== "ALL" ? selectedProjectId : undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
        }),
      ]);
      setProjects(projs);
      setTasks(taskList);
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

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const todoTasks = tasks.filter((t) => t.status === "To Do").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-400 border border-purple-500/20">
                Project Lead Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Sprint & Execution Command Center
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Welcome back, <strong>{user?.name || "Elena Rostova"}</strong> • Track execution phases, assign deliverables, and unblock team milestones.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              <span>Refresh Sprints</span>
            </button>
          </div>
        </div>

        {/* Lead KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-600/15 to-purple-900/10 p-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
              <span>Sprint Completion</span>
              <Activity className="h-5 w-5 text-purple-400" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-white">
              {completionRate}%
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {completedTasks} of {totalTasks} deliverables done
            </p>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-600/15 to-blue-900/10 p-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
              <span>In Progress Work</span>
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-white">
              {inProgressTasks}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Active tasks in current sprint</p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-600/15 to-amber-900/10 p-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
              <span>Backlog / To Do</span>
              <Layers className="h-5 w-5 text-amber-400" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-white">
              {todoTasks}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Queued for next sprint phase</p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-600/15 to-emerald-900/10 p-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
              <span>Managed Projects</span>
              <FolderKanban className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-white">
              {projects.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Active AI blueprints under execution</p>
          </div>
        </div>

        {/* Lead Projects Overview Strip */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Active Project Pipelines & Milestone Progress
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {projects.length} Total Projects
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((p) => {
              const projTasks = tasks.filter((t) => t.project_id === p.id);
              const done = projTasks.filter((t) => t.status === "Completed").length;
              const rate = projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 35;

              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3 hover:border-purple-500/40 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-bold text-white text-sm truncate">{p.name}</h5>
                    <span className="rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/20">
                      {p.expected_days}d
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Phase Execution</span>
                      <strong className="text-purple-400">{rate}%</strong>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${rate}%` }}
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                    <span className="text-slate-500">{p.analysis.timeline_breakdown.phases.length} Phases</span>
                    <Link
                      href={`/projects/${p.id}`}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
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

        {/* Sprint Task Board & Filter Bar */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-400" />
              <h3 className="text-base font-bold text-white">
                Sprint Deliverables & Role Assignments ({tasks.length})
              </h3>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold mr-1">Status:</span>
              <button
                onClick={() => setStatusFilter("ALL")}
                className={cn(
                  "rounded-lg px-2.5 py-1 font-semibold transition-all",
                  statusFilter === "ALL" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                )}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("To Do")}
                className={cn(
                  "rounded-lg px-2.5 py-1 font-semibold transition-all",
                  statusFilter === "To Do" ? "bg-amber-600 text-white" : "bg-amber-950/30 text-amber-400 border border-amber-500/20"
                )}
              >
                To Do ({todoTasks})
              </button>
              <button
                onClick={() => setStatusFilter("In Progress")}
                className={cn(
                  "rounded-lg px-2.5 py-1 font-semibold transition-all",
                  statusFilter === "In Progress" ? "bg-blue-600 text-white" : "bg-blue-950/30 text-blue-400 border border-blue-500/20"
                )}
              >
                In Progress ({inProgressTasks})
              </button>
              <button
                onClick={() => setStatusFilter("Completed")}
                className={cn(
                  "rounded-lg px-2.5 py-1 font-semibold transition-all",
                  statusFilter === "Completed" ? "bg-emerald-600 text-white" : "bg-emerald-950/30 text-emerald-400 border border-emerald-500/20"
                )}
              >
                Completed ({completedTasks})
              </button>
            </div>
          </div>

          {/* Task Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Deliverable / Task</th>
                  <th className="px-4 py-3">Project & Phase</th>
                  <th className="px-4 py-3">Role & Assignee</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Due Day</th>
                  <th className="px-4 py-3 text-right">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white text-xs sm:text-sm">{task.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{task.description}</div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-200">{task.project_name}</div>
                      <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20">
                        {task.phase_name}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="text-slate-200 font-semibold">{task.assigned_role}</div>
                      <div className="text-[11px] text-slate-400">{task.assigned_to}</div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                          task.priority === "High"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        )}
                      >
                        {task.priority}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                      Day {task.due_day}
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none border cursor-pointer",
                          task.status === "Completed"
                            ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"
                            : task.status === "In Progress"
                            ? "bg-blue-950/60 text-blue-400 border-blue-500/40"
                            : "bg-slate-900 text-amber-400 border-slate-700"
                        )}
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
