// Example code snippet demonstrating ESLint configuration

const c = 5;

const _obj = {
  a: 1,
  b: 2,
  c: c,
};

const _myFunction = (x: number) => {
  return x * 2;
};

const myAsyncFunction = async (x: number): Promise<number> => {
  return await Promise.resolve(x * 2);
};

const _funcUsingAwaitedAsync = async () => {
  const _result = await myAsyncFunction(5);
};

const _funcUsingNonAwaitedAsync = () => {
  const _promiseResult = myAsyncFunction(10);
};

const _funcUsingNonAwaitedAsyncSideEffect = () => {
  void myAsyncFunction(15);
};

const meaningOfLife = 42;
const isTrue = true;

const _templateLiteral = `Example: ${meaningOfLife}-${isTrue}`;
