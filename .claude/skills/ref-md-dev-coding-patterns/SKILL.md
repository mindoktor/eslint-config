---
name: ref-md-dev-coding-patterns
description: >-
  Cross-cutting coding conventions used across Mindoktor repos
  (TypeScript / React / React Native, Python, and Go where relevant).
  Use when: writing or reviewing code, naming variables or functions,
  deciding whether to add a comment, cleaning up code you touched,
  or organizing files and functions, or deciding whether to imitate the
  surrounding code or follow a documented convention. Covers naming, comments,
  Boy Scout Rule, documented-convention-beats-local-imitation, code organization,
  composition over inheritance, and nullish-vs-empty defaults.
metadata:
  author: mindoktor
  version: "1.11"
  shareable-skills.owner-prefix: "md"
  shareable-skills.owner: "mindoktor/agentic-tools"
  shareable-skills.domain: "dev"
  shareable-skills.visibility: "organization"
  shareable-skills.vendored-sha: "5774e76"
  shareable-skills.vendored-time: "2026-07-16"
---

# Mindoktor Coding Patterns

_Vendored from agentic-tools — edit the upstream skill there, not this copy; local edits are overwritten on re-vendor._

Cross-cutting conventions that apply to code across Mindoktor repos — TypeScript, React, React Native, Python, Go, shell scripts, and configuration files.

These rules are language-agnostic. For TypeScript-specific guidance (types, imports, low-hanging fruit), load `ref-md-js-typescript`; for Python-specific guidance (Pyright strict typing, structure, testing), load `ref-md-py-python`.

## Scope

Covers how to **write and shape code you are editing**: naming, comments, the Boy Scout Rule, code organization, composition over inheritance, and nullish-vs-empty defaults.

Does **not** cover:

- Git, commits, pull requests, reviews, CI → the `ref-md-dev-workflow` skill
- Language- or framework-specific deep-dives → `ref-md-js-typescript` and the other `ref-md-js-*` skills

## Quick Routing (Progressive Discovery)

