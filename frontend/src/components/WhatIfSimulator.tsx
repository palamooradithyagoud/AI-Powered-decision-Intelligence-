"use client";

import { useState } from "react";
import { Project, SimulationResponse } from "@/types";
import { simulateFeasibility } from "@/lib/api";
import { Sliders, RefreshCw, Users, Calendar, ArrowRight, X, Sparkles } from "lucide-react";
import FeasibilityBadge from "./FeasibilityBadge";
import { cn } from "@/lib/utils";

interface WhatIfSimulatorProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export default function WhatIfSimulator({ project, isOpen, onClose }: WhatIfSimulatorProps) {
  const [days, setDays] = useState<number>(project.expected_days);
  const [employees, setEmployees] = useState<number>(project.available_employees);
  const [simResult, setSimResult] = useState<SimulationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSimulate = async (newDays: number, newEmployees: number) => {
    setIsLoading(true);
    try {
      const res = await simulateFeasibility({
        project_id: project.id,
        expected_days: newDays,
        available_employees: newEmployees,
        base_analysis: project.analysis,
      });
      setSimResult(res);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDaysChange = (val: number) => {
    setDays(val);
    handleSimulate(val, employees);
  };

  const handleEmployeesChange = (val: number) => {
    setEmployees(val);
    handleSimulate(days, val);
  };

  const currentFeasibility = simResult ? simResult.feasibility : project.analysis.feasibility;
  const currentEmpAnalysis = simResult ? simResult.employee_analysis : project.analysis.employee_analysis;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs transition-all font-sans">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-[#6366f1] border border-indigo-200">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                What-If Feasibility Simulator
              </h3>
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-[#4f46e5] border border-indigo-200">
                Interactive Sandbox
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Simulate staffing or deadline adjustments in real-time to assess impact on feasibility.
            </p>
          </div>
        </div>

        {/* Sliders Area */}
        <div className="mt-6 space-y-5">
          
          {/* Days Slider */}
          <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2 text-slate-700 font-bold">
                <Calendar className="h-4 w-4 text-[#6366f1]" />
                Target Completion Timeline
              </span>
              <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-extrabold text-[#4f46e5] border border-indigo-200">
                {days} Days
              </span>
            </div>

            <input
              type="range"
              min={10}
              max={180}
              step={1}
              value={days}
              onChange={(e) => handleDaysChange(Number(e.target.value))}
              className="mt-3 w-full accent-[#6366f1] cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-[10px] text-slate-400">
              <span>10 Days (Sprint)</span>
              <span>Baseline: {project.expected_days}d</span>
              <span>180 Days (Long-term)</span>
            </div>
          </div>

          {/* Available Employees Slider */}
          <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2 text-slate-700 font-bold">
                <Users className="h-4 w-4 text-emerald-600" />
                Available Team Size
              </span>
              <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700 border border-emerald-200">
                {employees} Staff
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={employees}
              onChange={(e) => handleEmployeesChange(Number(e.target.value))}
              className="mt-3 w-full accent-emerald-600 cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-[10px] text-slate-400">
              <span>1 Employee</span>
              <span>Baseline: {project.available_employees} staff</span>
              <span>20 Employees</span>
            </div>
          </div>
        </div>

        {/* Live Simulation Output Card */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Simulated Feasibility Outcome
            </span>
            {isLoading && (
              <RefreshCw className="h-4 w-4 animate-spin text-[#6366f1]" />
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <FeasibilityBadge
              status={currentFeasibility.status}
              score={currentFeasibility.feasibility_score}
              size="lg"
            />

            <div className="text-right text-xs">
              <span className="text-slate-500">Capacity Status: </span>
              <strong
                className={
                  currentEmpAnalysis.gap_delta < 0
                    ? "text-rose-600"
                    : "text-emerald-600"
                }
              >
                {currentEmpAnalysis.status} (
                {currentEmpAnalysis.gap_delta > 0
                  ? `+${currentEmpAnalysis.gap_delta}`
                  : currentEmpAnalysis.gap_delta}
                )
              </strong>
            </div>
          </div>

          <p className="mt-3 text-xs sm:text-sm text-slate-700 leading-relaxed bg-[#f8fafc] p-3.5 rounded-xl border border-slate-200">
            {currentFeasibility.key_verdict}
          </p>
        </div>

        {/* Reset & Done Buttons */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => {
              setDays(project.expected_days);
              setEmployees(project.available_employees);
              handleSimulate(project.expected_days, project.available_employees);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset to Baseline</span>
          </button>

          <button
            onClick={onClose}
            className="rounded-xl bg-[#6366f1] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#4f46e5] transition-colors shadow-sm"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
}
