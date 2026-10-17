import React from "react";
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  Compass,
  Sparkles,
  Settings,
  Activity,
} from "lucide-react";
import { cn } from "../../lib/utils.js";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/history", label: "History", icon: Clock },
  { to: "/map", label: "Resonance Map", icon: Compass },
  { to: "/insights", label: "Insights", icon: Sparkles },
];

export const Sidebar: React.FC = () => {
  return (
    <aside
      aria-label="Desktop navigation"
      className="hidden lg:flex flex-col w-60 fixed inset-y-0 left-0 bg-surface border-r border-border-subtle z-30 select-none"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border-subtle gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-accent-indigo/15 border border-accent-indigo/30 flex items-center justify-center text-accent-indigo">
          <Activity className="w-4 h-4" aria-hidden="true" />
        </div>
        <Link
          to="/"
          className="font-mono text-sm tracking-wider font-semibold text-text-primary hover:text-white transition-colors"
        >
          RESONANCE
        </Link>
      </div>

      {/* Primary Log Moment CTA */}
      <div className="p-4">
        <NavLink
          to="/log"
          className={({ isActive }) =>
            cn(
              "w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo",
              isActive
                ? "bg-accent-indigo text-white shadow-indigo-950/60 font-semibold"
                : "bg-accent-indigo text-white hover:bg-accent-indigo/90 shadow-indigo-950/40"
            )
          }
        >
          <PlusCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Log Moment</span>
        </NavLink>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Main menu" className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo",
                  isActive
                    ? "bg-subtle text-accent-indigo border-l-2 border-accent-indigo font-semibold"
                    : "text-text-secondary hover:text-text-primary hover:bg-subtle/50"
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Area: Settings & Monastic Tag */}
      <div className="p-3 border-t border-border-subtle space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo",
              isActive
                ? "bg-subtle text-accent-indigo border-l-2 border-accent-indigo font-semibold"
                : "text-text-secondary hover:text-text-primary hover:bg-subtle/50"
            )
          }
        >
          <Settings className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Settings</span>
        </NavLink>
        <div className="px-3 py-2 text-[10px] font-mono text-text-tertiary uppercase tracking-widest">
          Academic Research Build
        </div>
      </div>
    </aside>
  );
};
