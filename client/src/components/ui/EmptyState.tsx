import React from "react";
import { LucideIcon, Inbox } from "lucide-react";
import { cn } from "../../lib/utils.js";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl bg-surface/50 border border-dashed border-border-subtle",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-subtle flex items-center justify-center mb-4 text-text-tertiary">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="text-base sm:text-lg font-medium text-text-primary tracking-tight mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
};
