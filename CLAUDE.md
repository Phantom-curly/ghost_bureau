# Ghost Relocation Bureau

Operator console for assigning ghosts to haunting locations. Test assignment for MOX.
Fictional domain, small scope. A small finished system beats a large half-working one.

## Architecture rule (non-negotiable)

All matching logic lives in `src/domain/`. It is pure: no React, no DOM, no `Date.now()`,
no randomness, no I/O. Time is passed in as a parameter. Everything the UI displays is
derived from these functions.

If a component computes a score, a violation, or a count, that is a bug. Move it to the
domain and render the result.

Core API. Do not change these signatures without asking:

```ts
evaluate(ghost, place, occupancy) -> { eligible, violations, score, breakdown }
assignAll(ghosts, places, now)    -> { assignments, unplaced }
```

`evaluate` is the single source of truth for three separate features: automatic matching,
"why is there no place for this ghost", and manual-override warnings. Do not write a second
code path for any of them.

## Stack

Vite + React + TypeScript, Vitest. No backend, no database, no router, no UI kit, no state
manager. Data is a static typed array in `src/data/`. Do not add a dependency without asking.

## Commands

```
npm run dev
npm test
npm run typecheck
npm run build
```

## Rules for every change

1. Domain changes are test-first. Write the failing test, run it, show me it fails, then implement.
2. Never edit or delete a test to make a suite pass. If a test looks wrong, stop and say so.
3. No `any`, no `as` casts, no non-null assertions. Strict mode stays on.
4. Every violation carries a human-readable Russian reason string. No bare error codes,
   no i18n layer.
5. Seed data must always contain, and the UI must always be able to reach:
   - a ghost that no place can accept
   - a place that more ghosts want than it can hold
   - a ghost whose deadline has passed
   - a one-click way to empty the application list
   If a change would hide one of these from a first-time visitor, flag it before doing it.
6. The UI never throws on bad data. The domain validates and returns a typed error value;
   the UI renders it as a message.

## Scope

In scope: auto-matching, explanation of each match, conflict reasons, manual override with
warnings, final report, worklog tab.

Out of scope: creating or editing applications, persistence, auth, animations, mobile layout,
dark mode, accessibility beyond semantic HTML. If you believe something out of scope is
required, ask before building it.

## Definition of done for any task

`npm run typecheck && npm test && npm run build` all pass, and domain coverage is still 100%.
Run them yourself before telling me you are finished. Do not report success without running them.

## Worklog

`WORKLOG.md` is imported and rendered inside the app. When I make a design decision, or when
I reject something you proposed, append one dated line under the current stage. Never rewrite
or tidy past entries.
