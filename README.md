# RESONANCE

> **Implementation Specification** — authoritative reference for development.  
> Source of truth: `RESONANCE_Revised_Blueprint.md` (v2).  
> Do not implement anything that contradicts this document without explicit revision.

---

## Table of Contents

1. [Project Purpose & Academic Objectives](#1-project-purpose--academic-objectives)
2. [Language Standard](#2-language-standard)
3. [Feature Classification](#3-feature-classification)
4. [User Journey](#4-user-journey)
5. [Page Specifications](#5-page-specifications)
6. [UX Principles](#6-ux-principles)
7. [Design System](#7-design-system)
8. [Component Architecture](#8-component-architecture)
9. [MongoDB Collections & Schemas](#9-mongodb-collections--schemas)
10. [Embedding vs Referencing Decisions](#10-embedding-vs-referencing-decisions)
11. [Indexes](#11-indexes)
12. [Aggregation Pipelines](#12-aggregation-pipelines)
13. [Timezone Handling](#13-timezone-handling)
14. [API Endpoints](#14-api-endpoints)
15. [Validation Rules](#15-validation-rules)
16. [Frontend State & Data-Fetching](#16-frontend-state--data-fetching)
17. [Loading, Empty, Error & Success States](#17-loading-empty-error--success-states)
18. [Accessibility Requirements](#18-accessibility-requirements)
19. [Responsive Behavior](#19-responsive-behavior)
20. [Seed-Data Requirements](#20-seed-data-requirements)
21. [Implementation Phases](#21-implementation-phases)
22. [Deferred Features](#22-deferred-features)
23. [Verification Checklist](#23-verification-checklist)

---

## 1. Project Purpose & Academic Objectives

**RESONANCE** is a productivity reflection tool where users log self-reported focus and environmental context, then discover patterns in the conditions associated with their focus.

It is explicitly **not** a medical diagnostic system, psychological assessment instrument, or well-being analytics platform. All insights surface correlation patterns in logged data only.

### Academic Discipline 1 — UI/UX Design Engineering

- Cognitive load reduction via constrained-input logging (Hick's Law)
- Progressive disclosure across a 4-step moment logger
- WCAG 2.1 AA accessibility: keyboard navigation, ARIA semantics, contrast ratios
- Responsive layouts: mobile bottom-bar, tablet 2-column, desktop persistent sidebar
- Purposeful motion: 150–200 ms ease-out only; `useReducedMotion()` respected
- Zero-layout-shift skeleton loaders on every data surface
- Meaningful empty, error, and success states on every page

### Academic Discipline 2 — NoSQL Database Architecture (MongoDB)

- Document modeling with embedded subdocuments for historical immutability
- Referenced 1-to-N relationship between `users` and `moments`
- Three justified compound and multikey indexes (ESR rule applied)
- Four multi-stage aggregation pipelines: `$facet`, `$unwind`, `$group`, `$project`, `$dateToString`
- Timezone-aware date extraction via IANA timezone parameter in all date operators
- Pipeline Inspector drawer that exposes raw pipeline JSON in the application UI for viva examination

### Target Stack

| Layer | Technologies |
|:---|:---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts, Lucide Icons |
| Backend | Node.js, Express, TypeScript, Mongoose, Zod |
| Database | MongoDB |

---

## 2. Language Standard

All in-application copy and developer comments must use the following neutral framing. The product measures nothing — it reflects what the user logged.

| ❌ Do Not Use | ✅ Use Instead |
|:---|:---|
| "Cognitive focus" (as a measured value) | "Self-reported focus" |
| "Somatic states" | "Personal state" or "how you felt" |
| "Chronobiology" / "diurnal pattern" | "Time-of-day pattern" or "hourly focus distribution" |
| "Optimal cognitive windows" | "Hours with your highest logged focus" |
| "Psychologically optimal setup" | "The environmental setup correlated with your highest self-reported focus" |
| "Deep flow state" | "Focus rating 5" |
| "Resonance Quotient" | "Resonance Score" |

**Resonance Score** is a pre-computed convenience value, not a validated index:

```
resonanceScore = (focusScore × 0.6) + (energyScore × 0.4)
```

In-app disclosure copy: *"Your Resonance Score is a simple weighted average of your self-reported focus (60%) and energy (40%) for this session. It is a convenience summary, not a validated metric."*

---

## 3. Feature Classification

### CORE — must be implemented before submission

| Feature | Rationale |
|:---|:---|
| Log Moment (4-step stepper) | Central user action; all other features depend on it |
| Dashboard 7-day pulse | Primary engagement surface; scoped to real 7-day window |
| Resonance Map (scatter + matrix) | Primary NoSQL viva demonstration surface |
| History feed with faceted filter | CRUD completeness; data audit |
| Insights page | Aggregation pipeline showcase |
| Pipeline Inspector drawer | Highest academic value for NoSQL viva |
| Academic Seeder (60 moments / 30 days) | Aggregations are meaningless without data |
| Landing page | First impression; UI/UX assessment entry point |
| Settings — timezone selector + seed/reset | Correct analytics; viva demonstration controls |
| WCAG 2.1 AA keyboard and ARIA accessibility | UI/UX academic requirement |

### OPTIONAL — implement only after all CORE pages are complete and verified

| Feature | Rationale |
|:---|:---|
| Dark/light mode toggle | Polish; dark mode is the CORE default |
| Moment edit (PUT) | Low academic value; delete + re-log is acceptable |
| Custom distraction tags | Default enum tags cover all viva scenarios |
| Saved locations management UI | `localStorage` autocomplete is sufficient |

### DEFERRED — do not implement

See [Section 22](#22-deferred-features) for the complete list with justifications.

---

## 4. User Journey

```
Landing (/)
  → "Open Dashboard" CTA
      → Dashboard (/dashboard)
          → View 7-day focus and energy pulse
          → "Log a Moment" quick CTA
              → Log Moment (/log)
                  Step 1: Activity (category, task name, duration)
                  Step 2: Environment (location, noise, lighting, people)
                  Step 3: Experience (focus, energy, mood, distractions)
                  Step 4: Reflection + Review + Submit
              → Success toast → return to Dashboard
          → Navigate to Resonance Map (/map)
              → Environmental matrix (location × lighting → avg focus)
              → Scatter plot (noise level vs self-reported focus)
              → Toggle Y-axis: Focus ↔ Energy
          → Navigate to Insights (/insights)
              → Hourly focus distribution heatmap (timezone-aware)
              → Distraction cost bar chart (focus delta vs baseline)
              → Optimal conditions callout
              → Open Pipeline Inspector → examine raw MongoDB pipeline
          → Navigate to History (/history)
              → Filter by category, location, date range, min focus
              → View grouped moment cards
              → Open moment detail modal
              → Delete moment with undo toast
          → Navigate to Settings (/settings)
              → Select timezone
              → Seed 60 demo moments
              → Reset all data (with confirmation)
```

The primary loop is: **log → observe pattern → adjust environment → log again**.

---

## 5. Page Specifications

### 5.1 Landing (`/`)

**Purpose:** Value proposition, product framing, entry point.

**Sections:**
- Hero: headline, one-line product description, two CTAs: `Open Dashboard` and `Load Demo Data`
- Interactive Logger Preview: a non-functional but visually accurate mock of the logger UI showing enum chips and rating pills in their selected state
- Architectural note: brief description of MongoDB aggregation vs hardcoded analytics, to orient academic evaluators

**Constraints:** No chatbot, no sign-up form, no marketing jargon.

---

### 5.2 Dashboard (`/dashboard`)

**Purpose:** 7-day self-reported focus and energy pulse; primary daily entry point.

**Layout (desktop 3-column grid):**
- Row 1: 4 Metric Cards — all strictly 7-day scoped:
  - Sessions Logged (last 7 days)
  - Average Self-Reported Focus (1–5)
  - Average Self-Reported Energy (1–5)
  - Top Resonance Location (location with highest avg resonance score, ≥ 2 sessions)
- Row 2 Left (60%): Dual-axis 7-day trend line chart (Focus + Energy per calendar day in user's timezone)
- Row 2 Right (40%): Quick-Log CTA card + Latest Resonance Callout (best environment from Pipeline 1)
- All metric cards show `—` when no data exists in the 7-day window, not `0`

**Data sources:** `GET /api/analytics/pulse?tz=<tz>` (Pipeline 4)

---

### 5.3 Log Moment (`/log`)

**Purpose:** Sub-30-second structured moment capture.

**Form structure (4 steps, single scroll page with sticky progress bar):**

| Step | Fields | Input Type |
|:---|:---|:---|
| 1 — Activity | `category` (enum), `taskName` (text), `durationMinutes` (number) | Chip selector + text input + number |
| 2 — Environment | `location` (text), `noiseLevel` (1–5), `lighting` (enum), `peoplePresent` (enum) | Text + RatingPills + Chip selectors |
| 3 — Experience | `focusScore` (1–5), `energyScore` (1–5), `moodScore` (1–5), `distractions` (multi-select) | RatingPills × 3 + Chip multi-select |
| 4 — Reflection | `reflection` (optional text), review summary, submit | Textarea + summary card + Button |

**Constraints:**
- `resonanceScore` is not shown or accepted from the user; computed server-side
- Form state auto-saved to `localStorage` key `resonance_draft` on 500 ms debounce
- Draft cleared on successful submit
- Client-side Zod validation mirrors server schema; field errors shown inline
- On submit success: toast notification, redirect to `/dashboard`

---

### 5.4 Resonance Map (`/map`)

**Purpose:** Visual environmental correlation engine.

**Components:**
- **Environmental Matrix (HeatGrid):** Rows = unique locations, Columns = lighting values, Cell value = avg focus score. Colour intensity encodes magnitude (light → dark = low → high focus).
- **Scatter Plot (ScatterPlot):** X-axis = Noise Level (1–5), Y-axis = Self-reported Focus (or Energy via toggle), bubble radius = session count. One bubble per unique (location × noise) combination.
- **Dimension Toggle:** Button group switching Y-axis between Focus and Energy.
- **Contextual note:** "Showing results from all time. Minimum 2 sessions required per condition."

**Data source:** `GET /api/analytics/matrix` (Pipeline 1)

---

### 5.5 History (`/history`)

**Purpose:** Chronological audit log of all logged moments with filtering and delete.

**Filter bar (sticky, URL-encoded):**
- Category pill selector (multi-select)
- Location dropdown (populated from distinct values in data)
- Date range (from / to date pickers)
- Min Focus slider (1–5)

**Feed layout:**
- Grouped by: Today / Yesterday / Earlier This Week / Older
- Each `MomentCard` shows: timestamp, activity badge, location chip, focus/energy/mood badges, distraction count, reflection snippet (truncated to 80 chars)
- Click card → `MomentDetail` modal (read-only, full data)
- Delete button on card → optimistic remove → undo toast (5s)
- `aria-live="polite"` on result count: "Showing 14 moments"

**Data source:** `GET /api/moments?page=1&limit=20&...filters` (paginated)

---

### 5.6 Insights (`/insights`)

**Purpose:** Analytical deep-dive from MongoDB aggregation pipelines.

**Card A — Hourly Focus Distribution:**
- Recharts bar or area chart: X = hour of day (0–23, labelled in user's local timezone), Y = avg self-reported focus
- Subtitle: "Hours with your highest logged focus, based on all recorded sessions"
- Pipeline Inspector toggle → shows Pipeline 2 JSON

**Card B — Distraction Cost Analysis:**
- Recharts horizontal bar chart: one bar per distraction type, value = focus delta vs baseline
- Bars left of centre = focus below baseline (negative delta); bars right = above baseline
- Subtitle: "How each logged distraction correlates with your self-reported focus"
- Requires ≥ 2 occurrences per distraction tag to appear
- Pipeline Inspector toggle → shows Pipeline 3 JSON

**Card C — Optimal Conditions Callout:**
- Text callout: "Your highest self-reported focus (avg X.X) was logged at [Location], under [Lighting] light, with noise level [N], across [N] sessions."
- Derived from top result of Pipeline 1 (avgResonance descending, sessionCount ≥ 2)
- Pipeline Inspector toggle → shows Pipeline 1 JSON

**Pipeline Inspector (per card):**
- Collapsible `<details>` / Framer Motion animated drawer
- Content: syntax-highlighted JSON of the raw MongoDB aggregation pipeline
- Field annotations: one-line comment per stage explaining its role
- Render as `<pre><code>` with monospace font
- No interaction required beyond open/close

**Data sources:**
- Card A: `GET /api/analytics/chronobiology?tz=<tz>`
- Card B: `GET /api/analytics/distractions`
- Card C: `GET /api/analytics/matrix`

---

### 5.7 Settings (`/settings`)

**Purpose:** Timezone configuration and viva demonstration controls.

**Sections:**
1. **Timezone:** Labelled `<select>` populated with a curated list of IANA timezone strings. Default: `Asia/Kolkata`. On change: `PATCH /api/user/preferences`, propagated globally via `usePreferences` hook.
2. **Demo Data:** Button: `Load 60 Sample Moments` → `POST /api/demo/seed`. Idempotent: if moments already exist, returns count without re-inserting. Success toast with redirect prompt.
3. **Reset:** Button: `Reset All Data` (styled destructive). Opens confirmation dialog: "This deletes all your logged moments permanently. Type RESET to confirm." On confirm: `DELETE /api/demo/reset` with body `{ "confirm": true }`. Clears all moments for userId.

---

## 6. UX Principles

| Principle | Application in RESONANCE |
|:---|:---|
| **Hick's Law** | All moment fields use constrained enum chips; no open-ended selection under 30 seconds |
| **Fitts's Law** | All interactive targets ≥ 44×44 px; rating pills have generous padding |
| **Progressive Disclosure** | Logger reveals steps sequentially; reflection and distraction tags are non-mandatory |
| **Jakob's Law** | Left sidebar on desktop, bottom bar on mobile — standard mental models |
| **Peak-End Rule** | Submit delivers an instant check animation + toast; last interaction is satisfying |
| **Aesthetic-Usability Effect** | Monastic Laboratory aesthetic: monochrome surfaces, editorial typography, no decorative noise |

---

## 7. Design System

### 7.1 Colour Tokens (Dark Mode Default)

```
bg-canvas:      #0A0B0E   Surface 0: page background
bg-surface:     #12141A   Surface 1: card background
bg-subtle:      #1A1D26   Surface 2: input, chip background
border-subtle:  #262A36   Dividers, inactive borders
border-strong:  #3B4254   Active / hover borders

text-primary:   #F3F4F6   Body and heading text
text-secondary: #9CA3AF   Labels, metadata
text-tertiary:  #6B7280   Placeholder, disabled

accent-indigo:  #6366F1   Focus metric, primary actions
accent-amber:   #F59E0B   Energy metric
accent-teal:    #14B8A6   Mood, calm states
accent-rose:    #F43F5E   Danger, delete, negative deltas
```

### 7.2 Typography

- **UI & Body:** Inter or Plus Jakarta Sans — legible at 11–13 px for metadata chips
- **Data & Code:** JetBrains Mono or Geist Mono — numerical scores, timestamps, Pipeline Inspector

### 7.3 Spacing

Base unit: 4 px grid. Scale: `4 8 12 16 24 32 48 64`.  
Content max-width: `1280px` for analytics pages; `768px` for the Moment Logger.

### 7.4 Motion Tokens

```
Hover (colour, border):  150ms cubic-bezier(0.16, 1, 0.3, 1)
Modal / drawer entry:    200ms cubic-bezier(0.16, 1, 0.3, 1), y: 8px → 0, opacity: 0 → 1
Page transitions:        120ms opacity crossfade (AnimatePresence mode="wait")
```

All Framer Motion variants must check `useReducedMotion()`. When true: opacity transition only, no translation, no scale.

### 7.5 Forbidden Patterns

- Excessive multi-colour radial/linear gradients
- Glassmorphism with insufficient contrast (`backdrop-blur` + `bg-white/5` on dark text)
- Spring-based bouncy animations or physics simulations
- Decorative floating elements with idle animation loops

---

## 8. Component Architecture

```
client/src/
├── components/
│   ├── ui/                         # Primitive design system — no domain coupling
│   │   ├── Button.tsx              # primary | secondary | outline | ghost | destructive
│   │   ├── Badge.tsx               # category, status, score display tags
│   │   ├── Card.tsx                # standard container: border + header slot + body
│   │   ├── Chip.tsx                # selectable enum picker; supports multi-select mode
│   │   ├── RatingPills.tsx         # 1–5 ARIA radiogroup; arrow-key navigation
│   │   ├── Modal.tsx               # accessible dialog: focus trap, Escape to close
│   │   ├── Skeleton.tsx            # shape-matched content placeholder
│   │   └── Toast.tsx               # bottom-center notification; auto-dismiss + undo slot
│   │
│   ├── layout/
│   │   ├── AppShell.tsx            # root layout: sidebar + <Outlet />
│   │   ├── Sidebar.tsx             # desktop persistent nav (hidden < 1024px)
│   │   └── MobileNav.tsx           # mobile bottom bar: Dashboard, Log, Insights, History
│   │
│   ├── domain/                     # product-specific components
│   │   ├── MomentCard.tsx          # history feed item with delete action
│   │   ├── MomentDetail.tsx        # read-only modal expansion
│   │   ├── MetricStat.tsx          # KPI tile: value + label + optional delta badge
│   │   ├── EmptyState.tsx          # zero-data card with headline, description, CTA(s)
│   │   └── PipelineInspector.tsx   # collapsible drawer: pipeline JSON + stage annotations
│   │
│   └── charts/
│       ├── TrendLine.tsx           # Recharts: 7-day dual-axis focus + energy line chart
│       ├── ScatterPlot.tsx         # Recharts: noise vs focus/energy scatter
│       ├── HeatGrid.tsx            # custom SVG or CSS grid: location × lighting heat map
│       └── DistractionBars.tsx     # Recharts: horizontal bar chart, focus delta per tag
│
├── pages/
│   ├── Landing.tsx
│   ├── Dashboard.tsx
│   ├── LogMoment.tsx               # 4-step form, localStorage draft
│   ├── ResonanceMap.tsx
│   ├── History.tsx
│   ├── Insights.tsx
│   └── Settings.tsx
│
├── hooks/
│   ├── usePulse.ts                 # GET /api/analytics/pulse — 7-day KPIs
│   ├── useMoments.ts               # GET /api/moments — paginated + filtered
│   ├── useMatrix.ts                # GET /api/analytics/matrix
│   ├── useChronobiology.ts         # GET /api/analytics/chronobiology
│   ├── useDistractions.ts          # GET /api/analytics/distractions
│   └── usePreferences.ts           # GET/PATCH /api/user/preferences; timezone source of truth
│
└── shared/
    └── schemas/
        └── moment.schema.ts        # Zod schemas — imported by both client and server
```

**Rules:**
- `components/ui/` must have zero imports from `domain/`, `hooks/`, or `pages/`
- `charts/` components accept plain data props only — no API calls inside
- All MongoDB logic lives exclusively in `server/`; never in React components or hooks

---

## 9. MongoDB Collections & Schemas

### 9.1 Collection: `users`

Minimal single-user document. Auth is out of scope; `userId` is a fixed constant from environment config.

```json
{
  "_id": { "$oid": "<fixed-demo-id>" },
  "name": "Demo User",
  "preferences": {
    "timezone": "Asia/Kolkata"
  },
  "createdAt": { "$date": "..." },
  "updatedAt": { "$date": "..." }
}
```

**Fields deliberately excluded:** `email`, `savedLocations`, `customDistractionTags`, `targetDailyFocusMinutes`, `theme`. All are DEFERRED scope.

---

### 9.2 Collection: `moments`

Single source of truth for all analytics.

```json
{
  "_id": { "$oid": "66f00250a12b3c4d5e6f0099" },
  "userId": { "$oid": "<fixed-demo-id>" },

  "timestamp": { "$date": "2026-09-28T04:00:00.000Z" },
  "durationMinutes": 90,

  "activity": {
    "category": "deep_work",
    "taskName": "Distributed Systems Literature Review"
  },

  "environment": {
    "location": "University Library",
    "noiseLevel": 1,
    "lighting": "natural",
    "peoplePresent": "alone"
  },

  "experience": {
    "focusScore": 5,
    "energyScore": 4,
    "moodScore": 4,
    "distractions": ["Phone Notifications"]
  },

  "reflection": "Morning window light created exceptional clarity.",

  "resonanceScore": 4.6,

  "createdAt": { "$date": "2026-09-28T09:30:00.000Z" },
  "updatedAt": { "$date": "2026-09-28T09:30:00.000Z" }
}
```

**Field constraints:**

| Field | Type | Constraints |
|:---|:---|:---|
| `timestamp` | Date (UTC) | Stored as UTC; IST display via Intl API |
| `durationMinutes` | Integer | 5–720 |
| `activity.category` | Enum | `deep_work` \| `shallow_work` \| `creative` \| `learning` \| `rest` \| `communication` |
| `activity.taskName` | String | 2–100 chars, trimmed |
| `environment.location` | String | 2–50 chars, trimmed |
| `environment.noiseLevel` | Integer | 1–5 |
| `environment.lighting` | Enum | `natural` \| `dim` \| `bright` \| `fluorescent` |
| `environment.peoplePresent` | Enum | `alone` \| `parallel_work` \| `crowded` \| `meeting` |
| `experience.focusScore` | Integer | 1–5 |
| `experience.energyScore` | Integer | 1–5 |
| `experience.moodScore` | Integer | 1–5 |
| `experience.distractions` | String[] | Max 10 items; each ≤ 30 chars |
| `reflection` | String | Optional; max 1000 chars |
| `resonanceScore` | Float | Server-computed: `(focus × 0.6) + (energy × 0.4)`; stored, not accepted from client |

---

## 10. Embedding vs Referencing Decisions

| Data | Decision | Justification |
|:---|:---|:---|
| `activity`, `environment`, `experience` | **Embedded** in `moments` | Historical snapshot immutability: the library's lighting at 09:00 on 28 Sep is a historical fact. If location or lighting conditions change in future, past moments must not be affected. Embedding preserves point-in-time fidelity and eliminates `$lookup` overhead during analytics. |
| `experience.distractions` | **Embedded array** (Multikey indexed) | Cardinality is small (0–10 items) and bounded. Never approaches the 16 MB document limit. The bounded array enables native Multikey indexing and efficient `$unwind` in the distraction pipeline. |
| `userId` in `moments` | **Referenced** ObjectId | The 1-to-N relationship between a user and their moments is unbounded: a user logs hundreds of moments over months. Embedding moments inside the user document would cause unbounded growth, trigger costly on-disk document moves, and hit the 16 MB BSON limit. |

---

## 11. Indexes

Three indexes are defined. Two proposed indexes from the original blueprint were removed after query-pattern audit. See justifications below.

### Index 1 — Primary User Timeline

```javascript
db.moments.createIndex(
  { userId: 1, timestamp: -1 },
  { name: "idx_user_timeline" }
);
```

**Queries served:**
- `GET /api/moments` → `find({ userId }).sort({ timestamp: -1 })`
- `GET /api/analytics/pulse` → `find({ userId, timestamp: { $gte: sevenDaysAgo } })`
- Dashboard daily trend grouping

**Justification:** Applies the ESR (Equality → Sort → Range) compound index rule. `userId` is the equality predicate on every single query in the application. `timestamp: -1` satisfies the chronological sort without an in-memory sort buffer (IXSCAN replaces SORT). The date-range predicate in the 7-day pulse uses the range portion of this same index.

---

### Index 2 — Distraction Analytics (Multikey)

```javascript
db.moments.createIndex(
  { userId: 1, "experience.distractions": 1 },
  { name: "idx_user_distractions_multikey" }
);
```

**Queries served:**
- `GET /api/analytics/distractions` → Pipeline 3 `$unwind`s the `distractions` array then groups by element
- History filter: `find({ userId, "experience.distractions": { $in: ["Phone"] } })`

**Justification:** MongoDB creates one index entry per array element (Multikey Index). Without this index, Pipeline 3 performs a full COLLSCAN on every Insights page load. With this index, the pipeline opens with an IXSCAN narrowed to the user's documents. This is the only Multikey index in the project and provides a strong academic demonstration of array indexing mechanics.

---

### Index 3 — Environmental Correlation

```javascript
db.moments.createIndex(
  { userId: 1, "environment.location": 1, "environment.noiseLevel": 1 },
  { name: "idx_user_env_location_noise" }
);
```

**Queries served:**
- `GET /api/analytics/matrix` → Pipeline 1 groups by `location`, `lighting`, `noiseLevel`
- `GET /api/moments?location=University+Library` → history filter by location
- Resonance Map scatter plot data

**Justification:** The Resonance Map loads on every map page visit and triggers re-queries on every dimension toggle. Without this index, each toggle causes a full COLLSCAN. The compound index allows the `$match: { userId }` prefix to scope the working set before `$group` aggregates environmental fields.

---

### Removed Indexes (with justification)

| Index | Reason Removed |
|:---|:---|
| `{ userId: 1, "activity.category": 1, "experience.focusScore": 1 }` | History category filtering is covered by `idx_user_timeline`. A dedicated category+focus index adds write overhead on every insert with no performance gain for a dataset of ≤ a few hundred moments. |
| `{ userId: 1, resonanceScore: -1 }` | Only consumer was sorting after a `$group` stage. MongoDB cannot use a collection-level index to sort aggregation output after `$group` — the sort operates on in-memory grouped documents. This index provided zero performance benefit. |

---

## 12. Aggregation Pipelines

All pipelines follow these invariants:
- `$match: { userId }` is always the first stage (narrows working set before any other operation)
- All date-part operators (`$hour`, `$dateToString`) accept and use an IANA `timezone` parameter
- `$match` for minimum occurrence counts is placed *after* `$group`, not before
- `resonanceScore` is used as a pre-computed field; no runtime formula is applied in pipelines

---

### Pipeline 1 — Environmental Matrix

**Endpoint:** `GET /api/analytics/matrix`  
**Consumed by:** Resonance Map, Insights Card C  
**Purpose:** Find which location/lighting/noise combinations correlate with highest self-reported focus.

```javascript
[
  // Stage 1: Scope to user — hits idx_user_env_location_noise
  { $match: { userId: new mongoose.Types.ObjectId(userId) } },

  // Stage 2: Group by the three environmental dimensions
  {
    $group: {
      _id: {
        location:   "$environment.location",
        lighting:   "$environment.lighting",
        noiseLevel: "$environment.noiseLevel"
      },
      sessionCount:  { $sum: 1 },
      totalMinutes:  { $sum: "$durationMinutes" },
      avgFocus:      { $avg: "$experience.focusScore" },
      avgEnergy:     { $avg: "$experience.energyScore" },
      avgResonance:  { $avg: "$resonanceScore" }
    }
  },

  // Stage 3: Require at least 2 sessions to prevent single-outlier skew
  { $match: { sessionCount: { $gte: 2 } } },

  // Stage 4: Reshape into flat response object
  {
    $project: {
      _id: 0,
      location:     "$_id.location",
      lighting:     "$_id.lighting",
      noiseLevel:   "$_id.noiseLevel",
      sessionCount: 1,
      totalMinutes: 1,
      avgFocus:     { $round: ["$avgFocus",    2] },
      avgEnergy:    { $round: ["$avgEnergy",   2] },
      avgResonance: { $round: ["$avgResonance", 2] }
    }
  },

  // Stage 5: Best-performing conditions first
  { $sort: { avgResonance: -1, sessionCount: -1 } },

  { $limit: 20 }
]
```

---

### Pipeline 2 — Time-of-Day Focus Distribution

**Endpoint:** `GET /api/analytics/chronobiology?tz=<iana_tz>`  
**Consumed by:** Insights Card A  
**Purpose:** Show which hours of the day correlate with highest self-reported focus, in the user's local timezone.

```javascript
[
  // Stage 1: Scope to user — hits idx_user_timeline
  { $match: { userId: new mongoose.Types.ObjectId(userId) } },

  // Stage 2: Extract local hour from UTC timestamp using user's IANA timezone
  // For Asia/Kolkata (UTC+5:30): a 04:00 UTC timestamp becomes hour 9
  {
    $project: {
      localHour:       { $hour: { date: "$timestamp", timezone: timezone } },
      focusScore:      "$experience.focusScore",
      energyScore:     "$experience.energyScore",
      durationMinutes: 1
    }
  },

  // Stage 3: Aggregate by local hour (0–23)
  {
    $group: {
      _id:           "$localHour",
      momentCount:   { $sum: 1 },
      totalDuration: { $sum: "$durationMinutes" },
      avgFocus:      { $avg: "$focusScore" },
      avgEnergy:     { $avg: "$energyScore" }
    }
  },

  // Stage 4: Reshape
  {
    $project: {
      _id: 0,
      hour:          "$_id",
      momentCount:   1,
      totalDuration: 1,
      avgFocus:      { $round: ["$avgFocus",  2] },
      avgEnergy:     { $round: ["$avgEnergy", 2] }
    }
  },

  { $sort: { hour: 1 } }
]
```

---

### Pipeline 3 — Distraction Impact Analysis

**Endpoint:** `GET /api/analytics/distractions`  
**Consumed by:** Insights Card B  
**Purpose:** Quantify how each distraction type correlates with lower self-reported focus vs. overall baseline.

```javascript
[
  // Stage 1: Scope to user — hits idx_user_distractions_multikey
  { $match: { userId: new mongoose.Types.ObjectId(userId) } },

  // Stage 2: Run two parallel branches via $facet
  {
    $facet: {
      // Branch A: overall baseline focus across ALL sessions
      baseline: [
        {
          $group: {
            _id: null,
            baselineAvgFocus: { $avg: "$experience.focusScore" },
            totalSessions:    { $sum: 1 }
          }
        }
      ],
      // Branch B: per-distraction-tag average focus
      byDistraction: [
        // Only sessions that had at least one distraction logged
        { $match: { "experience.distractions": { $exists: true, $not: { $size: 0 } } } },
        // Decompose array — one document per distraction element
        { $unwind: "$experience.distractions" },
        {
          $group: {
            _id:                 "$experience.distractions",
            occurrences:         { $sum: 1 },
            avgFocusWhenPresent: { $avg: "$experience.focusScore" }
          }
        },
        // Require ≥ 2 occurrences — single instances are not meaningful
        { $match: { occurrences: { $gte: 2 } } },
        { $sort: { occurrences: -1 } }
      ]
    }
  },

  // Stage 3: Extract first element from baseline array (facet always returns arrays)
  {
    $project: {
      baseline:      { $arrayElemAt: ["$baseline", 0] },
      byDistraction: 1
    }
  },

  // Stage 4: Expand byDistraction rows
  { $unwind: "$byDistraction" },

  // Stage 5: Compute focus delta vs baseline
  {
    $project: {
      _id: 0,
      distraction:   "$byDistraction._id",
      occurrences:   "$byDistraction.occurrences",
      avgFocus:      { $round: ["$byDistraction.avgFocusWhenPresent", 2] },
      baselineFocus: { $round: ["$baseline.baselineAvgFocus", 2] },
      totalSessions: "$baseline.totalSessions",
      focusDelta: {
        $round: [
          { $subtract: ["$byDistraction.avgFocusWhenPresent", "$baseline.baselineAvgFocus"] },
          2
        ]
      }
    }
  },

  // Stage 6: Most focus-reducing distractions first (most negative focusDelta first)
  { $sort: { focusDelta: 1 } }
]
```

---

### Pipeline 4 — Dashboard 7-Day Pulse

**Endpoint:** `GET /api/analytics/pulse?tz=<iana_tz>`  
**Consumed by:** Dashboard  
**Purpose:** All dashboard KPIs in one network round-trip, strictly scoped to the previous 7 days.

```javascript
// Computed server-side — never passed from client
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

[
  // Stage 1: MANDATORY 7-day window — uses range portion of idx_user_timeline
  {
    $match: {
      userId:    new mongoose.Types.ObjectId(userId),
      timestamp: { $gte: sevenDaysAgo }
    }
  },

  // Stage 2: Three parallel branches
  {
    $facet: {
      // 7-day aggregate stats
      weekStats: [
        {
          $group: {
            _id:                null,
            sessionCount:       { $sum: 1 },
            totalLoggedMinutes: { $sum: "$durationMinutes" },
            avgFocus:           { $avg: "$experience.focusScore" },
            avgEnergy:          { $avg: "$experience.energyScore" },
            avgResonance:       { $avg: "$resonanceScore" }
          }
        }
      ],
      // Highest-resonance location with ≥ 2 sessions in the window
      topLocation: [
        {
          $group: {
            _id:          "$environment.location",
            avgResonance: { $avg: "$resonanceScore" },
            count:        { $sum: 1 }
          }
        },
        { $match: { count: { $gte: 2 } } },
        { $sort: { avgResonance: -1 } },
        { $limit: 1 }
      ],
      // Per-day averages for the trend line chart, in the user's local timezone
      dailyTrend: [
        {
          $group: {
            _id: {
              $dateToString: {
                format:   "%Y-%m-%d",
                date:     "$timestamp",
                timezone: timezone         // IANA timezone string from user preferences
              }
            },
            avgFocus:  { $avg: "$experience.focusScore" },
            avgEnergy: { $avg: "$experience.energyScore" },
            sessions:  { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } }
      ]
    }
  },

  // Stage 3: Unwrap single-element arrays from $facet branches
  {
    $project: {
      weekStats:   { $arrayElemAt: ["$weekStats",   0] },
      topLocation: { $arrayElemAt: ["$topLocation", 0] },
      dailyTrend:  1
    }
  }
]
```

---

## 13. Timezone Handling

**Storage rule:** All `timestamp` values are stored as UTC in MongoDB. This is non-negotiable.

**Display rule:** All client-facing timestamp rendering uses `Intl.DateTimeFormat` with the user's IANA timezone string. No date library is required.

**Analytics rule:** All MongoDB date operators that extract date parts (`$hour`, `$dayOfWeek`, `$dateToString`) must receive the user's IANA timezone string as a parameter.

**Flow:**

```
User selects timezone in Settings (/settings)
  → PATCH /api/user/preferences { timezone: "Asia/Kolkata" }
  → Stored in users.preferences.timezone
  → usePreferences hook reads and exposes { timezone }
  → All analytics hooks append ?tz=Asia%2FKolkata to their requests
  → Server validates tz param is a valid IANA string
  → Server passes tz to pipeline as { timezone: req.query.tz }
  → $hour, $dateToString use this timezone
  → Client renders timestamps with Intl.DateTimeFormat({ timeZone: timezone })
```

**Default:** `"Asia/Kolkata"` if no preference is set and no `?tz` param is present.

**Seed data note:** All 60 seeded moments have their `timestamp` stored as UTC, converted from their intended IST times. Example: a moment intended for 09:00 IST is stored as `2026-09-15T03:30:00.000Z`.

---

## 14. API Endpoints

All responses use a consistent envelope:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "message": "...", "details": [...] } }
```

HTTP status codes: `200 OK`, `201 Created`, `400 Bad Request` (Zod failure), `404 Not Found`, `500 Internal Server Error`.

---

### Moments

| Method | Route | Query / Body | Response `data` shape |
|:---|:---|:---|:---|
| `GET` | `/api/moments` | `?page=1&limit=20&category=deep_work&location=...&minFocus=3&dateFrom=ISO&dateTo=ISO` | `{ moments: Moment[], total: number, page: number, pages: number }` |
| `POST` | `/api/moments` | Body: `CreateMomentInput` (Zod schema) | `{ moment: Moment }` |
| `GET` | `/api/moments/:id` | Path param `id` | `{ moment: Moment }` |
| `DELETE` | `/api/moments/:id` | Path param `id` | `{ deletedId: string }` |
| `PUT` | `/api/moments/:id` | **(OPTIONAL)** Partial `CreateMomentInput` | `{ moment: Moment }` |

---

### Analytics

| Method | Route | Query Params | Response `data` shape |
|:---|:---|:---|:---|
| `GET` | `/api/analytics/pulse` | `?tz=Asia%2FKolkata` | `{ weekStats, topLocation, dailyTrend[] }` |
| `GET` | `/api/analytics/matrix` | — | `[{ location, lighting, noiseLevel, sessionCount, avgFocus, avgEnergy, avgResonance }]` |
| `GET` | `/api/analytics/chronobiology` | `?tz=Asia%2FKolkata` | `[{ hour, momentCount, totalDuration, avgFocus, avgEnergy }]` |
| `GET` | `/api/analytics/distractions` | — | `[{ distraction, occurrences, avgFocus, baselineFocus, focusDelta }]` |
| `GET` | `/api/analytics/summary` | — | `{ totalMoments, totalMinutes, avgFocus, avgEnergy, avgResonance }` |

---

### User Preferences

| Method | Route | Body | Response `data` shape |
|:---|:---|:---|:---|
| `GET` | `/api/user/preferences` | — | `{ timezone: string }` |
| `PATCH` | `/api/user/preferences` | `{ timezone: string }` (Zod: valid IANA string) | `{ timezone: string }` |

---

### Academic Demo

| Method | Route | Body | Response `data` shape |
|:---|:---|:---|:---|
| `POST` | `/api/demo/seed` | — | `{ insertedCount: number, message: string }` |
| `DELETE` | `/api/demo/reset` | `{ confirm: true }` | `{ deletedCount: number }` |

`POST /api/demo/seed` is idempotent: if moments already exist for the userId, it returns `{ insertedCount: 0, message: "Data already seeded." }` without inserting duplicates.

`DELETE /api/demo/reset` requires `{ "confirm": true }` in the request body as a safety guard. Returns `400` if `confirm` is not `true`.

---

## 15. Validation Rules

Zod schemas defined in `shared/schemas/moment.schema.ts`. Imported by both the React client (for form validation) and the Express server (as middleware). Schemas must remain identical on both sides.

```typescript
// shared/schemas/moment.schema.ts

import { z } from "zod";

export const ActivityCategoryEnum = z.enum([
  "deep_work", "shallow_work", "creative",
  "learning", "rest", "communication"
]);

export const LightingEnum = z.enum([
  "natural", "dim", "bright", "fluorescent"
]);

export const PeoplePresentEnum = z.enum([
  "alone", "parallel_work", "crowded", "meeting"
]);

export const DEFAULT_DISTRACTION_TAGS = [
  "Phone",
  "Messaging Apps",
  "Background Noise",
  "Fatigue",
  "Hunger",
  "Interruptions",
  "Uncomfortable Environment"
] as const;

export const CreateMomentSchema = z.object({
  // Optional: if omitted, server uses time of submission
  timestamp: z.string().datetime().optional(),

  durationMinutes: z
    .number()
    .int()
    .min(5, "Minimum session length is 5 minutes")
    .max(720, "Maximum session length is 12 hours"),

  activity: z.object({
    category: ActivityCategoryEnum,
    taskName: z.string().trim().min(2).max(100)
  }),

  environment: z.object({
    location:      z.string().trim().min(2).max(50),
    noiseLevel:    z.number().int().min(1).max(5),
    lighting:      LightingEnum,
    peoplePresent: PeoplePresentEnum
  }),

  experience: z.object({
    focusScore:  z.number().int().min(1).max(5),
    energyScore: z.number().int().min(1).max(5),
    moodScore:   z.number().int().min(1).max(5),
    distractions: z
      .array(z.string().trim().max(30))
      .max(10, "Maximum 10 distraction tags per session")
      .default([])
  }),

  reflection: z.string().trim().max(1000).optional().default("")
});

// resonanceScore is NOT in this schema — it is computed server-side only
// userId is injected by the server — not accepted from client

export type CreateMomentInput = z.infer<typeof CreateMomentSchema>;
```

---

## 16. Frontend State & Data-Fetching

1. **Custom hooks per endpoint.** Each hook (`usePulse`, `useMoments`, etc.) owns its own `loading: boolean`, `error: string | null`, and `data` state. No global state library is required.

2. **Cache invalidation via `dataVersion`.** A `DataVersionContext` holds an integer counter. After `POST /api/moments` succeeds, the counter increments. All analytics hooks include the counter in their `useEffect` dependency array, triggering a refetch.

3. **Timezone propagation.** `usePreferences` is the single source of truth for `{ timezone }`. All analytics hooks call `usePreferences()` and append `?tz=<timezone>` to their fetch URLs.

4. **Logger draft persistence.** Logger form state is serialised to `localStorage` key `resonance_draft` on a 500 ms debounce. On page mount, the form hydrates from the draft. On successful submit, the key is deleted.

5. **URL-driven history filters.** The History page reads and writes filter state via URL search params (`?category=deep_work&minFocus=3`). This makes the filtered view reproducible across reloads and shareable during the viva.

6. **No analytics logic in components.** Components receive pre-computed data as props. No aggregation, averaging, or formatting logic inside JSX files.

---

## 17. Loading, Empty, Error & Success States

Every data-consuming component must implement all four states. Blank pages or uncaught promise errors are not acceptable.

| State | Behaviour |
|:---|:---|
| **Loading** | `Skeleton` component with the exact bounding box of the target content. Zero layout shift. |
| **Empty — no data exists** | `EmptyState` card: headline "No moments logged yet", two CTAs: "Log your first moment" and "Load 60 sample moments". Charts must not render empty axes. |
| **Empty — filter yields no results** | `EmptyState` variant: "No moments match these filters." with "Clear filters" button. |
| **API error** | Inline error card inside the failed component only. Remaining page sections stay functional. "Try again" button re-triggers the fetch. |
| **Submit success (log moment)** | Toast: "Moment logged" + animated check mark. Auto-dismiss after 3 s. Redirect to `/dashboard`. |
| **Delete success** | Optimistic removal: card disappears immediately. Toast: "Moment deleted" + "Undo" button for 5 s. On undo: re-insert call and card reappears. |
| **Seed success** | Toast: "60 moments loaded. Open Resonance Map or Insights to explore patterns." |
| **Reset success** | Toast: "All data cleared." App-wide `dataVersion` increments, all pages re-render to empty state. |

---

## 18. Accessibility Requirements

Target: **WCAG 2.1 Level AA** across all CORE pages.

| Requirement | Implementation |
|:---|:---|
| Colour contrast | All body text ≥ 4.5:1 on card surfaces. Icons ≥ 3:1. Verified with a contrast checker before submission. |
| Rating pills | `role="radiogroup"` on wrapper, `role="radio"` on each pill, `aria-checked`, `aria-label="Focus: 4 out of 5"`. Arrow-key navigation (Left/Right or Up/Down). Space/Enter to select. |
| Modal focus | On open: focus moves to first interactive element inside modal. On close: focus returns to the element that triggered the modal. Escape key closes. |
| Reduced motion | All Framer Motion variants check `useReducedMotion()`. When true: transition is opacity-only (no translate, no scale, no spring). |
| Live regions | History filter result count: `aria-live="polite"`. Toast notifications: `role="status"`. |
| Touch targets | All interactive elements ≥ 44×44 px on mobile viewports. |
| Semantic HTML | `<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>` used correctly. No `<div>` for interactive elements without ARIA roles. |
| Form labels | Every form input has an associated `<label>` with `htmlFor`. No placeholder-only labelling. |

---

## 19. Responsive Behavior

| Breakpoint | Layout Strategy |
|:---|:---|
| **Mobile `< 640px`** | Full-width single column. Bottom navigation bar (Dashboard, Log, Insights, History). Rating pills full-width. Recharts charts use fixed `height` and horizontal scroll wrapper. Sidebar hidden. |
| **Tablet `640px – 1024px`** | Two-column grid on Dashboard. Logger environment and experience fields displayed side by side. Collapsible sidebar or a compact top navigation bar. |
| **Desktop `> 1024px`** | Persistent 240 px left sidebar. Three-column dashboard grid. Pipeline Inspector opens as a right-side drawer. History filter bar is sticky at the top of the page. |

Charts never render at zero width. All `ResponsiveContainer` wrappers must have an explicit `min-h` to prevent collapse on initial render.

---

## 20. Seed-Data Requirements

The seeder inserts exactly **60 moments spanning 30 consecutive days** ending at the time of seeding. It is the only way to demonstrate meaningful aggregation results in a viva.

### Curated Behavioral Patterns

| Pattern | IST Time | Location | Noise | Lighting | People | Focus | Energy | Distractions |
|:---|:---|:---|:---:|:---|:---|:---:|:---:|:---|
| A — Morning library | 08:00–11:00 | University Library | 1 | natural | alone | 4–5 | 4–5 | None |
| B — Afternoon cafe | 14:00–16:00 | Science Cafe | 4 | fluorescent | crowded | 2–3 | 2–3 | Phone, Interruptions |
| C — Evening home | 20:00–22:00 | Home Studio | 2 | dim | alone | 3–4 | 3 | Fatigue |
| D — Open lab | 11:00–13:00 | Open Lab | 4–5 | bright | parallel_work | 2 | 3 | Background Noise, Messaging Apps |

### Seeder Constraints

- Timestamps stored as UTC converted from the IST values above. Example: 09:00 IST → `T03:30:00.000Z`
- `resonanceScore` computed correctly per record: `(focus × 0.6) + (energy × 0.4)`, rounded to 1 decimal
- No two moments share the same timestamp
- All 60 records reference the fixed demo `userId`
- Seeder is idempotent: checks `moments.countDocuments({ userId })` before inserting; returns early if count > 0

### Pattern Distribution (60 moments total)

- Pattern A: 20 moments (morning library, consistently high focus)
- Pattern B: 15 moments (afternoon cafe, consistently lower focus)
- Pattern C: 15 moments (evening home, moderate focus)
- Pattern D: 10 moments (open lab, lowest focus, most distractions)

This distribution ensures Pipeline 1 returns Pattern A as the top result, Pipeline 2 shows a morning peak (hours 8–10 IST), and Pipeline 3 shows "Phone" and "Background Noise" as the most focus-reducing distractions.

---

## 21. Implementation Phases

### Phase 1 — Foundation (2–3 days)
- Monorepo structure: `client/` (Vite + React + TypeScript + Tailwind) and `server/` (Node.js + Express + TypeScript)
- `shared/schemas/moment.schema.ts` with all Zod schemas
- MongoDB connection utility; Mongoose models for `User` and `Moment`
- Three indexes declared in Mongoose schema definitions (applied on connection)
- Demo user document created in DB initialisation script
- Seeder script (`seedData.ts`): 60 curated moments, UTC timestamps, correct resonanceScore
- `POST /api/demo/seed` and `DELETE /api/demo/reset` endpoints working and verified

### Phase 2 — Backend API (2–3 days)
- All four aggregation pipelines implemented as service functions
- Analytics endpoints: `pulse`, `matrix`, `chronobiology`, `distractions`, `summary`
- CRUD endpoints: `GET /api/moments`, `POST`, `GET /:id`, `DELETE /:id`
- Zod validation middleware applied to all mutating endpoints
- Timezone parameter (`?tz`) validated as IANA string before use in pipelines
- `GET /api/user/preferences` and `PATCH` endpoint

### Phase 3 — Design System & Shell (2 days)
- Tailwind config: custom colour tokens, font families, spacing extensions
- All `components/ui/` primitives: Button, Badge, Card, Chip, RatingPills, Modal, Skeleton, Toast
- `AppShell`, `Sidebar`, `MobileNav` with React Router routing
- `EmptyState`, `Skeleton` verified across all breakpoints

### Phase 4 — Core Pages (4–5 days)
- Landing page (hero, logger preview widget, CTAs)
- Log Moment stepper (4 steps, localStorage draft, client Zod validation, submit flow)
- Dashboard (7-day pulse pipeline, metric cards, trend chart, empty states)
- History (URL-encoded filter bar, date-grouped feed, detail modal, delete with undo)

### Phase 5 — Analytics Pages (3 days)
- Resonance Map (HeatGrid + ScatterPlot + dimension toggle)
- Insights (chrono heatmap Card A, distraction bars Card B, optimal callout Card C)
- Pipeline Inspector drawer for each Insights card (Pipeline 1, 2, 3 JSON + annotations)

### Phase 6 — Settings & Polish (2 days)
- Settings page (timezone selector, seed/reset controls)
- Accessibility pass: ARIA labels on all interactive elements, keyboard navigation verification, contrast check
- Responsive breakpoint verification at 375 px, 768 px, 1280 px
- `useReducedMotion()` check across all animated components
- Empty and error states audited on every page
- `README.md` and `AGENTS.md` final review

---

## 22. Deferred Features

The following are explicitly out of scope. Do not implement them without a formal revision of this document.

| Feature | Reason |
|:---|:---|
| JSON / CSV data export | Zero academic value for either subject |
| User profile page | Auth is out of scope; unnecessary for single-user project |
| OAuth / multi-user authentication | Excessive complexity; fixed userId is sufficient |
| Custom distraction tag management UI | Default enum tags cover all viva scenarios |
| Moment edit (PUT workflow) | Delete + re-log is sufficient; edit form duplicates logger |
| Dark/light mode toggle | Dark mode is default; toggle is post-viva polish |
| Automated WCAG test suite | Manual accessibility during development is sufficient |
| Unit test suite beyond seeder | Seeder + pipeline integration test is the relevant academic test |
| Saved locations management UI | `localStorage` autocomplete suggestions are sufficient |
| Landing page interactive chatbot | Contradicts scope constraints |
| Any ML or AI integration | Explicitly out of scope |

---

## 23. Verification Checklist

Run through this checklist before submission or viva demonstration.

### Database
- [ ] `users` collection contains the demo user with `preferences.timezone: "Asia/Kolkata"`
- [ ] `moments` collection has three indexes: `idx_user_timeline`, `idx_user_distractions_multikey`, `idx_user_env_location_noise`
- [ ] `POST /api/demo/seed` inserts 60 moments; re-running it does not duplicate
- [ ] `DELETE /api/demo/reset` with `{ confirm: true }` clears all moments
- [ ] All 60 seed records have correct UTC timestamps (IST time − 5h30m)
- [ ] All 60 seed records have correct `resonanceScore = (focus × 0.6) + (energy × 0.4)`

### Backend
- [ ] `POST /api/moments` with `focusScore: 6` returns `400` (Zod validation failure)
- [ ] `POST /api/moments` with `durationMinutes: 3` returns `400`
- [ ] `GET /api/analytics/pulse` returns data scoped to the last 7 days only
- [ ] `GET /api/analytics/chronobiology?tz=Asia%2FKolkata` returns hour `9` for a session stored at `03:30 UTC`
- [ ] `GET /api/analytics/chronobiology` (no tz param) defaults to `Asia/Kolkata`
- [ ] Pipeline 3 does not include distraction tags with fewer than 2 occurrences
- [ ] `DELETE /api/demo/reset` without body returns `400`
- [ ] TypeScript compiles with zero errors in `server/`

### Frontend
- [ ] Dashboard metric cards show `—` when no moments exist in the 7-day window
- [ ] Log Moment form auto-saves draft; draft survives page refresh; draft clears on submit
- [ ] Rating pill component: arrow-key navigation cycles through 1–5; ARIA attributes correct
- [ ] History filter state is preserved in URL: refreshing the page maintains filters
- [ ] Resonance Map dimension toggle switches Y-axis between Focus and Energy
- [ ] All Insights cards show empty state when no data exists (not empty chart axes)
- [ ] Pipeline Inspector opens and displays readable JSON with stage annotations
- [ ] Delete action on History: optimistic removal + toast with Undo; Undo restores the card
- [ ] All interactive elements are reachable by keyboard (Tab, Enter, Space, Escape)
- [ ] `prefers-reduced-motion: reduce` disables all translate/scale animations
- [ ] TypeScript compiles with zero errors in `client/` (`tsc --noEmit`)
- [ ] `npm run build` completes without errors or warnings

### Design & Accessibility
- [ ] All text passes 4.5:1 contrast ratio on its background
- [ ] All interactive elements have visible focus outlines
- [ ] Modal returns focus to trigger element on close
- [ ] No empty `alt` attributes on meaningful images; decorative images have `alt=""`
- [ ] Mobile layout at 375 px: no horizontal overflow; bottom nav visible and functional
- [ ] Charts do not collapse to zero height on initial render
