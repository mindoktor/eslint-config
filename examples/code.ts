/* eslint-disable @typescript-eslint/no-unused-vars */
// Example code snippet demonstrating ESLint configuration

const c = 5;

const obj = {
  a: 1,
  b: 2,
  c: c,
};

const myFunction = (x: number) => {
  return x * 2;
};

const myAsyncFunction = async (x: number): Promise<number> => {
  return await Promise.resolve(x * 2);
};

const funcUsingAwaitedAsync = async () => {
  const _result = await myAsyncFunction(5);
};

const funcUsingNonAwaitedAsync = () => {
  const promiseResult = myAsyncFunction(10);
};

const funcUsingNonAwaitedAsyncSideEffect = () => {
  void myAsyncFunction(15);
};

const meaningOfLife = 42;
const isTrue = true;

const templateLiteral = `Example: ${meaningOfLife}-${isTrue}`;
