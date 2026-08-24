"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import FeasibilityBadge from "@/components/FeasibilityBadge";
import WhatIfSimulator from "@/components/WhatIfSimulator";
import { createProject, sendProjectToLead } from "@/lib/api";
import { Project } from "@/types";
import { 
  Sparkles, 
  ArrowLeft, 
  Clock, 
  Users, 
  FileText, 
  CheckCircle2, 
  Layers, 
  Zap, 
  Send,
  Calendar,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  FolderPlus,
  Compass,
  AlertTriangle,
  Check,
  Sliders,
  ExternalLink,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";

// Preset enterprise project templates for quick testing
const PROJECT_PRESETS = [
  {
    name: "AegisHealth AI Diagnostic Clinical Suite",
    description: "Enterprise HIPAA-compliant clinical oncology AI platform with automated DICOM radiograph image analysis, differential diagnosis suggestions, and FHIR electronic health record integration.",
    expected_days: 60,
    available_employees: 6,
    requirements: `1. DICOM medical image viewer with WebGL GPU-accelerated rendering and automatic lesion contour segmentation.
2. FHIR / HL7 standard interoperability pipeline to ingest hospital EHR medical histories securely.
3. Multi-modal generative AI clinical report summarizer with citation validation against medical literature.
4. Role-based access control (RBAC), multi-factor authentication, and immutable HIPAA audit logging.
5. Real-time radiologist collaborative review room with live annotations and speech-to-text dictation.
6. Asynchronous batch worker queue for heavy image inference processing with auto-scaling GPU workers.
7. Automated QA validation test suite and disaster recovery cloud replication on AWS / GCP.`
  },
  {
    name: "ApexPay Global Multi-Currency Gateway",
    description: "High-throughput omni-channel fintech payment platform with sub-50ms authorization latency, smart routing across 5 payment processors, and real-time fraud anomaly detection.",
    expected_days: 45,
    available_employees: 5,
    requirements: `1. Unified RESTful payment API for Card, Apple Pay, Google Pay, and SEPA/ACH bank transfers.
2. Intelligent payment routing engine with automatic failover and fee optimization across multiple acquiring banks.
3. Machine learning fraud scoring pipeline analyzing transaction velocity, IP geolocation, and device fingerprints in <30ms.
4. PCI-DSS Level 1 compliant tokenization vault with AES-256 field-level database encryption.
5. Real-time merchant telemetry dashboard with live transaction stream and automated daily settlement reconciliations.
6. High-availability distributed Redis cluster with optimistic locking for high-concurrency checkout bursts.
7. Webhook notification system with HMAC signature verification and exponential backoff retry queues.`
  },
  {
    name: "NovaCommerce Headless Marketplace",
    description: "Scalable B2B2C marketplace platform featuring multi-tenant storefronts, real-time inventory synchronization, dynamic pricing algorithms, and elastic search.",
    expected_days: 50,
    available_employees: 4,
    requirements: `1. Headless storefront powered by Next.js with sub-second page loads and SSR SEO optimization.
2. Multi-vendor seller portal with product catalog management, bulk CSV imports, and automated commission calculations.
3. Elasticsearch / Algolia integration for typo-tolerant product search, faceted filters, and personalized recommendations.
4. Real-time inventory sync engine with optimistic locking to prevent stock overselling during flash sales.
5. Automated order lifecycle workflows with invoice PDF generation and DHL/FedEx shipping tracking integrations.
6. Customer reviews, ratings, and AI-powered sentiment analysis for spam review detection.
7. Stripe Connect payout infrastructure for automated split payments to vendor bank accounts.`
  },
  {
    name: "GeoPulse IoT Fleet Telemetry Hub",
    description: "Real-time cold-chain asset tracking telemetry platform processing 25,000 GPS/temperature sensor pings per second with predictive route optimization.",
    expected_days: 30,
    available_employees: 3,
    requirements: `1. MQTT / WebSocket broker ingestion layer handling 25,000 telemetry packets/sec with Kafka buffering.
2. Real-time Mapbox interactive fleet map displaying live asset clusters, speed telemetry, and geofencing polygons.
3. Automated temperature breach alerting with instant SMS / email notifications and emergency dispatch webhooks.
4. Time-series analytics database (TimescaleDB / ClickHouse) with downsampled historical telemetry queries.
5. Machine learning predictive model for cold-chain compressor failure and driver fuel efficiency scoring.
6. Multi-tenant logistics enterprise portal with custom SLA violation reports and CSV/PDF export.
7. Kubernetes Helm chart deployment with Prometheus monitoring and Grafana operational dashboards.`
  }
];

const ANALYSIS_STEPS = [
  "Parsing project scope & extracting functional deliverables...",
  "Analyzing domain technical requirements & dependencies...",
  "Estimating specialist role compositions & manpower balance...",
  "Formulating realistic phased Gantt timeline & buffer window...",
  "Evaluating probability, impact & risk severity matrix...",
  "Synthesizing 5-dimension Feasibility Verdict & AI Blueprint..."
];

export default function CreateProjectPage() {
  const router = useRouter();

  // Stage 1: "input", Stage 2: "verdict"
  const [currentStage, setCurrentStage] = useState<"input" | "verdict">("input");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    expected_days: 45,
    available_employees: 5,
    requirements: "",
  });

  const [createdProject, setCreatedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // Handoff to lead states
  const [isSendingToLead, setIsSendingToLead] = useState(false);
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const handleApplyPreset = (preset: typeof PROJECT_PRESETS[0]) => {
    setFormData({
      name: preset.name,
      description: preset.description,
      expected_days: preset.expected_days,
      available_employees: preset.available_employees,
      requirements: preset.requirements,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.name.trim() || !formData.description.trim() || !formData.requirements.trim()) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    setIsLoading(true);
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev));
    }, 600);

    try {
      const newProject = await createProject({
        name: formData.name,
        description: formData.description,
        expected_days: Number(formData.expected_days),
        available_employees: Number(formData.available_employees),
        requirements: formData.requirements,
      });

      clearInterval(interval);
      setIsLoading(false);
      setCreatedProject(newProject);
      setCurrentStage("verdict");
    } catch (err: any) {
      clearInterval(interval);
      setIsLoading(false);
      setErrorMessage(err.message || "Failed to analyze project. Please check inputs and try again.");
    }
  };

  const handleSendToLead = async () => {
    if (!createdProject) return;
    setIsSendingToLead(true);
    try {
      const updated = await sendProjectToLead(createdProject.id);
      setCreatedProject(updated);
      setIsHandoffModalOpen(true);
    } catch (err: any) {
      alert(err.message || "Failed to dispatch project to Project Lead");
    } finally {
      setIsSendingToLead(false);
    }
  };

  const handleResetToNew = () => {
    setCreatedProject(null);
    setCurrentStage("input");
    setFormData({
      name: "",
      description: "",
      expected_days: 45,
      available_employees: 5,
      requirements: "",
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      <Navbar />

      {/* What-If Simulator Modal */}
      {createdProject && (
        <WhatIfSimulator
          project={createdProject}
          isOpen={isSimulatorOpen}
          onClose={() => setIsSimulatorOpen(false)}
        />
      )}

      {/* Celebratory Handoff Modal */}
      {isHandoffModalOpen && createdProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            
            {/* Animated Celebration Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/25 animate-bounce">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                Handoff Successfully Dispatched
              </span>
              <h2 className="text-2xl font-bold text-slate-900">
                Project Dispatched to {createdProject.lead_assigned || "Ishita Rao"}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                The technical blueprint, {createdProject.analysis.timeline_breakdown.phases.length}-phase timeline milestones, and sprint deliverable backlog for <strong className="text-slate-900">{createdProject.name}</strong> are now in the Project Lead approvals inbox.
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
                Sprint Kickoff & Architecture Review: {createdProject.name}
              </p>
              <p className="text-[11px] text-slate-600">
                Attendees: <strong className="text-slate-800">Arjun Reddy (Manager)</strong> & <strong className="text-slate-800">{createdProject.lead_assigned || "Ishita Rao"} (Lead)</strong>
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

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/projects/${createdProject.id}`}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                  <span>View Full Blueprint</span>
                </Link>
                <Link
                  href="/"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Compass className="h-3.5 w-3.5 text-slate-500" />
                  <span>Manager Dashboard</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* ========================================================================= */}
        {/* STAGE 1: PROJECT PARAMETERS & SCOPE INPUT FORM                             */}
        {/* ========================================================================= */}
        {currentStage === "input" && (
          <>
            {/* Header */}
            <div className="space-y-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#6366f1] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Manager Dashboard</span>
              </Link>

              <div className="flex items-center gap-3 pt-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6366f1] shadow-md text-white">
                  <FolderPlus className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                      Create & Analyze Project
                    </h1>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-[#4f46e5] border border-indigo-200">
                      <Sparkles className="h-3.5 w-3.5 text-[#6366f1] animate-pulse" />
                      AI Achievability Engine
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Input your project scope, target timeline, and available team size for automated AI feasibility evaluation.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Presets Bar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#6366f1]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Quick-Start Enterprise Project Presets
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  Click to autofill realistic scope
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {PROJECT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="flex flex-col text-left rounded-xl border border-slate-200 bg-[#f8fafc] p-3 hover:border-indigo-300 hover:bg-white transition-all group shadow-sm"
                  >
                    <span className="text-xs font-bold text-slate-800 group-hover:text-[#6366f1] truncate">
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">
                      {preset.expected_days}d • {preset.available_employees} staff
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Project Creation Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
                  {errorMessage}
                </div>
              )}

              {/* Section 1: Basic Project Details */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#6366f1]" />
                    1. Basic Project Details
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define the high-level purpose and goals of the initiative.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Project Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Project Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MedAI Clinical Diagnostic Assistant"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-[#6366f1] focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Project Description */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Project Description & Business Objective <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Provide a summary of what problem this system solves and the expected target outcome..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] p-4 text-sm text-slate-900 placeholder-slate-400 focus:border-[#6366f1] focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Constraints (Timeline & Headcount) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#6366f1]" />
                    2. Project Constraints & Resources
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Set manager baseline expectations for completion time and allocated staff.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Expected Completion Days */}
                  <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#6366f1]" />
                        Expected Completion Days
                      </label>
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-extrabold text-[#4f46e5] border border-indigo-200">
                        {formData.expected_days} Days
                      </span>
                    </div>
                    <input
                      type="number"
                      required
                      min={5}
                      max={365}
                      value={formData.expected_days}
                      onChange={(e) => setFormData({ ...formData, expected_days: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#6366f1] focus:outline-none"
                    />
                    <input
                      type="range"
                      min={5}
                      max={180}
                      value={formData.expected_days}
                      onChange={(e) => setFormData({ ...formData, expected_days: Number(e.target.value) })}
                      className="w-full mt-3 accent-[#6366f1]"
                    />
                  </div>

                  {/* Available Employees */}
                  <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-emerald-600" />
                        Available Team Headcount
                      </label>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-extrabold text-emerald-700 border border-emerald-200">
                        {formData.available_employees} Staff
                      </span>
                    </div>
                    <input
                      type="number"
                      required
                      min={1}
                      max={50}
                      value={formData.available_employees}
                      onChange={(e) => setFormData({ ...formData, available_employees: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#6366f1] focus:outline-none"
                    />
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={formData.available_employees}
                      onChange={(e) => setFormData({ ...formData, available_employees: Number(e.target.value) })}
                      className="w-full mt-3 accent-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Technical Requirements */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#6366f1]" />
                    3. Detailed Technical Requirements
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    List the core technical requirements, architecture constraints, third-party integrations, and deliverables.
                  </p>
                </div>

                <div>
                  <textarea
                    required
                    rows={8}
                    placeholder="1. Real-time REST/GraphQL API with JWT authentication...&#10;2. Database schema with PostgreSQL and Redis caching...&#10;3. AI model inference pipeline with sub-100ms latency...&#10;4. Interactive dashboard with role-based access control..."
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] p-4 text-sm text-slate-900 placeholder-slate-400 focus:border-[#6366f1] focus:bg-white focus:outline-none font-mono transition-colors"
                  />
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#6366f1] to-purple-600 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:from-[#4f46e5] hover:to-purple-700 transition-all hover:scale-[1.005] active:scale-[0.995] disabled:opacity-75"
                >
                  {isLoading ? (
                    <>
                      <Sparkles className="h-5 w-5 animate-spin" />
                      <span className="font-semibold">{ANALYSIS_STEPS[loadingStep]}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>Evaluate Achievability & Synthesize AI Blueprint</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ========================================================================= */}
        {/* STAGE 2: AI ACHIEVABILITY VERDICT & HANDOFF SCREEN                        */}
        {/* ========================================================================= */}
        {currentStage === "verdict" && createdProject && (
          <div className="space-y-8 animate-in fade-in-50 duration-300">
            
            {/* Top Bar with Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <button
                type="button"
                onClick={handleResetToNew}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#6366f1] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Create Another Project</span>
              </button>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  Manager: <strong className="text-slate-800">Arjun Reddy</strong>
                </span>
                <span className="h-3 w-px bg-slate-300" />
                <span className="text-xs text-slate-500">
                  Assigned Lead: <strong className="text-[#6366f1]">{createdProject.lead_assigned || "Ishita Rao"}</strong>
                </span>
              </div>
            </div>

            {/* Verdict Hero Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                      Achievability Evaluation
                    </span>
                    <FeasibilityBadge
                      status={createdProject.analysis.feasibility.status}
                      score={createdProject.analysis.feasibility.feasibility_score}
                      size="md"
                    />
                    {createdProject.analysis.engine && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-[#4f46e5] border border-indigo-200">
                        <Sparkles className="h-3 w-3 text-[#6366f1]" />
                        {createdProject.analysis.engine}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {createdProject.name}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                    {createdProject.description}
                  </p>
                </div>

                {/* Achievability Ring / Score Card */}
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 to-purple-50/50 p-5 text-center shrink-0 min-w-[200px] shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4f46e5]">
                    Overall Feasibility
                  </span>
                  <div className="mt-1 flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-black text-slate-900">
                      {createdProject.analysis.feasibility.feasibility_score}
                    </span>
                    <span className="text-base font-bold text-slate-500">%</span>
                  </div>
                  <p className="text-[11px] font-semibold text-indigo-700 mt-1">
                    {createdProject.analysis.feasibility.status === "FEASIBLE"
                      ? "Realistically Achievable"
                      : createdProject.analysis.feasibility.status === "FEASIBLE WITH CHANGES"
                      ? "Achievable with Tweaks"
                      : "High Risk / Overconstrained"}
                  </p>
                </div>
              </div>

              {/* Achievability 3-Pillar Reality Check Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                
                {/* 1. Timeline Realism */}
                <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#6366f1]" />
                      Timeline Realism
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      Score: {createdProject.analysis.feasibility.dimensions.timeline_score}%
                    </span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {createdProject.analysis.timeline_breakdown.total_calculated_days} Days Calculated
                  </div>
                  <p className="text-xs text-slate-600">
                    Requested: <strong className="text-slate-800">{createdProject.expected_days} Days</strong> (
                    {createdProject.analysis.timeline_breakdown.variance_days <= 0 ? (
                      <span className="text-emerald-600 font-semibold">
                        {Math.abs(createdProject.analysis.timeline_breakdown.variance_days)}d buffer available
                      </span>
                    ) : (
                      <span className="text-rose-600 font-semibold">
                        +{createdProject.analysis.timeline_breakdown.variance_days}d delta over target
                      </span>
                    )}
                    )
                  </p>
                </div>

                {/* 2. Team Capacity Check */}
                <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-emerald-600" />
                      Team Capacity
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-md",
                      createdProject.analysis.employee_analysis.status === "Sufficient"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    )}>
                      {createdProject.analysis.employee_analysis.status}
                    </span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {createdProject.available_employees} Staff Allocated
                  </div>
                  <p className="text-xs text-slate-600">
                    AI Recommended: <strong className="text-slate-800">{createdProject.analysis.employee_analysis.total_recommended} Specialists</strong> across {createdProject.analysis.employee_analysis.roles.length} roles
                  </p>
                </div>

                {/* 3. Scope & Technical Risk */}
                <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                      Scope & Tech Risk
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      Health: {createdProject.analysis.feasibility.dimensions.technical_risk_score}%
                    </span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {createdProject.analysis.features.must_have.length} Core Deliverables
                  </div>
                  <p className="text-xs text-slate-600">
                    {createdProject.analysis.risk_analysis.length} Identified technical risks with mitigation protocols
                  </p>
                </div>

              </div>

              {/* AI Key Verdict Box */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#6366f1]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4f46e5]">
                    AI Feasibility Verdict & Manager Action Plan
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                  {createdProject.analysis.feasibility.key_verdict}
                </p>
                <div className="pt-2 border-t border-indigo-100/80">
                  <p className="text-xs text-slate-700">
                    <strong className="text-slate-900 font-bold">Primary Recommendation: </strong>
                    {createdProject.analysis.ai_recommendation.primary_advice}
                  </p>
                </div>
              </div>

              {/* =================================================================== */}
              {/* PRIMARY PROMINENT ACTION: SEND TO PROJECT LEAD                      */}
              {/* =================================================================== */}
              <div className="rounded-3xl border-2 border-indigo-300/80 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-indigo-400/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-400/30">
                        Sprint Execution Ready
                      </span>
                      <span className="text-xs text-slate-300">
                        Assignee: <strong className="text-white">{createdProject.lead_assigned || "Ishita Rao"} (Project Lead)</strong>
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                      Satisfied with the AI Blueprint? Dispatch to Sprint Execution!
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                      Clicking below dispatches the blueprint, {createdProject.analysis.timeline_breakdown.phases.length}-phase roadmap, and task backlog to {createdProject.lead_assigned || "Ishita Rao"}, and auto-schedules the Sprint Kickoff Meeting.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSendToLead}
                    disabled={isSendingToLead || createdProject.sent_to_lead}
                    className="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#6366f1] via-indigo-500 to-purple-600 px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-indigo-500/40 hover:from-[#4f46e5] hover:to-purple-700 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 group cursor-pointer"
                  >
                    {isSendingToLead ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <span>Dispatching to Lead...</span>
                      </>
                    ) : createdProject.sent_to_lead ? (
                      <>
                        <Check className="h-5 w-5 text-emerald-400" />
                        <span>Dispatched to {createdProject.lead_assigned || "Ishita Rao"}</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        <span>Send to Project Lead →</span>
                      </>
                    )}
                  </button>

                  <Link
                    href={`/projects/${createdProject.id}`}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm font-bold text-white hover:bg-white/20 transition-colors backdrop-blur-xs text-center"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Explore Full Blueprint</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setIsSimulatorOpen(true)}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm font-bold text-white hover:bg-white/20 transition-colors backdrop-blur-xs"
                  >
                    <Sliders className="h-4 w-4" />
                    <span>What-If Sandbox</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Quick 5-Phase Roadmap Preview */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#6366f1]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    Generated Phased Roadmap Deliverables ({createdProject.analysis.timeline_breakdown.phases.length} Phases)
                  </h3>
                </div>
                <Link
                  href={`/projects/${createdProject.id}`}
                  className="text-xs font-semibold text-[#6366f1] hover:underline flex items-center gap-1"
                >
                  <span>Detailed Gantt View</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {createdProject.analysis.timeline_breakdown.phases.map((phase, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-[#f8fafc] p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {phase.phase_name}
                      </span>
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-[#4f46e5]">
                        {phase.duration_days}d
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {phase.description}
                    </p>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Day {phase.start_day} → Day {phase.end_day}
                    </div>
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
