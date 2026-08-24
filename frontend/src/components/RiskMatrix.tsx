"use client";

import { RiskItem } from "@/types";
import { AlertOctagon, AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react";
import RiskSeverityBadge from "./RiskSeverityBadge";
import { cn } from "@/lib/utils";

interface RiskMatrixProps {
  risks: RiskItem[];
}

export default function RiskMatrix({ risks }: RiskMatrixProps) {
  const criticalCount = risks.filter((r) => r.severity === "Critical").length;
  const highCount = risks.filter((r) => r.severity === "High").length;
  const medCount = risks.filter((r) => r.severity === "Medium").length;
  const lowCount = risks.filter((r) => r.severity === "Low").length;

  return (
    <div className="space-y-6">
      {/* Risk Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
              Critical Risks
            </span>
            <div className="text-2xl font-extrabold text-red-400">{criticalCount}</div>
          </div>
          <AlertOctagon className="h-6 w-6 text-red-400 opacity-80" />
        </div>

        <div className="rounded-xl border border-orange-500/20 bg-orange-950/20 p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
              High Risks
            </span>
            <div className="text-2xl font-extrabold text-orange-400">{highCount}</div>
          </div>
          <AlertTriangle className="h-6 w-6 text-orange-400 opacity-80" />
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Medium Risks
            </span>
            <div className="text-2xl font-extrabold text-amber-400">{medCount}</div>
          </div>
          <AlertTriangle className="h-6 w-6 text-amber-400 opacity-80" />
        </div>

        <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Low Risks
            </span>
            <div className="text-2xl font-extrabold text-blue-400">{lowCount}</div>
          </div>
          <ShieldCheck className="h-6 w-6 text-blue-400 opacity-80" />
        </div>
      </div>

      {/* Risk Items Cards List */}
      <div className="space-y-4">
        {risks.map((risk, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm transition-all hover:border-slate-700/80 hover:bg-slate-900/90"
          >
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <h5 className="font-bold text-white text-sm sm:text-base">
                  {risk.risk}
                </h5>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">
                  Prob: <strong className="text-slate-200">{risk.probability}</strong>
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-[11px] text-slate-400">
                  Impact: <strong className="text-slate-200">{risk.impact}</strong>
                </span>
                <RiskSeverityBadge severity={risk.severity} />
              </div>
            </div>

            {/* Content: Reason and Mitigation */}
            <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
              {/* Reason */}
              <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Root Reason / Risk Trigger
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {risk.reason}
                </p>
              </div>

              {/* Mitigation */}
              <div className="rounded-lg bg-emerald-950/15 p-3 border border-emerald-500/20">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Recommended Mitigation Strategy</span>
                </div>
                <p className="text-emerald-300/90 leading-relaxed font-medium">
                  {risk.mitigation}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
