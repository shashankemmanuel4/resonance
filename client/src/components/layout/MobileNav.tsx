import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  Compass,
  Sparkles,
  Settings,
} from "lucide-react";
import { cn } from "../../lib/utils.js";

const mobileNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/history", label: "History", icon: Clock },
  { to: "/log", label: "Log", icon: PlusCircle, isPrimary: true },
  { to: "/map", label: "Map", icon: Compass },
  { to: "/insights", label: "Insights", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const MobileNav: React.FC = () => {
  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-surface/95 backdrop-blur-md border-t border-border-subtle z-40 px-2 flex items-center justify-around select-none"
    >
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1 rounded-lg text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo",
                item.isPrimary
                  ? isActive
                    ? "text-accent-indigo font-semibold"
                    : "text-accent-indigo hover:text-accent-indigo/80"
                  : isActive
                  ? "text-accent-indigo font-semibold"
                  : "text-text-secondary hover:text-text-primary"
              )
            }
          >
            <Icon
              className={cn("w-5 h-5 mb-0.5", item.isPrimary && "scale-110")}
              aria-hidden="true"
            />
            <span className="tracking-tight">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
