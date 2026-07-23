// Expected to trigger: react-hooks/rules-of-hooks
// A hook called conditionally violates the rules of hooks.
declare const useState: (v: number) => [number, (n: number) => void];

export const useThing = (enabled: boolean) => {
  if (enabled) {
    const [value] = useState(0);
    return value;
  }
  return 0;
};
