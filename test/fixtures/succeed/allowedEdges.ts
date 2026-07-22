// SUCCEED fixture — must produce ZERO ESLint findings and ZERO tsc errors.
// It exercises the config's *intentional allowances*: cases the shared config
// deliberately permits via rule overrides. If a dependency bump reverted one of
// those overrides (a rule suddenly firing on code we mean to allow), this file
// would start reporting findings and the rule-drift snapshot would fail.

// restrict-template-expressions: the config overrides the strict defaults to
// allow numbers and booleans in template literals (allowNumber/allowBoolean).
const meaningOfLife = 42;
const isTrue = true;
export const templateLiteral = `Example: ${meaningOfLife}-${isTrue}`;

// no-unused-vars / unused-imports: the config ignores names prefixed with `_`,
// including caught errors and destructured array holes.
export const usesUnderscoreArg = (_ignored: number, used: number) => used * 2;

export const toleratesCaughtError = () => {
  try {
    return JSON.parse('{}') as unknown;
  } catch (_error) {
    return null;
  }
};

const [, _second, third] = [1, 2, 3] as const;
export const usesThird = third;

// strict-boolean-expressions: an explicit boolean condition is fine (this is
// the correct form the fail-side strictBooleanExpressions fixture violates).
export const explicitBooleanCheck = (value: string | undefined) => {
  if (value !== undefined) {
    return value.length;
  }
  return 0;
};
