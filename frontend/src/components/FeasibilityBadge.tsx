import { FeasibilityStatus } from "@/types";
import { getFeasibilityColor, cn } from "@/lib/utils";

interface FeasibilityBadgeProps {
  status: FeasibilityStatus;
  score?: number;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
  className?: string;
}

export default function FeasibilityBadge({
  status,
  score,
  size = "md",
  showScore = true,
  className,
}: FeasibilityBadgeProps) {
  const conf = getFeasibilityColor(status);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1.5",
    md: "px-3 py-1 text-xs sm:text-sm gap-2",
    lg: "px-4 py-2 text-sm sm:text-base gap-2.5 font-bold",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border font-semibold tracking-wide transition-all shadow-sm",
        conf.bg,
        conf.border,
        conf.text,
        sizeClasses[size],
        className
      )}
    >
      <span className={cn("h-2 w-2 rounded-full animate-pulse", conf.dot)} />
      <span>{conf.label}</span>
      {showScore && score !== undefined && (
        <span
          className={cn(
            "ml-1 rounded-full px-2 py-0.2 text-[11px] font-bold text-white shadow-xs",
            conf.badge
          )}
        >
          {score}%
        </span>
      )}
    </div>
  );
}
