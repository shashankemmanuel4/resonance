import React, { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils.js";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id,
      label,
      options,
      error,
      helperText,
      required = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const errorId = error ? `${id}-error` : undefined;
    const helperId = helperText ? `${id}-helper` : undefined;

    return (
      <div className="space-y-1.5 w-full">
        <label
          htmlFor={id}
          className="block text-xs font-medium text-text-primary tracking-wide"
        >
          {label}
          {required && <span className="text-accent-rose ml-1" aria-hidden="true">*</span>}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={id}
            required={required}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId ?? helperId}
            className={cn(
              "w-full min-h-[44px] appearance-none px-3.5 pr-10 py-2 text-sm bg-surface border rounded-lg text-text-primary transition-colors cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
              error
                ? "border-accent-rose focus-visible:ring-accent-rose"
                : "border-border-subtle hover:border-border-strong focus-visible:border-accent-indigo",
              disabled && "opacity-50 pointer-events-none bg-subtle",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-surface text-text-primary py-1">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-accent-rose">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-xs text-text-tertiary">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
