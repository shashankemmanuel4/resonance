import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Clock,
  Zap,
  Database,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  PlusCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import { useChronobiology } from "../hooks/useChronobiology.js";
import { useDistractions } from "../hooks/useDistractions.js";
import { usePreferences } from "../hooks/usePreferences.js";
import { Button } from "../components/ui/Button.js";
import { Card } from "../components/ui/Card.js";
import { Skeleton } from "../components/ui/Skeleton.js";
import { EmptyState } from "../components/ui/EmptyState.js";
import { ErrorState } from "../components/ui/ErrorState.js";


// ---------------------------------------------------------------------------
// Pipeline stage data — describes actual implemented server pipelines
// ---------------------------------------------------------------------------

interface PipelineStage {
  operator: string;
  description: string;
}

interface PipelineDefinition {
  id: string;
  name: string;
  endpoint: string;
  description: string;
  stages: PipelineStage[];
}

const PIPELINES: PipelineDefinition[] = [
  {
    id: "matrix",
    name: "Environmental Matrix",
    endpoint: "GET /api/analytics/matrix",
    description:
      "Groups session dimensions (location × lighting × noise) to surface recurring conditions. Requires ≥ 2 sessions per combination to filter single-occurrence anomalies.",
    stages: [
      { operator: "$match", description: "Filter to the demo user's moments by userId" },
      {
        operator: "$group",
        description:
          "Group by { location, lighting, noiseLevel } and accumulate sessionCount, totalMinutes, sumFocus, sumEnergy",
      },
      {
        operator: "$match",
        description: "Exclude conditions with fewer than 2 sessions (sessionCount ≥ 2)",
      },
      {
        operator: "$project",
        description:
          "Compute avgFocus, avgEnergy, avgResonance (60 % focus + 40 % energy), round to 2 decimal places",
      },
      { operator: "$sort", description: "Sort by avgResonance descending, then sessionCount" },
      { operator: "$limit", description: "Return the top 20 environmental conditions" },
    ],
  },
  {
    id: "chronobiology",
    name: "Focus Across the Day",
    endpoint: "GET /api/analytics/chronobiology?tz=<iana>",
    description:
      "Extracts the local hour from each session's UTC timestamp using the user's IANA timezone, then aggregates focus and energy by hour. Sparse hours are omitted — a missing bar means no sessions were logged, not zero focus.",
    stages: [
      { operator: "$match", description: "Filter to the demo user's moments by userId" },
      {
        operator: "$project",
        description:
          "Extract { localHour } using $hour with the user's IANA timezone string to ensure all times are in local time, not UTC",
      },
      {
        operator: "$group",
        description:
          "Group by localHour: accumulate momentCount, totalDuration, sumFocus, sumEnergy",
      },
      {
        operator: "$project",
        description: "Compute avgFocus = sumFocus / momentCount, avgEnergy = sumEnergy / momentCount",
      },
      { operator: "$sort", description: "Sort by hour ascending (0 → 23)" },
    ],
  },
  {
    id: "distractions",
    name: "Distraction Impact",
    endpoint: "GET /api/analytics/distractions",
    description:
      "Uses a $facet to compute two parallel branches simultaneously: the overall focus baseline and per-distraction aggregates. Sessions are compared rather than individuals.",
    stages: [
      { operator: "$match", description: "Filter to the demo user's moments" },
      {
        operator: "$facet",
        description:
          "Branch A: compute global avgFocus baseline across all sessions. Branch B: $unwind the distractions array and group by tag name",
      },
      {
        operator: "$unwind",
        description: "Decompose the experience.distractions array so each tag becomes a document",
      },
      {
        operator: "$group",
        description: "Count occurrences per tag and compute avgFocus for sessions containing that tag",
      },
      {
        operator: "$match",
        description: "Retain only distraction tags with ≥ 2 occurrences to prevent outlier skew",
      },
      {
        operator: "$project",
        description:
          "Compute focusDelta = avgFocus (with distraction) − baseline avgFocus. Sort by most negative delta first",
      },
    ],
  },
  {
    id: "pulse",
    name: "7-Day Pulse",
    endpoint: "GET /api/analytics/pulse?tz=<iana>",
    description:
      "A three-branch $facet pipeline that simultaneously computes week statistics, the top-resonance location, and a daily trend for the past 7 days.",
    stages: [
      {
        operator: "$match",
        description:
          "Filter to the demo user's moments where timestamp ≥ now − 7 days (server-computed window in UTC)",
      },
      {
        operator: "$facet",
        description:
          "Branch A (weekStats): single-group aggregation. Branch B (topLocation): group by location, sort by avgResonance. Branch C (dailyTrend): group by local date using timezone",
      },
      {
        operator: "$project",
        description:
          "Unwrap single-element arrays from facet output. Compute avgResonance, format date strings in local timezone",
      },
    ],
  },
  {
    id: "summary",
    name: "All-Time Summary",
    endpoint: "GET /api/analytics/summary",
    description:
      "Simple single-group aggregation across all user moments to compute lifetime totals and averages.",
    stages: [
      { operator: "$match", description: "Filter to the demo user's moments" },
      {
        operator: "$group",
        description:
          "Single group (null): sum durationMinutes → totalMinutes, count → totalMoments, avg focusScore, avg energyScore",
      },
      {
        operator: "$project",
        description:
          "Compute avgResonance = (avgFocus × 0.6) + (avgEnergy × 0.4), round all averages to 2 decimal places",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Chart tooltip
// ---------------------------------------------------------------------------

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

const HourTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const hour = Number(label ?? 0);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return (
    <div className="bg-surface/95 backdrop-blur-md border border-border-strong px-3 py-2 rounded-lg shadow-xl shadow-black/60 text-xs font-mono space-y-1">
      <p className="text-text-secondary font-sans border-b border-border-subtle pb-1 mb-1">
        {displayHour} {ampm}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span style={{ color: entry.color }}>{entry.name}:</span>
          <span className="font-semibold text-text-primary">
            {typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value} / 5
          </span>
        </div>
      ))}
    </div>
  );
};

const DistractionTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-surface/95 backdrop-blur-md border border-border-strong px-3 py-2 rounded-lg shadow-xl shadow-black/60 text-xs font-mono space-y-1">
      <p className="text-text-secondary font-sans border-b border-border-subtle pb-1 mb-1">
        {label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span style={{ color: entry.color }}>{entry.name}:</span>
          <span className="font-semibold text-text-primary">
            {Number(entry.value) > 0 ? "+" : ""}
            {typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Pipeline Inspector Panel
// ---------------------------------------------------------------------------

const PipelineInspector: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [activePipeline, setActivePipeline] = useState<string>(PIPELINES[0]!.id);

  const pipeline = PIPELINES.find((p) => p.id === activePipeline) ?? PIPELINES[0]!;

  return (
    <Card padding="none" className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="pipeline-inspector-content"
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-subtle/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo focus-visible:ring-inset"
      >
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-accent-indigo" aria-hidden="true" />
          <span className="text-sm font-semibold uppercase tracking-wider font-mono text-text-secondary">
            Pipeline Inspector
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent-indigo/10 text-accent-indigo border border-accent-indigo/30 font-mono">
            Academic Feature
          </span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-text-tertiary" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-tertiary" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div id="pipeline-inspector-content" className="border-t border-border-subtle">
          {/* Rationale banner */}
          <div className="px-5 py-4 bg-subtle/30 border-b border-border-subtle text-xs text-text-secondary space-y-2">
            <p>
              RESONANCE demonstrates MongoDB aggregation pipelines: computation occurs
              server-side, adjacent to the data. The frontend receives pre-summarized results,
              minimising data transfer and clearly separating database logic from UI presentation.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
              {["Computation near data", "Reduced transfer volume", "Server-side aggregation", "Separation of concerns"].map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded bg-surface border border-border-subtle text-text-tertiary">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Pipeline tab selectors */}
          <div
            role="tablist"
            aria-label="Select pipeline to inspect"
            className="flex items-center gap-1 px-5 py-3 border-b border-border-subtle overflow-x-auto scrollbar-none"
          >
            {PIPELINES.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={activePipeline === p.id}
                onClick={() => setActivePipeline(p.id)}
                className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md transition-colors font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo ${
                  activePipeline === p.id
                    ? "bg-accent-indigo/15 text-accent-indigo font-semibold border border-accent-indigo/30"
                    : "text-text-secondary hover:text-text-primary hover:bg-subtle"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Active pipeline detail */}
          <div className="p-5 space-y-4">
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-text-primary">{pipeline.name}</h3>
                <code className="text-[11px] font-mono text-accent-indigo bg-accent-indigo/10 border border-accent-indigo/25 px-2 py-0.5 rounded shrink-0">
                  {pipeline.endpoint}
                </code>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{pipeline.description}</p>
            </div>

            {/* Stage flow */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-[11px] font-mono text-text-tertiary uppercase tracking-wider">
                  Raw Moments (Collection)
                </div>
                <div className="flex-1 border-t border-dashed border-border-subtle" />
              </div>
              {pipeline.stages.map((stage, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-1 h-3 bg-border-subtle rounded-full" />
                    <div className="w-2 h-2 rounded-full bg-accent-indigo/60 mt-0.5 mb-0.5" />
                    {idx < pipeline.stages.length - 1 && (
                      <div className="w-0.5 h-6 bg-border-subtle rounded-full" />
                    )}
                  </div>
                  <div className="pb-2 min-w-0">
                    <code className="text-xs font-mono font-semibold text-accent-indigo">
                      {stage.operator}
                    </code>
                    <p className="text-xs text-text-secondary leading-relaxed mt-0.5">
                      {stage.description}
                    </p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 border-t border-dashed border-border-subtle" />
                <div className="text-[11px] font-mono text-accent-teal uppercase tracking-wider">
                  Frontend Visualization
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Main Insights Page
// ---------------------------------------------------------------------------

export const Insights: React.FC = () => {
  const { timezone } = usePreferences();
  const {
    data: hourlyData,
    loading: hourlyLoading,
    error: hourlyError,
    refetch: refetchHourly,
  } = useChronobiology(timezone);

  const {
    data: distractions,
    loading: distractionsLoading,
    error: distractionsError,
    refetch: refetchDistractions,
  } = useDistractions();

  // Format hour label: 0 → "12 AM", 13 → "1 PM"
  const formatHour = (h: number): string => {
    const ampm = h >= 12 ? "PM" : "AM";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display}${ampm}`;
  };

  const hourlyChartData = hourlyData.map((item) => ({
    ...item,
    hourLabel: formatHour(item.hour),
  }));

  // Peak focus hour from real data
  const peakHour =
    hourlyData.length > 0
      ? hourlyData.reduce((best, curr) => (curr.avgFocus > best.avgFocus ? curr : best))
      : null;

  // Distraction chart data ordered by focusDelta ascending (most negative first)
  const distractionChartData = [...distractions].sort(
    (a, b) => a.focusDelta - b.focusDelta
  );

  // Baseline from first item (all share same baseline)
  const baseline = distractions[0]?.baselineFocus ?? null;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-2 border-b border-border-subtle">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
            Insights
          </h1>
          <p className="text-sm text-text-secondary">
            Patterns across time and distractions in your logged sessions.
          </p>
        </div>
        <Link to="/log">
          <Button size="sm" icon={<PlusCircle className="w-4 h-4" />}>
            Log Moment
          </Button>
        </Link>
      </header>

      {/* Educational Disclosure */}
      <Card padding="md" className="bg-subtle/30 border-border-subtle flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-accent-indigo shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-text-secondary leading-relaxed">
          <strong className="text-text-primary font-medium">Academic Note:</strong> These views
          describe associations in self-reported sessions. They do not establish causation or
          constitute a scientifically validated productivity measure. Use them for personal
          reflection, not prescription.
        </p>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION A: Focus Across the Day                                    */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="hourly-heading" className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent-indigo" aria-hidden="true" />
          <h2
            id="hourly-heading"
            className="text-sm font-semibold uppercase tracking-wider font-mono text-text-secondary"
          >
            Focus Across the Day
          </h2>
        </div>

        {hourlyError ? (
          <ErrorState
            title="Could not load hourly focus data"
            message={hourlyError}
            onRetry={refetchHourly}
          />
        ) : hourlyLoading ? (
          <Card padding="md" className="space-y-4">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-[280px] w-full" />
          </Card>
        ) : hourlyData.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No hourly data yet"
            description="Log sessions at different times of day to discover your hourly focus distribution."
            action={
              <Link to="/log">
                <Button size="sm">Log a session</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {/* Peak focus callout */}
            {peakHour && (
              <Card padding="md" className="flex items-start gap-3 bg-accent-indigo/5 border-accent-indigo/20">
                <Sparkles className="w-4 h-4 text-accent-indigo shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-text-secondary leading-relaxed">
                  Your logged sessions show a higher average self-reported focus around{" "}
                  <strong className="text-text-primary font-semibold">
                    {formatHour(peakHour.hour)}
                  </strong>{" "}
                  ({peakHour.avgFocus.toFixed(2)} / 5, {peakHour.momentCount} session
                  {peakHour.momentCount !== 1 ? "s" : ""}). Bars represent only hours with at
                  least one logged session — missing hours have no recorded data.
                </p>
              </Card>
            )}

            <Card padding="md" className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-text-tertiary mb-2">
                <span>Self-reported focus by hour (local timezone: {timezone})</span>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-accent-indigo">
                    <span className="w-2.5 h-2.5 rounded-sm bg-accent-indigo" aria-hidden="true" />
                    Focus
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-accent-amber">
                    <span className="w-2.5 h-2.5 rounded-sm bg-accent-amber" aria-hidden="true" />
                    Energy
                  </span>
                </div>
              </div>

              <div
                className="w-full h-[260px]"
                aria-label="Bar chart showing average self-reported focus and energy by hour of day"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hourlyChartData}
                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                    barGap={2}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#262A36" vertical={false} />
                    <XAxis
                      dataKey="hourLabel"
                      stroke="#6B7280"
                      tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "monospace" }}
                      tickLine={false}
                      axisLine={{ stroke: "#262A36" }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={[0, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      stroke="#6B7280"
                      tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "monospace" }}
                      tickLine={false}
                      axisLine={{ stroke: "#262A36" }}
                    />
                    <Tooltip content={<HourTooltip />} />
                    <Bar
                      dataKey="avgFocus"
                      name="Focus"
                      fill="#6366F1"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={32}
                    />
                    <Bar
                      dataKey="avgEnergy"
                      name="Energy"
                      fill="#F59E0B"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={32}
                      fillOpacity={0.75}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Accessible table for screen readers */}
              <details className="mt-2">
                <summary className="text-[11px] text-text-tertiary cursor-pointer hover:text-text-secondary font-mono">
                  View data table (screen reader)
                </summary>
                <table className="mt-2 w-full text-xs text-text-secondary border-collapse">
                  <thead>
                    <tr className="text-left border-b border-border-subtle">
                      <th className="py-1 pr-4 font-mono font-medium">Hour</th>
                      <th className="py-1 pr-4 font-mono font-medium">Sessions</th>
                      <th className="py-1 pr-4 font-mono font-medium">Avg Focus</th>
                      <th className="py-1 font-mono font-medium">Avg Energy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hourlyData.map((row) => (
                      <tr key={row.hour} className="border-b border-border-subtle/50">
                        <td className="py-1 pr-4 font-mono">{formatHour(row.hour)}</td>
                        <td className="py-1 pr-4 font-mono">{row.momentCount}</td>
                        <td className="py-1 pr-4 font-mono">{row.avgFocus.toFixed(2)}</td>
                        <td className="py-1 font-mono">{row.avgEnergy.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </Card>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION B: Distraction Insights                                    */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="distraction-heading" className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent-amber" aria-hidden="true" />
          <h2
            id="distraction-heading"
            className="text-sm font-semibold uppercase tracking-wider font-mono text-text-secondary"
          >
            Distraction Associations
          </h2>
        </div>

        {distractionsError ? (
          <ErrorState
            title="Could not load distraction data"
            message={distractionsError}
            onRetry={refetchDistractions}
          />
        ) : distractionsLoading ? (
          <Card padding="md" className="space-y-4">
            <Skeleton className="h-4 w-72" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </Card>
        ) : distractions.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="No distraction data yet"
            description="Log moments with distraction tags to see how they associate with self-reported focus. Requires at least 2 occurrences per tag."
            action={
              <Link to="/log">
                <Button size="sm">Log a session</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {/* Baseline explanation */}
            <Card padding="md" className="flex items-start gap-3 bg-accent-amber/5 border-accent-amber/20">
              <AlertCircle className="w-4 h-4 text-accent-amber shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-text-secondary leading-relaxed">
                <strong className="text-text-primary font-medium">Baseline context:</strong> Your
                overall average self-reported focus across all logged sessions is{" "}
                <strong className="text-text-primary font-semibold">
                  {baseline !== null ? `${baseline.toFixed(2)} / 5` : "—"}
                </strong>
                . Focus delta shows how sessions tagged with each distraction compare to this
                baseline. This reflects an observed correlation, not causation.
              </p>
            </Card>

            {/* Delta bar chart */}
            <Card padding="md" className="space-y-2">
              <div className="text-xs font-mono text-text-tertiary mb-2">
                Focus delta vs. overall baseline (negative = lower, positive = higher)
              </div>

              <div
                className="w-full h-[280px]"
                aria-label="Horizontal bar chart of distraction focus deltas versus overall baseline"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={distractionChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#262A36" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="#6B7280"
                      tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "monospace" }}
                      tickLine={false}
                      axisLine={{ stroke: "#262A36" }}
                      tickFormatter={(v: number) => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1))}
                    />
                    <YAxis
                      type="category"
                      dataKey="distraction"
                      width={140}
                      tick={{ fill: "#9CA3AF", fontSize: 11, fontFamily: "monospace" }}
                      tickLine={false}
                      axisLine={{ stroke: "#262A36" }}
                    />
                    <Tooltip content={<DistractionTooltip />} />
                    <ReferenceLine x={0} stroke="#3B4254" strokeWidth={1.5} />
                    <Bar
                      dataKey="focusDelta"
                      name="Focus Δ"
                      radius={[0, 3, 3, 0]}
                      fill="#F59E0B"
                      label={false}
                    >
                      {distractionChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.focusDelta < 0 ? "#F43F5E" : "#14B8A6"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Accessible breakdown table */}
              <div className="pt-2 border-t border-border-subtle space-y-1.5">
                <span className="text-[11px] font-mono text-text-tertiary uppercase tracking-wider block">
                  Detailed Breakdown
                </span>
                <div className="space-y-1">
                  {distractionChartData.map((d) => (
                    <div
                      key={d.distraction}
                      className="flex items-center justify-between gap-2 text-xs py-1"
                    >
                      <span className="text-text-secondary min-w-0 truncate">
                        {d.distraction}
                      </span>
                      <div className="flex items-center gap-3 shrink-0 font-mono">
                        <span className="text-text-tertiary">
                          {d.occurrences} session{d.occurrences !== 1 ? "s" : ""}
                        </span>
                        <span className="text-text-secondary">
                          avg {d.avgFocus.toFixed(2)} / 5
                        </span>
                        <span
                          className={
                            d.focusDelta < 0 ? "text-accent-rose font-semibold" : "text-accent-teal font-semibold"
                          }
                          aria-label={`Focus delta: ${d.focusDelta > 0 ? "+" : ""}${d.focusDelta.toFixed(2)}`}
                        >
                          {d.focusDelta > 0 ? "+" : ""}
                          {d.focusDelta.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION C: Pipeline Inspector                                      */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="pipeline-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-text-tertiary" aria-hidden="true" />
          <h2
            id="pipeline-heading"
            className="text-sm font-semibold uppercase tracking-wider font-mono text-text-secondary"
          >
            MongoDB Aggregation Pipeline Inspector
          </h2>
        </div>
        <PipelineInspector />
      </section>
    </div>
  );
};
