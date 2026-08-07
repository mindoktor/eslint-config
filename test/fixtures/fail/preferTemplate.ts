// Expected to trigger: prefer-template
// String concatenation with a variable instead of a template literal.
export const greet = (name: string) => 'Hello, ' + name + '!';
