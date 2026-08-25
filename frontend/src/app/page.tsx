"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  fetchKPIs, 
  fetchProjects, 
  deleteProject,
  fetchMeetings,
  fetchActivities,
  fetchTasks 
} from "@/lib/api";
import { Project, DashboardKPIs, MeetingItem, ActivityLog, TaskItem } from "@/types";
import Navbar from "@/components/Navbar";
import FeasibilityBadge from "@/components/FeasibilityBadge";
import { 
  FolderKanban, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  Search, 
  Calendar as CalendarIcon, 
  Users, 
  ArrowRight, 
  Trash2, 
  ShieldAlert,
  Sparkles,
  Layers, 
  BarChart3, 
  RefreshCw,
  Clock,
  TrendingUp,
  FileText,
  Bell,
  MessageSquare,
  Plus,
  Video,
  Check,
  Zap,
  ShieldCheck
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export default function ManagerDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [allTasks, setAllTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [feasibilityFilter, setFeasibilityFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadData = async () => {
    try {
      const [kpiData, projectsData, meetingsData, actData, taskData] = await Promise.all([
        fetchKPIs().catch(() => null),
        fetchProjects({
          search: searchTerm,
          feasibility: feasibilityFilter,
          status: statusFilter,
        }).catch(() => []),
        fetchMeetings().catch(() => []),
        fetchActivities({ limit: 12 }).catch(() => []),
        fetchTasks().catch(() => [])
      ]);
      setKpis(kpiData);
      setProjects(projectsData);
      setMeetings(meetingsData);
      setActivities(actData);
      setAllTasks(taskData);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-polling every 5 seconds so updates from employees and leads sync seamlessly
    const interval = setInterval(() => {
      loadData();
    }, 5000);
    return () => clearInterval(interval);
  }, [feasibilityFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteProject(id);
        await loadData();
      } catch (err) {
        alert("Failed to delete project");
      }
    }
  };

  const [greeting, setGreeting] = useState("Good day,");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning,");
    else if (hour < 17) setGreeting("Good afternoon,");
    else setGreeting("Good evening,");
  }, []);

  const avgFeasibility = projects.length > 0
    ? Math.round(projects.reduce((acc, p) => acc + (p.analysis?.feasibility?.feasibility_score || 75), 0) / projects.length)
    : 65;

  const totalDeliverables = allTasks.length;
  const completedDeliverables = allTasks.filter(t => t.status === "Completed").length;
  const overallDeliverableRate = totalDeliverables > 0 ? Math.round((completedDeliverables / totalDeliverables) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
        
        {/* 1. Header Greeting Ribbon */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {greeting} Arjun Reddy
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Project Manager Intelligence Dashboard • Live multi-role execution sync with Project Lead (Ishita Rao) & 40 employees.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-2xl text-xs font-bold text-emerald-700 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Multi-Role Live Sync Active</span>
            </div>

            <Link
              href="/create"
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ New Project Blueprint</span>
            </Link>
          </div>
        </div>

        {/* 2. LIVE SPRINT EXECUTION & EMPLOYEE ACTIVITY STREAM */}
        <div className="rounded-3xl border border-indigo-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Live Employee Execution & Deliverable Completion Stream
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time updates when employees start, claim, or complete sprint deliverables.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl">
                Sprint Progress: {completedDeliverables}/{totalDeliverables} ({overallDeliverableRate}%)
              </span>
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              No recent employee updates logged yet. As employees execute deliverables on their Kanban boards, updates will appear here instantly.
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

        {/* 3. Featured Active Projects Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Active Project Pipelines & Deliverables
            </h3>
            <a href="#portfolio-section" className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1">
              <span>View all ({projects.length})</span>
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.slice(0, 3).map((project, idx) => {
              const projTasks = allTasks.filter(t => t.project_id === project.id);
              const doneCount = projTasks.filter(t => t.status === "Completed").length;
              const rate = projTasks.length > 0 ? Math.round((doneCount / projTasks.length) * 100) : 0;

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-5 hover:border-slate-300 hover:shadow-md transition-all duration-200 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg px-2.5 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {project.status}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{project.expected_days}d Sprint</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#6366f1] transition-colors line-clamp-1">
                        {project.name}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {project.description}
                      </p>
                    </div>

                    {/* Deliverable completion progress bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span>Sprint Deliverables:</span>
                        <strong className="text-slate-800">{doneCount}/{projTasks.length} ({rate}%)</strong>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#6366f1] h-1.5 rounded-full transition-all duration-300" style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span>{project.available_employees} Staff Allocated</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                      <span>Blueprint</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 4. Analytics & KPIs Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Total Projects</span>
              <FolderKanban className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{projects.length}</div>
            <span className="text-[11px] text-slate-500 block">Enterprise AI Blueprints</span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Total Deliverables</span>
              <Layers className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{totalDeliverables}</div>
            <span className="text-[11px] text-slate-500 block">{completedDeliverables} completed by workers</span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Sprint Completion</span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{overallDeliverableRate}%</div>
            <span className="text-[11px] text-emerald-700 font-medium block">Across active work streams</span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Avg Feasibility Score</span>
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{avgFeasibility}%</div>
            <span className="text-[11px] text-slate-500 block">AI Gemini Multi-Factor</span>
          </div>
        </div>

        {/* 5. All Projects Portfolio Section */}
        <div id="portfolio-section" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Enterprise Projects Portfolio ({projects.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage project blueprints, review AI feasibility risk assessments, and dispatch pipelines to Project Leads.
              </p>
            </div>

            {/* Filter Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-64"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {projects.length === 0 ? (
            <div className="py-16 text-center space-y-3 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <FolderKanban className="h-10 w-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Projects Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No projects matched your search criteria. Create a new blueprint to run AI feasibility analysis.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {projects.map((project) => {
                const analysis = project.analysis;
                const projTasks = allTasks.filter(t => t.project_id === project.id);
                const doneCount = projTasks.filter(t => t.status === "Completed").length;
                const rate = projTasks.length > 0 ? Math.round((doneCount / projTasks.length) * 100) : 0;

                const isPending = project.status === "Pending Lead Review" || project.lead_status === "Pending Review";
                const isRejected = project.status === "Rejected by Lead" || project.lead_status === "Rejected";
                const isAccepted = project.lead_status === "Accepted" || (!isPending && !isRejected);

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group relative block rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 transition-all duration-200 hover:border-indigo-300 hover:shadow-md"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      
                      {/* Project Main Info */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h4 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#6366f1] transition-colors truncate">
                            {project.name}
                          </h4>

                          {analysis?.feasibility && (
                            <FeasibilityBadge
                              status={analysis.feasibility.status}
                              score={analysis.feasibility.feasibility_score}
                              size="sm"
                            />
                          )}

                          {isPending ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Pending Lead Review
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-300">
                              <AlertTriangle className="h-3 w-3 text-rose-600" />
                              Rejected by Lead
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              <Check className="h-3 w-3 text-emerald-600" />
                              Accepted & In Execution
                            </span>
                          )}
                        </div>

                        {/* If Rejected by Lead, display rejection alert banner */}
                        {project.rejection_reason && isRejected && (
                          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-2.5 text-xs text-rose-900 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="font-bold text-[11px] text-rose-800 uppercase tracking-wider block">Lead Rejection Feedback:</span>
                              <p className="text-[11px] text-rose-700 leading-normal">{project.rejection_reason}</p>
                            </div>
                          </div>
                        )}

                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>

                        {/* Metadata Tags & Sprint Deliverable Progress */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                            <span>Timeline: <strong className="text-slate-800">{project.expected_days} Days</strong></span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            <span>Staff: <strong className="text-slate-800">{project.available_employees} Available</strong></span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-indigo-600" />
                            <span>Deliverables: <strong className="text-indigo-700">{doneCount}/{projTasks.length} Completed ({rate}%)</strong></span>
                          </div>

                          <span className="text-[11px] text-slate-400">
                            Created: {formatDate(project.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Right Action Ribbon */}
                      <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        <button
                          onClick={(e) => handleDelete(e, project.id, project.name)}
                          className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-100 px-3.5 py-2 text-xs font-bold text-[#4f46e5] group-hover:bg-[#6366f1] group-hover:text-white transition-all shadow-sm">
                          <span>View Blueprint</span>
                          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>

                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
