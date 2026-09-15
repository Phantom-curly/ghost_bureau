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
