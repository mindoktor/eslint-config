# Mocking dates in tests — date-fns (patient-phoenix)

Patient-phoenix (`packages/apps/patient/phoenix/`) uses `date-fns`; legacy patient code and clinic-app use `dayjs` (see [`dayjs.md`](dayjs.md)). `date-fns` functions are **pure** and take an explicit `Date` argument, so most date logic needs no mocking — pass a fixed date:

```ts
import { format } from 'date-fns';

expect(format(new Date('2024-06-15T12:00:00Z'), 'yyyy-MM-dd')).toBe('2024-06-15');
```

- **Do not** `jest.mock('date-fns')` — mock whatever *produces* the date (or the clock), not the pure formatter.
- When the code under test reads the system clock itself (`new Date()`, `Date.now()`), pin it with fake timers — see [Mocking Time](patterns.md#mocking-time). `date-fns` then reads the controlled clock with no extra setup.
- Import named functions (`import { addDays } from 'date-fns'`) for tree-shaking. date-fns has no plugin-registration step (unlike dayjs).
