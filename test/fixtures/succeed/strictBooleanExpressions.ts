// SUCCEED mirror of fail/strictBooleanExpressions.ts — must fire NOTHING.
// The nullable value is compared explicitly rather than used as a bare
// conditional, satisfying @typescript-eslint/strict-boolean-expressions.
const maybe: string | undefined = process.env.MAYBE;

export const check = () => {
  if (maybe !== undefined) {
    return 'set';
  }
  return 'unset';
};
