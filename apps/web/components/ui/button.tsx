import { type ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium tracking-tight transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap";

const variants = {
  primary:
    "bg-accent text-canvas hover:bg-accent-soft shadow-[0_0_0_1px_rgba(226,183,116,0.4),0_8px_24px_-8px_rgba(226,183,116,0.5)] active:scale-[0.98]",
  secondary:
    "glass text-structure hover:bg-white/[0.06] hover:border-border-strong active:scale-[0.98]",
  ghost: "text-structure-muted hover:text-structure hover:bg-white/[0.05]",
  danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
};

const sizes = {
  sm: "h-8 px-3.5 text-xs",
  md: "h-10 px-5",
  lg: "h-12 px-7 text-[15px]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  href?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", href, children, ...props }, ref) => {
    const classes = cn(base, variants[variant], sizes[size], className);
    if (href) {
      return (
        <Link href={href} className={classes}>
          {children}
        </Link>
      );
    }
    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
