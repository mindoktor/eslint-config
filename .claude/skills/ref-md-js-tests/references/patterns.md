# Unit Test Patterns

## File Naming and Placement

- Co-locate tests near the code under test. The exact layout varies by app — flat alongside the source, or in a `__tests__/` subdirectory — so follow the convention the folder already uses.
- Default to `*.test.ts` / `*.test.tsx` — the measured standard ([why](test-vs-spec-naming.md)).
- Keep existing `*.spec.ts` naming only when a folder already uses it (mostly legacy code).

Examples — the two layouts, so neither reads as universal:

**Flat co-location** (patient-phoenix, from `mindoktor-app` — paths relative to `packages/apps/patient/phoenix/`):

- `auth/functions/tokenUtils.test.ts`
- `booking/hooks/useOpenBookingSession.test.ts`
- `messaging/components/Composer/MediaPreview/utils.spec.ts`

**`__tests__/` subdirectory** (clinic-app, from `mindoktor/CLINIC_APP` — paths relative to `src/`; this is clinic's dominant layout):

- `api/dashboard/__tests__/useCasesClosedVnext.test.ts`
- `api/nll/__tests__/schemas.test.ts`
- `common/utils/__tests__/displaySex-test.ts` (older dash-variant name)

> **Per-app test setup** — path-alias config, run commands, and any enforced placement (e.g. a required `__tests__/` subdirectory) — lives in the skill named after the app you're working in (its hub skill, typically a `references/testing.md`). This file is the cross-app baseline.

## Baseline Structure

Use a clear `describe` + `it` structure:

```ts
describe('decodeTokenClaims', () => {
  it('returns undefined for an empty string', () => {
    expect(decodeTokenClaims('')).toBeUndefined();
  });
});
```

Keep test names behavior-focused: what happens and under which input/condition.

## Mocking Strategy

- Mock external dependencies with `jest.mock(...)`.
- Use `jest.mocked(...)` for typed mocked values/functions.
- Reset or clear mocks between test cases (`jest.clearAllMocks()`).

```ts
jest.mock('./useCreateBookingSessionMutator', () => ({
  useCreateBookingSessionMutator: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});
```

## Mocking Time

When the code under test reads "now" from the system clock, pin it with fake timers (recommended); always restore real timers in `afterAll`:

```ts
const NOW = new Date('2024-06-15T12:00:00Z');

beforeAll(() => {
  jest.useFakeTimers().setSystemTime(NOW);
});

afterAll(() => {
  jest.useRealTimers();
});
```

Reach for fake timers only when the code reads the clock itself. When a function instead **takes the date as an argument**, just pass a fixed `Date` — no fake timers needed, and it reads more clearly. Some parts of the codebase rely entirely on fixed date args and use no fake timers at all, so don't assume the fake-timer setup is already in place.

## Date libraries and the fake clock

Date libraries read the system clock, so the fake timer above covers code that reads "now". The two frontends use different libraries — see the per-library reference for setup details: [`dayjs`](dayjs.md) (clinic) and [`date-fns`](date-fns.md) (patient).

## Testing Hooks

Two approaches, depending on whether the package renders to the DOM and carries `@testing-library/react`:

**With `@testing-library/react`** — for hooks that depend on TanStack Query, render them with `renderHook` inside a `QueryClientProvider` (disable retries so failures surface immediately):

```ts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: React.PropsWithChildren) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { Wrapper, queryClient };
};
```

**Without a renderer** — some packages have no `@testing-library/react` (a React Native app/package, or a util package). There, test a hook by **mocking its dependencies (e.g. `jest.mock('@tanstack/react-query')`) and calling it directly**, asserting on what it wires up — no `renderHook`. Which approach a package uses is per-app — see the skill named after your app.

## What to Test

Prioritize:

1. Pure utility functions (input/output behavior)
2. Hook orchestration logic (branching and side effects at boundaries)
3. Parsing/validation/error handling paths

Do not prioritize:

- Snapshot-heavy tests for simple pure logic
- Re-testing third-party library behavior
- Assertions on private internals when public behavior already proves correctness

## Maintenance Rules

- If behavior changes, update tests in the same PR.
- If a bug was fixed, add a regression test covering the bug path.
- Keep fixtures minimal and local to the test file unless reused by multiple tests.