| If your task is...                           | Read first                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| Improve naming or function readability       | [Naming](#naming)                                                         |
| Decide whether to add/remove a comment       | [Comments](#comments)                                                     |
| Apply cleanup while already editing a file   | [Boy Scout Rule](#boy-scout-rule)                                         |
| Refactor structure of a long/complex file    | [Code Organization](#code-organization)                                   |
| Share behavior without a class hierarchy     | [Composition over Inheritance](#composition-over-inheritance)             |
| Handle absent values without masking bugs    | [Nullish Values over Empty Defaults](#nullish-values-over-empty-defaults) |
| TypeScript types, imports, low-hanging fruit | `ref-md-js-typescript`                                                    |
| Maintain `cSpell.words` in any repo          | [Spell Checking](#spell-checking-cspellwords)                             |

## Recommended Read Order

1. Apply [Naming](#naming) and [Comments](#comments) rules first (always-on baseline).
2. Apply [Boy Scout Rule](#boy-scout-rule) and [Code Organization](#code-organization) when touching existing code.
3. Use [Nullish Values over Empty Defaults](#nullish-values-over-empty-defaults) for data modeling and API boundary decisions.

| Topic                                               | Read                                                           |
| --------------------------------------------------- | -------------------------------------------------------------- |
| Nullish values vs. empty defaults (TypeScript + Go) | [`references/nullish-values.md`](references/nullish-values.md) |

## Naming

| What                                         | Why                                                                                                            | When                                                                                                                                                   |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Prefer clear, complete names                 | Readable code reduces cognitive load for reviewers                                                             | Every variable, function, type, and file                                                                                                               |
| Abbreviate only universally understood terms | Uncommon abbreviations force readers to guess                                                                  | `err`, `ctx`, `req`, `res`, `id`, `db` are fine                                                                                                        |
| Name booleans as questions                   | `isActive` reads naturally in conditionals                                                                     | Boolean variables and function return values                                                                                                           |
| Name functions after what they do            | Action verbs make call sites self-documenting                                                                  | All functions and methods                                                                                                                              |
| Use camelCase for JS/TS filenames            | Dashed filenames (`path-utils.mjs`) are inconsistent with symbol naming and make utility files noisier to scan | JavaScript / TypeScript files and scripts — except React component files, which are PascalCase after the component (`CaseActionList.tsx`)              |
| Use neutral names for meaningless values     | `t, u` imply a meaning that isn't there; `a, b` honestly signal position-only                                  | Comparator/positional params and throwaway locals with no domain meaning (conversely, name a real value for what it is: `patchVersion`, not `version`) |
| Reserve plural names for collections         | A plural (`cases`, `authors`) reads as a list/slice/array; a single value named plural misleads the reader     | Any single value — name a dependency or collaborator by its role (`caseGetter`, `userGetter`), not a plural noun                                       |
| Avoid shadowing an outer name                | A reused name hides the enclosing binding and invites referring to the wrong one                               | Any nested scope reusing an enclosing parameter/variable name — rename the inner (not consistently lint-enforced; apply deliberately)                  |

## Comments

A good comment **ages like wine, not milk**: it stays true long after the PR is merged. Before writing one, ask whether it will still be accurate and useful in a year — if it only holds for the length of the review, it belongs in the PR description, not the code.

| What                                                        | Why                                                                                                                                 | When                                                                       |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Code should explain itself                                  | Comments that restate logic drift from the code and mislead                                                                         | Always — default to no comment                                             |
| Reserve comments for business reasons                       | "Why" is not visible in the code; "what" usually is                                                                                 | Regulatory rules, domain quirks, workarounds                               |
| Keep comments crisp                                         | A long-winded comment gets skimmed past; a dense one gets read                                                                      | Every comment — if one line says it, use one line                          |
| Write for the next reader, not the reviewer                 | Review-scoped notes ("changed per feedback", "TODO before merge", "replaces the old approach") are stale the moment the PR merges   | Keep review context in the PR thread; keep only the durable "why" in code  |
| Mind how it reads, not just what it states                  | A true fact in review-relative or apologetic terms ("hacky", "temporary", "for now", "we used to") reads as wrong even when correct | Phrase every comment as a standing statement about the code as it is today |
| Do not add comments to code you did not change              | Unsolicited comment passes create noise in PRs                                                                                      | Unless fixing a factual error in the comment                               |
| When adding JSDoc to a throwing function, include `@throws` | Callers should see exceptional behavior at the call site instead of discovering it from implementation details                      | JavaScript / TypeScript functions documented with JSDoc                    |

## Boy Scout Rule

Leave code better than you found it — scoped to the same file or small, closely related files (e.g., a component and its direct consumers).

| What                                                   | Why                                                  | When                                                                       |
| ------------------------------------------------------ | ---------------------------------------------------- | -------------------------------------------------------------------------- |
| Fix lint warnings in files you are already editing     | Keeps the codebase from accumulating low-level debt  | Every change — not optional                                                |
| Add or update unit tests for testable behavior changes | Prevents regressions and keeps future refactors safe | When business logic, parsing, transformations, or command behavior changes |
| Fix outdated patterns in the same file                 | Prevents "broken windows" effect                     | When the fix is small and obvious                                          |
| Do not cascade into unrelated parts of the codebase    | Boy Scout scope must stay reviewable                 | Always — if the cleanup needs its own PR, stop                             |

For TypeScript-specific low-hanging fruit (braceless `if`, `any`, non-null assertions, deep relative imports, barrels, etc.), see the `low-hanging-fruit` reference in `ref-md-js-typescript`.

## Documented Convention Beats Local Imitation

Agents are told to write code that reads like its neighbors — and that instinct is usually right. But it is **conditional, not primary**: the documented convention (the matching `ref-md-*` skill) is the source of truth, and imitation is only valid **when the surrounding code already conforms to it**. Imitating a stale neighbor propagates the drift the skills exist to prevent — and CI often will not catch it (many conventions, e.g. the `React.FC<Props>` template, are not lint-enforced).

| What                                                              | Why                                                                                                      | When                                                                                   |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Load the matching stack skill **before** writing code in its area | The skill is the source of truth; deciding a self-contained feature "doesn't need it" is the usual miss  | Before writing a component, hook, query, style block, etc. — not after review flags it |
| Match neighbors **only if** they conform to the skill             | A folder can hold old and new patterns side by side; the nearest structural sibling may be the stale one | Every time you model new code on existing code                                         |
| When skill and neighbor disagree, follow the **skill**            | The documented pattern is the default; a divergent neighbor is not a template                            | Any disagreement between a loaded skill and the surrounding code                       |
| Treat the divergent neighbor as a **Boy-Scout candidate**         | It is drift to fix (in scope), not a convention to copy                                                  | When you notice a neighbor diverges — see [Boy Scout Rule](#boy-scout-rule)            |

## Code Organization

| What                                                     | Why                                                                                                                                                           | When                                                                                                                                                                                                            |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep functions focused on one responsibility             | Smaller functions are easier to test, read, and name                                                                                                          | Always — extract when a function does two unrelated things                                                                                                                                                      |
| Extract when logic is reused, not preemptively           | Premature abstraction creates indirection without value                                                                                                       | Only when the same logic appears in 2+ places                                                                                                                                                                   |
| Don't dismiss dedup on signature mismatch alone          | Two functions doing the same thing with different signatures are still duplicates — a thin adapter (split a string, wrap in an object) bridges them trivially | Always — read both implementations before deciding                                                                                                                                                              |
| Avoid deeply nested conditionals                         | Flat code is easier to follow                                                                                                                                 | Use early returns or guard clauses to flatten                                                                                                                                                                   |
| Keep files under ~300 lines                              | Long files signal mixed responsibilities                                                                                                                      | Split when a file covers multiple unrelated concerns                                                                                                                                                            |
| Delete code that doesn't earn its place                  | Pass-through wrappers, redundant guards, and speculative (YAGNI) code add surface without value                                                               | Prefer removing over keeping when something only forwards a call, re-checks an already-guaranteed invariant, or exists "just in case"                                                                           |
| Split a utils/helpers file that mixes unrelated concerns | A grab-bag collects unrelated responsibilities and resists discovery                                                                                          | A `utils`/`helpers` file accumulates unrelated functions — split by concern (e.g. `access`, `params`). A feature-scoped `utils` of cohesive helpers is fine; the smell is mixing unrelated things, not the name |

## Composition over Inheritance

Build behavior by assembling small, independent pieces; reach for inheritance (`extends`, deep class hierarchies) only when a framework genuinely requires it. Inheritance couples a subtype to a base's internals and resists change, whereas composed pieces stay testable and recombine freely.

The Pulse component library (`mindoktor-app/packages/pulse`) is the reference example. Three patterns recur:

| Pattern                      | What it looks like                                                                      | Pulse example                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Compound components          | A parent exposes sub-components arranged as `children`, not configured by many props    | `BottomSheet` + `BottomSheetHeader` / `BottomSheetContent` / `BottomSheetActions` |
| Wrap a primitive             | A higher-level component renders a configured lower-level one — it does not subclass it | `Card` renders a styled `Stack`                                                   |
| Extract behavior into a hook | Shared logic lives in a hook components consume, not in a base class                    | `PillGroup` gets keyboard navigation from `useRadioGroupKeyboard`                 |

`Card` composing `Stack` rather than extending it:

```tsx
const Card: React.FC<CardProps> = ({ children, padding = 1, ...props }) => (
  <Stack padding={padding} borderRadius={props.borderRadius ?? 0.5} shadowVariant="default" {...props}>
    <Stack>{children}</Stack>
  </Stack>
);
```

The principle is language-agnostic: in Go, embed and compose small interfaces and structs instead of deep type hierarchies; in Python, prefer small collaborators and `Protocol`s over inheritance chains.

## Nullish Values over Empty Defaults

Use `null` / `undefined` (TypeScript) or `nil` + pointer types (Go) to represent absent values — not empty strings, zero, or sentinel values. Empty defaults hide missing data from the type system. See [`references/nullish-values.md`](references/nullish-values.md) for the full rationale, acceptable exceptions, and language-specific implications.

## Spell Checking (`cSpell.words`)

When adding entries to `cSpell.words` in any repo's `.vscode/settings.json`:

| What                                     | Why                                                                                  | When                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Keep the array in **alphabetical order** | Prevents duplicates and keeps diffs reviewable                                       | Every time an entry is added or removed                                                          |
| Use the **lowercase form**               | Library names, tool names, and domain terms are written lowercase in code            | Always — uppercase only for words that are genuinely uppercase in the codebase (e.g. `EFRIKORT`) |
| Add only **meaningful technical terms**  | Misspellings and one-off abbreviations pollute the list and defeat the spell checker | Library names, tool names, domain vocabulary, and well-known abbreviations                       |

**Low-hanging fruit:** when you encounter a `cSpell.words` array that is unsorted, contains non-lowercase words, or is missing a technical term you know belongs there — fix it as a Boy Scout pass. No dedicated PR needed; fold it into the commit that touched the related file.

## Related Skills

| Skill                  | When to load                                                           |
| ---------------------- | ---------------------------------------------------------------------- |
| `ref-md-js-typescript` | TypeScript-specific conventions, types, and low-hanging fruit          |
| `ref-md-js-tests`      | Test structure, naming, date-lib mocking patterns for JS/TS code       |
| `ref-md-py-python`     | Python-specific conventions: Pyright strict typing, structure, testing |
