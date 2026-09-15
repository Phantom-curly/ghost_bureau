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
