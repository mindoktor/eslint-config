// SUCCEED mirror of fail/typeError.ts — must fire NOTHING (no tsc error).
// The value is well-typed for its declared type. A union annotation carries
// real information, so it doesn't trip no-inferrable-types the way a redundant
// `: number = 42` would.
const count: number | undefined = 42;

export { count };
