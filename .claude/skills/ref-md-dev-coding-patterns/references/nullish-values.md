# Nullish Values over Empty Defaults

Use `null` / `undefined` (TypeScript) or `nil` + pointer types (Go) to represent absent values — not empty strings (`""`), zero (`0`), or sentinel values (`-1`). Empty defaults hide missing data from the type system and push detection to runtime; nullish types make the compiler catch it.

## Why

```ts
// With empty default — compiles, fails silently at runtime
const handleName = (name: string) => { ... };
const userName: string = dataIsMissing ? '' : 'John Doe';
handleName(userName); // TypeScript sees nothing wrong

// With nullish — compiler forces handling
const userName: string | undefined = dataIsMissing ? undefined : 'John Doe';
handleName(userName); // TS error: string | undefined is not assignable to string
```

The value of this scales with codebase size: every function downstream of the empty default silently accepts invalid data, while nullish propagates the constraint through the type system.

## When empty values are acceptable

Use empty defaults when the empty value is **semantically meaningful**, not a stand-in for "missing":

| Use case                   | Value   | Reason                                               |
| -------------------------- | ------- | ---------------------------------------------------- |
| Text input initial state   | `''`    | The user has entered nothing yet — that is the value |
| Counter starting from zero | `0`     | Zero is a valid count                                |
| Boolean flag default       | `false` | The flag is explicitly off                           |

The test: if the consumer needs to distinguish "absent" from "empty", use nullish. If they don't, an empty default is fine.

## TypeScript implications

The TypeScript mechanics — parsing to `null`, the empty-value helper, `strict-boolean-expressions`, Zod `.nullable()` / `.optional()`, and `assertUnreachable` — live in the `ref-md-js-typescript` skill (§ Representing Absent Values, plus its low-hanging-fruit). This file keeps only the cross-language principle and the Go side.

## Go implications

- Use `omitempty` / `omitzero` JSON struct tags when a field being absent is distinct from the zero value. If the zero value means "not provided", the field should be a pointer type with `omitempty` so the frontend receives `null` (or the field is omitted) rather than `""` or `0`.
- Example: a patient's middle name that was never entered should be `*string` with `omitempty`, not `string` defaulting to `""`.
- Conversely, if `0` or `""` is a valid domain value (e.g., a counter, a status code), keep the value type and do not use `omitempty`.
