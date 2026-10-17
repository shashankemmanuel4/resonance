import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Compass,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { useCreateMoment } from "../hooks/useCreateMoment.js";
import { useDataVersion } from "../context/DataVersionContext.js";
import { useToast } from "../context/ToastContext.js";
import { Button } from "../components/ui/Button.js";
import { Card } from "../components/ui/Card.js";
import { Input } from "../components/ui/Input.js";
import { Chip } from "../components/ui/Chip.js";
import { RatingPills } from "../components/ui/RatingPills.js";
import {
  ActivityCategory,
  Lighting,
  PeoplePresent,
  CreateMomentInput,
} from "../types/index.js";
import {
  DEFAULT_DISTRACTION_TAGS,
  CreateMomentSchema,
} from "../../../shared/schemas/moment.schema.js";
import {
  formatCategoryLabel,
  formatLightingLabel,
  formatPeopleLabel,
} from "../lib/utils.js";

const DRAFT_STORAGE_KEY = "resonance_draft";

const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  "deep_work",
  "shallow_work",
  "creative",
  "learning",
  "rest",
  "communication",
];

const LIGHTING_OPTIONS: Lighting[] = ["natural", "dim", "bright", "fluorescent"];

const PEOPLE_OPTIONS: PeoplePresent[] = [
  "alone",
  "parallel_work",
  "crowded",
  "meeting",
];

const DURATION_PRESETS = [25, 45, 60, 90, 120];

interface FormState {
  category: ActivityCategory;
  taskName: string;
  durationMinutes: number;
  location: string;
  noiseLevel: number;
  lighting: Lighting;
  peoplePresent: PeoplePresent;
  focusScore: number;
  energyScore: number;
  moodScore: number;
  distractions: string[];
  reflection: string;
}

const defaultFormState: FormState = {
  category: "deep_work",
  taskName: "",
  durationMinutes: 45,
  location: "",
  noiseLevel: 2,
  lighting: "natural",
  peoplePresent: "alone",
  focusScore: 4,
  energyScore: 3,
  moodScore: 4,
  distractions: [],
  reflection: "",
};

