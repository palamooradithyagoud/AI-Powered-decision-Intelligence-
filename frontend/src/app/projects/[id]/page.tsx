"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import FeasibilityBadge from "@/components/FeasibilityBadge";
import RiskSeverityBadge from "@/components/RiskSeverityBadge";
import GanttTimeline from "@/components/GanttTimeline";
import WorkflowGraph from "@/components/WorkflowGraph";
import ResourceChart from "@/components/ResourceChart";
import FeasibilityRadar from "@/components/FeasibilityRadar";
import RiskMatrix from "@/components/RiskMatrix";
import WhatIfSimulator from "@/components/WhatIfSimulator";
import ExportBlueprintModal from "@/components/ExportBlueprintModal";
import { fetchProjectById, reanalyzeProject, sendProjectToLead } from "@/lib/api";
import { Project } from "@/types";
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  Layers, 
  CheckCircle2, 
  AlertOctagon, 
  Sparkles, 
  FileText, 
  Sliders, 
  Download, 
  RefreshCw, 
  Cpu, 
  Database, 
  Server, 
  Globe, 
  ShieldCheck, 
  Clock, 
  ListOrdered, 
  Lightbulb, 
  TrendingUp, 
  Network,
  ExternalLink,
  Send,
  Check,
  ArrowRight
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export default function ProjectBlueprintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | "blueprint"
    | "summary"
    | "features"
    | "requirements"
    | "employees"
    | "timeline"
    | "tech"
    | "risks"
    | "feasibility"
    | "recommendations"
  >("blueprint");

  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isSendingToLead, setIsSendingToLead] = useState(false);
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false);

  const loadProject = async () => {
    setLoading(true);
    try {
      const data = await fetchProjectById(resolvedParams.id);
      setProject(data);
    } catch (err) {
      console.error("Failed to load project:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [resolvedParams.id]);

  const handleReanalyze = async () => {
    if (!project) return;
    setIsReanalyzing(true);
    try {
      const updated = await reanalyzeProject(project.id);
      setProject(updated);
    } catch (err) {
      alert("Failed to re-analyze project");
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleSendToLead = async () => {
    if (!project) return;
    setIsSendingToLead(true);
    try {
      const updated = await sendProjectToLead(project.id);
      setProject(updated);
      setIsHandoffModalOpen(true);
    } catch (err: any) {
      alert(err.message || "Failed to dispatch project to Project Lead");
    } finally {
      setIsSendingToLead(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-[#6366f1] animate-spin" />
            <Sparkles className="absolute h-5 w-5 text-[#6366f1]" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Loading Project Blueprint...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="rounded-full bg-rose-50 p-4 text-rose-500 border border-rose-200">
            <AlertOctagon className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Project Not Found</h3>
          <p className="text-xs text-slate-500">The requested project plan could not be retrieved.</p>
          <Link href="/" className="rounded-xl bg-[#6366f1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4f46e5]">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const analysis = project.analysis;
  const { summary, features, must_need_requirements, employee_analysis, timeline_breakdown, tools_and_technologies, risk_analysis, feasibility, ai_recommendation } = analysis;

  const tabs = [
    { id: "blueprint", label: "Final Blueprint", icon: FileText },
    { id: "feasibility", label: "Feasibility Score", icon: TrendingUp },
    { id: "summary", label: "Summary", icon: Lightbulb },
    { id: "features", label: "Features", icon: Layers, count: features.must_have.length + features.optional.length },
    { id: "requirements", label: "Must-Needs", icon: CheckCircle2, count: must_need_requirements.length },
    { id: "employees", label: "Employees & Roles", icon: Users, count: employee_analysis.roles.length },
    { id: "timeline", label: "Timeline & Gantt", icon: Calendar, count: timeline_breakdown.phases.length },
    { id: "tech", label: "Tech Stack", icon: Cpu, count: tools_and_technologies.length },
    { id: "risks", label: "Risk Matrix", icon: ShieldCheck, count: risk_analysis.length },
    { id: "recommendations", label: "AI Recommendations", icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      <Navbar />

      {/* Interactive Modals */}
      <WhatIfSimulator
        project={project}
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />

      {/* Celebratory Handoff Modal */}
      {/* Handoff Modal */}
      {isHandoffModalOpen && project && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/25 animate-bounce">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                Dispatched for Lead Review
              </span>
              <h2 className="text-2xl font-bold text-slate-900">
                Project Dispatched to {project.lead_assigned || "Ishita Rao"}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                The technical blueprint, {timeline_breakdown.phases.length}-phase timeline milestones, and sprint deliverable backlog for <strong className="text-slate-900">{project.name}</strong> are now in the Project Lead approvals inbox.
              </p>
            </div>

            {/* Scheduled Calendar Meeting Card */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4f46e5] flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Auto-Scheduled Calendar Kickoff
                </span>
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                  10:00 AM Today
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900">
                Sprint Kickoff & Architecture Review: {project.name}
              </p>
              <p className="text-[11px] text-slate-600">
                Attendees: <strong className="text-slate-800">Arjun Reddy (Manager)</strong> & <strong className="text-slate-800">{project.lead_assigned || "Ishita Rao"} (Lead)</strong>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <Link
                href="/lead"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-purple-600 px-5 py-3.5 text-sm font-bold text-white shadow-md hover:from-[#4f46e5] hover:to-purple-700 transition-all hover:scale-[1.01]"
              >
                <span>Switch to Project Lead Command Center</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={() => setIsHandoffModalOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <span>Close Window</span>
              </button>
            </div>

          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Back Link & Navigation Breadcrumb */}
        <div className="no-print flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#6366f1] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Manager Dashboard</span>
          </Link>

          <span className="text-xs text-slate-400 font-medium">
            Last Evaluated: {formatDate(project.updated_at)}
          </span>
        </div>

        {/* Master Project Executive Header Card */}
        <div className="blueprint-card rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* Rejection Alert Banner if Rejected by Lead */}
          {project.rejection_reason && (project.status === "Rejected by Lead" || project.lead_status === "Rejected") && (
            <div className="rounded-2xl border-2 border-rose-300 bg-gradient-to-r from-rose-50 via-red-50 to-white p-5 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shrink-0 mt-0.5">
                  <AlertOctagon className="h-5 w-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-rose-900">
                      Project Rejected by Lead: {project.lead_assigned || "Ishita Rao"}
                    </h3>
                    <span className="rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 border border-rose-300">
                      Requires Refinement
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 font-medium leading-relaxed">
                    "{project.rejection_reason}"
                  </p>
                  <p className="text-[11px] text-rose-600 pt-0.5">
                    Adjust the timeline or available headcount using the What-If Sandbox or Re-Analyze with updated requirements, then resubmit to the Project Lead.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Project Details */}
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  {project.name}
                </h1>
                <FeasibilityBadge
                  status={feasibility.status}
                  score={feasibility.feasibility_score}
                  size="lg"
                />

                {/* Lead Status Badges */}
                {project.status === "Pending Lead Review" || project.lead_status === "Pending Review" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300 shadow-xs">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    Pending Lead Review ({project.lead_assigned || "Ishita Rao"})
                  </span>
                ) : project.status === "Rejected by Lead" || project.lead_status === "Rejected" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800 border border-rose-300">
                    <AlertOctagon className="h-3.5 w-3.5 text-rose-600" />
                    Rejected by Lead
                  </span>
                ) : project.lead_status === "Accepted" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-xs">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Accepted & In Execution
                  </span>
                ) : null}

                {analysis.engine && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-[#4f46e5] border border-indigo-200">
                    <Sparkles className="h-3.5 w-3.5 text-[#6366f1]" />
                    {analysis.engine}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                {project.description}
              </p>

              {/* Key Baseline Specs */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[#6366f1]" />
                  <span>Timeline: <strong className="text-slate-800">{project.expected_days} Days</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <span>
                    Staff: <strong className="text-slate-800">{project.available_employees} Allocated</strong> vs {employee_analysis.total_recommended} Needed
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  <span>
                    Feasibility Index: <strong className="text-slate-900">{feasibility.feasibility_score}%</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Buttons */}
            <div className="no-print flex flex-wrap items-center gap-2.5 shrink-0">
              {/* Send or Resubmit to Project Lead Action */}
              {!project.sent_to_lead || project.status === "Rejected by Lead" || project.lead_status === "Rejected" ? (
                <button
                  onClick={handleSendToLead}
                  disabled={isSendingToLead}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] via-indigo-500 to-purple-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md hover:from-[#4f46e5] hover:to-purple-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 group cursor-pointer"
                >
                  {isSendingToLead ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      <span>{project.lead_status === "Rejected" ? "Resubmit to Lead →" : "Send to Project Lead →"}</span>
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href="/lead"
                  className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-xs font-bold text-[#4f46e5] hover:bg-indigo-100 transition-colors shadow-xs"
                >
                  <Check className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Lead Workspace →</span>
                </Link>
              )}

              {/* What-If Simulation Sandbox */}
              <button
                onClick={() => setIsSimulatorOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-xs font-bold text-[#4f46e5] hover:bg-indigo-100 transition-all shadow-sm"
              >
                <Sliders className="h-4 w-4 text-[#6366f1]" />
                <span>What-If Sandbox</span>
              </button>

              {/* Export Blueprint */}
              <button
                onClick={() => setIsExportOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <Download className="h-4 w-4 text-slate-500" />
                <span>Export Report</span>
              </button>

              {/* Re-analyze Button */}
              <button
                onClick={handleReanalyze}
                disabled={isReanalyzing}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-900 transition-all disabled:opacity-50"
              >
                <RefreshCw className={cn("h-4 w-4", isReanalyzing && "animate-spin")} />
                <span>{isReanalyzing ? "Re-analyzing..." : "Re-Analyze"}</span>
              </button>
            </div>

          </div>

          {/* Key Verdict Callout Banner */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-[#6366f1] shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4f46e5]">
                  AI Feasibility Summary & Verdict
                </span>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5 leading-relaxed">
                  {feasibility.key_verdict}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Navigation Ribbon */}
        <div className="no-print border-b border-slate-200 overflow-x-auto">
          <div className="flex gap-1.5 min-w-max pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
                    isActive
                      ? "bg-[#6366f1] text-white shadow-sm font-bold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px]",
                        isActive ? "bg-indigo-800 text-white" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: FINAL CONSOLIDATED PROJECT BLUEPRINT */}
        {activeTab === "blueprint" && (
          <div className="space-y-8">
            
            {/* Section A: Project Overview & Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Lightbulb className="h-4 w-4 text-[#6366f1]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  A. Project Summary & Scope Definition
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4f46e5]">
                    What It Is
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {summary.what_it_is}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Problem It Solves
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {summary.problem_solved}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                    What Needs To Be Built
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {summary.what_needs_to_be_built}
                  </p>
                </div>
              </div>
            </div>

            {/* Section B: Features (Must-Have vs Optional) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#6366f1]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    B. Main Features Prioritization
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {features.must_have.length} Must-Have • {features.optional.length} Optional
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Must Have */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Must-Have Features ({features.must_have.length})</span>
                  </div>
                  <div className="space-y-2.5">
                    {features.must_have.map((f, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-slate-200 bg-[#f8fafc] p-3.5 space-y-1.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate">{f.name}</span>
                          <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-[#4f46e5] border border-indigo-100">
                            {f.complexity} Complexity
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{f.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optional */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    <span>Optional / Nice-to-Have Features ({features.optional.length})</span>
                  </div>
                  <div className="space-y-2.5">
                    {features.optional.map((f, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-slate-200 bg-[#f8fafc] p-3.5 space-y-1.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-700 truncate">{f.name}</span>
                          <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                            Optional (v1.1)
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section C: Must-Need Requirements */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <CheckCircle2 className="h-4 w-4 text-[#6366f1]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  C. Must-Need Technical & Functional Requirements
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {must_need_requirements.map((req, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4 space-y-2.5 shadow-sm"
                  >
                    <span className="text-xs font-bold text-[#4f46e5] uppercase tracking-wider block">
                      {req.category}
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {req.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#6366f1] mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      <strong>Rationale:</strong> {req.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section D: Employee Requirement Analysis */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Users className="h-4 w-4 text-[#6366f1]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  D. Employee Requirement & Team Composition Analysis
                </h3>
              </div>
              <ResourceChart analysis={employee_analysis} />
            </div>

            {/* Section E: Timeline Breakdown & Gantt */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Calendar className="h-4 w-4 text-[#6366f1]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  E. Phased Timeline & Execution Gantt Breakdown
                </h3>
              </div>
              <GanttTimeline timeline={timeline_breakdown} />
            </div>

            {/* Interactive Architecture Workflow Diagram */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Network className="h-4 w-4 text-[#6366f1]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Interactive Execution Architecture Graph
                </h3>
              </div>
              <WorkflowGraph phases={timeline_breakdown.phases} />
            </div>

            {/* Section F: Tools & Technology Recommendations */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Cpu className="h-4 w-4 text-[#6366f1]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  F. Recommended Tools & Technology Stack
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tools_and_technologies.map((tech, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4 space-y-2 shadow-sm"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {tech.layer}
                    </span>
                    <div className="text-sm font-bold text-[#4f46e5]">
                      {tech.technology}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed border-t border-slate-200 pt-2">
                      {tech.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section G: Risk Analysis Matrix */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="h-4 w-4 text-[#6366f1]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  G. Risk Analysis & Mitigation Matrix
                </h3>
              </div>
              <RiskMatrix risks={risk_analysis} />
            </div>

            {/* Section H: Feasibility Deep Dive */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <TrendingUp className="h-4 w-4 text-[#6366f1]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  H. Project Feasibility Evaluation & 5-Dimension Radar
                </h3>
              </div>
              <FeasibilityRadar feasibility={feasibility} />
            </div>

            {/* Section I: AI Strategic Recommendations for Manager */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sparkles className="h-4 w-4 text-[#6366f1]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  I. Strategic AI Recommendations for the Manager
                </h3>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5 space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4f46e5]">
                    Primary Manager Guidance
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                    {ai_recommendation.primary_advice}
                  </h4>
                </div>

                {/* Actionable Steps */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Actionable Implementation Steps:
                  </span>
                  <div className="space-y-2">
                    {ai_recommendation.actionable_steps.map((step, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 rounded-xl bg-white p-3 border border-slate-200 shadow-sm"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-[#4f46e5]">
                          {i + 1}
                        </span>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested Adjustments */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Headcount Delta Needed
                    </span>
                    <div className="text-lg font-extrabold text-[#4f46e5] mt-1">
                      +{ai_recommendation.suggested_adjustments.recommended_additional_employees} Employees
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Timeline Buffer Extension
                    </span>
                    <div className="text-lg font-extrabold text-[#4f46e5] mt-1">
                      +{ai_recommendation.suggested_adjustments.recommended_timeline_extension_days} Days
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-sm sm:col-span-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Key Technical Roles Needed
                    </span>
                    <div className="text-xs text-slate-700 mt-1 truncate">
                      {ai_recommendation.suggested_adjustments.critical_skills_needed.join(", ")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Feasibility Radar Deep Dive */}
        {activeTab === "feasibility" && (
          <div className="space-y-6">
            <FeasibilityRadar feasibility={feasibility} />

            {/* Handoff Ribbon inside Feasibility Tab */}
            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-900 to-slate-900 p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  Project Lead Dispatch
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white">
                  Ready to execute sprint milestones?
                </h4>
                <p className="text-xs text-slate-300">
                  {project.sent_to_lead
                    ? `This project has been sent to ${project.lead_assigned || "Ishita Rao"} for feasibility review & work allocation.`
                    : `Transfer the feasibility plan and task deliverables directly to Project Lead ${project.lead_assigned || "Ishita Rao"}.`}
                </p>
              </div>

              {!project.sent_to_lead ? (
                <button
                  onClick={handleSendToLead}
                  disabled={isSendingToLead}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-purple-600 px-5 py-3 text-xs font-extrabold text-white shadow-md hover:from-[#4f46e5] hover:to-purple-700 transition-all shrink-0 cursor-pointer"
                >
                  {isSendingToLead ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send to Project Lead →</span>
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href="/lead"
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all shrink-0"
                >
                  <Check className="h-4 w-4" />
                  <span>Open Lead Workspace</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Summary */}
        {activeTab === "summary" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-[#6366f1]" />
              Project Summary & Core Purpose
            </h3>
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-5 space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#4f46e5]">
                  What This Project Is
                </h5>
                <p className="text-sm text-slate-700 leading-relaxed">{summary.what_it_is}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-5 space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Problem It Eliminates
                </h5>
                <p className="text-sm text-slate-700 leading-relaxed">{summary.problem_solved}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-5 space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-purple-700">
                  Scope of What Needs To Be Built
                </h5>
                <p className="text-sm text-slate-700 leading-relaxed">{summary.what_needs_to_be_built}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Features */}
        {activeTab === "features" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#6366f1]" />
                Must-Have Features ({features.must_have.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.must_have.map((f, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-sm">{f.name}</span>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        {f.complexity} Complexity
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{f.description}</p>
                    {f.rationale && (
                      <p className="text-[11px] text-slate-400 border-t border-slate-200 pt-1.5">
                        <strong>Rationale:</strong> {f.rationale}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-600" />
                Optional / Nice-to-Have Features ({features.optional.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.optional.map((f, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 text-sm">{f.name}</span>
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                        Optional
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{f.description}</p>
                    {f.rationale && (
                      <p className="text-[11px] text-slate-400 border-t border-slate-200 pt-1.5">
                        <strong>Benefit:</strong> {f.rationale}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Requirements */}
        {activeTab === "requirements" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#6366f1]" />
              Essential Technical & Functional Requirements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {must_need_requirements.map((req, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-[#f8fafc] p-5 space-y-3 shadow-sm">
                  <span className="text-xs font-bold text-[#4f46e5] uppercase tracking-wider block">
                    {req.category}
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {req.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-200">
                    <strong>Why Required:</strong> {req.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 6: Employees */}
        {activeTab === "employees" && (
          <ResourceChart analysis={employee_analysis} />
        )}

        {/* Tab 7: Timeline */}
        {activeTab === "timeline" && (
          <div className="space-y-8">
            <GanttTimeline timeline={timeline_breakdown} />
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4">
                Interactive Execution Architecture Flow
              </h4>
              <WorkflowGraph phases={timeline_breakdown.phases} />
            </div>
          </div>
        )}

        {/* Tab 8: Tech Stack */}
        {activeTab === "tech" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-[#6366f1]" />
              Recommended Tools & Technologies (With Rationale)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tools_and_technologies.map((tech, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-[#f8fafc] p-5 space-y-2 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {tech.layer}
                  </span>
                  <div className="text-base font-bold text-[#4f46e5]">
                    {tech.technology}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-200 pt-2">
                    {tech.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 9: Risks */}
        {activeTab === "risks" && (
          <RiskMatrix risks={risk_analysis} />
        )}

        {/* Tab 10: Recommendations */}
        {activeTab === "recommendations" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#6366f1]" />
              Strategic AI Recommendations for Manager
            </h3>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4f46e5]">
                Primary Executive Recommendation
              </span>
              <p className="text-base font-bold text-slate-900 mt-1">
                {ai_recommendation.primary_advice}
              </p>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Recommended Action Sequence:
              </h5>
              <div className="space-y-2.5">
                {ai_recommendation.actionable_steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6366f1] text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
