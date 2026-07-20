---
name: ref-md-js-typescript
description: >-
  TypeScript conventions used across Mindoktor repos.
  Use when: writing TypeScript types, interfaces, lookup tables, type guards, null checks,
  declaring functions as const arrow functions, applying opportunistic fixes to existing code,
  taming `strict-boolean-expressions`, fixing deep relative imports, splitting type-only and
  value imports, or choosing a file type for a new runnable Node script.
  Covers strict mode rules, const arrow functions and their exceptions, Zod inference, import
  hygiene, workspace package imports, representing absent values, `.mts`-first for new Node
  scripts (runtime type-stripping), and low-hanging fruit.
metadata:
  author: mindoktor
  version: "1.15"
  shareable-skills.owner-prefix: "md"
  shareable-skills.owner: "mindoktor/agentic-tools"
  shareable-skills.domain: "js"
  shareable-skills.visibility: "organization"
  shareable-skills.requires: "ref-md-dev-coding-patterns"
  shareable-skills.vendored-sha: "a596295"
  shareable-skills.vendored-time: "2026-07-19"
---

# Mindoktor TypeScript Conventions

_Vendored from agentic-tools — edit the upstream skill there, not this copy; local edits are overwritten on re-vendor._

Read this file when writing or reviewing TypeScript in a Mindoktor repo.

This is the core language skill for both TypeScript and JavaScript work in Mindoktor repos. When working in `.js`/`.mjs`, use this skill first, then apply JavaScript-focused JSDoc guidance from [`references/low-hanging-fruit.md`](references/low-hanging-fruit.md).

## Scope

Covers TypeScript language conventions — types, strict mode, imports, Zod inference, and low-hanging fruit. For framework patterns see `ref-md-js-react`, `ref-md-js-mui`, `ref-md-js-redux`, `ref-md-js-tanstack-query`; for cross-cutting code quality see `ref-md-dev-coding-patterns`.

## Routing Table

| Task                                                           | Read                                                                 |
| -------------------------------------------------------------- | -------------------------------------------------------------------- |
| Types, interfaces, lookup tables, Zod inference, null handling | [`references/types.md`](references/types.md)                         |
| Opportunistic fixes when touching existing code                | [`references/low-hanging-fruit.md`](references/low-hanging-fruit.md) |
| Cross-cutting naming, comments, code organization              | `ref-md-dev-coding-patterns`                                         |

## Compiler Settings

