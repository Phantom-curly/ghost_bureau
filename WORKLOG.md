# AI Worklog

## Stage 1 — Scaffold

- 2026-09-15: Decided the ESLint ban on `as` casts should allow `as const` while still
  banning `as Type` / `<Type>value`. Reasoning: `as const` only narrows a literal to its
  readonly/literal type and can't hide a real type error the way a type-overriding cast can.

## Stage 2 — Types and seed data

- 2026-09-15: Decided ghost deadlines should be computed relative to real time (a
  `daysFromNow()` helper in `src/data/`, outside `src/domain/`) instead of hardcoded ISO
  date literals, so the "deadline already passed" and upcoming-deadline scenarios stay valid
  indefinitely rather than drifting stale as real time moves past static dates.
- 2026-09-15: Confirmed it's acceptable that Маяк (lighthouse, capacity 1) ends up with no
  ghost from the auto-match in the 7-ghost seed. It's mathematically unavoidable given the
  required print-shop displacement overlap plus only 5 of 7 ghosts being placeable at all,
  and it stays reachable through manual override.

## Stage 3 — Scenarios and failing tests

- 2026-09-15: Resolved a gap in CLAUDE.md's documented `evaluate` signature: it listed
  `evaluate(ghost, place, occupancy)` with no `now`, but the deadline hard constraint can't be
  checked without the current time, and the domain can't call `Date.now()` internally. Added
  `now: Date` as a 4th parameter — confirmed with the user before writing tests against it.
- 2026-09-15: Decided `evaluate`'s ineligible case returns `score: null, breakdown: null` (a
  discriminated union on `eligible`) rather than always-present zeroed values, so TypeScript
  forces every caller to check eligibility before reading a score.
- 2026-09-15: Decided the non-blocking `needs_quiet` warning lives inside
  `breakdown.warnings` (alongside a new `breakdown.penalty` field) rather than as a new
  top-level field on `evaluate`'s return value.
- 2026-09-15: Decided the final score is clamped to a 0 floor after the `needs_quiet` -25
  penalty is applied, matching the spec's stated 0-100 range for score.
- 2026-09-15: Decided `assignAll`'s `unplaced` is `Ghost[]`, not ghosts paired with reasons —
  since `evaluate` is the single source of truth for "why no place fits," the UI explains an
  unplaced ghost by calling `evaluate` per place itself rather than `assignAll` duplicating
  that logic.

## Stage 5 — UI

- 2026-09-15: Decided to add two new domain exports, `tallyOccupancy` and `rankCandidates`,
  rather than have a component compute a count or a ranking itself. CLAUDE.md treats either as
  a bug ("if a component computes a score, a violation, or a count, that is a bug"), and the
  UI genuinely needs both: a per-place occupancy tally reflecting manual overrides, and a full
  ranked list of every place per ghost (not just the single `assignAll` winner) for the top-3
  display, the override `<select>`, and the "why no place fits" explanation — one function for
  all three, the same way `evaluate` itself is reused. `evaluate`/`assignAll`'s own signatures
  are untouched.
- 2026-09-15: Decided occupancy for candidate rankings and override warnings is live —
  recomputed from the current auto+override state whenever it changes — rather than frozen at
  the original `assignAll` baseline. A static baseline would show a seat as free after the
  operator had already manually filled it, which would look like a bug.
- 2026-09-15: Decided stage 5 builds the tab shell for all three tabs now (Заявки fully
  functional, Отчёт/AI Worklog as one-line placeholders), rather than deferring the shell
  entirely to stage 6, since CLAUDE.md's own stage 5 heading lists "Три вкладки" as part of
  this stage's deliverable.
- 2026-09-15: While implementing, refactored `assignAll`'s internal best-place selection to
  call the new `rankCandidates` instead of its own private `findBestEligiblePlace`, so the
  auto-matching algorithm and the UI's candidate ranking are provably the same code path, not
  two implementations of the same idea. Internal-only change; `assignAll`'s observable
  behavior and all 35 existing tests were unaffected.

## Stage 6 — Report and worklog

- 2026-09-15: Decided the report's "most problematic applications" and "overloaded locations"
  are computed against a zero-occupancy baseline (`tallyOccupancy(places, [])`), not the live,
  override-aware occupancy the applications tab uses. Reasoning: "demand vs capacity" only
  means something if demand is measured independently of capacity — with live occupancy, the
  moment one ghost claims a seat, evaluating a second ghost against that place would already
  show it as ineligible (capacity full), collapsing "2 ghosts want this 1-seat place" down to
  "1 ghost has it," hiding exactly the thing that section exists to reveal. Same reasoning for
  "most problematic": it should be a stable structural property of the applications
  themselves, not something that jitters depending on unrelated manual overrides elsewhere.
- 2026-09-15: Confirmed the AI Worklog tab renders `WORKLOG.md` (pulled in at build time via
  Vite's `?raw` import) with a small hand-rolled renderer rather than adding a markdown
  dependency — headers, bullets, bold, and paragraphs, exactly the subset this file uses.
  Inline code spans (backtick text) render as literal characters rather than styled `<code>`,
  since that wasn't part of the agreed subset; not worth a dependency for.

## Stage 7 — Finish

- 2026-09-15: Scoped the domain's typed validation (`validateData`) to invariants that would
  actually cause silent misbehavior — duplicate ids, negative capacity, unparseable deadlines —
  rather than exhaustive range-checking every numeric field. Also noted plainly that this path
  can't actually trigger in today's app: applications can't be created or edited, so `ghosts`
  only ever becomes the seed array or `[]`, both valid by construction. Built anyway because
  CLAUDE.md's "the domain validates, the UI never throws" is a standing architectural rule, not
  a feature gated on editing existing — and it's the right place for it the moment that changes.
- 2026-09-15: Confirmed GitHub Pages as the deploy target. Since no git remote exists yet and
  the eventual `/repo-name/` subpath is unknown, used a relative `base: './'` in
  `vite.config.ts` instead of guessing a repo name — verified the built `dist/index.html`
  actually uses relative asset paths. Added `.github/workflows/deploy.yml` as a separate
  workflow from the existing `ci.yml`, config only — no attempt to actually enable or trigger a
  deploy, since that needs the repo to exist on GitHub and Pages enabled in its settings.
