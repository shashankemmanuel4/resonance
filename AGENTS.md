# AGENTS.md — Permanent Development Rules for RESONANCE

This file contains the binding operational rules for every engineering session on this codebase.
Any automated agent, pair programmer, or contributor must read and follow these rules without exception.

---

## 0. Authoritative Documents

**Two documents are the source of truth for this project. Both must be consulted before any implementation decision.**

1. **`README.md`** — Implementation specification. Defines the final page list, schemas, indexes, pipelines, API surface, validation rules, component architecture, and verification checklist.
2. **`RESONANCE_Revised_Blueprint.md`** — Design rationale. Explains the reasoning behind every architectural decision. If README.md is silent on a question, consult the blueprint.

If there is any conflict between these two documents and what an agent thinks should be done, the documents win.

---

## 1. Scope Control

**This is a minor academic project. Keep it that way.**

- Initial implementation must include CORE features only. OPTIONAL features may be considered only after every CORE feature passes verification. DEFERRED features must not be implemented.
- Do not add features that are not listed as **CORE** or **OPTIONAL** in `README.md § Feature Classification`.
- The **DEFERRED** list in `README.md § 22` is absolute. Do not implement any item on it during this phase.
- Do not propose new features or architectural changes during implementation. If something genuinely needs to change, surface it and wait for explicit revision of the authoritative documents.
- The approved pages are: `/`, `/dashboard`, `/log`, `/map`, `/history`, `/insights`, `/settings`. Do not add routes.
- The approved backend routes are exactly those listed in `README.md § 14`. Do not add speculative endpoints.

---

## 2. No Unapproved Architecture Changes

- The MongoDB schema, collection structure, and field names are frozen as specified in `README.md § 9`.
- The three approved indexes are frozen as specified in `README.md § 11`. Do not add indexes. Do not remove indexes. Do not rename them.
- The four aggregation pipelines are frozen as specified in `README.md § 12`. Pipeline logic, stage order, and field names are authoritative. Do not refactor pipeline logic without explicit instruction.
- The component directory structure is specified in `README.md § 8`. Follow it. Do not invent new top-level directories.
- If an architectural change is genuinely required, stop and ask. Do not make unilateral changes to the approved design.

---

## 3. TypeScript Strict Mode

- TypeScript strict mode is enabled on both `client/` and `server/`. Do not disable it.
- `tsconfig.json` must include `"strict": true` in both workspaces.
- `noImplicitAny`, `strictNullChecks`, and `noUncheckedIndexedAccess` must all be enabled.
- Before completing any task, verify that `tsc --noEmit` runs with zero errors on both `client/` and `server/`.
- Do not use `any` as an escape hatch. Use `unknown` with appropriate type guards, or define the correct type.
- Do not use `// @ts-ignore` or `// @ts-expect-error` without a documented reason in the same comment.

---

## 4. Zod Validation on Every API Input

- Every `POST`, `PUT`, and `PATCH` endpoint must parse its request body through the corresponding Zod schema before touching Mongoose.
- Every `GET` endpoint with query parameters that affect database queries (e.g., `?minFocus=`, `?tz=`) must validate those parameters with Zod before use.
- The Zod schemas live in `shared/schemas/moment.schema.ts` and are imported by both the client and the server. **Schemas must be identical on both sides.** Do not duplicate or diverge them.
- When Zod validation fails on the server, return `HTTP 400` with `{ "success": false, "error": { "message": "Validation failed", "details": zodError.errors } }`.
- `resonanceScore` is computed server-side only. It must never be accepted from a client request body.
- `userId` is injected server-side from application config. It must never be accepted from a client request body.

---

## 5. No MongoDB Logic in React Components or Hooks

- All Mongoose queries, aggregation pipelines, and index definitions live exclusively in `server/`.
- React hooks (`hooks/`) are only permitted to call the REST API via `fetch`. They must not contain Mongoose imports, MongoDB driver calls, or pipeline construction logic.
- React components (`components/`, `pages/`) must not contain any data-fetching logic beyond calling hooks. They receive pre-computed data as props.
- The separation is: **MongoDB → Mongoose service → Express controller → REST API → React hook → React component**.

---

## 6. No Fake or Hardcoded Analytics

- Every number displayed on the Dashboard, Resonance Map, and Insights pages must originate from a live MongoDB aggregation pipeline.
- Do not hardcode example data into chart components or API responses.
- Do not write mock API handlers that return static JSON for analytics endpoints in the production build.
- The seed data in `server/seed/seedData.ts` is the only legitimate source of pre-populated data, and it is explicitly curated for the academic demonstration (see `README.md § 20`).
- If a user has no data, the UI must show the defined empty state (see `README.md § 17`). It must not show fabricated numbers.

---

## 7. Timezone Correctness

The following rules are non-negotiable. Violating them produces analytically incorrect results.