export const LogMoment: React.FC = () => {
  const navigate = useNavigate();
  const { create, loading } = useCreateMoment();
  const { incrementVersion } = useDataVersion();
  const { showToast } = useToast();

  const [form, setForm] = useState<FormState>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as FormState;
        return { ...defaultFormState, ...parsed };
      }
    } catch {
      // Fallback to defaults if draft is corrupted
    }
    return defaultFormState;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced autosave to localStorage (500ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
      } catch {
        // Silently ignore storage quota errors
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [form]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear field-specific error upon edit
    if (errors[key]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
  };

  const toggleDistraction = (tag: string) => {
    setForm((prev) => {
      const exists = prev.distractions.includes(tag);
      const updated = exists
        ? prev.distractions.filter((t) => t !== tag)
        : [...prev.distractions, tag];
      return { ...prev, distractions: updated };
    });
  };

  const handleResetDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setForm(defaultFormState);
    setErrors({});
    setSubmitError(null);
    showToast("Draft cleared", { type: "info" });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.taskName.trim() || form.taskName.trim().length < 2) {
      newErrors["taskName"] = "Task name must be at least 2 characters";
    } else if (form.taskName.length > 100) {
      newErrors["taskName"] = "Task name must not exceed 100 characters";
    }

    if (!form.location.trim() || form.location.trim().length < 2) {
      newErrors["location"] = "Location must be at least 2 characters";
    } else if (form.location.length > 50) {
      newErrors["location"] = "Location must not exceed 50 characters";
    }

    if (form.durationMinutes < 5 || form.durationMinutes > 720) {
      newErrors["durationMinutes"] = "Duration must be between 5 and 720 minutes";
    }

    if (form.focusScore < 1 || form.focusScore > 5) {
      newErrors["focusScore"] = "Focus score must be between 1 and 5";
    }

    if (form.energyScore < 1 || form.energyScore > 5) {
      newErrors["energyScore"] = "Energy score must be between 1 and 5";
    }

    if (form.moodScore < 1 || form.moodScore > 5) {
      newErrors["moodScore"] = "Mood score must be between 1 and 5";
    }

    if (form.reflection && form.reflection.length > 1000) {
      newErrors["reflection"] = "Reflection cannot exceed 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      showToast("Please correct the errors in the form", { type: "error" });
      return;
    }

    const payload: CreateMomentInput = {
      timestamp: new Date().toISOString(),
      durationMinutes: form.durationMinutes,
      activity: {
        category: form.category,
        taskName: form.taskName.trim(),
      },
      environment: {
        location: form.location.trim(),
        noiseLevel: form.noiseLevel,
        lighting: form.lighting,
        peoplePresent: form.peoplePresent,
      },
      experience: {
        focusScore: form.focusScore,
        energyScore: form.energyScore,
        moodScore: form.moodScore,
        distractions: form.distractions,
      },
      reflection: form.reflection.trim(),
    };

    // Client-side Zod schema verification
    const zodResult = CreateMomentSchema.safeParse(payload);
    if (!zodResult.success) {
      const msg = zodResult.error.errors[0]?.message ?? "Validation failed";
      setSubmitError(msg);
      showToast(msg, { type: "error" });
      return;
    }

    const created = await create(payload);
    if (created) {
      // Clear draft
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      // Invalidate analytics caches
      incrementVersion();
      // Toast notification
      showToast("Moment logged", { type: "success" });
      // Redirect to dashboard
      navigate("/dashboard");
    } else {
      setSubmitError("Failed to save moment. Please check your inputs and try again.");
      showToast("Failed to save moment", { type: "error" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
            Log Moment
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Capture your working session context and subjective experience.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDraft}
          className="text-xs text-text-tertiary hover:text-text-primary inline-flex items-center gap-1.5 self-start sm:self-center transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Reset Draft</span>
        </button>
      </header>

      {submitError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/30 text-accent-rose text-sm flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h4 className="font-medium">Could not save moment</h4>
            <p className="text-xs text-accent-rose/90 mt-0.5">{submitError}</p>
          </div>
        </div>
      )}

      {/* Main Single-Scroll Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* ============================================================== */}
        {/* SECTION 1: What were you doing?                                 */}
        {/* ============================================================== */}
        <Card padding="md" className="space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
            <Clock className="w-4 h-4 text-accent-indigo" aria-hidden="true" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary font-mono">
              1. What were you doing?
            </h2>
          </div>

          {/* Activity Category Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-text-primary tracking-wide">
              Activity Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ACTIVITY_CATEGORIES.map((cat) => (
                <Chip
                  key={cat}
                  label={formatCategoryLabel(cat)}
                  selected={form.category === cat}
                  onClick={() => updateField("category", cat)}
                  size="sm"
                />
              ))}
            </div>
          </div>

          {/* Task Name Input */}
          <Input
            id="taskName"
            label="Task or Focus Name"
            placeholder="e.g. Distributed Consensus Paper Review, Database Indexing"
            value={form.taskName}
            onChange={(e) => updateField("taskName", e.target.value)}
            error={errors["taskName"]}
            required
            maxLength={100}
            helperText="Brief name describing your specific objective"
          />

          {/* Duration Input & Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="durationMinutes"
                className="block text-xs font-medium text-text-primary tracking-wide"
              >
                Duration (minutes) <span className="text-accent-rose">*</span>
              </label>
              <span className="text-[11px] font-mono text-text-tertiary">5 &ndash; 720 min</span>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="durationMinutes"
                type="number"
                min={5}
                max={720}
                required
                value={form.durationMinutes}
                onChange={(e) =>
                  updateField("durationMinutes", parseInt(e.target.value, 10) || 0)
                }
                className="w-28 min-h-[44px] px-3.5 py-2 text-sm font-mono bg-surface border border-border-subtle hover:border-border-strong rounded-lg text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo"
              />

              <div className="flex items-center gap-1.5 flex-wrap">
                {DURATION_PRESETS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => updateField("durationMinutes", mins)}
                    className={`px-2.5 py-1.5 rounded text-xs font-mono transition-colors ${
                      form.durationMinutes === mins
                        ? "bg-accent-indigo text-white font-medium"
                        : "bg-subtle text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
            {errors["durationMinutes"] && (
              <p className="text-xs text-accent-rose">{errors["durationMinutes"]}</p>
            )}
          </div>
        </Card>

        {/* ============================================================== */}
        {/* SECTION 2: Where/how were you working?                         */}
        {/* ============================================================== */}
        <Card padding="md" className="space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
            <Compass className="w-4 h-4 text-accent-amber" aria-hidden="true" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary font-mono">
              2. Where were you working?
            </h2>
          </div>

          {/* Location Input */}
          <Input
            id="location"
            label="Location"
            placeholder="e.g. University Library, Home Desk, Coffee Lab"
            value={form.location}
            onChange={(e) => updateField("location", e.target.value)}
            error={errors["location"]}
            required
            maxLength={50}
            helperText="The specific physical space or setup"
          />

          {/* Noise Level Rating */}
          <RatingPills
            label="Noise Level"
            value={form.noiseLevel}
            onChange={(val) => updateField("noiseLevel", val)}
            lowLabel="Silent"
            highLabel="Very Loud"
          />

          {/* Lighting Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-text-primary tracking-wide">
              Lighting Environment
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LIGHTING_OPTIONS.map((light) => (
                <Chip
                  key={light}
                  label={formatLightingLabel(light)}
                  selected={form.lighting === light}
                  onClick={() => updateField("lighting", light)}
                  size="sm"
                />
              ))}
            </div>
          </div>

          {/* People Present Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-text-primary tracking-wide">
              Social Setting / People Present
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PEOPLE_OPTIONS.map((people) => (
                <Chip
                  key={people}
                  label={formatPeopleLabel(people)}
                  selected={form.peoplePresent === people}
                  onClick={() => updateField("peoplePresent", people)}
                  size="sm"
                />
              ))}
            </div>
          </div>
        </Card>

        {/* ============================================================== */}
        {/* SECTION 3: How did it feel?                                    */}
        {/* ============================================================== */}
        <Card padding="md" className="space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
            <Sparkles className="w-4 h-4 text-accent-teal" aria-hidden="true" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary font-mono">
              3. How did it feel?
            </h2>
          </div>

          {/* Focus Score */}
          <RatingPills
            label="Self-Reported Focus"
            value={form.focusScore}
            onChange={(val) => updateField("focusScore", val)}
            lowLabel="Distracted"
            highLabel="Deep Absorption"
          />

          {/* Energy Score */}
          <RatingPills
            label="Energy Level"
            value={form.energyScore}
            onChange={(val) => updateField("energyScore", val)}
            lowLabel="Depleted"
            highLabel="High Vitality"
          />

          {/* Mood Score */}
          <RatingPills
            label="Mood State"
            value={form.moodScore}
            onChange={(val) => updateField("moodScore", val)}
            lowLabel="Frustrated/Low"
            highLabel="Content/Optimal"
          />

          {/* Distractions Multi-select */}
          <div className="space-y-2 pt-2 border-t border-border-subtle">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-text-primary tracking-wide">
                What got in the way? (Select all that apply)
              </label>
              <span className="text-[11px] font-mono text-text-tertiary">
                {form.distractions.length} selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {DEFAULT_DISTRACTION_TAGS.map((tag) => {
                const isSelected = form.distractions.includes(tag);
                return (
                  <Chip
                    key={tag}
                    label={tag}
                    selected={isSelected}
                    onClick={() => toggleDistraction(tag)}
                    size="sm"
                  />
                );
              })}
            </div>
          </div>
        </Card>

        {/* ============================================================== */}
        {/* SECTION 4: Anything worth remembering? (Reflection)            */}
        {/* ============================================================== */}
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="reflection"
              className="block text-xs font-medium text-text-primary tracking-wide uppercase font-mono text-text-secondary"
            >
              4. Reflection (Optional)
            </label>
            <span className="text-[11px] font-mono text-text-tertiary">
              {form.reflection.length} / 1000
            </span>
          </div>

          <textarea
            id="reflection"
            rows={3}
            maxLength={1000}
            placeholder="Qualitative notes on flow state, environmental factors, or friction..."
            value={form.reflection}
            onChange={(e) => updateField("reflection", e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-surface border border-border-subtle hover:border-border-strong rounded-lg text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo leading-relaxed resize-y min-h-[90px]"
          />
        </Card>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <p className="text-xs text-text-tertiary">
            Your Resonance Score will be automatically computed upon logging.
          </p>

          <Button
            type="submit"
            size="lg"
            loading={loading}
            icon={<CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
            className="w-full sm:w-auto px-8"
          >
            Log Moment
          </Button>
        </div>
      </form>
    </div>
  );
};
