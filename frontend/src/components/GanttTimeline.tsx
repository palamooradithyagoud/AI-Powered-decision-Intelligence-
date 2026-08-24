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
    { bg: "bg-blue-500", border: "border-blue-400", light: "bg-blue-500/20 text-blue-300" },
    { bg: "bg-purple-500", border: "border-purple-400", light: "bg-purple-500/20 text-purple-300" },
    { bg: "bg-cyan-500", border: "border-cyan-400", light: "bg-cyan-500/20 text-cyan-300" },
    { bg: "bg-emerald-500", border: "border-emerald-400", light: "bg-emerald-500/20 text-emerald-300" },
    { bg: "bg-indigo-500", border: "border-indigo-400", light: "bg-indigo-500/20 text-indigo-300" },
    { bg: "bg-teal-500", border: "border-teal-400", light: "bg-teal-500/20 text-teal-300" },
    { bg: "bg-amber-500", border: "border-amber-400", light: "bg-amber-500/20 text-amber-300" },
    { bg: "bg-rose-500", border: "border-rose-400", light: "bg-rose-500/20 text-rose-300" },
    { bg: "bg-slate-500", border: "border-slate-400", light: "bg-slate-500/20 text-slate-300" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/20 p-2 text-blue-400">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">
              Phased Execution Schedule
            </h4>
            <p className="text-xs text-slate-400">
              Total Duration: <strong className="text-slate-200">{totalDays} Days</strong> • {timeline.phases.length} Execution Phases • Buffer: <strong className="text-emerald-400">{timeline.buffer_days} Days</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-slate-400">
            <span className="h-2.5 w-2.5 rounded-xs bg-blue-500" /> Dev Phases
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="h-2.5 w-2.5 rounded-xs bg-amber-500" /> Testing
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="h-2.5 w-2.5 rounded-xs bg-slate-500" /> Buffer
          </span>
        </div>
      </div>

      {/* Visual Gantt Chart Bars */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0c1220] p-4 sm:p-6 shadow-inner">
        <div className="min-w-[650px] space-y-4">
          
          {/* Days Scale Header */}
          <div className="grid grid-cols-12 gap-1 border-b border-slate-800 pb-2 text-[11px] font-semibold text-slate-500">
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

            // Calculate percentage positions for the bar
            const leftPercent = Math.max(0, Math.min(100, ((phase.start_day - 1) / totalDays) * 100));
            const widthPercent = Math.max(4, Math.min(100 - leftPercent, (phase.duration_days / totalDays) * 100));

            return (
              <div
                key={phase.phase_name}
                onClick={() => setSelectedPhase(phase)}
                className={cn(
                  "group relative grid grid-cols-12 items-center gap-1 rounded-lg p-2 transition-all cursor-pointer",
                  isSelected
                    ? "bg-slate-800/90 ring-1 ring-blue-500/50"
                    : "hover:bg-slate-900/80"
                )}
              >
                {/* Phase Info */}
                <div className="col-span-4 pr-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", color.bg)} />
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {phase.phase_name}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    Day {phase.start_day} - {phase.end_day} ({phase.duration_days}d)
                  </div>
                </div>

                {/* Timeline Bar Track */}
                <div className="col-span-8 relative h-7 rounded-md bg-slate-900/90 border border-slate-800/60 overflow-hidden">
                  <div
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                    className={cn(
                      "absolute top-1 bottom-1 rounded-md px-2 flex items-center justify-between text-[10px] font-bold text-white shadow-md transition-all group-hover:brightness-110",
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
        <div className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/30 via-slate-900/60 to-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-400" />
              <h5 className="font-bold text-white text-sm sm:text-base">
                {selectedPhase.phase_name}
              </h5>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-md bg-slate-800 px-2.5 py-1 text-slate-300 font-medium">
                Day {selectedPhase.start_day} → Day {selectedPhase.end_day}
              </span>
              <span className="rounded-md bg-blue-500/20 px-2.5 py-1 text-blue-400 font-semibold">
                Duration: {selectedPhase.duration_days} Days
              </span>
            </div>
          </div>

          <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
            {selectedPhase.description}
          </p>

          {/* Key Deliverables */}
          {selectedPhase.key_deliverables && selectedPhase.key_deliverables.length > 0 && (
            <div className="mt-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Key Phase Deliverables:
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedPhase.key_deliverables.map((del, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 border border-slate-700/60"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{del}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Phase Breakdown Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
        <div className="border-b border-slate-800 px-4 py-3 bg-slate-900/80">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Phase Specification Matrix
          </h5>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Phase</th>
                <th className="px-4 py-2.5">Start Day</th>
                <th className="px-4 py-2.5">End Day</th>
                <th className="px-4 py-2.5">Duration</th>
                <th className="px-4 py-2.5">Scope & Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {timeline.phases.map((p, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                    {p.phase_name}
                  </td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">Day {p.start_day}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">Day {p.end_day}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="rounded bg-blue-500/10 px-2 py-0.5 font-semibold text-blue-400 border border-blue-500/20">
                      {p.duration_days} days
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
