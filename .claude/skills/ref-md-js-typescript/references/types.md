# Types, Interfaces, and Zod

Read this file when writing TypeScript types, interfaces, lookup tables, type guards, or null checks.

---

## Interfaces Over Type Aliases for Object Shapes

Use `interface` for object shapes — it gives cleaner error messages and is erased at compile time with no runtime cost.

```ts
// Correct
interface UserProfile {
  id: number;
  name: string;
  email?: string;
}

// Avoid for object shapes
type UserProfile = {
  id: number;
  name: string;
};
```

Use `type` for unions, intersections, and aliases of primitives. For a closed set of string or numeric values, prefer a `const` object with a derived type — it gives you a runtime-accessible lookup table and a type in one declaration:

```ts
// Preferred for closed sets
export const Status = {
  Active: 'active',
  Inactive: 'inactive',
  Pending: 'pending',
} as const;
export type Status = Values<typeof Status>; // 'active' | 'inactive' | 'pending'

// Fine for open unions or primitive aliases
type Id = number;
type Direction = 'ltr' | 'rtl';
```

---

## Lookup Tables

For a closed set of named values, use a `const` object with `as const`.

```ts
// Preferred
export const OrderStatus = {
  Pending: 1,
  InProgress: 2,
  Finished: 3,
} as const;

// Derive the union type from the object
export type OrderStatus = Values<typeof OrderStatus>;
// → number (1 | 2 | 3)
```

The `Values` helper lives at a different import path per app — patient-app exposes it as the `@mindoktor/utils` workspace package, clinic-app as a tsconfig `@common/*` alias:

```ts
// patient-app (mindoktor-app)
import type { Values } from '@mindoktor/utils/types/objects';
// clinic-app (mindoktor)
import type { Values } from '@common/utils/objects';
```

Compare against the constant, never the raw string/number literal — this covers `===` checks and `switch` cases:

```ts
// Before — raw literals
if (status === 2) { ... }
switch (status) {
  case 1: ...
  case 2: ...
}

// After — constants
if (status === OrderStatus.InProgress) { ... }
switch (status) {
  case OrderStatus.Pending: ...
  case OrderStatus.InProgress: ...
}
```

A literal array used with `.includes()` narrows the argument type and can reject the wider union — rewrite as explicit `===` comparisons against the constants rather than casting:

```ts
// Before
[1, 2].includes(status)

// After
status === OrderStatus.Pending || status === OrderStatus.InProgress
```

---

## Infer Types from Zod When Possible

In the API layer, types are inferred from Zod schemas. Do not hand-write types that duplicate a schema.

```ts
// Correct — single source of truth
export const OrderSchema = z.object({
  id: z.number(),
  status: z.nativeEnum(OrderStatus),
});
export type Order = z.infer<typeof OrderSchema>;

// Avoid — duplicates the schema
export interface Order {
  id: number;
  status: OrderStatus;
}
```

`z.nativeEnum` accepts either a real `enum` or an `as const` object — so the `as const` lookup-table style above pairs with it directly, no `enum` required:

```ts
const OrderStatus = { Pending: 1, InProgress: 2 } as const;
z.nativeEnum(OrderStatus);
```

---

## Type Guards Over Assertions

Prefer runtime type guards over `as` assertions. Guards narrow the type for both the compiler and at runtime.

```ts
// Correct
if (typeof value !== 'string') {
  throw new Error('Expected string');
}
doSomethingWith(value); // narrowed to string

// Avoid — silences the compiler but does not validate at runtime
const value = someValue as string;
```

## Null Handling

`strict: true` enables `strictNullChecks`. Never widen a type to bypass null checks.

```ts
// Correct
if (user == null) return;
console.log(user.name); // safe

// Avoid
console.log(user!.name); // non-null assertion hides real bugs
```

---

## Representing Absent Values

Model absence explicitly — use `null` / `undefined`, never an empty string, `0`, or a sentinel standing in for "missing". Empty defaults hide missing data from the type system. (This is the TypeScript side of a cross-language principle — see `ref-md-dev-coding-patterns` for the rationale and the Go side.)

