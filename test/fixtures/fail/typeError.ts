// Expected to trigger (tsc): TS2322 — string is not assignable to number.
// This fixture pins the strict typechecking behavior, independent of ESLint.
const count: number = 'not a number';

export { count };
