"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <label className="theme-toggle-switch relative flex items-center cursor-pointer h-9 w-[136px] rounded-full p-1 bg-slate-200/90 dark:bg-slate-800/90 border border-slate-300/80 dark:border-slate-700/80 shadow-inner transition-all duration-300">
        <input
          type="checkbox"
          checked={isDark}
          onChange={toggleTheme}
          className="sr-only"
          aria-label="Toggle Bright / Dark Mode"
        />

        {/* Sliding Pill Indicator */}
        <div
          className={cn(
            "absolute top-1 bottom-1 w-[62px] rounded-full shadow-md transition-all duration-300 flex items-center justify-center",
            isDark
              ? "translate-x-[64px] bg-[#1e293b] text-white border border-slate-600/50"
              : "translate-x-0 bg-white text-slate-900 border border-slate-200/70"
          )}
        />

        {/* Labels Overlay */}
        <div className="relative z-10 w-full flex items-center justify-between px-1.5 text-[11px] font-bold tracking-wide">
          {/* Light Mode Pill */}
          <span
            className={cn(
              "flex items-center justify-center gap-1 w-[60px] py-1 transition-all duration-200",
              !isDark
                ? "text-slate-900 font-extrabold"
                : "text-slate-400 hover:text-slate-200 opacity-60"
            )}
          >
            <Sun className={cn("h-3.5 w-3.5", !isDark ? "text-amber-500 fill-amber-400" : "")} />
            <span>Light</span>
          </span>

          {/* Dark Mode Pill */}
          <span
            className={cn(
              "flex items-center justify-center gap-1 w-[60px] py-1 transition-all duration-200",
              isDark
                ? "text-white font-extrabold"
                : "text-slate-500 hover:text-slate-700 opacity-60"
            )}
          >
            <Moon className={cn("h-3.5 w-3.5", isDark ? "text-indigo-300 fill-indigo-300" : "")} />
            <span>Dark</span>
          </span>
        </div>
      </label>
    </div>
  );
}
