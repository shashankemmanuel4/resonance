import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button.js";
import { cn } from "../../lib/utils.js";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "Failed to load data. Please check your connection and try again.",
  onRetry,
  className,
}) => {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center p-6 sm:p-8 text-center rounded-xl bg-surface border border-accent-rose/30 text-text-primary",
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-accent-rose/10 flex items-center justify-center mb-3 text-accent-rose">
        <AlertCircle className="w-5 h-5" aria-hidden="true" />
      </div>
      <h4 className="text-sm sm:text-base font-medium text-text-primary mb-1">{title}</h4>
      <p className="text-xs sm:text-sm text-text-secondary max-w-sm mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          icon={<RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />}
        >
          Try again
        </Button>
      )}
    </div>
  );
};
