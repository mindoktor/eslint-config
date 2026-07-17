# Mocking dates in tests — dayjs (clinic-app + legacy patient)

`dayjs` is used in clinic-app and in **legacy patient** code (under `packages/apps/patient/legacy/`); patient-phoenix uses `date-fns` instead (see [`date-fns.md`](date-fns.md)). For pinning the clock, see [Mocking Time](patterns.md#mocking-time): dayjs reads the system clock, so `jest.useFakeTimers().setSystemTime(...)` controls it — there is no dayjs-specific *time* mock to add.

## Plugins are not auto-registered in isolated tests

The app registers dayjs plugins once at startup, but an isolated test file does not run that setup. Extend the plugins the code under test needs, per test file:

```ts
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
```

A missing plugin shows up only in the test, as a runtime error like `dayjs(...).utc is not a function`. Add an `extend` call for each plugin the tested code relies on.
