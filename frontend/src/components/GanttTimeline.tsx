"use client";

import { useState } from "react";
import { PhaseTimeline, TimelineBreakdown } from "@/types";
import { Calendar, Clock, CheckCircle2, Layers, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface GanttTimelineProps {
  timeline: TimelineBreakdown;
}

export default function GanttTimeline({ timeline }: GanttTimelineProps) {
  const [selectedPhase, setSelectedPhase] = useState<PhaseTimeline | null>(
    timeline.phases[0] || null
  );

  const totalDays = timeline.total_calculated_days;

  const phaseColors = [
    { bg: "bg-[#6366f1]", border: "border-indigo-400", light: "bg-indigo-50 text-[#4f46e5]" },
    { bg: "bg-purple-500", border: "border-purple-400", light: "bg-purple-50 text-purple-700" },
    { bg: "bg-blue-500", border: "border-blue-400", light: "bg-blue-50 text-blue-700" },
    { bg: "bg-emerald-500", border: "border-emerald-400", light: "bg-emerald-50 text-emerald-700" },
    { bg: "bg-teal-500", border: "border-teal-400", light: "bg-teal-50 text-teal-700" },
    { bg: "bg-amber-500", border: "border-amber-400", light: "bg-amber-50 text-amber-700" },
    { bg: "bg-rose-500", border: "border-rose-400", light: "bg-rose-50 text-rose-700" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-2 text-[#6366f1]">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Phased Execution Schedule
            </h4>
            <p className="text-xs text-slate-500">
              Total Duration: <strong className="text-slate-800">{totalDays} Days</strong> • {timeline.phases.length} Execution Phases • Buffer: <strong className="text-emerald-600">{timeline.buffer_days} Days</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-[#6366f1]" /> Dev Phases
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Testing
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Buffer
          </span>
        </div>
      </div>

      {/* Visual Gantt Chart Bars */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="min-w-[650px] space-y-3">
          
          {/* Days Scale Header */}
          <div className="grid grid-cols-12 gap-1 border-b border-slate-100 pb-2 text-[11px] font-semibold text-slate-400">
            <div className="col-span-4">Phase Name</div>
            <div className="col-span-8 flex justify-between px-1">
              <span>Day 1</span>
              <span>Day {Math.round(totalDays * 0.25)}</span>
              <span>Day {Math.round(totalDays * 0.50)}</span>
              <span>Day {Math.round(totalDays * 0.75)}</span>
              <span>Day {totalDays}</span>
            </div>
          </div>

          {/* Phase Rows */}
          {timeline.phases.map((phase, idx) => {
            const color = phaseColors[idx % phaseColors.length];
            const isSelected = selectedPhase?.phase_name === phase.phase_name;

            const leftPercent = Math.max(0, Math.min(100, ((phase.start_day - 1) / totalDays) * 100));
            const widthPercent = Math.max(4, Math.min(100 - leftPercent, (phase.duration_days / totalDays) * 100));

            return (
              <div
                key={phase.phase_name}
                onClick={() => setSelectedPhase(phase)}
                className={cn(
                  "group relative grid grid-cols-12 items-center gap-1 rounded-xl p-2 transition-all cursor-pointer",
                  isSelected
                    ? "bg-indigo-50/70 ring-1 ring-[#6366f1]/40"
                    : "hover:bg-slate-50"
                )}
              >
                {/* Phase Info */}
                <div className="col-span-4 pr-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", color.bg)} />
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {phase.phase_name}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    Day {phase.start_day} - {phase.end_day} ({phase.duration_days}d)
                  </div>
                </div>

                {/* Timeline Bar Track */}
                <div className="col-span-8 relative h-7 rounded-lg bg-[#f8fafc] border border-slate-200 overflow-hidden">
                  <div
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                    className={cn(
                      "absolute top-1 bottom-1 rounded-md px-2 flex items-center justify-between text-[10px] font-bold text-white shadow-sm transition-all group-hover:brightness-105",
                      color.bg
                    )}
                  >
                    <span className="truncate">{phase.duration_days}d</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Phase Detail Card */}
      {selectedPhase && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#6366f1]" />
              <h5 className="font-bold text-slate-900 text-sm sm:text-base">
                {selectedPhase.phase_name}
              </h5>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-md bg-white border border-slate-200 px-2.5 py-1 text-slate-700 font-medium shadow-xs">
                Day {selectedPhase.start_day} → Day {selectedPhase.end_day}
              </span>
              <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-[#4f46e5] font-semibold border border-indigo-200">
                Duration: {selectedPhase.duration_days} Days
              </span>
            </div>
          </div>

          <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            {selectedPhase.description}
          </p>

          {/* Key Deliverables */}
          {selectedPhase.key_deliverables && selectedPhase.key_deliverables.length > 0 && (
            <div className="mt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Key Phase Deliverables:
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedPhase.key_deliverables.map((del, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1 text-xs text-slate-800 border border-slate-200 shadow-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{del}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Phase Breakdown Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3.5 bg-[#f8fafc]">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Phase Specification Matrix
          </h5>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-[#f8fafc] text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3">Phase</th>
                <th className="px-5 py-3">Start Day</th>
                <th className="px-5 py-3">End Day</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Scope & Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timeline.phases.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                    {p.phase_name}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">Day {p.start_day}</td>
                  <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">Day {p.end_day}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-semibold text-[#4f46e5] border border-indigo-100">
                      {p.duration_days} days
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
