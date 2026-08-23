import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  raised?: boolean;
  hover?: boolean;
}

export function GlassCard({ className, raised, hover, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        raised ? "glass-raised" : "glass",
        "rounded-2xl",
        hover &&
          "transition-all duration-300 hover:border-border-strong hover:bg-white/[0.045] hover:-translate-y-0.5",
        className
      )}
      {...props}
    />
  );
}
