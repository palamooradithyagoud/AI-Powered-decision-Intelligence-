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
    <div className="space-y-6 font-sans">
      {/* Risk Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
              Critical Risks
            </span>
            <div className="text-2xl font-bold text-rose-700">{criticalCount}</div>
          </div>
          <AlertOctagon className="h-6 w-6 text-rose-600 opacity-80" />
        </div>

        <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700">
              High Risks
            </span>
            <div className="text-2xl font-bold text-orange-700">{highCount}</div>
          </div>
          <AlertTriangle className="h-6 w-6 text-orange-600 opacity-80" />
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Medium Risks
            </span>
            <div className="text-2xl font-bold text-amber-700">{medCount}</div>
          </div>
          <AlertTriangle className="h-6 w-6 text-amber-600 opacity-80" />
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
              Low Risks
            </span>
            <div className="text-2xl font-bold text-blue-700">{lowCount}</div>
          </div>
          <ShieldCheck className="h-6 w-6 text-blue-600 opacity-80" />
        </div>
      </div>

      {/* Risk Items Cards List */}
      <div className="space-y-4">
        {risks.map((risk, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300"
          >
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <h5 className="font-bold text-slate-900 text-sm sm:text-base">
                  {risk.risk}
                </h5>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">
                  Prob: <strong className="text-slate-800">{risk.probability}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] text-slate-500">
                  Impact: <strong className="text-slate-800">{risk.impact}</strong>
                </span>
                <RiskSeverityBadge severity={risk.severity} />
              </div>
            </div>

            {/* Content: Reason and Mitigation */}
            <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
              {/* Reason */}
              <div className="rounded-xl bg-[#f8fafc] p-4 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Root Reason / Risk Trigger
                </span>
                <p className="text-slate-700 leading-relaxed">
                  {risk.reason}
                </p>
              </div>

              {/* Mitigation */}
              <div className="rounded-xl bg-emerald-50/40 p-4 border border-emerald-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                  Recommended Mitigation Strategy
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
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
