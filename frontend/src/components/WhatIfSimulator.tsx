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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700/80 bg-[#0c1220] p-6 sm:p-8 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 shadow-md shadow-purple-500/20">
            <Sliders className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">
                What-If Feasibility Simulator
              </h3>
              <span className="rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/20">
                Interactive Sandbox
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Simulate staffing or deadline adjustments in real-time to assess impact on feasibility.
            </p>
          </div>
        </div>

        {/* Sliders Area */}
        <div className="mt-6 space-y-6">
          
          {/* Days Slider */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2 text-slate-300">
                <Calendar className="h-4 w-4 text-blue-400" />
                Target Completion Timeline
              </span>
              <span className="rounded-md bg-blue-500/20 px-2.5 py-1 text-sm font-extrabold text-blue-400">
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
              className="mt-3 w-full accent-blue-500 cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-[10px] text-slate-500">
              <span>10 Days (Sprint)</span>
              <span>Baseline: {project.expected_days}d</span>
              <span>180 Days (Long-term)</span>
            </div>
          </div>

          {/* Available Employees Slider */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2 text-slate-300">
                <Users className="h-4 w-4 text-emerald-400" />
                Available Team Size
              </span>
              <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-sm font-extrabold text-emerald-400">
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
              className="mt-3 w-full accent-emerald-500 cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-[10px] text-slate-500">
              <span>1 Employee</span>
              <span>Baseline: {project.available_employees} staff</span>
              <span>20 Employees</span>
            </div>
          </div>
        </div>

        {/* Live Simulation Output Card */}
        <div className="mt-6 rounded-2xl border border-slate-700 bg-gradient-to-r from-slate-900 via-slate-900/90 to-[#0c1220] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Simulated Feasibility Outcome
            </span>
            {isLoading && (
              <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <FeasibilityBadge
              status={currentFeasibility.status}
              score={currentFeasibility.feasibility_score}
              size="lg"
            />

            <div className="text-right text-xs">
              <span className="text-slate-400">Capacity Status: </span>
              <strong
                className={
                  currentEmpAnalysis.gap_delta < 0
                    ? "text-rose-400"
                    : "text-emerald-400"
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

          <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
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
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset to Baseline</span>
          </button>

          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-500 transition-colors shadow-md shadow-blue-600/30"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
}
