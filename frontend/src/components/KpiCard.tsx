import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  color?: "blue" | "emerald" | "amber" | "rose" | "purple";
  badge?: string;
  onClick?: () => void;
  active?: boolean;
}

export default function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  badge,
  onClick,
  active = false,
}: KpiCardProps) {
  const colorMap = {
    blue: {
      bg: "from-blue-600/15 to-blue-900/10",
      border: "border-blue-500/20 hover:border-blue-500/50",
      activeBorder: "border-blue-500 ring-1 ring-blue-500",
      iconBg: "bg-blue-500/20 text-blue-400",
      valueColor: "text-blue-400",
    },
    emerald: {
      bg: "from-emerald-600/15 to-emerald-900/10",
      border: "border-emerald-500/20 hover:border-emerald-500/50",
      activeBorder: "border-emerald-500 ring-1 ring-emerald-500",
      iconBg: "bg-emerald-500/20 text-emerald-400",
      valueColor: "text-emerald-400",
    },
    amber: {
      bg: "from-amber-600/15 to-amber-900/10",
      border: "border-amber-500/20 hover:border-amber-500/50",
      activeBorder: "border-amber-500 ring-1 ring-amber-500",
      iconBg: "bg-amber-500/20 text-amber-400",
      valueColor: "text-amber-400",
    },
    rose: {
      bg: "from-rose-600/15 to-rose-900/10",
      border: "border-rose-500/20 hover:border-rose-500/50",
      activeBorder: "border-rose-500 ring-1 ring-rose-500",
      iconBg: "bg-rose-500/20 text-rose-400",
      valueColor: "text-rose-400",
    },
    purple: {
      bg: "from-purple-600/15 to-purple-900/10",
      border: "border-purple-500/20 hover:border-purple-500/50",
      activeBorder: "border-purple-500 ring-1 ring-purple-500",
      iconBg: "bg-purple-500/20 text-purple-400",
      valueColor: "text-purple-400",
    },
  };

  const scheme = colorMap[color];

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 backdrop-blur-sm transition-all duration-200",
        scheme.bg,
        scheme.border,
        active && scheme.activeBorder,
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-950/50"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={cn("rounded-lg p-2.5", scheme.iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-white">
          {value}
        </span>
        {badge && (
          <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-300 border border-slate-700">
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-400 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}
