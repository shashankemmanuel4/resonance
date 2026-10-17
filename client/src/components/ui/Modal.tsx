import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils.js";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg";
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;

      // Focus first focusable element inside modal
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable && focusable.length > 0) {
        focusable[0]?.focus();
      } else {
        modalRef.current?.focus();
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
          return;
        }

        // Trap tab key inside modal
        if (e.key === "Tab" && modalRef.current) {
          const focusableEls = modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusableEls.length === 0) return;

          const firstEl = focusableEls[0];
          const lastEl = focusableEls[focusableEls.length - 1];

          if (e.shiftKey && document.activeElement === firstEl) {
            e.preventDefault();
            lastEl?.focus();
          } else if (!e.shiftKey && document.activeElement === lastEl) {
            e.preventDefault();
            firstEl?.focus();
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
        previouslyFocusedElement.current?.focus();
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  const maxWidthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
        tabIndex={-1}
        className={cn(
          "w-full bg-surface border border-border-strong rounded-2xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden outline-none animate-in zoom-in-95 duration-150",
          maxWidthStyles[maxWidth]
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div>
            <h3 id="modal-title" className="text-base font-semibold text-text-primary tracking-tight">
              {title}
            </h3>
            {description && (
              <p id="modal-description" className="text-xs text-text-secondary mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-130px)] text-sm text-text-secondary">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-3.5 bg-subtle/40 border-t border-border-subtle">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
