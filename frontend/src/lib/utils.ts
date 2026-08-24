import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { FeasibilityStatus, RiskSeverity } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

export function getFeasibilityColor(status: FeasibilityStatus) {
  switch (status) {
    case "FEASIBLE":
      return {
        bg: "bg-emerald-500/10 dark:bg-emerald-950/40",
        border: "border-emerald-500/30 dark:border-emerald-500/40",
        text: "text-emerald-700 dark:text-emerald-400",
        badge: "bg-emerald-500 text-white",
        dot: "bg-emerald-500",
        accent: "#10b981",
        label: "FEASIBLE",
        icon: "🟢",
      };
    case "FEASIBLE WITH CHANGES":
      return {
        bg: "bg-amber-500/10 dark:bg-amber-950/40",
        border: "border-amber-500/30 dark:border-amber-500/40",
        text: "text-amber-700 dark:text-amber-400",
        badge: "bg-amber-500 text-white",
        dot: "bg-amber-500",
        accent: "#f59e0b",
        label: "FEASIBLE WITH CHANGES",
        icon: "🟡",
      };
    case "NOT FEASIBLE":
      return {
        bg: "bg-rose-500/10 dark:bg-rose-950/40",
        border: "border-rose-500/30 dark:border-rose-500/40",
        text: "text-rose-700 dark:text-rose-400",
        badge: "bg-rose-500 text-white",
        dot: "bg-rose-500",
        accent: "#f43f5e",
        label: "NOT FEASIBLE",
        icon: "🔴",
      };
  }
}

export function getRiskSeverityColor(severity: RiskSeverity) {
  switch (severity) {
    case "Critical":
      return {
        bg: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
        badge: "bg-red-600 text-white",
      };
    case "High":
      return {
        bg: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
        badge: "bg-orange-600 text-white",
      };
    case "Medium":
      return {
        bg: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
        badge: "bg-amber-600 text-white",
      };
    case "Low":
      return {
        bg: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
        badge: "bg-blue-600 text-white",
      };
  }
}
