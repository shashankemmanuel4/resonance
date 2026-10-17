import React from "react";
import { cn } from "../../lib/utils.js";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "indigo" | "amber" | "teal" | "rose";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}) => {
  const variantStyles = {
    default: "bg-subtle text-text-secondary border-border-subtle",
    indigo: "bg-accent-indigo/10 text-accent-indigo border-accent-indigo/30",
    amber: "bg-accent-amber/10 text-accent-amber border-accent-amber/30",
    teal: "bg-accent-teal/10 text-accent-teal border-accent-teal/30",
    rose: "bg-accent-rose/10 text-accent-rose border-accent-rose/30",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] font-medium tracking-wide",
    md: "px-2.5 py-1 text-xs font-medium tracking-wide",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-mono select-none uppercase",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
