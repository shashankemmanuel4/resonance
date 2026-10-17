import React from "react";
import { Link } from "react-router-dom";
import {
  PlusCircle,
  Clock,
  MapPin,
  Activity,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Calendar,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { usePulse } from "../hooks/usePulse.js";
import { useSummary } from "../hooks/useSummary.js";
import { useMoments } from "../hooks/useMoments.js";
import { usePreferences } from "../hooks/usePreferences.js";
import { Button } from "../components/ui/Button.js";
import { Card } from "../components/ui/Card.js";
import { Badge } from "../components/ui/Badge.js";
import { Skeleton } from "../components/ui/Skeleton.js";
import { EmptyState } from "../components/ui/EmptyState.js";
import { ErrorState } from "../components/ui/ErrorState.js";
import {
  formatTimestamp,
  formatDuration,
  formatCategoryLabel,
} from "../lib/utils.js";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
}

const ChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface/95 backdrop-blur-md border border-border-strong px-3 py-2 rounded-lg shadow-xl shadow-black/60 text-xs font-mono space-y-1">
        <p className="text-text-secondary font-sans border-b border-border-subtle pb-1 mb-1">
          {label}
        </p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span style={{ color: entry.color }} className="capitalize">
              {entry.name}:
            </span>
            <span className="font-semibold text-text-primary">
              {typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value} / 5
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC = () => {
  const { timezone, loading: tzLoading } = usePreferences();
  const {
    data: pulse,
    loading: pulseLoading,
    error: pulseError,
    refetch: refetchPulse,
  } = usePulse(timezone);

  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useSummary();

  const {
    moments: recentMoments,
    total: totalMomentsCount,
    loading: momentsLoading,
    error: momentsError,
    refetch: refetchMoments,
  } = useMoments({ limit: 5 });

  const weekStats = pulse?.weekStats;
  const topLocation = pulse?.topLocation;
  const dailyTrend = pulse?.dailyTrend ?? [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ------------------------------------------------------------------ */}
      {/* SECTION A: Header                                                   */}
      {/* ------------------------------------------------------------------ */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-text-tertiary uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Timezone: {tzLoading ? "Loading..." : timezone}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
            Dashboard
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Self-reported session pulse and environmental patterns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/history">
            <Button variant="outline" size="sm" icon={<Clock className="w-4 h-4" />}>
              History
            </Button>
          </Link>
          <Link to="/log">
            <Button size="sm" icon={<PlusCircle className="w-4 h-4" />}>
              Log Moment
            </Button>
          </Link>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION B: 7-Day Pulse (KPI Row)                                   */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="pulse-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-indigo" aria-hidden="true" />
            <h2
              id="pulse-heading"
              className="text-sm font-semibold tracking-wide uppercase text-text-secondary font-mono"
            >
              7-Day Pulse (Last 7 Days)
            </h2>
          </div>
          <span className="text-xs text-text-tertiary">
            Updated via live aggregation
          </span>
        </div>

        {pulseError ? (
          <ErrorState
            title="Failed to load 7-day pulse"
            message={pulseError}
            onRetry={refetchPulse}
          />
        ) : pulseLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i} padding="sm" className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-2 w-20" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* KPI 1: Sessions */}
            <Card padding="md" className="space-y-1">
              <span className="text-xs text-text-tertiary uppercase tracking-wider font-mono">
                Sessions
              </span>
              <div className="text-2xl font-bold font-mono text-text-primary">
                {weekStats?.sessionCount ?? "—"}
              </div>
              <p className="text-[11px] text-text-secondary">Logged in 7-day window</p>
            </Card>

            {/* KPI 2: Total Time */}
            <Card padding="md" className="space-y-1">
              <span className="text-xs text-text-tertiary uppercase tracking-wider font-mono">
                Logged Time
              </span>
              <div className="text-2xl font-bold font-mono text-text-primary">
                {weekStats?.totalLoggedMinutes
                  ? formatDuration(weekStats.totalLoggedMinutes)
                  : "—"}
              </div>
              <p className="text-[11px] text-text-secondary">Total session duration</p>
            </Card>

            {/* KPI 3: Avg Focus */}
            <Card padding="md" className="space-y-1">
              <span className="text-xs text-text-tertiary uppercase tracking-wider font-mono">
                Avg Focus
              </span>
              <div className="text-2xl font-bold font-mono text-accent-indigo">
                {weekStats?.avgFocus ? `${weekStats.avgFocus.toFixed(1)}` : "—"}
                <span className="text-xs font-normal text-text-tertiary ml-1">/ 5</span>
              </div>
              <p className="text-[11px] text-text-secondary">Self-reported focus</p>
            </Card>

            {/* KPI 4: Avg Energy */}
            <Card padding="md" className="space-y-1">
              <span className="text-xs text-text-tertiary uppercase tracking-wider font-mono">
                Avg Energy
              </span>
              <div className="text-2xl font-bold font-mono text-accent-amber">
                {weekStats?.avgEnergy ? `${weekStats.avgEnergy.toFixed(1)}` : "—"}
                <span className="text-xs font-normal text-text-tertiary ml-1">/ 5</span>
              </div>
              <p className="text-[11px] text-text-secondary">Self-reported energy</p>
            </Card>

            {/* KPI 5: Avg Resonance */}
            <Card padding="md" className="space-y-1 col-span-2 sm:col-span-1">
              <span className="text-xs text-text-tertiary uppercase tracking-wider font-mono">
                Avg Resonance
              </span>
              <div className="text-2xl font-bold font-mono text-accent-teal">
                {weekStats?.avgResonance ? `${weekStats.avgResonance.toFixed(1)}` : "—"}
                <span className="text-xs font-normal text-text-tertiary ml-1">/ 5</span>
              </div>
              <p className="text-[11px] text-text-secondary">Weighted 60/40 index</p>
            </Card>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION C & D: Daily Trend & Top Location Callout                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart (2 columns on desktop) */}
        <section
          aria-labelledby="trend-heading"
          className="lg:col-span-2 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent-indigo" aria-hidden="true" />
              <h2
                id="trend-heading"
                className="text-sm font-semibold tracking-wide uppercase text-text-secondary font-mono"
              >
                Daily Trend (Focus &amp; Energy)
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 text-accent-indigo">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-indigo" aria-hidden="true" />
                Focus
              </span>
              <span className="inline-flex items-center gap-1.5 text-accent-amber">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-amber" aria-hidden="true" />
                Energy
              </span>
            </div>
          </div>

          <Card padding="md" className="min-h-[280px] flex flex-col justify-center">
            {pulseError ? (
              <ErrorState
                title="Could not load daily trend"
                message={pulseError}
                onRetry={refetchPulse}
              />
            ) : pulseLoading ? (
              <div className="space-y-3 py-6 px-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-[200px] w-full" />
              </div>
            ) : dailyTrend.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No daily trend data"
                description="Log moments throughout the week to see your daily focus and energy patterns."
                action={
                  <Link to="/log">
                    <Button size="sm">Log a session</Button>
                  </Link>
                }
              />
            ) : (
              <div className="w-full h-[250px]" aria-label="Line chart showing focus and energy over the past 7 days">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyTrend}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#262A36" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#6B7280"
                      tick={{ fill: "#9CA3AF", fontSize: 11, fontFamily: "monospace" }}
                      tickLine={false}
                      axisLine={{ stroke: "#262A36" }}
                    />
                    <YAxis
                      domain={[1, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      stroke="#6B7280"
                      tick={{ fill: "#9CA3AF", fontSize: 11, fontFamily: "monospace" }}
                      tickLine={false}
                      axisLine={{ stroke: "#262A36" }}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="avgFocus"
                      name="Focus"
                      stroke="#6366F1"
                      strokeWidth={2.5}
                      dot={{ fill: "#6366F1", r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#818CF8" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgEnergy"
                      name="Energy"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ fill: "#F59E0B", r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "#FBBF24" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </section>

        {/* Top Resonance Location Callout (1 column on desktop) */}
        <section
          aria-labelledby="top-loc-heading"
          className="space-y-3 flex flex-col"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent-teal" aria-hidden="true" />
            <h2
              id="top-loc-heading"
              className="text-sm font-semibold tracking-wide uppercase text-text-secondary font-mono"
            >
              Top Resonance Location
            </h2>
          </div>

          <Card padding="md" className="flex-1 flex flex-col justify-between space-y-4">
            {pulseLoading ? (
              <div className="space-y-3 py-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-44" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : topLocation ? (
              <>
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-accent-teal uppercase tracking-wider">
                    Highest Resonance in this Window
                  </span>
                  <h3 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">
                    {topLocation.location}
                  </h3>
                  <div className="flex items-center gap-3 pt-1">
                    <Badge variant="teal" size="md">
                      Score: {topLocation.avgResonance.toFixed(1)} / 5
                    </Badge>
                    <span className="text-xs text-text-tertiary font-mono">
                      {topLocation.count} sessions recorded
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-subtle/60 border border-border-subtle text-xs text-text-tertiary leading-relaxed">
                  <p>
                    <strong className="text-text-secondary font-medium">Pattern Note:</strong> This
                    condition reflects your highest average self-reported focus and energy in the
                    recent window (minimum 2 sessions). It represents an observed association, not a
                    causal guarantee.
                  </p>
                </div>

                <div className="pt-2">
                  <Link to="/map">
                    <Button variant="outline" size="sm" className="w-full">
                      Explore Resonance Map
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="py-8 text-center flex-1 flex flex-col justify-center items-center">
                <div className="w-10 h-10 rounded-full bg-subtle flex items-center justify-center text-text-tertiary mb-3">
                  <MapPin className="w-5 h-5" aria-hidden="true" />
                </div>
                <h4 className="text-sm font-medium text-text-primary">No recurring location</h4>
                <p className="text-xs text-text-secondary max-w-xs mt-1 leading-relaxed">
                  At least 2 sessions in the same location are required in the 7-day window to
                  highlight an environmental pattern.
                </p>
              </div>
            )}
          </Card>
        </section>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION E: All-Time Summary                                        */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="summary-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-text-tertiary" aria-hidden="true" />
            <h2
              id="summary-heading"
              className="text-sm font-semibold tracking-wide uppercase text-text-secondary font-mono"
            >
              All-Time Summary
            </h2>
          </div>
          <span className="text-xs text-text-tertiary">All recorded history</span>
        </div>

        {summaryError ? (
          <ErrorState
            title="Failed to load all-time summary"
            message={summaryError}
            onRetry={refetchSummary}
          />
        ) : summaryLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i} padding="sm" className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-20" />
              </Card>
            ))}
          </div>
        ) : (
          <Card padding="md" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <span className="text-[11px] font-mono text-text-tertiary uppercase tracking-wider block">
                  All Sessions
                </span>
                <span className="text-xl font-bold font-mono text-text-primary mt-0.5 block">
                  {summary?.totalMoments ?? 0}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-mono text-text-tertiary uppercase tracking-wider block">
                  Total Time
                </span>
                <span className="text-xl font-bold font-mono text-text-primary mt-0.5 block">
                  {summary?.totalMinutes ? formatDuration(summary.totalMinutes) : "0m"}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-mono text-text-tertiary uppercase tracking-wider block">
                  Lifetime Focus
                </span>
                <span className="text-xl font-bold font-mono text-accent-indigo mt-0.5 block">
                  {summary?.avgFocus ? `${summary.avgFocus.toFixed(1)} / 5` : "—"}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-mono text-text-tertiary uppercase tracking-wider block">
                  Lifetime Energy
                </span>
                <span className="text-xl font-bold font-mono text-accent-amber mt-0.5 block">
                  {summary?.avgEnergy ? `${summary.avgEnergy.toFixed(1)} / 5` : "—"}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[11px] font-mono text-text-tertiary uppercase tracking-wider block">
                  Lifetime Resonance
                </span>
                <span className="text-xl font-bold font-mono text-accent-teal mt-0.5 block">
                  {summary?.avgResonance ? `${summary.avgResonance.toFixed(1)} / 5` : "—"}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-border-subtle text-[11px] text-text-tertiary italic">
              Your Resonance Score is a simple weighted average of your self-reported focus (60%) and
              energy (40%) for each session. It is a convenience summary, not a validated metric.
            </div>
          </Card>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION F: Recent Moments                                          */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="recent-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-text-secondary" aria-hidden="true" />
            <h2
              id="recent-heading"
              className="text-sm font-semibold tracking-wide uppercase text-text-secondary font-mono"
            >
              Recent Moments ({totalMomentsCount} Total)
            </h2>
          </div>
          <Link
            to="/history"
            className="text-xs text-accent-indigo hover:text-accent-indigo/80 font-medium inline-flex items-center gap-1"
          >
            <span>View all in History</span>
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </Link>
        </div>

        {momentsError ? (
          <ErrorState
            title="Failed to load recent moments"
            message={momentsError}
            onRetry={refetchMoments}
          />
        ) : momentsLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Card key={i} padding="sm" className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-3 w-60" />
              </Card>
            ))}
          </div>
        ) : recentMoments.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No moments logged yet"
            description="Start capturing your work sessions to discover your environmental and time-of-day patterns."
            action={
              <Link to="/log">
                <Button size="sm" icon={<PlusCircle className="w-4 h-4" />}>
                  Log your first moment
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-2.5">
            {recentMoments.map((m) => (
              <Card
                key={m._id}
                padding="sm"
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-border-strong transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-text-primary text-sm truncate">
                      {m.activity.taskName}
                    </span>
                    <Badge variant="indigo" size="sm">
                      {formatCategoryLabel(m.activity.category)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-tertiary flex-wrap">
                    <span className="inline-flex items-center gap-1 text-text-secondary">
                      <MapPin className="w-3 h-3 text-text-tertiary" aria-hidden="true" />
                      {m.environment.location}
                    </span>
                    <span>&bull;</span>
                    <span>{formatDuration(m.durationMinutes)}</span>
                    <span>&bull;</span>
                    <span>{formatTimestamp(m.timestamp, timezone)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center font-mono text-xs">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-subtle border border-border-subtle">
                    <span className="text-text-tertiary text-[10px]">FOCUS</span>
                    <span className="text-accent-indigo font-bold">{m.experience.focusScore}/5</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-subtle border border-border-subtle">
                    <span className="text-text-tertiary text-[10px]">ENERGY</span>
                    <span className="text-accent-amber font-bold">{m.experience.energyScore}/5</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent-teal/10 border border-accent-teal/30">
                    <span className="text-accent-teal font-semibold">
                      {m.resonanceScore.toFixed(1)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
