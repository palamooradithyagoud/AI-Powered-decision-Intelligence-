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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-[#4f46e5] border border-indigo-200">
                Project Lead Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Sprint & Execution Command Center
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Welcome back, <strong className="text-slate-800">{user?.name || "Elena Rostova"}</strong> • Track execution phases, assign deliverables, and unblock team milestones.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              <span>Refresh Sprints</span>
            </button>
          </div>
        </div>

        {/* Lead KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-indigo-700">
              <span>Sprint Completion</span>
              <Activity className="h-5 w-5 text-[#6366f1]" />
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {completionRate}%
            </div>
            <p className="text-[11px] text-indigo-600/90 mt-1">
              {completedTasks} of {totalTasks} deliverables done
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-blue-700">
              <span>In Progress Work</span>
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {inProgressTasks}
            </div>
            <p className="text-[11px] text-blue-600/90 mt-1">Active tasks in current sprint</p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-amber-700">
              <span>Backlog / To Do</span>
              <Layers className="h-5 w-5 text-amber-600" />
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {todoTasks}
            </div>
            <p className="text-[11px] text-amber-600/90 mt-1">Queued for next sprint phase</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-emerald-700">
              <span>Managed Projects</span>
              <FolderKanban className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {projects.length}
            </div>
            <p className="text-[11px] text-emerald-600/90 mt-1">Active AI blueprints under execution</p>
          </div>
        </div>

        {/* Lead Projects Overview Strip */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-[#6366f1]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Active Project Pipelines & Milestone Progress
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
              const rate = projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 35;

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4 space-y-3 hover:border-indigo-300 hover:bg-white transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-bold text-slate-900 text-sm truncate">{p.name}</h5>
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-[#4f46e5] border border-indigo-200">
                      {p.expected_days}d
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Phase Execution</span>
                      <strong className="text-[#4f46e5]">{rate}%</strong>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        style={{ width: `${rate}%` }}
                        className="h-full bg-gradient-to-r from-[#6366f1] to-purple-500 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                    <span className="text-slate-500">{p.analysis?.timeline_breakdown?.phases?.length || 4} Phases</span>
                    <Link
                      href={`/projects/${p.id}`}
                      className="text-xs font-semibold text-[#6366f1] hover:text-[#4f46e5] flex items-center gap-1"
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
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#6366f1]" />
              <h3 className="text-base font-bold text-slate-900">
                Sprint Deliverables & Role Assignments ({tasks.length})
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
                All
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
                  <th className="px-4 py-3">Role & Assignee</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Due Day</th>
                  <th className="px-4 py-3 text-right">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">{task.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{task.description}</div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{task.project_name}</div>
                      <span className="text-[10px] text-[#4f46e5] bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                        {task.phase_name}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="text-slate-800 font-semibold">{task.assigned_role}</div>
                      <div className="text-[11px] text-slate-500">{task.assigned_to}</div>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
