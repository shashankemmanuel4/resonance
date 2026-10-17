import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  MapPin,
  Volume2,
  Sun,
  Info,
  Layers,
  ChevronRight,
} from "lucide-react";
import { useMatrix } from "../hooks/useMatrix.js";
import { MatrixItem } from "../types/index.js";
import { Button } from "../components/ui/Button.js";
import { Card } from "../components/ui/Card.js";
import { Skeleton } from "../components/ui/Skeleton.js";
import { EmptyState } from "../components/ui/EmptyState.js";
import { ErrorState } from "../components/ui/ErrorState.js";
import { Modal } from "../components/ui/Modal.js";
import {
  formatDuration,
  formatLightingLabel,
} from "../lib/utils.js";

type MetricDimension = "resonance" | "focus" | "energy";

export const ResonanceMap: React.FC = () => {
  const { data: matrix, loading, error, refetch } = useMatrix();
  const [activeDimension, setActiveDimension] = useState<MetricDimension>("resonance");
  const [selectedItem, setSelectedItem] = useState<MatrixItem | null>(null);

  const getMetricValue = (item: MatrixItem, dim: MetricDimension): number => {
    switch (dim) {
      case "focus":
        return item.avgFocus;
      case "energy":
        return item.avgEnergy;
      case "resonance":
      default:
        return item.avgResonance;
    }
  };

  const getDimensionColor = (dim: MetricDimension) => {
    switch (dim) {
      case "focus":
        return {
          text: "text-accent-indigo",
          bg: "bg-accent-indigo/10",
          border: "border-accent-indigo/30",
          bar: "bg-accent-indigo",
        };
      case "energy":
        return {
          text: "text-accent-amber",
          bg: "bg-accent-amber/10",
          border: "border-accent-amber/30",
          bar: "bg-accent-amber",
        };
      case "resonance":
      default:
        return {
          text: "text-accent-teal",
          bg: "bg-accent-teal/10",
          border: "border-accent-teal/30",
          bar: "bg-accent-teal",
        };
    }
  };

  const sortedMatrix = [...matrix].sort((a, b) => {
    const valA = getMetricValue(a, activeDimension);
    const valB = getMetricValue(b, activeDimension);
    return valB - valA || b.sessionCount - a.sessionCount;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
            Resonance Map
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Environmental combinations correlated with your self-reported focus and energy.
          </p>
        </div>

        <Link to="/log">
          <Button size="sm">Log Moment</Button>
        </Link>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Educational Disclosure Card                                       */}
      {/* ------------------------------------------------------------------ */}
      <Card padding="md" className="space-y-2.5 bg-subtle/40 border-border-subtle">
        <div className="flex items-center gap-2 text-xs font-mono font-medium text-text-secondary uppercase tracking-wider">
          <Info className="w-4 h-4 text-accent-indigo" aria-hidden="true" />
          <span>Understanding Environmental Resonance</span>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          Each card represents an observed combination of location, lighting, and noise level
          aggregated directly via MongoDB Pipeline 1. Results require a minimum threshold of{" "}
          <strong className="text-text-primary font-medium">at least 2 sessions</strong> to filter
          single-occurrence anomalies. Higher resonance reflects an observed pattern in your
          self-reported logs &mdash; it does not claim scientific causation or guarantee future
          performance.
        </p>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Dimension Toggle Controls                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-text-tertiary" aria-hidden="true" />
          <span className="text-xs font-mono font-medium text-text-secondary uppercase tracking-wide">
            Ranked Dimension:
          </span>
        </div>

        <div
          role="group"
          aria-label="Select metric dimension to rank environmental conditions"
          className="inline-flex rounded-lg bg-surface border border-border-subtle p-1 self-start sm:self-center"
        >
          <button
            type="button"
            onClick={() => setActiveDimension("resonance")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeDimension === "resonance"
                ? "bg-accent-teal/15 text-accent-teal font-semibold"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Resonance Score
          </button>
          <button
            type="button"
            onClick={() => setActiveDimension("focus")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeDimension === "focus"
                ? "bg-accent-indigo/15 text-accent-indigo font-semibold"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Self-Reported Focus
          </button>
          <button
            type="button"
            onClick={() => setActiveDimension("energy")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeDimension === "energy"
                ? "bg-accent-amber/15 text-accent-amber font-semibold"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Energy Level
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Matrix Grid & Content States                                       */}
      {/* ------------------------------------------------------------------ */}
      {error ? (
        <ErrorState
          title="Could not load environmental matrix"
          message={error}
          onRetry={refetch}
        />
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} padding="md" className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-60" />
              <Skeleton className="h-8 w-full" />
            </Card>
          ))}
        </div>
      ) : sortedMatrix.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No environmental patterns found"
          description="The Resonance Map requires at least 2 sessions with the same location, lighting, and noise condition to ensure analytical relevance."
          action={
            <Link to="/log">
              <Button size="sm">Log a session</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-text-tertiary font-mono px-1">
            <span>
              Showing {sortedMatrix.length} distinct recurring condition combinations
            </span>
            <span>Sorted by {activeDimension} score</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedMatrix.map((item, index) => {
              const currentVal = getMetricValue(item, activeDimension);
              const colors = getDimensionColor(activeDimension);
              const percentage = Math.min(100, Math.max(0, (currentVal / 5) * 100));

              return (
                <Card
                  key={`${item.location}-${item.lighting}-${item.noiseLevel}-${index}`}
                  padding="md"
                  hoverable
                  onClick={() => setSelectedItem(item)}
                  className="cursor-pointer space-y-4 flex flex-col justify-between"
                  tabIndex={0}
                  role="button"
                  aria-label={`Inspect ${item.location} environmental condition`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedItem(item);
                    }
                  }}
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Location & Rank Number */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider block">
                          Condition #{index + 1}
                        </span>
                        <h2 className="text-base font-semibold text-text-primary tracking-tight truncate flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-text-tertiary shrink-0" aria-hidden="true" />
                          <span>{item.location}</span>
                        </h2>
                      </div>

                      <div
                        className={`px-2.5 py-1 rounded-lg border font-mono text-sm font-bold shrink-0 ${colors.bg} ${colors.text} ${colors.border}`}
                      >
                        {currentVal.toFixed(2)}
                        <span className="text-[10px] font-normal text-text-tertiary ml-0.5">
                          /5
                        </span>
                      </div>
                    </div>

                    {/* Condition Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-text-secondary">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-subtle text-text-secondary">
                        <Sun className="w-3 h-3 text-text-tertiary" aria-hidden="true" />
                        {formatLightingLabel(item.lighting)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-subtle text-text-secondary">
                        <Volume2 className="w-3 h-3 text-text-tertiary" aria-hidden="true" />
                        Noise {item.noiseLevel}/5
                      </span>
                    </div>

                    {/* Visual Score Gauge Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] font-mono text-text-tertiary">
                        <span className="capitalize">{activeDimension} Magnitude</span>
                        <span>{percentage.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-subtle rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${colors.bar}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Row: Session Count & Details Prompt */}
                  <div className="flex items-center justify-between pt-3 border-t border-border-subtle text-xs text-text-tertiary">
                    <span className="font-mono">
                      {item.sessionCount} sessions ({formatDuration(item.totalMinutes)})
                    </span>
                    <span className="text-text-secondary inline-flex items-center gap-0.5 hover:text-text-primary transition-colors text-xs">
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Condition Detail Inspection Modal                                  */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.location ?? "Environmental Condition"}
        description="Detailed multi-session correlation breakdown"
        footer={
          <Button size="sm" onClick={() => setSelectedItem(null)}>
            Close Inspection
          </Button>
        }
      >
        {selectedItem && (
          <div className="space-y-5 text-text-primary">
            {/* Environment Specification */}
            <div className="p-3.5 rounded-xl bg-subtle/50 border border-border-subtle space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-text-tertiary block">
                Environmental Setup
              </span>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-text-tertiary block">Lighting</span>
                  <span className="font-medium text-text-primary">
                    {formatLightingLabel(selectedItem.lighting)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-text-tertiary block">Noise Level</span>
                  <span className="font-medium text-text-primary">
                    Rating {selectedItem.noiseLevel} / 5
                  </span>
                </div>
              </div>
            </div>

            {/* Score Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-surface border border-border-subtle space-y-1 text-center">
                <span className="text-[11px] font-mono text-text-tertiary uppercase block">
                  Focus
                </span>
                <span className="text-xl font-bold font-mono text-accent-indigo">
                  {selectedItem.avgFocus.toFixed(2)}
                </span>
                <span className="text-[10px] text-text-tertiary block">out of 5</span>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-border-subtle space-y-1 text-center">
                <span className="text-[11px] font-mono text-text-tertiary uppercase block">
                  Energy
                </span>
                <span className="text-xl font-bold font-mono text-accent-amber">
                  {selectedItem.avgEnergy.toFixed(2)}
                </span>
                <span className="text-[10px] text-text-tertiary block">out of 5</span>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-border-subtle space-y-1 text-center">
                <span className="text-[11px] font-mono text-text-tertiary uppercase block">
                  Resonance
                </span>
                <span className="text-xl font-bold font-mono text-accent-teal">
                  {selectedItem.avgResonance.toFixed(2)}
                </span>
                <span className="text-[10px] text-text-tertiary block">out of 5</span>
              </div>
            </div>

            {/* Sample Weight & Session Details */}
            <div className="space-y-1.5 text-xs text-text-secondary border-t border-border-subtle pt-3">
              <div className="flex justify-between py-1">
                <span>Recorded Sessions:</span>
                <strong className="font-mono text-text-primary">
                  {selectedItem.sessionCount} sessions
                </strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Total Accumulated Time:</span>
                <strong className="font-mono text-text-primary">
                  {formatDuration(selectedItem.totalMinutes)}
                </strong>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-subtle/60 border border-border-subtle text-[11px] text-text-tertiary leading-relaxed italic">
              Self-reported focus and energy vary based on task type, fatigue, and other somatic
              factors. Use these patterns as contextual reflection rather than prescriptive rules.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
