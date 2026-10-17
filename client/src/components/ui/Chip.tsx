import React from "react";
import { cn } from "../../lib/utils.js";

export interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected,
  onClick,
  disabled = false,
  icon,
  className,
  size = "md",
}) => {
  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs min-h-[32px] gap-1.5",
    md: "px-3.5 py-2 text-xs sm:text-sm min-h-[44px] gap-2",
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        selected
          ? "bg-accent-indigo/15 text-accent-indigo border border-accent-indigo shadow-sm shadow-indigo-950/40"
          : "bg-surface text-text-secondary hover:text-text-primary hover:bg-subtle border border-border-subtle hover:border-border-strong",
        disabled && "opacity-40 pointer-events-none",
        sizeStyles[size],
        className
      )}
    >
      {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
      <span>{label}</span>
    </button>
  );
};
