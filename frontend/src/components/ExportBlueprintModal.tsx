"use client";

import { useState } from "react";
import { Project } from "@/types";
import { Download, Printer, Copy, Check, X, FileText, Sparkles } from "lucide-react";

interface ExportBlueprintModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportBlueprintModal({
  project,
  isOpen,
  onClose,
}: ExportBlueprintModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${project.name.toLowerCase().replace(/\s+/g, "_")}_blueprint.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const summaryText = `
# PROJECT BLUEPRINT: ${project.name}
Feasibility: ${project.analysis.feasibility.status} (Score: ${project.analysis.feasibility.feasibility_score}%)
Timeline: ${project.expected_days} Days
Team: ${project.available_employees} Available vs ${project.analysis.employee_analysis.total_recommended} Recommended

## Summary
${project.analysis.summary.what_it_is}

## Feasibility Verdict
${project.analysis.feasibility.key_verdict}

## Must-Have Features (${project.analysis.features.must_have.length})
${project.analysis.features.must_have.map((f) => `- ${f.name} (${f.complexity}): ${f.description}`).join("\n")}

## Required Roles
${project.analysis.employee_analysis.roles.map((r) => `- ${r.role}: ${r.required_count} needed (${r.rationale})`).join("\n")}

## Major Risks (${project.analysis.risk_analysis.length})
${project.analysis.risk_analysis.map((r) => `- [${r.severity}] ${r.risk}: ${r.mitigation}`).join("\n")}

## Primary AI Recommendation
${project.analysis.ai_recommendation.primary_advice}
    `.trim();

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/80 bg-[#0c1220] p-6 sm:p-8 shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Export Project Blueprint
            </h3>
            <p className="text-xs text-slate-400">
              Download or export the complete AI analysis and feasibility report.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          {/* Print / PDF */}
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-left hover:border-blue-500/40 hover:bg-slate-800/80 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/20 p-2.5 text-blue-400 group-hover:scale-105 transition-transform">
                <Printer className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  Print / Save as PDF
                </div>
                <div className="text-xs text-slate-400">
                  Formatted executive dossier ready for stakeholders
                </div>
              </div>
            </div>
            <span className="text-xs text-blue-400 font-semibold group-hover:translate-x-1 transition-transform">
              Print →
            </span>
          </button>

          {/* Download JSON */}
          <button
            onClick={handleDownloadJson}
            className="w-full flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-left hover:border-emerald-500/40 hover:bg-slate-800/80 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/20 p-2.5 text-emerald-400 group-hover:scale-105 transition-transform">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  Download Full JSON Blueprint
                </div>
                <div className="text-xs text-slate-400">
                  Raw data schemas for CI/CD or future module ingestion
                </div>
              </div>
            </div>
            <span className="text-xs text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform">
              .json →
            </span>
          </button>

          {/* Copy Markdown */}
          <button
            onClick={handleCopySummary}
            className="w-full flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-left hover:border-purple-500/40 hover:bg-slate-800/80 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/20 p-2.5 text-purple-400 group-hover:scale-105 transition-transform">
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {copied ? "Copied to Clipboard!" : "Copy Markdown Summary"}
                </div>
                <div className="text-xs text-slate-400">
                  Formatted text for Slack, Jira, or email briefs
                </div>
              </div>
            </div>
            <span className="text-xs text-purple-400 font-semibold">
              {copied ? "Done" : "Copy"}
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
