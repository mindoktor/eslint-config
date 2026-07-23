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

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(TEST_DIR, '..');
// Cover both fail/ and succeed/ — ESLint's JSON formatter emits an entry for
// every linted file (clean files included, with an empty messages array), so a
// succeed fixture lands in the snapshot as { eslint: [], tsc: [] }.
const FIXTURES_DIR = resolve(TEST_DIR, 'fixtures');
const SNAPSHOT_PATH = resolve(TEST_DIR, 'ruleDrift.snapshot.json');

// A single `tsc --pretty false` diagnostic line, capturing the file path and
// the TS error code: `path/to/file.ts(12,5): error TS2322: ...`.
const TSC_DIAGNOSTIC_PATTERN = /^(.+\.ts)\(\d+,\d+\): error (TS\d+):/;
const SHOULD_UPDATE = process.env.UPDATE_SNAPSHOT === '1';

// ESLint reports a parse/internal error with a null ruleId, which would
// otherwise collapse into an empty rule set and look like a clean pass; stand
// in this sentinel so a fixture that stops parsing shows up as drift instead.
const PARSE_ERROR = '<parse-error>';

/** Per-fixture fired rules, keyed by repo-relative fixture path. */
type DriftSnapshot = Record<string, { eslint: string[]; tsc: string[] }>;

/** One reported problem in ESLint's `--format json` output. */
interface EslintMessage {
  ruleId: string | null;
}

/** One linted file's entry in ESLint's `--format json` report. */
interface EslintFileResult {
  filePath: string;
  messages: EslintMessage[];
}

/** The subset of ESLint's `--format json` report this test reads. */
type EslintReport = EslintFileResult[];

const binary = (name: string) => resolve(REPO_ROOT, 'node_modules/.bin', name);

const toRepoRelative = (absolutePath: string) =>
  relative(REPO_ROOT, absolutePath).split('\\').join('/');

const sortedUnique = (values: string[]) => [...new Set(values)].sort();

/**
 * Run a fixtures tool (ESLint/tsc) and return its stdout. Both tools exit zero
 * with empty stdout when they find nothing, and exit non-zero with their report
 * on stdout when they do — execFileSync only throws on the non-zero case, and
 * attaches the report as error.stdout.
 *
 * A non-zero exit with *empty* stdout is neither: the tool itself failed to run
 * (bad flags, crash, project-resolution error to stderr). Throwing on it is what
 * stops a broken tsc/eslint invocation from being misread as "no findings" and
 * silently false-passing the snapshot.
 */
const runTool = (name: string, args: string[]) => {
  try {
    return execFileSync(binary(name), args, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const stdout = (error as { stdout?: string }).stdout;
    if (typeof stdout === 'string' && stdout.length > 0) {
      return stdout;
    }
    throw error;
  }
};

/**
 * Run ESLint over the fixtures with the dedicated fixtures config and return
 * a map of fixture path → sorted unique rule IDs that fired.
 */
const collectEslint = () => {
  const raw = runTool('eslint', [
    '--no-config-lookup',
    '--config',
    resolve(TEST_DIR, 'eslint.fixtures.config.mts'),
    '--format',
    'json',
    FIXTURES_DIR,
  ]);
  const report = JSON.parse(raw) as EslintReport;

  const rulesByFixture: Record<string, string[]> = {};
  for (const file of report) {
    const rules = file.messages.map((message) => message.ruleId ?? PARSE_ERROR);
    rulesByFixture[toRepoRelative(file.filePath)] = sortedUnique(rules);
  }
  return rulesByFixture;
};

/**
 * Run tsc over the fixtures project and return a map of fixture path → sorted
 * unique TS error codes (e.g. `TS2322`). Line/column and message text are
 * stripped so only the code identity is pinned.
 */
const collectTsc = () => {
  const output = runTool('tsc', [
    '--noEmit',
    '--pretty',
    'false',
    '--project',
    resolve(TEST_DIR, 'tsconfig.fixtures.json'),
  ]);

  const codesByFixture: Record<string, string[]> = {};
  for (const line of output.split('\n')) {
    const match = TSC_DIAGNOSTIC_PATTERN.exec(line);
    if (!match) {
      continue;
    }
    const [, filePath, code] = match;
    const fixture = toRepoRelative(resolve(REPO_ROOT, filePath));
    (codesByFixture[fixture] ??= []).push(code);
  }
  return Object.fromEntries(
    Object.entries(codesByFixture).map(([fixture, codes]) => [
      fixture,
      sortedUnique(codes),
    ]),
  );
};

/** Build the full normalized projection, keys sorted for a stable snapshot. */
const buildSnapshot = (): DriftSnapshot => {
  const eslint = collectEslint();
  const tsc = collectTsc();
  const fixtures = sortedUnique([...Object.keys(eslint), ...Object.keys(tsc)]);

  const snapshot: DriftSnapshot = {};
  for (const fixture of fixtures) {
    snapshot[fixture] = {
      eslint: eslint[fixture] ?? [],
      tsc: tsc[fixture] ?? [],
    };
  }
  return snapshot;
};

// The node:test runner awaits the describe/test promises itself, so we must not
// await them here; `void` marks that as intentional for no-floating-promises.
void describe('rule drift', () => {
  void test('fired rules and TS codes match the committed snapshot', () => {
    const actual = buildSnapshot();

    if (SHOULD_UPDATE) {
      writeFileSync(
        SNAPSHOT_PATH,
        `${JSON.stringify(actual, null, 2)}\n`,
        'utf8',
      );
      return;
    }

    const expected = JSON.parse(
      readFileSync(SNAPSHOT_PATH, 'utf8'),
    ) as DriftSnapshot;
    assert.deepEqual(
      actual,
      expected,
      'Rule output drifted from the committed snapshot. If this change is ' +
        'intentional, re-baseline with `yarn test:update` and review the diff.',
    );
  });
});
