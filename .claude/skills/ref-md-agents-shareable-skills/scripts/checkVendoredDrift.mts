// Reports drift between a repo's vendored skill copies and their upstream
// sources. A skill is a vendored copy when it carries a
// `shareable-skills.vendored-sha` pin; its `shareable-skills.owner` names the
// upstream source repo (as "org/repo") and `shareable-skills.vendored-time`
// records when it was taken. For each such copy it compares the local files
// against the upstream version at that commit and flags:
//   - edited : the local copy differs from upstream@sha (ignoring vendoring
//              markers — the vendored-sha / vendored-time lines and a
//              "_Vendored from …_" note — and blank-line runs)
//   - stale  : upstream changed this skill after the pinned commit (re-vendor
//              available)
//
// Cross-repo by nature: it needs both the consumer repo and the source repo
// present (resolved under ~/dev by the repo name in `owner`), so this is a
// LOCAL maintenance tool, not a CI gate. See ref-md-agents-shareable-skills.
//
// Usage:
//   node checkVendoredDrift.mts --repo-path <repo-name-or-path>
// Without --repo-path it scans the repo this script lives in (which, being the
// upstream, normally has no pins).

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);

// `owner:` must not also match `owner-prefix:`; the trailing colon guards it.
const OWNER_RE = /^\s*shareable-skills\.owner:\s*"?([^"\n]+?)"?\s*$/;
const VENDORED_SHA_RE =
  /^\s*shareable-skills\.vendored-sha:\s*"?([0-9a-fA-F]+)"?\s*$/;
const VENDORED_TIME_RE =
  /^\s*shareable-skills\.vendored-time:\s*"?([^"\n]+?)"?\s*$/;
const VENDOR_NOTE_RE = /^_Vendored from .*_\s*$/;

const readRepoPathArg = (argv: string[]): string | null => {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg.startsWith('--repo-path=')) {
      return arg.slice('--repo-path='.length);
    }
    if (arg === '--repo-path') {
      return argv[index + 1] ?? '';
    }
  }
  return null;
};

// An absolute path is used as-is; a path that exists relative to the current
// directory is used next; anything else is treated as a repo name under ~/dev.
const resolveRepoRoot = (value: string): string => {
  if (path.isAbsolute(value)) {
    return value;
  }
  const fromCwd = path.resolve(process.cwd(), value);
  if (fs.existsSync(fromCwd)) {
    return fromCwd;
  }
  return path.join(os.homedir(), 'dev', value);
};

// `owner` is "org/repo"; the source is checked out under ~/dev by its repo
// name (the last path segment).
const repoNameFromOwner = (owner: string): string => {
  const trimmed = owner.trim();
  const slash = trimmed.lastIndexOf('/');
  return slash === -1 ? trimmed : trimmed.slice(slash + 1);
};

const repoPathArg = readRepoPathArg(process.argv.slice(2));
const ROOT =
  repoPathArg == null || repoPathArg === ''
    ? path.resolve(scriptDir, '../../../../')
    : resolveRepoRoot(repoPathArg);
const SKILLS_DIR = path.join(ROOT, '.claude', 'skills');

type DriftStatus =
  | 'ok'
  | 'edited'
  | 'stale'
  | 'edited-and-stale'
  | 'unresolved';

interface VendorPin {
  sourceOwner: string; // "org/repo" — the upstream home the copy was taken from
  sha: string;
}

interface DriftReport {
  folder: string;
  pin: VendorPin;
  status: DriftStatus;
  editedFiles: string[];
  upstreamHead: string | null;
  note: string | null;
}

const isDirectory = (target: string): boolean => {
  try {
    return fs.statSync(target).isDirectory();
  } catch {
    return false;
  }
};

