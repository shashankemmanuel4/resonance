import React, { useState, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Clock,
  PlusCircle,
  MapPin,
  Trash2,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Sparkles,
  Quote,
} from "lucide-react";
import { useMoments } from "../hooks/useMoments.js";
import { usePreferences } from "../hooks/usePreferences.js";
import { useDataVersion } from "../context/DataVersionContext.js";
import { useToast } from "../context/ToastContext.js";
import { api } from "../lib/api.js";
import { Moment, ActivityCategory } from "../types/index.js";
import { Button } from "../components/ui/Button.js";
import { Card } from "../components/ui/Card.js";
import { Badge } from "../components/ui/Badge.js";
import { Skeleton } from "../components/ui/Skeleton.js";
import { EmptyState } from "../components/ui/EmptyState.js";
import { ErrorState } from "../components/ui/ErrorState.js";
import { Modal } from "../components/ui/Modal.js";
import { Select } from "../components/ui/Select.js";
import {
  formatTimestamp,
  formatDuration,
  formatCategoryLabel,
  formatLightingLabel,
  formatPeopleLabel,
} from "../lib/utils.js";

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Categories" },
  { value: "deep_work", label: "Deep Work" },
  { value: "shallow_work", label: "Shallow Work" },
  { value: "creative", label: "Creative" },
  { value: "learning", label: "Learning" },
  { value: "rest", label: "Rest" },
  { value: "communication", label: "Communication" },
];

const FOCUS_OPTIONS = [
  { value: "", label: "Any Focus Rating" },
  { value: "1", label: "1+ Minimal Focus" },
  { value: "2", label: "2+ Low Focus" },
  { value: "3", label: "3+ Moderate Focus" },
  { value: "4", label: "4+ High Focus" },
  { value: "5", label: "5 Peak Absorption" },
];

