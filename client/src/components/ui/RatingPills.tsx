import React, { useRef } from "react";
import { cn } from "../../lib/utils.js";

export interface RatingPillsProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  lowLabel?: string;
  highLabel?: string;
}

export const RatingPills: React.FC<RatingPillsProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  className,
  lowLabel = "Low",
  highLabel = "High",
}) => {
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (disabled) return;
    let targetIndex = -1;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      targetIndex = (index + 1) % 5;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      targetIndex = (index - 1 + 5) % 5;
    } else if (e.key === "Home") {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      targetIndex = 4;
    }

    if (targetIndex !== -1) {
      const nextValue = targetIndex + 1;
      onChange(nextValue);
      pillRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
        <span className="font-medium text-text-primary">{label}</span>
        <span className="font-mono text-[11px] text-text-tertiary">
          {value ? `${value}/5` : "Unrated"}
        </span>
      </div>

      <fieldset
        role="radiogroup"
        aria-label={`${label} rating`}
        disabled={disabled}
        className="grid grid-cols-5 gap-2 select-none border-0 p-0 m-0"
      >
        <legend className="sr-only">{label}</legend>
        {[1, 2, 3, 4, 5].map((rating, idx) => {
          const isSelected = value === rating;
          return (
            <button
              key={rating}
              ref={(el) => {
                pillRefs.current[idx] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${label}: ${rating} out of 5`}
              tabIndex={isSelected || (!value && rating === 1) ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(rating)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={cn(
                "min-h-[44px] flex items-center justify-center rounded-lg font-mono text-sm font-medium transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
                isSelected
                  ? "bg-accent-indigo text-white font-semibold shadow-md shadow-indigo-950/60 border border-accent-indigo"
                  : "bg-surface text-text-secondary hover:text-text-primary hover:bg-subtle border border-border-subtle hover:border-border-strong",
                disabled && "opacity-40 pointer-events-none"
              )}
            >
              {rating}
            </button>
          );
        })}
      </fieldset>

      <div className="flex items-center justify-between text-[11px] text-text-tertiary px-0.5">
        <span>1: {lowLabel}</span>
        <span>5: {highLabel}</span>
      </div>
    </div>
  );
};
