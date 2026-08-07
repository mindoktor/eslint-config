// SUCCEED mirror of fail/preferTemplate.ts — must fire NOTHING.
// A template literal instead of string concatenation satisfies prefer-template.
export const greet = (name: string) => `Hello, ${name}!`;
