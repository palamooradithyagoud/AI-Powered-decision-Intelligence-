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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Recommended Headcount</span>
            <Users className="h-4 w-4 text-[#6366f1]" />
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {analysis.total_recommended}{" "}
            <span className="text-xs font-normal text-slate-500">specialists</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Calculated across {analysis.roles.length} specialized functional domains
          </p>
        </div>

        {/* Available */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Available Headcount</span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {analysis.total_available}{" "}
            <span className="text-xs font-normal text-slate-500">allocated staff</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Manager provided staff pool capacity
          </p>
        </div>

        {/* Status / Delta */}
        <div
          className={cn(
            "rounded-2xl border p-5 shadow-sm",
            isShortage
              ? "border-rose-200 bg-rose-50/70"
              : isOverload
              ? "border-amber-200 bg-amber-50/70"
              : "border-emerald-200 bg-emerald-50/70"
          )}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase">
            <span
              className={
                isShortage
                  ? "text-rose-700 font-bold"
                  : isOverload
                  ? "text-amber-700 font-bold"
                  : "text-emerald-700 font-bold"
              }
            >
              Capacity Status
            </span>
            {isShortage ? (
              <UserX className="h-4 w-4 text-rose-600" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            )}
          </div>
          <div
            className={cn(
              "mt-2 text-2xl font-bold",
              isShortage
                ? "text-rose-700"
                : isOverload
                ? "text-amber-700"
                : "text-emerald-700"
            )}
          >
            {analysis.status}
          </div>
          <p className="mt-1 text-[11px] text-slate-600 font-medium">
            Delta:{" "}
            <strong>
              {analysis.gap_delta > 0 ? `+${analysis.gap_delta}` : analysis.gap_delta}{" "}
              headcount
            </strong>
          </p>
        </div>
      </div>

      {/* Analysis Summary Narrative */}
      <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-xs sm:text-sm text-slate-700 shadow-sm">
        <AlertTriangle className="h-5 w-5 text-[#6366f1] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#4f46e5] font-semibold">
            Resource Allocation Summary:{" "}
          </strong>
          {analysis.analysis_summary}
        </div>
      </div>

      {/* Visual Recharts Bar Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Available vs Recommended */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
            Manpower Balance: Available vs Required
          </h5>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" textAnchor="middle" />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "12px",
                    color: "#0f172a",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                />
                <Legend />
                <Bar dataKey="Available Staff" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="AI Recommended Staff" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Roles Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
            Required Specialist Role Composition
          </h5>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" textAnchor="middle" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "12px",
                    color: "#0f172a",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                />
                <Bar dataKey="Required" fill="#818cf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Role Requirements Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3.5 bg-[#f8fafc]">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Recommended Team Composition & Role Rationale
          </h5>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-[#f8fafc] text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3">Domain Role</th>
                <th className="px-5 py-3 text-right">Required Count</th>
                <th className="px-5 py-3">Role Rationale & Primary Responsibilities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analysis.roles.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                    {r.role}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-[#4f46e5] border border-indigo-200">
                      {r.required_count}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{r.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
