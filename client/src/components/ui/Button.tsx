import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils.js";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      icon,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-50 disabled:pointer-events-none select-none";

    const variantStyles = {
      primary:
        "bg-accent-indigo text-white hover:bg-accent-indigo/90 active:bg-accent-indigo/95 shadow-sm shadow-indigo-950/50",
      secondary:
        "bg-subtle text-text-primary hover:bg-subtle/80 active:bg-subtle/90 border border-border-subtle",
      outline:
        "bg-transparent text-text-primary border border-border-subtle hover:border-border-strong hover:bg-subtle/40 active:bg-subtle/60",
      ghost:
        "bg-transparent text-text-secondary hover:text-text-primary hover:bg-subtle/50 active:bg-subtle/70",
      danger:
        "bg-accent-rose text-white hover:bg-accent-rose/90 active:bg-accent-rose/95 shadow-sm shadow-rose-950/50",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs min-h-[36px] gap-1.5",
      md: "px-4 py-2 text-sm min-h-[44px] gap-2",
      lg: "px-5 py-2.5 text-base min-h-[48px] gap-2.5",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" aria-hidden="true" />
        ) : icon ? (
          <span className="shrink-0" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
