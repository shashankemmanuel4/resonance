import React, { forwardRef } from "react";
import { cn } from "../../lib/utils.js";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = "md", hoverable = false, children, ...props }, ref) => {
    const paddingStyles = {
      none: "p-0",
      sm: "p-3 sm:p-4",
      md: "p-4 sm:p-6",
      lg: "p-6 sm:p-8",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "bg-surface border border-border-subtle rounded-xl text-text-primary",
          hoverable && "hover:border-border-strong transition-colors duration-200",
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
