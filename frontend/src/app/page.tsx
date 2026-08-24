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
  Calendar, 
  Users, 
  ArrowRight, 
  Trash2, 
  ShieldAlert,
  Sparkles,
  Layers,
  BarChart3,
  RefreshCw
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
        fetchKPIs(),
        fetchProjects({
          search: searchTerm,
          feasibility: feasibilityFilter,
          status: statusFilter,
        }),
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

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Header Ribbon */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Manager Project Control Hub
              </h1>
              <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
                Live Overview
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              AI Project Planning & Feasibility System • Analyze requirements, team allocation, timelines, and risks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              <span>Refresh</span>
            </button>

            <Link
              href="/create"
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ Create New Project</span>
            </Link>
          </div>
        </div>

        {/* Top 4 Dashboard KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Projects"
            value={kpis ? kpis.total_projects : "—"}
            subtitle="All managed project plans"
            icon={FolderKanban}
            color="blue"
            onClick={() => {
              setFeasibilityFilter("ALL");
              setStatusFilter("ALL");
            }}
            active={feasibilityFilter === "ALL" && statusFilter === "ALL"}
          />

          <KpiCard
            title="Active Projects"
            value={kpis ? kpis.active_projects : "—"}
            subtitle="Projects in execution or planning"
            icon={Activity}
            color="emerald"
            onClick={() => setStatusFilter("Active")}
            active={statusFilter === "Active"}
          />

          <KpiCard
            title="Completed Projects"
            value={kpis ? kpis.completed_projects : "—"}
            subtitle="Successfully delivered projects"
            icon={CheckCircle2}
            color="purple"
            onClick={() => setStatusFilter("Completed")}
            active={statusFilter === "Completed"}
          />

          <KpiCard
            title="At-Risk Projects"
            value={kpis ? kpis.at_risk_projects : "—"}
            subtitle="Projects needing scope/staff revisions"
            icon={AlertTriangle}
            color="rose"
            onClick={() => {
              setFeasibilityFilter("NOT FEASIBLE");
            }}
            active={feasibilityFilter === "NOT FEASIBLE"}
          />
        </div>

        {/* Quick Feasibility Filter Pill Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400 mr-2">Feasibility Filter:</span>
            
            <button
              onClick={() => setFeasibilityFilter("ALL")}
              className={cn(
                "rounded-lg px-3 py-1.5 font-semibold transition-all",
                feasibilityFilter === "ALL"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              )}
            >
              All Projects ({kpis?.total_projects || 0})
            </button>

            <button
              onClick={() => setFeasibilityFilter("FEASIBLE")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all",
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
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all",
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
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all",
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
              className="w-full rounded-lg border border-slate-800 bg-slate-950/80 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </form>
        </div>

        {/* Project List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Project Portfolio & AI Analysis Status ({projects.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/30 p-16 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mb-3" />
              <p className="text-sm font-semibold text-slate-300">Loading Manager Projects...</p>
              <p className="text-xs text-slate-500">Querying AI planning blueprints</p>
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
                className="mt-4 flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-md shadow-blue-600/30"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Create New Project</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {projects.map((project) => {
                const analysis = project.analysis;
                const criticalRisks = analysis.risk_analysis.filter((r) => r.severity === "Critical").length;
                const totalRisks = analysis.risk_analysis.length;
                const recommendedStaff = analysis.employee_analysis.total_recommended;
                const availableStaff = project.available_employees;
                const gap = availableStaff - recommendedStaff;

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group relative block rounded-2xl border border-slate-800/90 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-[#0c1220] p-5 sm:p-6 backdrop-blur-sm transition-all duration-200 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-950/20"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      
                      {/* Project Main Info */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h4 className="text-lg sm:text-xl font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                            {project.name}
                          </h4>

                          <FeasibilityBadge
                            status={analysis.feasibility.status}
                            score={analysis.feasibility.feasibility_score}
                            size="sm"
                          />

                          <span
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                              project.status === "Active"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
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
                            <Calendar className="h-3.5 w-3.5 text-blue-400" />
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
                          className="rounded-lg p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="flex items-center gap-1.5 rounded-lg bg-blue-600/10 border border-blue-500/30 px-3.5 py-2 text-xs font-bold text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
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
