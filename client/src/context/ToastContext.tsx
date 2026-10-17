import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  undoAction?: () => void;
  undoLabel?: string;
  durationMs: number;
}

interface ToastContextType {
  showToast: (
    message: string,
    options?: {
      type?: ToastType;
      undoAction?: () => void;
      undoLabel?: string;
      durationMs?: number;
    }
  ) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  dismissToast: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (
      message: string,
      options?: {
        type?: ToastType;
        undoAction?: () => void;
        undoLabel?: string;
        durationMs?: number;
      }
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const type = options?.type ?? "success";
      const durationMs = options?.durationMs ?? (options?.undoAction ? 5000 : 3000);

      const toastItem: ToastItem = {
        id,
        message,
        type,
        undoAction: options?.undoAction,
        undoLabel: options?.undoLabel ?? "Undo",
        durationMs,
      };

      setToasts((prev) => [...prev, toastItem]);

      const timer = setTimeout(() => {
        dismissToast(id);
      }, durationMs);

      timersRef.current.set(id, timer);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      {/* Accessible Live Region */}
      <aside
        aria-live="polite"
        role="status"
        aria-atomic="true"
        className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none w-full max-w-md px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-surface border border-border-strong text-text-primary shadow-xl shadow-black/40 text-sm animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {toast.type === "success" && (
                <CheckCircle2 className="w-4 h-4 text-accent-teal shrink-0" aria-hidden="true" />
              )}
              {toast.type === "error" && (
                <AlertCircle className="w-4 h-4 text-accent-rose shrink-0" aria-hidden="true" />
              )}
              {toast.type === "info" && (
                <Info className="w-4 h-4 text-accent-indigo shrink-0" aria-hidden="true" />
              )}
              <span className="truncate">{toast.message}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {toast.undoAction && (
                <button
                  type="button"
                  onClick={() => {
                    toast.undoAction?.();
                    dismissToast(toast.id);
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-accent-amber hover:text-accent-amber/80 bg-subtle hover:bg-subtle/80 rounded border border-border-subtle focus:outline-none focus:ring-1 focus:ring-accent-amber"
                >
                  {toast.undoLabel}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="p-1 text-text-tertiary hover:text-text-primary rounded focus:outline-none focus:ring-1 focus:ring-accent-indigo"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </aside>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  return useContext(ToastContext);
}
