# Low-Hanging Fruit

Read this file when touching existing TypeScript code and looking for opportunistic improvements.

Apply these fixes to code you are **already reading or modifying**. Do not make separate passes over untouched files.

---

## Braceless `if` Statements

```ts
// Before
if (condition) doSomething();

// After
if (condition) {
  doSomething();
}
```

---

## Replace `any` with a Precise Type

```ts
// Before
const handleResponse = (data: any) => { ... };

// After
const handleResponse = (data: ApiResponse<CasesResponse>) => { ... };
```

When the shape is genuinely unknown, prefer `unknown` over `any` — it forces you to narrow before using it.

```ts
// Better than any — forces narrowing
const handleUnknown = (data: unknown) => {
  if (typeof data === 'string') {
    console.log(data.toUpperCase());
  }
};
```

---

## Replace `function` Declarations with `const` Arrow Functions

```ts
// Before
function formatName(first: string, last: string): string {
  return `${first} ${last}`;
}

// After
const formatName = (first: string, last: string): string => `${first} ${last}`;
```

Keep `function` only for the [legitimate exceptions](../SKILL.md#const-arrow-functions) — `arguments`, self-referencing recursive IIFEs, generators, and hoisting.

---

## Default Export → Named Export (Non-Component Values)

Utilities, hooks, and other non-component values use **named** exports — never `export default function helper()`. Named exports keep import names consistent and greppable.

```ts
// Before
export default function formatName(first: string, last: string) { ... }

// After
export const formatName = (first: string, last: string) => { ... };
```

React components are the exception — they use default exports; see `ref-md-js-react`.

---

## Non-Null Assertion (`!`) → Proper Guard

```ts
// Before
console.log(user!.name);

// After
if (user == null) return;
console.log(user.name);
```

---

## `as` Assertion → Type Guard

```ts
// Before
const id = (event.target as HTMLInputElement).value;

// After — when the type can be verified
if (!(event.target instanceof HTMLInputElement)) return;
const id = event.target.value;
```

---

## Missing `import type` on Type-Only Imports

```ts
// Before
import { Case } from '../models/cases'; // only used in annotations

// After
import { type Case } from '../models/cases';
```

When every binding in an import is a type, hoist it to a dedicated `import type` statement so the line is erased entirely at compile time:

```ts
// Before — inline keyword, still emits a runtime import line
import { type Case } from '../models/cases';

// After — whole statement erased
import type { Case } from '../models/cases';
```

When the same module gives you both values and types, split them onto separate lines instead of mixing `type` inline. Splitting lets the type-only line be erased cleanly and avoids confusing bundlers:

```ts
// Before — inline type keyword
import { type Theme, Box } from '@mui/material';

// After — separate statements
import type { Theme } from '@mui/material';
import Box from '@mui/material/Box';
```

---

## Deep Relative Imports → Aliased Imports

Replace deep relative imports (`../../..` or deeper) with the app's stable aliased path — stable when files move and easier to read. **Which alias depends on the app**, so check what the app actually provides before rewriting:

- **patient-app (mindoktor-app)** — `@mindoktor/*` Yarn **workspace package names** (`@mindoktor/utils`, `@mindoktor/api`, …), resolved through the monorepo's workspaces and `transpilePackages`. Crossing a *package* boundary.
- **clinic-app (mindoktor)** — has **no** `@mindoktor/*` packages; it uses tsconfig `paths` aliases for its own `src/` (`@common/*`, `@state/*`, `@api/*`, `@components/*`, …). Crossing a *directory* boundary within one app.

```ts
// Before — fragile, breaks when the file is moved
import { useSomething } from '../../../../utils/useSomething';
import type { Values } from '../../../../../utils/types/objects';

// After (patient-app) — workspace package name
import { useSomething } from '@mindoktor/utils/useSomething';
import type { Values } from '@mindoktor/utils/types/objects';

// After (clinic-app) — tsconfig path alias
import type { Values } from '@common/utils/objects';
```

Relative imports are fine for same-directory or one level up (`./helpers`, `../types`). Reach for the aliased import as soon as the chain hits two or more `..`.

---

## Barrel `index.ts` Files → Direct Imports

```ts
// Before
import { useCasesApi } from '../cases'; // imports from a barrel index

// After
import { useCasesApi } from '../cases/hooks/useCasesApi';
```

Remove `index.ts` files you encounter and update callers to import from the specific file. Never create new barrel files.

---

## `Values` Helper Instead of Manual Union Extraction

```ts
// Before
type Direction = 'UP' | 'DOWN'; // duplicates the const object

// After (import path is app-specific — see "Deep Relative Imports" above)
import { type Values } from '@mindoktor/utils/types/objects'; // patient-app
// import { type Values } from '@common/utils/objects';       // clinic-app
export type Direction = Values<typeof Direction>;
```

---

## Implicit Boolean Coercion (`strict-boolean-expressions`)

`@typescript-eslint/strict-boolean-expressions` flags conditions that rely on JavaScript's truthiness rules. The fix depends on the type — pick the form that matches your intent.

**Nullable boolean** — `undefined` sneaks through as falsy:

```ts
// Before
if (isActive) { ... }

// After — explicit
if (isActive === true) { ... }
// or, if false and undefined should behave the same:
if (isActive != null && isActive) { ... }
```

**Nullable string** — `''` and `undefined` are both falsy, but they often mean different things:

```ts
// Before
if (name) { ... }

// After — choose based on intent
if (name != null && name !== '') { ... } // exclude both nullish and empty
if (name != null) { ... }                // exclude only nullish, allow ''
```

**Nullable number** — especially dangerous because `0` is falsy:

```ts
// Before — 0 is a valid value but treated as falsy
if (caseId) { ... }

// After — explicit nullish check preserves 0
if (caseId != null) { ... }
```

**`any` in a conditional** — fix the type first, then apply the appropriate pattern above. If the type is genuinely unknown, narrow explicitly.

**Object always truthy** — the condition is pointless; remove it or check what was actually intended (e.g., a property on the object).

**Split null/undefined check** — collapse `x === undefined || x === null` to `x == null` (and the negation to `x != null`). `== null` matches both `null` and `undefined` and nothing else, so it is exact, not a weak-truthiness shortcut.

These rules apply to inline JSX render guards too — `!!` is not an exception. Pick the form by type exactly as for an `if` condition:

```tsx
// Before — !! to coerce for conditional rendering
{!!description && <Box>{description}</Box>}
{!!warn && <WarningBar />}

// After
{description != null && description !== '' && <Box>{description}</Box>} // nullable string
{warn === true && <WarningBar />}                                       // nullable boolean
```

---

## Nested `if`/`else` → Early Returns

Guard against bad cases first, then keep the happy path flat.

```ts
// Before — nested, happy path buried
const formatLabel = (data: Data | null): string => {
  if (data != null) {
    if (data.items.length > 0) {
      return data.items.join(', ');
    } else {
      return 'Empty';
    }
  } else {
    return 'Loading';
  }
};

// After — guard clauses first, happy path last
const formatLabel = (data: Data | null): string => {
  if (data == null) {
    return 'Loading';
  }
  if (data.items.length === 0) {
    return 'Empty';
  }
  return data.items.join(', ');
};
```

---

## Unused Imports and Variables

Remove them. ESLint catches most, but occasionally dead imports survive — clean them up when you see them in a file you are already editing.

---

## Recursive Functions Need an Explicit Return Type

A function that references itself in a return position (directly or via a mutually-recursive helper) cannot have its return type inferred — TypeScript reports `TS7023` / `TS7024` and falls back to `any`. Annotate the return type explicitly.

```ts
// Before — TS7023: implicit any return
const getNode = (node: Node, index: string) => {
  if (node.index === index) {
    return node;
  }
  return node.children?.map((child) => getNode(child, index)).find(Boolean);
};

// After — annotate the return type
const getNode = (node: Node, index: string): Node | undefined => { ... };
```

---

## Inline Date Formatting → Shared Date Helper

Don't hardcode date format strings or locale logic inline — use the project's locale-aware date helper so formatting and locale stay consistent:

- clinic-app: `dateTimeFormats` constants from `@common/utils/format` (dayjs).
- patient-app: `useDate()` → `formatDate` / `formatShortDate` from `packages/localization/src/hooks/useDate.ts` (date-fns).

```ts
// Before — inline format string, no shared locale handling
dayjs(date).format('YYYY-MM-DD');
```

---

## Stray `console.log` Statements

Remove `console.log` calls left from debugging. If a log has permanent value, convert it to proper logging (Sentry or the project's logger) rather than leaving raw `console.*` calls behind.

---

## Plain Comments on Exports → JSDoc

Comments that describe an exported function, variable, or constant should use JSDoc (`/** */`) so they appear in VS Code hover tooltips at call sites. Plain `//` comments are invisible outside the file.

When the exported function can throw, include an explicit `@throws` entry in the JSDoc so callers can see that behavior at the call site.

Keep plain `//` comments for **implementation details inside a function body** — those are only useful when reading the source, not when calling the function.

```ts
// Before — invisible at call sites
// Formats and validates the SSN to YYYYMMDD-XXXX.
export const formatSsn = (val: string) => { ... };

// After — appears in hover tooltips
/** Formats and validates an SSN to YYYYMMDD-XXXX. */
export const formatSsn = (val: string) => { ... };

/**
 * Validates the payload before saving.
 * @throws {ValidationError} When the payload is invalid.
 */
export const savePayload = (payload: Payload) => { ... };
```

Implementation details stay as plain comments:

```ts
export const formatDateOfBirth = (dateOfBirth: string) => {
  // Treat date of birth as UTC so the date is the same in all timezones.
  return dayjs.utc(dateOfBirth).format('L');
};
```

**Strip redundant JSDoc types in TypeScript.** JSDoc should describe *purpose*, not restate types the compiler already provides. When JSDoc carries `@param {type}` / `@returns {type}` tags on TypeScript code, drop the `{type}` — and drop the whole tag when it adds nothing beyond the signature:

```ts
// Before — JSDoc restates types TypeScript already knows
/**
 * @param {number} id - The case id
 * @returns {Promise<Case>} The case
 */
const getCase = async (id: number) => { ... };

// After — keep only what the signature does not say
/** Fetches full case details, including journal entries. */
const getCase = async (id: number) => { ... };
```

This applies to TypeScript (`.ts` / `.tsx`) only. In legacy `.js` / `.mjs` files the JSDoc types **are** the source of truth — keep them (see the legacy `.js` section below).

---

## JSDoc `@import` for Legacy `.js` Files

When a `.js` file is too large or too risky to convert to TypeScript, add JSDoc types in place. Use the `@import` form to bring types into scope — it is shorter and supported by the TypeScript checker that runs on `.js` files.

When a documented function can throw, include `@throws` in the JSDoc alongside the parameter and return type information.

**Bring types into scope with `@import`**, not `@typedef` indirection:

```js
// Before — verbose, every type needs its own redeclaration
/** @typedef {import('../types').AppDispatch} AppDispatch */
/** @typedef {import('../types').GetState} GetState */

// After — single import line, types usable directly
/** @import { AppDispatch, GetState } from '../types'; */
```

**Type function parameters inline:**

```js
/** @import { AppDispatch, GetState } from '../types'; */

export const fetchSomething =
  (caseId) =>
  async (
    /** @type {AppDispatch} */ dispatch,
    /** @type {GetState} */ getState
  ) => {
    const state = getState();
    // ...
  };
```

```js
/** @import { ValidationError } from '../errors'; */

/**
 * Parses the user-provided JSON settings.
 * @param {string} rawSettings
 * @throws {ValidationError} When the JSON is invalid.
 */
export const parseSettings = (rawSettings) => {
  return JSON.parse(rawSettings);
};
```

**Annotate non-trivial values** so type narrowing works:

```js
/** @import { AppState } from './types'; */

/** @type {AppState} */
const initialState = {
  ready: false,
  online: undefined,
};
```

Rules:

- Prefer `@import { … } from '…'` over `@typedef {import('…').Name} Name`.
- Do not use inline `/** @type {import('…').Name} */` more than once for the same type — `@import` it at the top.
- Convert pre-existing `@typedef`-with-`import` indirection to the `@import` form when you encounter it (Boy Scout fix).
- If a documented function throws, add `@throws` to the JSDoc rather than leaving the failure mode implicit.