Mindoktor TypeScript projects share a `tsconfig-base.json` (or equivalent) that targets `strict: true` and `noImplicitAny: true`. Some apps mid-migration gate CI on a laxer config (clinic-app's `typecheck:ci` runs against `tsconfig-lax.json`) — write new code to the strict rules regardless. Never weaken them per-file with `@ts-ignore` or `as any` without a justification comment.

Prefer constructs that are erased at compile time and produce no runtime output over constructs that generate JavaScript code.

### `import type` for type-only imports

Use `import type` whenever an import is used only in type annotations — it is erased at compile time and keeps module graphs clean. Choose the form by what the module brings in:

- **Type-only** → statement form `import type { X } from '...'`.
- **Mixed value + type** → one statement with the type specifiers marked inline: `import { value, type X } from '...'`.

```ts
import type { ApiResponse } from './requestHandler';    // type-only module — statement form
import { fetchCase, type Case } from '../models/cases'; // mixed value + type — inline form
```

Reach for the inline `type` modifier only when the same import also pulls a value; otherwise prefer the statement form. (eslint does not enforce `consistent-type-specifier-style`, so both forms pass lint — apply this by hand.)

> **React's own types are an exception**: reference them through the `React.` namespace (`React.FC`, `React.ReactNode`, `React.JSX.Element`) via `import type React from 'react'`, not named imports. See `ref-md-js-react`.

### Filename casing for JS / TS files

Use **camelCase** for JavaScript and TypeScript filenames when the file exports a named utility, helper, or script. Do not use dashed filenames like `path-utils.mjs` or `fetch-user.ts`; prefer `pathUtils.mjs` or `fetchUser.ts`.

When the file name is already scoped by its folder, prefer the shortest clear name. For example, inside `src/utils/`, `path.mjs` is better than `pathUtils.mjs`.

### JSDoc on throwing functions

When you add JSDoc to a TypeScript function that can throw, include an explicit `@throws` entry. Do not leave exceptional behavior implicit when the function is already documented.

This applies equally to `.ts`, `.mts`, `.js`, and `.mjs` files that use JSDoc-based typing or API documentation.

### Prefer erasable types over `enum` / `namespace`

For **new** code, prefer TypeScript constructs that are erased at compile time over ones that emit JavaScript: an `as const` object with `Values<T>` instead of `enum`, and ES module `import`/`export` instead of `namespace`. Emitting constructs (`enum`, `const enum`, `namespace`, a value-carrying `abstract class`) produce runtime output and resist tree-shaking (see [`references/types.md`](references/types.md)).

This is a forward-looking preference, not a ban on existing code. The codebases still contain live `enum`s — sometimes deliberately, e.g. a numeric `enum` fed to `z.nativeEnum(...)` at an API boundary. Apply the `as const` preference to new declarations; leave working enums alone unless you are already refactoring them.

### Prefer `.mts` for new runnable Node scripts

Modern Node runs TypeScript directly by stripping types at load — `node script.mts` executes with no ts-node/tsx loader (flagged `--experimental-strip-types` on Node 22.6+, on by default on 23.6+). So a CLI or utility script can be authored in real TypeScript — inline `interface`/`type`, typed parameters — and still run directly, which is cleaner than the `@typedef`/`@param {…}` JSDoc scaffolding an `.mjs` file needs to carry the same types.

For **new** runnable Node scripts, prefer `.mts` with real TypeScript over `.js`/`.mjs` + JSDoc. This is a forward preference, not a migration mandate: existing `.mjs`/JSDoc files stay as they are, and their JSDoc types remain the source of truth — matching the tone of the `enum`/`namespace` rule above.

The two rules converge. Type-stripping requires exactly the erasable constructs the rule above already prefers: a `.mts` script that must run under type-stripping cannot use `enum`, `const enum`, `namespace`, or a value-carrying `abstract class` (parameter properties), because those emit runtime code the stripper won't produce. So "prefer erasable constructs" is not only about tree-shaking — it is what keeps an `.mts` file runnable.

**Browser-eval'd source stays plain `.js`.** Source injected into a browser/page context and consumed as raw text — not imported as a module — must stay plain JavaScript with no type syntax and no module syntax, because nothing strips its types before it runs. (Concrete case: `mindoktor-testing`'s `src/common/interactions/*.js`, which `playwright-cli run-code` wraps and evaluates in the page.)

**Wiring the first `.mts` into a repo:** add `**/*.mts` to the tsconfig `include` so the file is typechecked, and point any runner or path alias at the `.mts` path.

## `const` Arrow Functions

Declare functions as `const` arrow functions unless there is a specific reason to use a `function` declaration:

```ts
// Correct
const formatDate = (date: string) => dayjs(date).format('YYYY-MM-DD');

// Avoid
function formatDate(date: string): string { ... }
```

**Legitimate exceptions** — keep `function` when:

- **Body uses `arguments`** — arrow functions have no `arguments` object; common in legacy evaluator/variadic helpers.
- **Self-referencing recursive IIFE** — arrow functions have no self-referencing name; `(function fn(n) { fn(c) })(root)` cannot be rewritten as an arrow.
- **Generator** — `function*` syntax has no arrow equivalent.
- **Hoisting required** — `function` declarations are hoisted; `const` is not.

Leave these as `function` declarations and add a brief comment explaining why if non-obvious to the next reader.

## Let TypeScript infer return types

Do not annotate return types when the compiler can infer them. Add an explicit return type only when inference is insufficient or misleading:

- **Type guard functions** — `(value: unknown): value is MyType`.
- **Overloaded signatures** — required by the language.
- **Public API contracts** where the inferred type would be too wide or unstable.
- **Self-referencing recursive functions** — inference falls back to `any`; annotate explicitly (see [`references/low-hanging-fruit.md`](references/low-hanging-fruit.md)).

```ts
// Correct — let inference do the work
const sum = (a: number, b: number) => a + b;

// Correct — type guard requires explicit annotation
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

// Avoid — redundant annotation
const sum = (a: number, b: number): number => a + b;
```

## Related Skills

| Skill                        | When to load                                                        |
| ---------------------------- | ------------------------------------------------------------------- |
| `ref-md-dev-coding-patterns` | Cross-cutting naming, comments, code organization, nullish defaults |
