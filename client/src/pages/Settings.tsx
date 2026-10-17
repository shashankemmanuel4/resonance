import React, { useState } from "react";
import {
  Globe,
  Database,
  Trash2,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Info,
} from "lucide-react";
import { usePreferences } from "../hooks/usePreferences.js";
import { useDataVersion } from "../context/DataVersionContext.js";
import { useToast } from "../context/ToastContext.js";
import { api } from "../lib/api.js";
import { Button } from "../components/ui/Button.js";
import { Card } from "../components/ui/Card.js";
import { Select } from "../components/ui/Select.js";
import { Modal } from "../components/ui/Modal.js";

// ---------------------------------------------------------------------------
// IANA timezone options covering common zones for a sensible selector
// ---------------------------------------------------------------------------

const TIMEZONE_OPTIONS = [
  // Asia
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST, UTC+5:30)" },
  { value: "Asia/Colombo", label: "Asia/Colombo (SLT, UTC+5:30)" },
  { value: "Asia/Dhaka", label: "Asia/Dhaka (BST, UTC+6)" },
  { value: "Asia/Karachi", label: "Asia/Karachi (PKT, UTC+5)" },
  { value: "Asia/Kathmandu", label: "Asia/Kathmandu (NPT, UTC+5:45)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST, UTC+4)" },
  { value: "Asia/Riyadh", label: "Asia/Riyadh (AST, UTC+3)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT, UTC+8)" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai (CST, UTC+8)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST, UTC+9)" },
  { value: "Asia/Seoul", label: "Asia/Seoul (KST, UTC+9)" },
  { value: "Asia/Bangkok", label: "Asia/Bangkok (ICT, UTC+7)" },
  { value: "Asia/Jakarta", label: "Asia/Jakarta (WIB, UTC+7)" },
  // Europe
  { value: "Europe/London", label: "Europe/London (GMT/BST, UTC+0/+1)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET/CEST, UTC+1/+2)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET/CEST, UTC+1/+2)" },
  { value: "Europe/Moscow", label: "Europe/Moscow (MSK, UTC+3)" },
  // Americas
  { value: "America/New_York", label: "America/New_York (EST/EDT, UTC−5/−4)" },
  { value: "America/Chicago", label: "America/Chicago (CST/CDT, UTC−6/−5)" },
  { value: "America/Denver", label: "America/Denver (MST/MDT, UTC−7/−6)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT, UTC−8/−7)" },
  { value: "America/Toronto", label: "America/Toronto (EST/EDT, UTC−5/−4)" },
  { value: "America/Vancouver", label: "America/Vancouver (PST/PDT, UTC−8/−7)" },
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo (BRT, UTC−3)" },
  // Africa / Pacific
  { value: "Africa/Nairobi", label: "Africa/Nairobi (EAT, UTC+3)" },
  { value: "Africa/Lagos", label: "Africa/Lagos (WAT, UTC+1)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST/AEDT, UTC+10/+11)" },
  { value: "Pacific/Auckland", label: "Pacific/Auckland (NZST/NZDT, UTC+12/+13)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time, UTC+0)" },
];

