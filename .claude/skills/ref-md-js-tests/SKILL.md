---
name: ref-md-js-tests
description: >-
  Testing conventions for Mindoktor TypeScript/JavaScript code — unit and
  integration / module-level tests with Jest.
  Use when: adding test coverage for pure functions, hooks, modules, or
  integration seams, updating tests after behavior changes, naming test files,
  or introducing mocks in Jest-based tests.
  Covers test placement, naming patterns, Jest mocking, fake-timer time mocking,
  per-library date mocking (dayjs for clinic and legacy patient, date-fns for
  patient-phoenix), hook testing, and maintenance rules. E2e (Playwright) lives in
  mindoktor-testing; React component-render testing in `ref-md-js-react`.
metadata:
  author: mindoktor
  version: "1.10"
  shareable-skills.owner-prefix: "md"
  shareable-skills.owner: "mindoktor/agentic-tools"
  shareable-skills.domain: "js"
  shareable-skills.visibility: "organization"
  shareable-skills.vendored-sha: "f996033"
  shareable-skills.vendored-time: "2026-07-13"
  shareable-skills.requires: "ref-md-js-typescript"
  shareable-skills.suggests: "ref-md-js-react"
---

# JavaScript and TypeScript Tests

_Vendored from agentic-tools — edit the upstream skill there, not this copy; local edits are overwritten on re-vendor._

Use this skill for testing in Mindoktor JavaScript and TypeScript codebases — unit and integration / module-level tests with Jest.

`ref-md-js-typescript` is required baseline context. This skill focuses on testing patterns and does not repeat TypeScript fundamentals.

## Scope

Covers JS/TS testing conventions — placement, naming, Jest mocking, time mocking, and per-library date mocking (`dayjs` for clinic and legacy patient, `date-fns` for patient-phoenix) — for unit and integration / module-level tests. **Not** here: end-to-end tests (Playwright), in the `mindoktor-testing` repo; React component-render testing, in `ref-md-js-react`. For TypeScript see [`ref-md-js-typescript`](../ref-md-js-typescript/SKILL.md); quality expectations `ref-md-dev-coding-patterns`.

## Source Basis

This guidance draws from both Mindoktor frontends — patient-app (`packages/apps/patient/phoenix/` in `mindoktor-app`) and clinic-app. They share Jest conventions but differ in date library (patient: `date-fns`, clinic: `dayjs`), so library-specific date-test setup is deferred to each app's own skill.

- Tooling: Jest (patient-app: `test` and `test:ci` scripts; clinic-app: `test` only)
- File patterns: `*.test.ts` / `*.test.tsx` are the standard; `*.spec.*` is a legacy minority, and clinic-app carries older dash-variant `*-test.ts(x)` files (see [`references/test-vs-spec-naming.md`](references/test-vs-spec-naming.md))
- Placement: co-located next to implementation files in most packages; clinic-app predominantly uses sibling `__tests__/` folders — match the folder's existing convention
- Mocking: `jest.mock(...)` and `jest.mocked(...)` for dependency seams

## Routing Table

| Task                                                              | Read                                                                     |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Writing and maintaining tests                                     | [`references/patterns.md`](references/patterns.md)                       |
| Mocking dates with dayjs (clinic + legacy patient)                | [`references/dayjs.md`](references/dayjs.md)                             |
| Mocking dates with date-fns (patient-phoenix)                     | [`references/date-fns.md`](references/date-fns.md)                       |
| Naming test files (`.test` vs `.spec`) and the evidence behind it | [`references/test-vs-spec-naming.md`](references/test-vs-spec-naming.md) |

## Quick Rules

- Add or update tests whenever behavior changes in testable code.
- Keep test files near the module under test — flat or in a `__tests__/` subdirectory per the app's convention.
- Name new test files `*.test.ts` / `*.test.tsx` — the measured standard in both repos; use `*.spec.*` only when extending a folder that already uses it ([evidence](references/test-vs-spec-naming.md)).
- Mock dependencies at module boundaries (`jest.mock`), not internal implementation details.
- Assert behavior and outputs, not private implementation structure.

## Related Skills

| Skill                                                      | When to load                                               |
| ---------------------------------------------------------- | ---------------------------------------------------------- |
| [`ref-md-js-typescript`](../ref-md-js-typescript/SKILL.md) | Type safety and strictness rules for test and source files |
| `ref-md-js-react`                                          | React-specific hook/component testing context              |
| `ref-md-dev-coding-patterns`                               | Cross-cutting quality and Boy Scout expectations           |
