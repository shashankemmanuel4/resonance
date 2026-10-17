import React, { forwardRef } from "react";
import { cn } from "../../lib/utils.js";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, error, helperText, required = false, className, disabled, ...props }, ref) => {
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
        <input
          ref={ref}
          id={id}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId ?? helperId}
          className={cn(
            "w-full min-h-[44px] px-3.5 py-2 text-sm bg-surface border rounded-lg text-text-primary placeholder:text-text-tertiary transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
            error
              ? "border-accent-rose focus-visible:ring-accent-rose"
              : "border-border-subtle hover:border-border-strong focus-visible:border-accent-indigo",
            disabled && "opacity-50 pointer-events-none bg-subtle",
            className
          )}
          {...props}
        />
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

Input.displayName = "Input";
