import { cn } from "@/lib/cn";

export function Meter({
  value,
  max = 100,
  label,
  sublabel,
  tone = "accent",
}: {
  value: number;
  max?: number;
  label: string;
  sublabel?: string;
  tone?: "accent" | "success" | "warning" | "danger";
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const barTone = {
    accent: "bg-accent",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  }[tone];

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-structure-muted">{label}</span>
        {sublabel && (
          <span className="font-mono text-xs text-structure-faint">{sublabel}</span>
        )}
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barTone)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
