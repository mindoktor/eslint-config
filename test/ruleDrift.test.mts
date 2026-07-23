/**
 * Rule-drift test.
 *
 * The config in this package has no runtime of its own; its only observable
 * effect is the lint/type output it produces. This test pins that output: it
 * runs ESLint and tsc over a set of fixtures and asserts that the *set of
 * rules/codes that fire per fixture* matches a committed snapshot. It pins
 * drift in both directions:
 *
 * - `fixtures/fail/` — deliberately-broken code; each file must keep firing its
 *   specific rule(s). Catches a bump silently WEAKENING or renaming a rule (it
 *   stops firing).
 * - `fixtures/succeed/` — clean code exercising the config's intentional
 *   allowances; each file must keep firing NOTHING. Catches a bump making a
 *   rule stricter so it starts firing on code we mean to allow.
 *
 * Either direction failing is the guard that keeps the auto-merged weekly
 * Dependabot bumps honest.
 *
 * What is captured is normalized on purpose: only the sorted rule IDs / TS
 * error codes per fixture, never file paths, line/column, or message text.
 * That survives line shifts and tool-version phrasing changes and fails only
 * on real rule drift.
 *
 * Re-baseline after an intentional change: `yarn test:update` (we manage our
 * own JSON snapshot and set UPDATE_SNAPSHOT=1; the built-in
 * `node --test --test-update-snapshots` is NOT used).
 *
 * @module
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, '..');
// Cover both fail/ and succeed/ — ESLint's JSON formatter emits an entry for
// every linted file (clean files included, with an empty messages array), so a
// succeed fixture lands in the snapshot as { eslint: [], tsc: [] }.
const fixturesDir = resolve(testDir, 'fixtures');
const snapshotPath = resolve(testDir, 'ruleDrift.snapshot.json');

// A single `tsc --pretty false` diagnostic line, capturing the file path and
// the TS error code: `path/to/file.ts(12,5): error TS2322: ...`.
const tscDiagnosticPattern = /^(.+\.ts)\(\d+,\d+\): error (TS\d+):/;
const shouldUpdate = process.env.UPDATE_SNAPSHOT === '1';

/** Per-fixture fired rules, keyed by repo-relative fixture path. */
type DriftSnapshot = Record<string, { eslint: string[]; tsc: string[] }>;

const bin = (name: string) => resolve(repoRoot, 'node_modules/.bin', name);

const relFixture = (absolutePath: string) =>
  relative(repoRoot, absolutePath).split('\\').join('/');

/**
 * Run ESLint over the fixtures with the dedicated fixtures config and return
 * a map of fixture path → sorted unique rule IDs that fired. A `null` ruleId
 * (a parse/internal error) is surfaced as `<parse-error>` so a broken fixture
 * fails loudly rather than looking rule-free.
 */
const collectEslint = () => {
  let raw: string;
  try {
    raw = execFileSync(
      bin('eslint'),
      [
        '--no-config-lookup',
        '--config',
        resolve(testDir, 'eslint.fixtures.config.mts'),
        '--format',
        'json',
        fixturesDir,
      ],
      { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
  } catch (error) {
    // ESLint exits non-zero when it reports errors (the expected case). Its
    // JSON report is still on stdout, which execFileSync attaches to the error.
    const stdout = (error as { stdout?: string }).stdout;
    if (typeof stdout !== 'string' || stdout.length === 0) {
      throw error;
    }
    raw = stdout;
  }

  const report = JSON.parse(raw) as {
    filePath: string;
    messages: { ruleId: string | null }[];
  }[];

  const byFixture: Record<string, string[]> = {};
  for (const file of report) {
    const rules = file.messages.map(
      (message) => message.ruleId ?? '<parse-error>',
    );
    byFixture[relFixture(file.filePath)] = [...new Set(rules)].sort();
  }
  return byFixture;
};

/**
 * Run tsc over the fixtures project and return a map of fixture path → sorted
 * unique TS error codes (e.g. `TS2322`). Line/column and message text are
 * stripped so only the code identity is pinned.
 */
const collectTsc = () => {
  let output: string;
  try {
    output = execFileSync(
      bin('tsc'),
      [
        '--noEmit',
        '--pretty',
        'false',
        '--project',
        resolve(testDir, 'tsconfig.fixtures.json'),
      ],
      { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
  } catch (error) {
    // tsc exits non-zero when it finds type errors (the expected case); the
    // diagnostics are printed to stdout.
    const stdout = (error as { stdout?: string }).stdout;
    output = typeof stdout === 'string' ? stdout : '';
  }

  const byFixture: Record<string, string[]> = {};
  for (const line of output.split('\n')) {
    const match = tscDiagnosticPattern.exec(line);
    if (!match) {
      continue;
    }
    const [, filePath, code] = match;
    const key = relFixture(resolve(repoRoot, filePath));
    (byFixture[key] ??= []).push(code);
  }
  for (const key of Object.keys(byFixture)) {
    byFixture[key] = [...new Set(byFixture[key])].sort();
  }
  return byFixture;
};

/** Build the full normalized projection, keys sorted for a stable snapshot. */
const buildSnapshot = (): DriftSnapshot => {
  const eslint = collectEslint();
  const tsc = collectTsc();
  const fixtures = [
    ...new Set([...Object.keys(eslint), ...Object.keys(tsc)]),
  ].sort();

  const snapshot: DriftSnapshot = {};
  for (const fixture of fixtures) {
    snapshot[fixture] = {
      eslint: eslint[fixture] ?? [],
      tsc: tsc[fixture] ?? [],
    };
  }
  return snapshot;
};

// node:test's describe/test return promises the runner manages internally; we
// deliberately do not await them, so mark the top-level call with `void`.
void describe('rule drift', () => {
  void test('fired rules and TS codes match the committed snapshot', () => {
    const actual = buildSnapshot();

    if (shouldUpdate) {
      writeFileSync(
        snapshotPath,
        `${JSON.stringify(actual, null, 2)}\n`,
        'utf8',
      );
      return;
    }

    const expected = JSON.parse(
      readFileSync(snapshotPath, 'utf8'),
    ) as DriftSnapshot;
    assert.deepEqual(
      actual,
      expected,
      'Rule output drifted from the committed snapshot. If this change is ' +
        'intentional, re-baseline with `yarn test:update` and review the diff.',
    );
  });
});
