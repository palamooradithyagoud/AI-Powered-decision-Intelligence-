"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createProject } from "@/lib/api";
import { 
  Sparkles, 
  ArrowLeft, 
  Clock, 
  Users, 
  FileText, 
  CheckCircle2, 
  Layers, 
  Zap, 
  HelpCircle,
  FolderPlus,
  Compass
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

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    expected_days: 45,
    available_employees: 5,
    requirements: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

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
      router.push(`/projects/${newProject.id}`);
    } catch (err: any) {
      clearInterval(interval);
      setIsLoading(false);
      setErrorMessage(err.message || "Failed to analyze project. Please check inputs and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Back Link & Title */}
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
                  Create & Analyze New Project
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-[#4f46e5] border border-indigo-200">
                  <Sparkles className="h-3.5 w-3.5 text-[#6366f1] animate-pulse" />
                  AI Decision Intelligence Engine
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Input your project scope, target timeline, and available team size for automated AI feasibility planning.
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
              className="w-full flex items-center justify-center gap-3 rounded-2xl bg-[#6366f1] py-4 text-sm font-bold text-white shadow-md hover:bg-[#4f46e5] transition-all hover:scale-[1.005] active:scale-[0.995] disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <Sparkles className="h-5 w-5 animate-spin" />
                  <span className="font-semibold">{ANALYSIS_STEPS[loadingStep]}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Synthesize Full AI Feasibility Blueprint</span>
                </>
              )}
            </button>
          </div>
        </form>

      </main>
    </div>
  );
}
