"use client";

import { EmployeeAnalysis } from "@/types";
import { Users, UserCheck, UserX, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

interface ResourceChartProps {
  analysis: EmployeeAnalysis;
}

export default function ResourceChart({ analysis }: ResourceChartProps) {
  const chartData = [
    {
      name: "Team Headcount",
      "Available Staff": analysis.total_available,
      "AI Recommended Staff": analysis.total_recommended,
    },
  ];

  // Also role-by-role chart data
  const roleChartData = analysis.roles.map((r) => ({
    name: r.role.replace(" Developer", "").replace(" Engineer", ""),
    "Required": r.required_count,
  }));

  const isShortage = analysis.gap_delta < 0;
  const isOverload = analysis.gap_delta > 3;

  return (
    <div className="space-y-6">
      {/* Top Headcount Stat Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Recommended */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Recommended Headcount</span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white">
            {analysis.total_recommended}{" "}
            <span className="text-xs font-normal text-slate-400">specialists</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Calculated across {analysis.roles.length} specialized functional domains
          </p>
        </div>

        {/* Available */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Available Headcount</span>
            <UserCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white">
            {analysis.total_available}{" "}
            <span className="text-xs font-normal text-slate-400">allocated staff</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Manager provided staff pool capacity
          </p>
        </div>

        {/* Status / Delta */}
        <div
          className={cn(
            "rounded-xl border p-4",
            isShortage
              ? "border-rose-500/30 bg-rose-950/20"
              : isOverload
              ? "border-amber-500/30 bg-amber-950/20"
              : "border-emerald-500/30 bg-emerald-950/20"
          )}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase">
            <span
              className={
                isShortage
                  ? "text-rose-400"
                  : isOverload
                  ? "text-amber-400"
                  : "text-emerald-400"
              }
            >
              Capacity Status
            </span>
            {isShortage ? (
              <UserX className="h-4 w-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            )}
          </div>
          <div
            className={cn(
              "mt-2 text-2xl font-extrabold",
              isShortage
                ? "text-rose-400"
                : isOverload
                ? "text-amber-400"
                : "text-emerald-400"
            )}
          >
            {analysis.status}
          </div>
          <p className="mt-1 text-[11px] text-slate-300">
            Delta:{" "}
            <strong>
              {analysis.gap_delta > 0 ? `+${analysis.gap_delta}` : analysis.gap_delta}{" "}
              headcount
            </strong>
          </p>
        </div>
      </div>

      {/* Analysis Summary Narrative */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-950/20 p-4 text-xs sm:text-sm text-slate-200">
        <AlertTriangle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-blue-300 font-semibold">
            Resource Allocation Summary:{" "}
          </strong>
          {analysis.analysis_summary}
        </div>
      </div>

      {/* Visual Recharts Bar Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Available vs Recommended */}
        <div className="rounded-xl border border-slate-800 bg-[#0c1220] p-5">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
            Manpower Balance: Available vs Required
          </h5>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" textAnchor="middle" />
                <YAxis stroke="#64748b" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                />
                <Legend />
                <Bar dataKey="Available Staff" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="AI Recommended Staff" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Roles Distribution */}
        <div className="rounded-xl border border-slate-800 bg-[#0c1220] p-5">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
            Required Specialist Role Composition
          </h5>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" textAnchor="middle" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                />
                <Bar dataKey="Required" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Role Requirements Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
        <div className="border-b border-slate-800 px-4 py-3 bg-slate-900/80">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Recommended Team Composition & Role Rationale
          </h5>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Domain Role</th>
                <th className="px-4 py-2.5 text-right">Required Count</th>
                <th className="px-4 py-2.5">Role Rationale & Primary Responsibilities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {analysis.roles.map((r, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                    {r.role}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">
                      {r.required_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{r.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
