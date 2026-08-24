"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  fetchKPIs, 
  fetchProjects, 
  deleteProject 
} from "@/lib/api";
import { Project, DashboardKPIs, FeasibilityStatus } from "@/types";
import Navbar from "@/components/Navbar";
import KpiCard from "@/components/KpiCard";
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
  Check,
  TrendingUp,
  FileText,
  Bell,
  MessageSquare,
  Sliders,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export default function ManagerDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [feasibilityFilter, setFeasibilityFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpiData, projectsData] = await Promise.all([
        fetchKPIs().catch(() => null),
        fetchProjects({
          search: searchTerm,
          feasibility: feasibilityFilter,
          status: statusFilter,
        }).catch(() => []),
      ]);
      setKpis(kpiData);
      setProjects(projectsData);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  // Get dynamic greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning,";
    if (hour < 17) return "Good afternoon,";
    return "Good evening,";
  };

  // Calculate portfolio completion/feasibility index
  const avgFeasibility = projects.length > 0
    ? Math.round(projects.reduce((acc, p) => acc + (p.analysis?.feasibility?.feasibility_score || 75), 0) / projects.length)
    : 65;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* 1. Header Greeting Ribbon matching Reference */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {getGreeting()} <span className="text-indigo-400">Alexander</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Here's what's happening with your portfolio today.
            </p>
          </div>

          {/* Today's Progress Bar matching Reference */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-200">Portfolio Feasibility & Progress</span>
            </div>

            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="w-full h-3 rounded-full bg-slate-800/90 overflow-hidden relative">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-500 transition-all duration-700 shadow-md shadow-indigo-500/30"
                  style={{ width: `${avgFeasibility}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-indigo-300 flex-shrink-0">
                {avgFeasibility}% complete
              </span>
            </div>
          </div>
        </div>

        {/* 2. Upcoming Tasks / Featured Projects Grid matching Reference */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Upcoming Deliverables & Tasks</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                Priority Sprints
              </span>
            </h3>
            <a href="#portfolio-section" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <span>View all</span>
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.slice(0, 3).map((project, idx) => {
              const priority = idx === 0 ? "High priority" : idx === 1 ? "Medium" : "Low";
              const priorityClass = 
                idx === 0 
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                  : idx === 1 
                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" 
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
              
              const timeLeft = idx === 0 ? "12 days left" : idx === 1 ? "45 days left" : `${project.expected_days} days left`;

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 hover:border-indigo-500/40 hover:bg-slate-900 transition-all duration-200 shadow-md space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold border", priorityClass)}>
                        {priority}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="h-3 w-3 text-slate-500" />
                        {timeLeft}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {project.name}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer: Date & Staff Stack matching Reference */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 font-medium">
                      <CalendarIcon className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{project.expected_days}d Sprint</span>
                    </div>

                    <div className="flex items-center -space-x-1.5">
                      <div className="h-6 w-6 rounded-full bg-blue-600 border border-slate-900 flex items-center justify-center text-[9px] font-bold text-white">
                        EA
                      </div>
                      <div className="h-6 w-6 rounded-full bg-purple-600 border border-slate-900 flex items-center justify-center text-[9px] font-bold text-white">
                        RC
                      </div>
                      <div className="h-6 w-6 rounded-full bg-slate-800 border border-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-300">
                        +{project.available_employees}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 3. Analytics & Quick Actions 4-Column Grid matching Reference */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Performance Bar Chart Widget */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Performance</span>
              <span className="text-[10px] text-slate-400 font-medium">This week ▾</span>
            </div>

            {/* Custom SVG/CSS Bar Chart matching reference */}
            <div className="h-28 flex items-end justify-between gap-2 pt-4 px-1">
              {[
                { day: "Mo", h: "40%", peak: false },
                { day: "Tu", h: "65%", peak: false },
                { day: "We", h: "50%", peak: false },
                { day: "Th", h: "95%", peak: true },
                { day: "Fr", h: "70%", peak: false },
                { day: "Sa", h: "60%", peak: false },
                { day: "Su", h: "45%", peak: false },
              ].map((item) => (
                <div key={item.day} className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
                  <div 
                    className={cn(
                      "w-full rounded-t-md transition-all duration-300",
                      item.peak 
                        ? "bg-gradient-to-t from-indigo-600 to-purple-500 shadow-md shadow-indigo-500/40" 
                        : "bg-indigo-950/60 hover:bg-indigo-900/80"
                    )}
                    style={{ height: item.h }}
                  />
                  <span className="text-[10px] text-slate-500 font-medium">{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Task / Feasibility Donut Overview Widget */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-3 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Task & Scope Overview</span>
            </div>

            <div className="flex items-center justify-between gap-3 py-1">
              {/* Donut graphic */}
              <div className="relative flex h-20 w-20 items-center justify-center flex-shrink-0">
                <svg className="h-20 w-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="6" className="text-slate-800" fill="transparent" />
                  <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="6" strokeDasharray="200" strokeDashoffset="50" className="text-indigo-500" strokeLinecap="round" fill="transparent" />
                  <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="6" strokeDasharray="200" strokeDashoffset="140" className="text-purple-400" strokeLinecap="round" fill="transparent" />
                </svg>
                <div className="absolute text-center">
                  <div className="text-base font-extrabold text-white leading-none">
                    {kpis?.total_projects ? kpis.total_projects * 4 : 23}
                  </div>
                  <div className="text-[8px] text-slate-400 uppercase font-semibold">Total</div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-1.5 text-[11px] flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    Feasible
                  </span>
                  <span className="font-bold text-slate-200">{kpis?.feasible_count || 15}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-purple-400" />
                    In Progress
                  </span>
                  <span className="font-bold text-slate-200">{kpis?.feasible_with_changes_count || 5}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-600" />
                    Pending
                  </span>
                  <span className="font-bold text-slate-200">{kpis?.not_feasible_count || 3}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Widget matching Reference */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2 shadow-md flex flex-col justify-between">
            <span className="text-xs font-bold text-white px-1">Quick Actions</span>

            <div className="space-y-1.5">
              <Link
                href="/create"
                className="w-full flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-2 text-xs font-semibold text-slate-200 hover:border-indigo-500/50 hover:bg-indigo-950/20 hover:text-indigo-300 transition-all"
              >
                <PlusCircle className="h-3.5 w-3.5 text-indigo-400" />
                <span>+ Create Project</span>
              </Link>

              <Link
                href="/lead"
                className="w-full flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-2 text-xs font-semibold text-slate-200 hover:border-indigo-500/50 hover:bg-indigo-950/20 hover:text-indigo-300 transition-all"
              >
                <CalendarIcon className="h-3.5 w-3.5 text-purple-400" />
                <span>Schedule Sprint</span>
              </Link>

              {projects.length > 0 && (
                <Link
                  href={`/projects/${projects[0].id}`}
                  className="w-full flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-2 text-xs font-semibold text-slate-200 hover:border-indigo-500/50 hover:bg-indigo-950/20 hover:text-indigo-300 transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  <span>AI Feasibility Sandbox</span>
                </Link>
              )}

              <Link
                href="/employee"
                className="w-full flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-2 text-xs font-semibold text-slate-200 hover:border-indigo-500/50 hover:bg-indigo-950/20 hover:text-indigo-300 transition-all"
              >
                <FileText className="h-3.5 w-3.5 text-emerald-400" />
                <span>Team Task Board</span>
              </Link>
            </div>
          </div>

          {/* Notifications Stream Widget matching Reference */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2.5 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-white">Notifications</span>
              <span className="text-[10px] text-indigo-400 font-semibold cursor-pointer hover:underline">View all →</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2.5 rounded-xl p-1.5 hover:bg-slate-850/50 transition-colors">
                <div className="h-6 w-6 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bell className="h-3 w-3" />
                </div>
                <div className="text-xs min-w-0 flex-1">
                  <div className="font-semibold text-slate-200 text-[11px] truncate">Deadline approaching</div>
                  <div className="text-[10px] text-slate-400 truncate">Sprint review in 1 hour</div>
                </div>
                <span className="text-[9px] text-slate-500 flex-shrink-0">5m</span>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl p-1.5 hover:bg-slate-850/50 transition-colors">
                <div className="h-6 w-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <div className="text-xs min-w-0 flex-1">
                  <div className="font-semibold text-slate-200 text-[11px] truncate">Task update</div>
                  <div className="text-[10px] text-slate-400 truncate">2 completed, 3 pending</div>
                </div>
                <span className="text-[9px] text-slate-500 flex-shrink-0">1h</span>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl p-1.5 hover:bg-slate-850/50 transition-colors">
                <div className="h-6 w-6 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageSquare className="h-3 w-3" />
                </div>
                <div className="text-xs min-w-0 flex-1">
                  <div className="font-semibold text-slate-200 text-[11px] truncate">New message</div>
                  <div className="text-[10px] text-slate-400 truncate">AI Scoper generated plan</div>
                </div>
                <span className="text-[9px] text-slate-500 flex-shrink-0">3h</span>
              </div>
            </div>
          </div>

        </div>

        {/* 4. Complete Project Portfolio Section with Full Filter & Search */}
        <div id="portfolio-section" className="space-y-4 pt-4 border-t border-slate-800/80">
          
          {/* Section Title & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <FolderKanban className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Project Portfolio Blueprints ({projects.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Detailed AI Feasibility, manpower estimations, and timeline allocations
                </p>
              </div>
            </div>

            <button
              onClick={loadData}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors self-start sm:self-auto"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Quick Feasibility Filter Pill Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-400 mr-2">Feasibility:</span>
              
              <button
                onClick={() => setFeasibilityFilter("ALL")}
                className={cn(
                  "rounded-xl px-3 py-1.5 font-semibold transition-all",
                  feasibilityFilter === "ALL"
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                )}
              >
                All ({kpis?.total_projects || 0})
              </button>

              <button
                onClick={() => setFeasibilityFilter("FEASIBLE")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold transition-all",
                  feasibilityFilter === "FEASIBLE"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-900/50"
                )}
              >
                <span>🟢 Feasible</span>
                <span>({kpis?.feasible_count || 0})</span>
              </button>

              <button
                onClick={() => setFeasibilityFilter("FEASIBLE WITH CHANGES")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold transition-all",
                  feasibilityFilter === "FEASIBLE WITH CHANGES"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-950/40 text-amber-400 border border-amber-500/20 hover:bg-amber-900/50"
                )}
              >
                <span>🟡 Feasible with Changes</span>
                <span>({kpis?.feasible_with_changes_count || 0})</span>
              </button>

              <button
                onClick={() => setFeasibilityFilter("NOT FEASIBLE")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold transition-all",
                  feasibilityFilter === "NOT FEASIBLE"
                    ? "bg-rose-600 text-white"
                    : "bg-rose-950/40 text-rose-400 border border-rose-500/20 hover:bg-rose-900/50"
                )}
              >
                <span>🔴 Not Feasible</span>
                <span>({kpis?.not_feasible_count || 0})</span>
              </button>
            </div>

            {/* Search Box */}
            <form onSubmit={handleSearchSubmit} className="relative min-w-[240px] max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search project name or scope..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </form>
          </div>

          {/* Project List / Cards */}
          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/30 p-16 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
              <p className="text-sm font-semibold text-slate-300">Loading Manager Portfolio...</p>
              <p className="text-xs text-slate-500">Querying AI decision blueprints</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 p-12 text-center">
              <div className="rounded-full bg-slate-800/80 p-4 text-slate-400 mb-3">
                <FolderKanban className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-white">No projects found</h4>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">
                No project matches your current filter or search criteria. Create a new project to run an AI feasibility analysis.
              </p>
              <Link
                href="/create"
                className="mt-4 flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/30"
              >
                <PlusCircle className="h-4 w-4" />
                <span>+ Create New Project</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {projects.map((project) => {
                const analysis = project.analysis;
                const criticalRisks = analysis?.risk_analysis?.filter((r) => r.severity === "Critical").length || 0;
                const totalRisks = analysis?.risk_analysis?.length || 0;
                const recommendedStaff = analysis?.employee_analysis?.total_recommended || 6;
                const availableStaff = project.available_employees;
                const gap = availableStaff - recommendedStaff;

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group relative block rounded-2xl border border-slate-800/90 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-[#0c1220] p-5 sm:p-6 backdrop-blur-sm transition-all duration-200 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-950/20"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      
                      {/* Project Main Info */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h4 className="text-lg sm:text-xl font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                            {project.name}
                          </h4>

                          {analysis?.feasibility && (
                            <FeasibilityBadge
                              status={analysis.feasibility.status}
                              score={analysis.feasibility.feasibility_score}
                              size="sm"
                            />
                          )}

                          <span
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                              project.status === "Active"
                                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                : project.status === "Completed"
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            )}
                          >
                            {project.status}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>

                        {/* Metadata Tags */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="h-3.5 w-3.5 text-indigo-400" />
                            <span>Timeline: <strong className="text-slate-200">{project.expected_days} Days</strong></span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-emerald-400" />
                            <span>
                              Staff: <strong className="text-slate-200">{availableStaff} Available</strong> / {recommendedStaff} Needed
                            </span>
                            {gap < 0 && (
                              <span className="rounded bg-rose-500/20 px-1.5 py-0.2 text-[10px] font-bold text-rose-400">
                                {gap} Shortage
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <ShieldAlert className={cn("h-3.5 w-3.5", criticalRisks > 0 ? "text-rose-400" : "text-amber-400")} />
                            <span>
                              Risks: <strong className={criticalRisks > 0 ? "text-rose-400" : "text-slate-200"}>{totalRisks} Total</strong>
                              {criticalRisks > 0 && ` (${criticalRisks} Critical)`}
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-500">
                            Created: {formatDate(project.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Right Action Ribbon */}
                      <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                        <button
                          onClick={(e) => handleDelete(e, project.id, project.name)}
                          className="rounded-xl p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="flex items-center gap-1.5 rounded-xl bg-indigo-600/10 border border-indigo-500/30 px-3.5 py-2 text-xs font-bold text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
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
