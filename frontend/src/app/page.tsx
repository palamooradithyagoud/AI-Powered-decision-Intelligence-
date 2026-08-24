"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  fetchKPIs, 
  fetchProjects, 
  deleteProject,
  fetchMeetings 
} from "@/lib/api";
import { Project, DashboardKPIs, MeetingItem } from "@/types";
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
  Check
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export default function ManagerDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [feasibilityFilter, setFeasibilityFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpiData, projectsData, meetingsData] = await Promise.all([
        fetchKPIs().catch(() => null),
        fetchProjects({
          search: searchTerm,
          feasibility: feasibilityFilter,
          status: statusFilter,
        }).catch(() => []),
        fetchMeetings().catch(() => []),
      ]);
      setKpis(kpiData);
      setProjects(projectsData);
      setMeetings(meetingsData);
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

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
        
        {/* 1. Header Greeting Ribbon matching Reference */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {greeting}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Here's what's happening with your work today.
            </p>
          </div>

          {/* Today's Progress Bar matching Reference */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <TrendingUp className="h-4 w-4 text-[#6366f1]" />
              <span>Today's Progress</span>
            </div>

            <div className="flex items-center gap-4 flex-1 max-w-2xl">
              <div className="w-full h-2.5 rounded-full bg-slate-200/80 overflow-hidden relative">
                <div 
                  className="h-full rounded-full bg-[#6366f1] transition-all duration-700"
                  style={{ width: `${avgFeasibility}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-500 flex-shrink-0">
                {avgFeasibility}% complete
              </span>
            </div>
          </div>
        </div>

        {/* 2. Upcoming Tasks / Featured Projects Grid matching Reference */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Upcoming Tasks
            </h3>
            <a href="#portfolio-section" className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1">
              <span>View all</span>
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.slice(0, 3).map((project, idx) => {
              const priority = idx === 0 ? "High priority" : idx === 1 ? "Medium" : "Low";
              const priorityClass = 
                idx === 0 
                  ? "bg-[#fef2f2] text-[#ef4444]" 
                  : idx === 1 
                  ? "bg-[#ede9fe] text-[#6366f1]" 
                  : "bg-[#f0fdf4] text-[#16a34a]";
              
              const timeLeft = idx === 0 ? "12 min left" : idx === 1 ? "58 min left" : "2 hr left";

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-5 hover:border-slate-300 hover:shadow-md transition-all duration-200 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={cn("rounded-lg px-2.5 py-0.5 text-[11px] font-semibold", priorityClass)}>
                        {priority}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {timeLeft}
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
                  </div>

                  {/* Card Footer: Date & Staff Stack matching Reference */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                      <span>{project.expected_days}d Sprint</span>
                    </div>

                    <div className="flex items-center -space-x-1.5">
                      <div className="h-6 w-6 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
                        EA
                      </div>
                      <div className="h-6 w-6 rounded-full bg-[#6366f1] border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
                        RC
                      </div>
                      <div className="h-6 w-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-600 shadow-sm">
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
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Performance</span>
              <span className="text-[10px] text-slate-500 font-medium cursor-pointer">This week ▾</span>
            </div>

            {/* Bar Chart matching Reference screenshot */}
            <div className="h-28 flex items-end justify-between gap-2 pt-2 px-1">
              {[
                { day: "Mo", h: "45%", peak: false },
                { day: "Tu", h: "60%", peak: false },
                { day: "We", h: "50%", peak: false },
                { day: "Th", h: "95%", peak: true },
                { day: "Fr", h: "70%", peak: false },
                { day: "Sa", h: "75%", peak: false },
                { day: "Su", h: "40%", peak: false },
              ].map((item) => (
                <div key={item.day} className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
                  <div 
                    className={cn(
                      "w-full rounded-md transition-all duration-300",
                      item.peak 
                        ? "bg-[#6366f1]" 
                        : "bg-[#e0e7ff] hover:bg-[#c7d2fe]"
                    )}
                    style={{ height: item.h }}
                  />
                  <span className="text-[10px] text-slate-400 font-medium">{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Task / Feasibility Donut Overview Widget */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Task Overview</span>
            </div>

            <div className="flex items-center justify-between gap-3 py-1">
              {/* Donut graphic */}
              <div className="relative flex h-20 w-20 items-center justify-center flex-shrink-0">
                <svg className="h-20 w-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="30" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                  <circle cx="40" cy="40" r="30" stroke="#cbd5e1" strokeWidth="6" strokeDasharray="188" strokeDashoffset="140" strokeLinecap="round" fill="transparent" />
                  <circle cx="40" cy="40" r="30" stroke="#818cf8" strokeWidth="6" strokeDasharray="188" strokeDashoffset="100" strokeLinecap="round" fill="transparent" />
                  <circle cx="40" cy="40" r="30" stroke="#6366f1" strokeWidth="6" strokeDasharray="188" strokeDashoffset="40" strokeLinecap="round" fill="transparent" />
                </svg>
                <div className="absolute text-center">
                  <div className="text-base font-bold text-slate-900 leading-none">
                    {kpis?.total_projects ? kpis.total_projects * 4 : 23}
                  </div>
                  <div className="text-[8px] text-slate-400 font-medium mt-0.5">Total tasks</div>
                </div>
              </div>

              {/* Legend matching Reference */}
              <div className="space-y-1.5 text-[11px] flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#6366f1]" />
                    Completed
                  </span>
                  <span className="font-bold text-slate-800">{kpis?.feasible_count || 15}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#818cf8]" />
                    In progress
                  </span>
                  <span className="font-bold text-slate-800">{kpis?.feasible_with_changes_count || 5}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                    Pending
                  </span>
                  <span className="font-bold text-slate-800">{kpis?.not_feasible_count || 3}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Widget matching Reference */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-2 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-900 px-1">Quick Actions</span>

            <div className="space-y-1.5">
              <Link
                href="/create"
                className="w-full flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <Plus className="h-3.5 w-3.5 text-slate-500" />
                <span>Create Task</span>
              </Link>

              <Link
                href="/calendar?schedule=true"
                className="w-full flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <CalendarIcon className="h-3.5 w-3.5 text-[#6366f1]" />
                <span className="font-semibold text-slate-900">Schedule Meeting</span>
              </Link>

              <Link
                href="/create"
                className="w-full flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-slate-500" />
                <span>New Project</span>
              </Link>

              <Link
                href="/employee"
                className="w-full flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                <span>Add Note</span>
              </Link>
            </div>
          </div>

          {/* Upcoming Briefings & Syncs Widget */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-2.5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-900">Upcoming Syncs</span>
              <Link href="/calendar" className="text-[10px] text-[#6366f1] font-bold cursor-pointer hover:underline">
                Calendar →
              </Link>
            </div>

            <div className="space-y-2">
              {meetings.slice(0, 3).map((m) => (
                <div key={m.id} className="flex items-start gap-2.5 rounded-xl p-1.5 hover:bg-slate-50 transition-colors">
                  <div className="h-6 w-6 rounded-full bg-indigo-50 text-[#6366f1] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CalendarIcon className="h-3 w-3" />
                  </div>
                  <div className="text-xs min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 text-[11px] truncate">{m.title}</div>
                    <div className="text-[10px] text-slate-500 truncate">{m.date} • {m.start_time}</div>
                  </div>
                  <a
                    href={m.location_or_link.includes("http") ? m.location_or_link : `https://${m.location_or_link}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-bold text-[#6366f1] hover:underline flex-shrink-0 flex items-center gap-0.5 pt-0.5"
                  >
                    <Video className="h-2.5 w-2.5" />
                    <span>Join</span>
                  </a>
                </div>
              ))}

              {meetings.length === 0 && (
                <div className="text-center py-4 text-xs text-slate-400 italic">
                  No upcoming syncs scheduled
                </div>
              )}
            </div>
          </div>

        </div>

        {/* 4. Complete Project Portfolio Section with Full Filter & Search */}
        <div id="portfolio-section" className="space-y-4 pt-6 border-t border-slate-200">
          
          {/* Section Title & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-[#6366f1]">
                <FolderKanban className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Project Portfolio Blueprints ({projects.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Full AI Feasibility, manpower estimations, and timeline allocations
                </p>
              </div>
            </div>

            <button
              onClick={loadData}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors self-start sm:self-auto shadow-sm"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Quick Feasibility Filter Pill Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500 mr-2">Feasibility:</span>
              
              <button
                onClick={() => setFeasibilityFilter("ALL")}
                className={cn(
                  "rounded-xl px-3 py-1.5 font-semibold transition-all",
                  feasibilityFilter === "ALL"
                    ? "bg-[#6366f1] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
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
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
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
                    ? "bg-amber-500 text-white"
                    : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
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
                    : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
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
                className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-[#6366f1] focus:bg-white focus:outline-none transition-colors"
              />
            </form>
          </div>

          {/* Project List / Cards */}
          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
              <RefreshCw className="h-8 w-8 animate-spin text-[#6366f1] mb-3" />
              <p className="text-sm font-semibold text-slate-700">Loading Manager Portfolio...</p>
              <p className="text-xs text-slate-400">Querying AI decision blueprints</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
              <div className="rounded-full bg-slate-100 p-4 text-slate-400 mb-3">
                <FolderKanban className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900">No projects found</h4>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                No project matches your current filter or search criteria. Create a new project to run an AI feasibility analysis.
              </p>
              <Link
                href="/create"
                className="mt-4 flex items-center gap-1.5 rounded-xl bg-[#6366f1] px-4 py-2 text-xs font-bold text-white hover:bg-[#4f46e5] transition-colors shadow-sm"
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

                          <span
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                              project.status === "Active"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                : project.status === "Completed"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            )}
                          >
                            {project.status}
                          </span>

                          {project.sent_to_lead && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              <Check className="h-3 w-3 text-emerald-600" />
                              Dispatched to Elena Rostova
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>

                        {/* Metadata Tags */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                            <span>Timeline: <strong className="text-slate-800">{project.expected_days} Days</strong></span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            <span>
                              Staff: <strong className="text-slate-800">{availableStaff} Available</strong> / {recommendedStaff} Needed
                            </span>
                            {gap < 0 && (
                              <span className="rounded bg-rose-50 px-1.5 py-0.2 text-[10px] font-bold text-rose-600 border border-rose-200">
                                {gap} Shortage
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <ShieldAlert className={cn("h-3.5 w-3.5", criticalRisks > 0 ? "text-rose-500" : "text-amber-500")} />
                            <span>
                              Risks: <strong className={criticalRisks > 0 ? "text-rose-600" : "text-slate-800"}>{totalRisks} Total</strong>
                              {criticalRisks > 0 && ` (${criticalRisks} Critical)`}
                            </span>
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
                          className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
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