- All `timestamp` values are stored as **UTC** in MongoDB. Never store local time.
- All MongoDB date operators that extract date parts (`$hour`, `$dayOfWeek`, `$dateToString`) **must** receive the user's IANA timezone string as a parameter.
- The timezone parameter flows from `users.preferences.timezone` → `usePreferences` hook → `?tz=<iana>` query param on analytics requests → server validates IANA string → passed to pipeline.
- The default timezone when none is configured is `"Asia/Kolkata"`.
- Client-side timestamp display uses `Intl.DateTimeFormat` with `timeZone: timezone`. No other date formatting library is required.
- The seeder converts all IST times to UTC before inserting. Example: `09:00 IST → T03:30:00.000Z`. Verify this.
- Never use `timezone: "UTC"` in any user-facing aggregation pipeline stage.

---

## 8. Semantic and Accessible HTML

- Use semantic HTML elements correctly: `<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>`, `<form>`, `<fieldset>`, `<legend>`, `<label>`.
- Never use `<div>` or `<span>` for interactive elements without the correct ARIA `role`.
- Every form input must have an associated `<label>` element using `htmlFor`. Placeholder text is not a label.
- Rating pill components (`RatingPills.tsx`) must implement `role="radiogroup"` on the wrapper and `role="radio"` on each pill, with `aria-checked` and `aria-label="<dimension>: <N> out of 5"`. Arrow-key navigation is required.
- Modals must implement focus trapping and return focus to the trigger element on close.
- All Framer Motion animated components must check `useReducedMotion()`. When true, use opacity transitions only — no `x`, `y`, `scale`, or `rotate` transforms.
- Use `aria-live="polite"` for dynamic content updates (filter result counts, toast notifications).
- Do not suppress the browser's default focus outline without providing a visible custom replacement.
- All interactive elements must be reachable and operable by keyboard alone.
- Verify colour contrast with a contrast checker: body text ≥ 4.5:1, large text and icons ≥ 3:1.

---

## 9. Loading, Empty, Error, and Success States

Every component that fetches or mutates data must implement all four states. This is not optional.

- **Loading:** Use the `Skeleton` component. Match the exact bounding box of the content it replaces. No layout shift.
- **Empty:** Use the `EmptyState` component. Never render an empty chart with blank axes. Provide at least one actionable CTA.
- **Error:** Render an inline error card inside the failing component. Do not let errors crash the entire page. Provide a "Try again" button.
- **Success:** Use the `Toast` component. Log Moment submit → toast + redirect. Delete → optimistic removal + toast with Undo.

---

## 10. Neutral Language in All Copy

Do not use language that implies clinical or psychological measurement.

| ❌ Forbidden | ✅ Required |
|:---|:---|
| "Cognitive focus" (as a measured value) | "Self-reported focus" |
| "Somatic states" | "Personal state" or "how you felt" |
| "Chronobiology" / "diurnal pattern" | "Time-of-day pattern" or "hourly focus distribution" |
| "Optimal cognitive windows" | "Hours with your highest logged focus" |
| "Psychologically optimal setup" | "The environmental setup correlated with your highest self-reported focus" |
| "Deep flow state" | "Focus rating 5" |
| "Resonance Quotient" | "Resonance Score" |

The Resonance Score in-app disclosure must read: *"Your Resonance Score is a simple weighted average of your self-reported focus (60%) and energy (40%) for this session. It is a convenience summary, not a validated metric."*

---

## 11. Build and Type Verification

Before marking any task complete, run and verify all three of the following:

```bash
# 1. TypeScript — zero errors required on both workspaces
npm --prefix server exec tsc -- --noEmit
npm --prefix client exec tsc -- --noEmit

# 2. Linter — zero errors required (warnings may be reviewed)
npm run lint

# 3. Production build — must succeed without errors
npm run build
```

Do not claim a feature is complete until all three pass. Do not commit code that fails any of these checks.

---

## 12. Never Claim Without Verifying

- Do not say "the pipeline is correct" without running it against the seeded database and inspecting the output.
- Do not say "the build passes" without running `npm run build` and reading the output.
- Do not say "the timezone handling is correct" without testing a seeded session at a known IST time and confirming the chronobiology endpoint returns the expected local hour.
- Do not say "accessibility is complete" without keyboard-navigating through the full logging flow.
- If you cannot verify something because the application is not yet running, say so explicitly. Do not assert correctness without evidence.

---

## 13. Response Envelope Consistency

All API responses use this exact shape. Do not deviate.

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "message": "...", "details": [...] } }
```

HTTP status codes: `200` (success), `201` (created), `400` (validation), `404` (not found), `500` (server error).

---

## 14. Pre-Commit Checklist

Before any commit, verify:

- [ ] `tsc --noEmit` passes in both `client/` and `server/` (zero errors)
- [ ] `npm run lint` passes (zero errors)
- [ ] `npm run build` completes successfully
- [ ] No `console.log` debug statements left in production code
- [ ] No hardcoded analytics values in any response handler
- [ ] No UTC-only date operators in user-facing aggregation pipelines
- [ ] No `any` types without a documented justification comment
- [ ] All new interactive UI elements are keyboard-accessible and have ARIA labels
- [ ] All data-fetching components handle loading, empty, error, and success states
- [ ] No DEFERRED features have been added
