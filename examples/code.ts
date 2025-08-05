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
  return x * 2;
};

const funcUsingAwaitedAsync = async () => {
  const result = await myAsyncFunction(5);
};

const funcUsingNonAwaitedAsync = () => {
  const promiseResult = myAsyncFunction(10);
};

const funcUsingNonAwaitedAsyncSideEffect = () => {
  myAsyncFunction(15);
}