export const Settings: React.FC = () => {
  const { timezone, loading: tzLoading, updateTimezone } = usePreferences();
  const { incrementVersion } = useDataVersion();
  const { showToast } = useToast();

  // Timezone selection state
  const [selectedTz, setSelectedTz] = useState<string>("");
  const [savingTz, setSavingTz] = useState(false);

  // Effective value for the select — use fetched timezone once loaded
  const effectiveTz = selectedTz || timezone;

  const handleSaveTimezone = async () => {
    if (!selectedTz || selectedTz === timezone) return;
    try {
      setSavingTz(true);
      await updateTimezone(selectedTz);
      incrementVersion(); // Invalidate analytics caches
      showToast("Timezone updated to " + selectedTz, { type: "success" });
      setSelectedTz(""); // Reset local override; hook now holds truth
    } catch {
      showToast("Failed to save timezone. Please try again.", { type: "error" });
    } finally {
      setSavingTz(false);
    }
  };

  // Demo seed state
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const result = await api.seedDemo();
      incrementVersion();
      showToast(result.message ?? `${result.insertedCount} sample moments loaded`, {
        type: "success",
      });
    } catch {
      showToast("Failed to seed demo data. It may already be loaded.", { type: "error" });
    } finally {
      setSeeding(false);
    }
  };

  // Reset state
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    try {
      setResetting(true);
      const result = await api.resetDemo();
      incrementVersion();
      setResetModalOpen(false);
      showToast(
        `Data reset — ${result.deletedCount} moment${result.deletedCount !== 1 ? "s" : ""} removed.`,
        { type: "info" }
      );
    } catch {
      showToast("Failed to reset data. Please try again.", { type: "error" });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <header className="pb-2 border-b border-border-subtle">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
          Settings
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Control how RESONANCE interprets your session timestamps and manage academic demo data.
        </p>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION A: Timezone                                                */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="tz-heading" className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-accent-indigo" aria-hidden="true" />
          <h2
            id="tz-heading"
            className="text-sm font-semibold uppercase tracking-wider font-mono text-text-secondary"
          >
            Timezone
          </h2>
        </div>

        <Card padding="md" className="space-y-5">
          <div className="p-3 rounded-lg bg-subtle/50 border border-border-subtle text-xs text-text-secondary leading-relaxed">
            <p>
              The timezone setting controls how all session timestamps are displayed and how
              time-of-day analytics (e.g., Focus Across the Day) are computed. RESONANCE stores all
              timestamps internally in UTC and converts to local time using this IANA timezone
              string.
            </p>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Select
                id="timezone-select"
                label="IANA Timezone"
                options={TIMEZONE_OPTIONS}
                value={effectiveTz}
                onChange={(e) => setSelectedTz(e.target.value)}
                disabled={tzLoading}
                helperText={tzLoading ? "Loading saved preference…" : `Currently stored: ${timezone}`}
              />
            </div>
            <Button
              size="md"
              loading={savingTz}
              disabled={!selectedTz || selectedTz === timezone || tzLoading}
              onClick={handleSaveTimezone}
              icon={<CheckCircle2 className="w-4 h-4" />}
              className="shrink-0"
            >
              Save
            </Button>
          </div>

          <div className="text-[11px] font-mono text-text-tertiary flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              Default: Asia/Kolkata (IST). The server validates the timezone string before
              persisting.
            </span>
          </div>
        </Card>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION B: Demo Data Controls                                      */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="demo-heading" className="space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-accent-amber" aria-hidden="true" />
          <h2
            id="demo-heading"
            className="text-sm font-semibold uppercase tracking-wider font-mono text-text-secondary"
          >
            Academic Demo Data
          </h2>
        </div>

        <Card padding="md" className="space-y-5">
          <div className="p-3 rounded-lg bg-subtle/50 border border-border-subtle text-xs text-text-secondary leading-relaxed">
            These controls manage the seeded demonstration dataset, designed to illustrate the
            analytics pipelines. These controls are part of the academic evaluation environment
            and would not appear in a production system.
          </div>

          {/* Seed Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-border-subtle">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-text-primary">Seed Demo Moments</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Load 60 curated sample sessions covering morning library, afternoon café,
                evening home, and open lab patterns across 30 days (IST, converted to UTC).
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={seeding}
              onClick={handleSeed}
              icon={<RefreshCw className="w-4 h-4" />}
              className="shrink-0"
            >
              Load 60 Samples
            </Button>
          </div>

          {/* Reset Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-accent-rose/5 border border-accent-rose/25">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-text-primary">Reset All Data</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Permanently deletes all logged moments from the database. Use this to restore a
                blank state before re-seeding. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setResetModalOpen(true)}
              icon={<Trash2 className="w-4 h-4" />}
              className="shrink-0"
            >
              Reset All Data
            </Button>
          </div>
        </Card>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION C: Academic Disclosure                                     */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="disclosure-heading" className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-accent-teal" aria-hidden="true" />
          <h2
            id="disclosure-heading"
            className="text-sm font-semibold uppercase tracking-wider font-mono text-text-secondary"
          >
            Academic &amp; Data Disclosure
          </h2>
        </div>

        <Card padding="md" className="space-y-4 bg-subtle/30 border-border-subtle">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-text-secondary leading-relaxed">
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-mono text-text-tertiary uppercase tracking-wider">
                Resonance Score
              </h4>
              <p>
                Your Resonance Score is a convenience weighted average of your self-reported focus
                (60%) and energy (40%) for each session. It is computed server-side and is{" "}
                <strong className="text-text-primary font-medium">
                  not a validated scientific metric
                </strong>
                .
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-[11px] font-mono text-text-tertiary uppercase tracking-wider">
                Analytics Scope
              </h4>
              <p>
                All analytics describe observed associations in your self-reported logged data.
                Patterns shown in Dashboard, Map, and Insights reflect session correlations,{" "}
                <strong className="text-text-primary font-medium">not causal relationships</strong>
                .
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-[11px] font-mono text-text-tertiary uppercase tracking-wider">
                No Diagnostic Purpose
              </h4>
              <p>
                RESONANCE is an academic project evaluating NoSQL aggregation and UI/UX design
                principles. It is not a medical tool, psychological assessment, or clinical
                productivity evaluator.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-[11px] font-mono text-text-tertiary uppercase tracking-wider">
                Data Scope
              </h4>
              <p>
                All moment data is stored in a local MongoDB instance using a single demo user.
                No data is transmitted to external services. Timestamps are UTC-normalised on
                write.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-border-subtle text-[11px] font-mono text-text-tertiary">
            RESONANCE — NoSQL Aggregation &amp; Cognitive UI/UX Evaluation &bull; Academic Build
          </div>
        </Card>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Reset Confirmation Modal                                           */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        open={resetModalOpen}
        onClose={() => !resetting && setResetModalOpen(false)}
        title="Reset All Moment Data"
        description="This action cannot be undone."
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={resetting}
              onClick={() => setResetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={resetting}
              onClick={handleReset}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Confirm Reset
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-text-secondary">
          <p>
            This will permanently delete{" "}
            <strong className="text-text-primary font-semibold">all logged moments</strong> from
            the database. The demo user account and settings will be preserved.
          </p>
          <p>
            After resetting, use the{" "}
            <strong className="text-text-primary font-medium">Load 60 Samples</strong> button to
            restore the curated academic demonstration dataset.
          </p>
          <div className="p-3 rounded-lg bg-accent-rose/10 border border-accent-rose/30 text-accent-rose text-xs font-mono">
            ⚠ This operation cannot be reversed.
          </div>
        </div>
      </Modal>
    </div>
  );
};
