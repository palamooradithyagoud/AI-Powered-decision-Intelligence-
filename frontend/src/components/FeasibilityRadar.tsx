"use client";

import { FeasibilityAnalysis } from "@/types";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";
import { ShieldCheck, Target, Clock, Users, Zap, Award } from "lucide-react";
import FeasibilityBadge from "./FeasibilityBadge";

interface FeasibilityRadarProps {
  feasibility: FeasibilityAnalysis;
}

export default function FeasibilityRadar({ feasibility }: FeasibilityRadarProps) {
  const { dimensions, status, feasibility_score, key_verdict } = feasibility;

  const radarData = [
    { subject: "Scope Clarity", score: dimensions.scope_score, fullMark: 100 },
    { subject: "Timeline Viability", score: dimensions.timeline_score, fullMark: 100 },
    { subject: "Manpower Match", score: dimensions.manpower_score, fullMark: 100 },
    { subject: "Risk Mitigation", score: dimensions.technical_risk_score, fullMark: 100 },
    { subject: "Architecture Simplicity", score: dimensions.complexity_score, fullMark: 100 },
  ];

  const dimensionCards = [
    {
      title: "Scope Balance",
      score: dimensions.scope_score,
      icon: Target,
      desc: "Clarity of must-have features vs optional creep",
    },
    {
      title: "Timeline Feasibility",
      score: dimensions.timeline_score,
      icon: Clock,
      desc: "Execution speed vs realistic phase deadlines",
    },
    {
      title: "Manpower Adequacy",
      score: dimensions.manpower_score,
      icon: Users,
      desc: "Skill coverage vs required domain roles",
    },
    {
      title: "Risk Health",
      score: dimensions.technical_risk_score,
      icon: ShieldCheck,
      desc: "Mitigation buffer against critical blockers",
    },
    {
      title: "Architectural Complexity",
      score: dimensions.complexity_score,
      icon: Zap,
      desc: "Manageability of third-party & AI dependencies",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Verdict Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-[#0c1220] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Comprehensive AI Feasibility Analysis
            </span>
            <h3 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
              Can We Build It Realistically?
            </h3>
          </div>

          <FeasibilityBadge
            status={status}
            score={feasibility_score}
            size="lg"
            className="text-base sm:text-lg"
          />
        </div>

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Award className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Executive Feasibility Verdict
              </h5>
              <p className="mt-1 text-sm sm:text-base font-semibold text-slate-100 leading-relaxed">
                {key_verdict}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Radar Chart + Dimension Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Radar Graphic */}
        <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-[#0c1220] p-5">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              5-Dimension Feasibility Radar
            </h5>
            <span className="text-xs text-blue-400 font-semibold">
              Index: {feasibility_score}/100
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                <Radar
                  name="Feasibility Score"
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.45}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5 Dimension Progress Cards */}
        <div className="lg:col-span-6 space-y-3">
          {dimensionCards.map((d, i) => {
            const Icon = d.icon;
            const isHigh = d.score >= 75;
            const isMid = d.score >= 50 && d.score < 75;

            return (
              <div
                key={i}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 transition-all hover:bg-slate-800/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-slate-800 p-1.5 text-blue-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white">
                        {d.title}
                      </span>
                      <p className="text-[10px] text-slate-400">{d.desc}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={
                        isHigh
                          ? "text-sm font-extrabold text-emerald-400"
                          : isMid
                          ? "text-sm font-extrabold text-amber-400"
                          : "text-sm font-extrabold text-rose-400"
                      }
                    >
                      {d.score}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${d.score}%` }}
                    className={
                      isHigh
                        ? "h-full rounded-full bg-emerald-500 transition-all duration-500"
                        : isMid
                        ? "h-full rounded-full bg-amber-500 transition-all duration-500"
                        : "h-full rounded-full bg-rose-500 transition-all duration-500"
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