- **Parse external/route params with a validating helper** that returns `null` on invalid input — never `Number()`, which silently yields `NaN` or `0`. Use the project's `parseId` / `parseUUID`: `@common/utils/validation` in clinic-app, `packages/utils/strings/strings.ts` in patient-app.
- **For a broad emptiness check**, use the project's empty-value helper rather than ad-hoc truthiness — `isNonEmpty` / `isEmpty` (`@common/utils/emptyValues`) in clinic-app, or `isEmptyObject` (`packages/utils/objects/isEmptyObject.ts`, which treats an object as empty when every value is `null` or `''`) in patient-app. Each helper defines "empty" differently, so check its logic before relying on it.
- **At API boundaries, model absence in the schema** — `z.string().nullable()` or `.optional()` — instead of making a field always-present with a fallback empty value.
- For truthiness pitfalls (`0` / `''` are falsy) see [`low-hanging-fruit.md`](low-hanging-fruit.md) (§ strict-boolean-expressions); for exhaustive switches use `assertUnreachable` (below).

---

## Arrays and Objects Are Not Safe to Index

Treat direct indexing (`arr[i]`, `obj[key]`) as unsafe unless you have already proven the key/index exists.

Even when the code "usually works," unchecked indexing is a common source of `undefined` bugs.

```ts
// Risky: can be undefined at runtime
const first = users[0];
const statusLabel = statusLabels[status];
```

Preferred strategies:

1. Guard array access with length checks or bounds checks before indexing.
2. Prefer `Array.prototype.at()` when reading positional elements; it returns `T | undefined`, which forces handling.
3. Prefer `find`, `some`, `every`, `filter`, and `map` over manual index math when searching or transforming.
4. For object dictionaries, check with `Object.hasOwn(...)` before reading a dynamic key.
5. For key-value lookups with dynamic keys, prefer `Map` + `has`/`get` when feasible.
6. Use `for...of` or `Object.entries()` iteration instead of indexing when traversing collections.

```ts
const maybeUser = users.at(0);
if (maybeUser == null) return;

if (!Object.hasOwn(statusLabels, status)) {
  return 'Unknown';
}
const statusLabel = statusLabels[status];

const openCase = cases.find((currentCase) => currentCase.status === 'open');
if (openCase == null) return;
```

If your repository enables stricter indexed access checks, keep them enabled and fix call sites with explicit guards instead of widening types or adding assertions.

**Do not index with a fabricated fallback key.** `obj[id ?? '']` (or `obj[id || '']`) reads as "handled" but silently looks up a key that does not exist (`''`) when `id` is nullish — masking the real question of whether the entry is present. Guard the key explicitly instead:

```ts
// Before — meaningless '' lookup when id is missing
const label = labels[id ?? ''];

// After — guard the key, then look it up
if (id == null || !Object.hasOwn(labels, id)) {
  return 'Unknown';
}
const label = labels[id];
```

Writing to a fabricated key is occasionally intentional (a catch-all bucket) — if so, leave a comment saying why.

**Partial lookup map: prefer `Partial<Record<…>>` over an `as keyof typeof` cast.** When a map only has entries for *some* members of a key union, indexing it with the full union is a real `TS7053`. The usual `as keyof typeof obj` band-aid lies — it asserts the key always exists and silences the very `== null` check that handles the missing ones. Annotate the map as partial so indexing honestly yields `V | undefined`, and capture the result before the null check (re-indexing twice does not carry the narrowing):

```ts
// Before — cast asserts the key always exists
const transforms = { binary: ..., choice: ... }; // ~14 of ~25 node types
const fn = transforms[type as keyof typeof transforms];

// After
const transforms: Partial<Record<NodeType, (value: unknown) => unknown>> = {
  binary: ...,
  choice: ...,
};
const transform = transforms[type]; // (…) | undefined — honestly typed
if (transform == null) {
  return value;                      // member with no entry
}
return transform(value);
```

Note the `in` operator narrows the **object**, not the key: `if (key in obj)` does not narrow a wide `key` down to `keyof typeof obj`, so the `Partial<Record<…>>` annotation (not an `in` check) is what makes the index legal.

---

## Exhaustive Checks with `assertUnreachable`

Use `assertUnreachable` in `switch` statements to guarantee all cases are handled — the compiler errors if a new case is added without being covered. The import path is app-specific: `@mindoktor/utils/types/assertUnreachable` in patient-app, `@common/utils/assertUnreachable` in clinic-app.

```ts
// patient-app (mindoktor-app)
import { assertUnreachable } from '@mindoktor/utils/types/assertUnreachable';
// clinic-app (mindoktor)
import { assertUnreachable } from '@common/utils/assertUnreachable';

switch (status) {
  case OrderStatus.Pending: return handlePending();
  case OrderStatus.Finished: return handleFinished();
  default: assertUnreachable(status); // compile error if status has unhandled values
}
```
