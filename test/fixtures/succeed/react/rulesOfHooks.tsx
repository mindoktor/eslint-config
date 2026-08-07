// SUCCEED mirror of fail/react/rulesOfHooks.tsx — must fire NOTHING.
// The hook is called unconditionally at the top of the custom hook, satisfying
// react-hooks/rules-of-hooks.
declare const useState: (v: number) => [number, (n: number) => void];

export const useThing = (enabled: boolean) => {
  const [value, setValue] = useState(0);
  if (enabled) {
    setValue(1);
  }
  return value;
};