// Run git read-only; return stdout, or null if git exits non-zero (e.g. a path
// or sha that does not exist). stderr is captured by execFileSync, not printed.
const git = (repo: string, args: string[]): string | null => {
  try {
    return execFileSync('git', ['-C', repo, ...args], {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  } catch {
    return null;
  }
};

const isGitRepo = (repo: string): boolean =>
  fs.existsSync(repo) && git(repo, ['rev-parse', '--git-dir']) != null;

const commitExists = (repo: string, sha: string): boolean =>
  git(repo, ['cat-file', '-e', `${sha}^{commit}`]) != null;

const shortHead = (repo: string): string | null => {
  const out = git(repo, ['rev-parse', '--short', 'HEAD']);
  return out == null ? null : out.trim();
};

const showAtSha = (repo: string, sha: string, relPath: string): string | null =>
  git(repo, ['show', `${sha}:${relPath}`]);

const listUpstreamSubPaths = (
  repo: string,
  sha: string,
  skillRelDir: string,
): string[] => {
  const out = git(repo, [
    'ls-tree',
    '-r',
    '--name-only',
    sha,
    '--',
    skillRelDir,
  ]);
  if (out == null) {
    return [];
  }
  const prefix = `${skillRelDir}/`;
  return out
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((file) =>
      file.startsWith(prefix) ? file.slice(prefix.length) : file,
    );
};

const upstreamChangedSincePin = (
  repo: string,
  sha: string,
  skillRelDir: string,
): boolean => {
  const out = git(repo, [
    'diff',
    '--name-only',
    sha,
    'HEAD',
    '--',
    skillRelDir,
  ]);
  return out != null && out.trim() !== '';
};

const listLocalSubPaths = (skillDir: string): string[] => {
  const out: string[] = [];
  const walk = (currentDir: string): void => {
    for (const entry of fs.readdirSync(currentDir)) {
      const full = path.join(currentDir, entry);
      if (isDirectory(full)) {
        walk(full);
        continue;
      }
      out.push(path.relative(skillDir, full));
    }
  };
  walk(skillDir);
  return out;
};

// Strip the vendoring markers (only meaningful in SKILL.md) and collapse
// blank-line runs so the marker insertion never reads as content drift. The
// `owner` line is identical between upstream and copy, so it is left in place.
const normalize = (content: string, isSkillFile: boolean): string => {
  const lines = content.split('\n');
  const kept = isSkillFile
    ? lines.filter(
        (line) =>
          !VENDORED_SHA_RE.test(line) &&
          !VENDORED_TIME_RE.test(line) &&
          !VENDOR_NOTE_RE.test(line),
      )
    : lines;
  return kept
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd();
};

// A skill is a vendored copy iff it carries a vendored-sha pin; owner then names
// the upstream source repo. Returns null for non-vendored skills.
const readPin = (skillFile: string): VendorPin | null => {
  let owner: string | null = null;
  let sha: string | null = null;
  for (const line of fs.readFileSync(skillFile, 'utf-8').split('\n')) {
    const ownerMatch = OWNER_RE.exec(line);
    if (ownerMatch != null) {
      owner = ownerMatch[1].trim();
    }
    const shaMatch = VENDORED_SHA_RE.exec(line);
    if (shaMatch != null) {
      sha = shaMatch[1];
    }
  }
  if (sha == null) {
    return null;
  }
  return { sourceOwner: owner ?? '', sha };
};

const statusOf = (edited: boolean, stale: boolean): DriftStatus => {
  if (edited && stale) {
    return 'edited-and-stale';
  }
  if (edited) {
    return 'edited';
  }
  if (stale) {
    return 'stale';
  }
  return 'ok';
};

const checkSkill = (
  folder: string,
  skillDir: string,
  pin: VendorPin,
): DriftReport => {
  const base: DriftReport = {
    folder,
    pin,
    status: 'unresolved',
    editedFiles: [],
    upstreamHead: null,
    note: null,
  };

  if (pin.sourceOwner === '') {
    return {
      ...base,
      note: 'vendored-sha present but shareable-skills.owner is missing',
    };
  }

  const upstream = resolveRepoRoot(repoNameFromOwner(pin.sourceOwner));
  if (!isGitRepo(upstream)) {
    return {
      ...base,
      note: `source repo '${pin.sourceOwner}' not found at ${upstream}`,
    };
  }
  if (!commitExists(upstream, pin.sha)) {
    return {
      ...base,
      note: `commit ${pin.sha} not in '${pin.sourceOwner}' (fetch it?)`,
    };
  }

  // The vendored copy keeps the upstream skill's folder name, so the source
  // path mirrors the local one.
  const skillRelDir = `.claude/skills/${folder}`;
  const subPaths = new Set<string>([
    ...listLocalSubPaths(skillDir),
    ...listUpstreamSubPaths(upstream, pin.sha, skillRelDir),
  ]);

  const editedFiles: string[] = [];
  for (const sub of subPaths) {
    const isSkillFile = sub === 'SKILL.md';
    const localFull = path.join(skillDir, sub);
    const localContent = fs.existsSync(localFull)
      ? normalize(fs.readFileSync(localFull, 'utf-8'), isSkillFile)
      : null;
    const upstreamRaw = showAtSha(upstream, pin.sha, `${skillRelDir}/${sub}`);
    const upstreamContent =
      upstreamRaw == null ? null : normalize(upstreamRaw, isSkillFile);
    if (localContent !== upstreamContent) {
      editedFiles.push(sub);
    }
  }
  editedFiles.sort((a, b) => a.localeCompare(b));

  const stale = upstreamChangedSincePin(upstream, pin.sha, skillRelDir);

  return {
    ...base,
    status: statusOf(editedFiles.length > 0, stale),
    editedFiles,
    upstreamHead: stale ? shortHead(upstream) : null,
    note: null,
  };
};

const LABEL: Record<DriftStatus, string> = {
  ok: 'ok',
  edited: 'EDITED',
  stale: 'stale',
  'edited-and-stale': 'EDITED+stale',
  unresolved: 'SKIP',
};

const detailFor = (report: DriftReport): string => {
  if (report.status === 'edited' || report.status === 'edited-and-stale') {
    return `  → differs from source: ${report.editedFiles.join(', ')}`;
  }
  if (report.status === 'stale') {
    return `  → upstream ahead (HEAD ${report.upstreamHead ?? '?'}); re-vendor available`;
  }
  if (report.status === 'unresolved') {
    return `  → ${report.note ?? 'could not verify'}`;
  }
  return '';
};

const main = (): number => {
  if (!fs.existsSync(SKILLS_DIR)) {
    console.error(`ERROR: .claude/skills not found in ${ROOT}`);
    return 1;
  }
  console.log(`Checking vendored skills in ${ROOT}\n`);

  const reports: DriftReport[] = [];
  for (const entry of fs
    .readdirSync(SKILLS_DIR)
    .sort((a, b) => a.localeCompare(b))) {
    const skillDir = path.join(SKILLS_DIR, entry);
    const skillFile = path.join(skillDir, 'SKILL.md');
    if (!isDirectory(skillDir) || !fs.existsSync(skillFile)) {
      continue;
    }
    const pin = readPin(skillFile);
    if (pin == null) {
      continue; // not a vendored copy
    }
    reports.push(checkSkill(entry, skillDir, pin));
  }

  if (reports.length === 0) {
    console.log(
      'No vendored skills found (no shareable-skills.vendored-sha pins).',
    );
    return 0;
  }

  for (const report of reports) {
    const pin = `${report.pin.sourceOwner}@${report.pin.sha}`;
    console.log(
      `  ${LABEL[report.status].padEnd(13)} ${report.folder.padEnd(34)} ${pin}${detailFor(report)}`,
    );
  }

  const count = (status: DriftStatus): number =>
    reports.filter((report) => report.status === status).length;
  const edited = count('edited') + count('edited-and-stale');
  const stale = count('stale') + count('edited-and-stale');
  const unresolved = count('unresolved');
  const ok = count('ok');
  console.log(
    `\n${reports.length} vendored skills — ${ok} ok, ${edited} edited, ${stale} stale, ${unresolved} unresolved`,
  );

  // Only local edits (drift from source) are a hard failure; staleness and
  // unresolved sources are informational.
  return edited > 0 ? 1 : 0;
};

process.exit(main());