export const History: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { timezone } = usePreferences();
  const { incrementVersion } = useDataVersion();
  const { showToast } = useToast();

  // Active filter state parsed from URL query parameters
  const page = parseInt(searchParams.get("page") ?? "1", 10) || 1;
  const category = (searchParams.get("category") ?? "") as ActivityCategory | "";
  const locationParam = searchParams.get("location") ?? "";
  const minFocus = searchParams.get("minFocus")
    ? parseInt(searchParams.get("minFocus")!, 10)
    : undefined;
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";

  // Local draft state for text inputs to avoid thrashing on every keystroke
  const [locationInput, setLocationInput] = useState(locationParam);

  // Moment marked for pending deletion confirmation
  const [deletingMoment, setDeletingMoment] = useState<Moment | null>(null);

  // Map of active pending deletion timeouts keyed by moment ID
  const pendingDeletesRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Moments hook querying real backend API
  const queryOptions = useMemo(
    () => ({
      page,
      limit: 15,
      category: category || undefined,
      location: locationParam || undefined,
      minFocus,
      dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
    }),
    [page, category, locationParam, minFocus, dateFrom, dateTo]
  );

  const {
    moments,
    total,
    pages,
    loading,
    error,
    refetch,
    removeLocally,
    restoreLocally,
  } = useMoments(queryOptions);

  const isFiltered = Boolean(category || locationParam || minFocus || dateFrom || dateTo);

  const updateFilters = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    // Reset to page 1 on filter modification
    next.set("page", "1");

    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "") {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    });

    setSearchParams(next);
  };

  const handleClearFilters = () => {
    setLocationInput("");
    setSearchParams(new URLSearchParams({ page: "1" }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pages) return;
    const next = new URLSearchParams(searchParams);
    next.set("page", String(newPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---------------------------------------------------------------------------
  // Deletion Flow with 5-Second Undo Protection
  // ---------------------------------------------------------------------------
  const handleConfirmDelete = () => {
    if (!deletingMoment) return;
    const momentToDelete = deletingMoment;
    setDeletingMoment(null);

    // 1. Optimistically remove from view
    removeLocally(momentToDelete._id);

    // 2. Schedule actual server DELETE call after 5 seconds
    const timer = setTimeout(async () => {
      try {
        await api.deleteMoment(momentToDelete._id);
        incrementVersion();
      } catch {
        // If server delete fails, restore locally and alert user
        restoreLocally(momentToDelete);
        showToast("Failed to delete moment on server", { type: "error" });
      } finally {
        pendingDeletesRef.current.delete(momentToDelete._id);
      }
    }, 5000);

    pendingDeletesRef.current.set(momentToDelete._id, timer);

    // 3. Show Toast with accessible Undo action
    showToast("Moment deleted", {
      type: "success",
      undoLabel: "Undo",
      durationMs: 5000,
      undoAction: () => {
        // Cancel the scheduled server deletion
        const pendingTimer = pendingDeletesRef.current.get(momentToDelete._id);
        if (pendingTimer) {
          clearTimeout(pendingTimer);
          pendingDeletesRef.current.delete(momentToDelete._id);
        }
        // Restore locally
        restoreLocally(momentToDelete);
        showToast("Deletion undone", { type: "info" });
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
            History
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Chronological log of your self-reported working sessions.
          </p>
        </div>

        <Link to="/log">
          <Button size="sm" icon={<PlusCircle className="w-4 h-4" />}>
            Log Moment
          </Button>
        </Link>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Filter Bar                                                         */}
      {/* ------------------------------------------------------------------ */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-accent-indigo" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono">
              Filters &amp; Query Scope
            </span>
          </div>
          {isFiltered && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-accent-rose hover:text-accent-rose/80 font-medium inline-flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Category Filter */}
          <Select
            id="filter-category"
            label="Activity Category"
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(e) => updateFilters({ category: e.target.value })}
          />

          {/* Location Filter */}
          <div className="space-y-1.5 w-full">
            <label
              htmlFor="filter-location"
              className="block text-xs font-medium text-text-primary tracking-wide"
            >
              Location
            </label>
            <div className="flex gap-1.5">
              <input
                id="filter-location"
                type="text"
                placeholder="e.g. Library, Cafe"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    updateFilters({ location: locationInput.trim() });
                  }
                }}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-surface border border-border-subtle hover:border-border-strong rounded-lg text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo"
              />
              {locationInput !== locationParam && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateFilters({ location: locationInput.trim() })}
                >
                  Apply
                </Button>
              )}
            </div>
          </div>

          {/* Min Focus Filter */}
          <Select
            id="filter-focus"
            label="Minimum Focus"
            options={FOCUS_OPTIONS}
            value={minFocus ? String(minFocus) : ""}
            onChange={(e) => updateFilters({ minFocus: e.target.value })}
          />

          {/* Date Range: From / To */}
          <div className="space-y-1.5">
            <label
              htmlFor="filter-date-from"
              className="block text-xs font-medium text-text-primary tracking-wide"
            >
              Date Window (From &ndash; To)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                id="filter-date-from"
                type="date"
                aria-label="Start date"
                value={dateFrom}
                onChange={(e) => updateFilters({ dateFrom: e.target.value })}
                className="min-h-[44px] px-2 py-1 text-xs bg-surface border border-border-subtle rounded-lg text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo font-mono"
              />
              <input
                id="filter-date-to"
                type="date"
                aria-label="End date"
                value={dateTo}
                onChange={(e) => updateFilters({ dateTo: e.target.value })}
                className="min-h-[44px] px-2 py-1 text-xs bg-surface border border-border-subtle rounded-lg text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo font-mono"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Moments List & States                                              */}
      {/* ------------------------------------------------------------------ */}
      {error ? (
        <ErrorState
          title="Could not load session history"
          message={error}
          onRetry={refetch}
        />
      ) : loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} padding="md" className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-4 w-72" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : moments.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon={Inbox}
            title="No moments match these filters"
            description="Try widening your search, selecting a different activity category, or clearing the filter parameters."
            action={
              <Button size="sm" onClick={handleClearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Sparkles}
            title="No moments logged yet"
            description="Start capturing your work sessions to build your personal history and environmental correlations."
            action={
              <Link to="/log">
                <Button size="sm" icon={<PlusCircle className="w-4 h-4" />}>
                  Log your first moment
                </Button>
              </Link>
            }
          />
        )
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-text-tertiary font-mono px-1">
            <span>
              Showing {moments.length} of {total} sessions
            </span>
            <span>Sorted newest first</span>
          </div>

          {moments.map((moment) => (
            <Card
              key={moment._id}
              padding="md"
              className="space-y-3.5 hover:border-border-strong transition-colors"
            >
              {/* Row 1: Task Title, Category Badge, Delete Button */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base font-semibold text-text-primary tracking-tight">
                      {moment.activity.taskName}
                    </h2>
                    <Badge variant="indigo" size="sm">
                      {formatCategoryLabel(moment.activity.category)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs text-text-secondary flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-text-tertiary" aria-hidden="true" />
                      {moment.environment.location}
                    </span>
                    <span>&bull;</span>
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-text-tertiary" aria-hidden="true" />
                      {formatDuration(moment.durationMinutes)}
                    </span>
                    <span>&bull;</span>
                    <span className="text-text-tertiary font-mono">
                      {formatTimestamp(moment.timestamp, timezone)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDeletingMoment(moment)}
                  aria-label={`Delete moment: ${moment.activity.taskName}`}
                  className="p-2 text-text-tertiary hover:text-accent-rose hover:bg-accent-rose/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-rose shrink-0"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {/* Row 2: Environmental Badges & Scores */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-subtle">
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
                  <span className="px-2 py-0.5 rounded bg-subtle text-text-secondary">
                    {formatLightingLabel(moment.environment.lighting)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-subtle text-text-secondary">
                    Noise: {moment.environment.noiseLevel}/5
                  </span>
                  <span className="px-2 py-0.5 rounded bg-subtle text-text-secondary">
                    {formatPeopleLabel(moment.environment.peoplePresent)}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-1 rounded bg-subtle border border-border-subtle text-text-secondary">
                    Focus: <strong className="text-accent-indigo">{moment.experience.focusScore}/5</strong>
                  </span>
                  <span className="px-2 py-1 rounded bg-subtle border border-border-subtle text-text-secondary">
                    Energy: <strong className="text-accent-amber">{moment.experience.energyScore}/5</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded bg-accent-teal/10 border border-accent-teal/30 text-accent-teal font-semibold">
                    Resonance: {moment.resonanceScore.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Row 3: Distractions (if any) */}
              {moment.experience.distractions && moment.experience.distractions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                  <span className="text-[11px] font-mono text-text-tertiary mr-1">
                    Distractions:
                  </span>
                  {moment.experience.distractions.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-accent-rose/10 border border-accent-rose/25 text-accent-rose text-[11px] font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Row 4: Reflection (if present) */}
              {moment.reflection && (
                <div className="flex items-start gap-2 pt-2 text-xs text-text-secondary bg-subtle/40 p-2.5 rounded-lg border border-border-subtle">
                  <Quote className="w-3.5 h-3.5 text-text-tertiary shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="italic leading-relaxed">{moment.reflection}</p>
                </div>
              )}
            </Card>
          ))}

          {/* ------------------------------------------------------------------ */}
          {/* Pagination Controls                                                */}
          {/* ------------------------------------------------------------------ */}
          {pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
              <span className="text-xs font-mono text-text-tertiary">
                Page {page} of {pages}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                  icon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pages}
                  onClick={() => handlePageChange(page + 1)}
                  icon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Delete Confirmation Modal                                          */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        open={Boolean(deletingMoment)}
        onClose={() => setDeletingMoment(null)}
        title="Delete Session"
        description="Are you sure you want to delete this moment?"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDeletingMoment(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmDelete}>
              Delete Moment
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary leading-relaxed">
          This will remove{" "}
          <strong className="text-text-primary">
            &ldquo;{deletingMoment?.activity.taskName}&rdquo;
          </strong>{" "}
          from your session history. You will have a 5-second window to undo this deletion.
        </p>
      </Modal>
    </div>
  );
};
