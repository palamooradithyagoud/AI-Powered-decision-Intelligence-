import { RiskSeverity } from "@/types";
import { getRiskSeverityColor, cn } from "@/lib/utils";

interface RiskSeverityBadgeProps {
  severity: RiskSeverity;
  size?: "sm" | "md";
  className?: string;
}

export default function RiskSeverityBadge({
  severity,
  size = "sm",
  className,
}: RiskSeverityBadgeProps) {
  const conf = getRiskSeverityColor(severity);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-semibold uppercase tracking-wider",
        conf.bg,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      {severity}
    </span>
  );
}
