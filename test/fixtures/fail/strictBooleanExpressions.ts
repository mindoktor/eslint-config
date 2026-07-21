// Expected to trigger: @typescript-eslint/strict-boolean-expressions
// A nullable string used directly in a conditional is the canonical violation.
const maybe: string | undefined = process.env.MAYBE;

export const check = () => {
  if (maybe) {
    return 'truthy';
  }
  return 'falsy';
};
