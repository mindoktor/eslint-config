// Validates the SHARING / portability metadata of every skill under
// .claude/skills: the shareable-skills.* frontmatter fields and the dependency
// graph. Structural and naming checks (folder name, description, links, table
// alignment) live in the authoring validator, ref-md-agents-skills-authoring's
// scripts/validateSkills.mts — run both.
//
// Checks:
//   - owner-prefix present and equal to the name's owner token
//   - owner (canonical home repo) present
//   - domain present, one of ALLOWED_DOMAINS, and (for ref- skills) equal to the
//     name's domain token
//   - visibility present and one of ALLOWED_VISIBILITY
//   - requires: every entry names an existing skill of equal-or-wider visibility
//   - suggests: intentionally NOT existence-checked (a soft dep may be absent)
//
// Usage:
//   node validateSharing.mts [--repo-path <repo-name-or-path>]

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);

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

// An absolute path is used as-is, a path that exists relative to the current
// directory is used next, and anything else is treated as a repo name under ~/dev.
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

const repoPathArg = readRepoPathArg(process.argv.slice(2));

// Without --repo-path, validate the repo this script lives in (four levels up
// from the script). With the flag, validate the named repo instead.
const ROOT =
  repoPathArg == null || repoPathArg === ''
    ? path.resolve(scriptDir, '../../../../')
    : resolveRepoRoot(repoPathArg);
const SKILLS_DIR = path.join(ROOT, '.claude', 'skills');

const FRONTMATTER_OWNER_PREFIX_RE =
  /^\s*shareable-skills\.owner-prefix:\s*"?([^"\n]+?)"?\s*$/;
const FRONTMATTER_OWNER_RE =
  /^\s*shareable-skills\.owner:\s*"?([^"\n]+?)"?\s*$/;
const FRONTMATTER_DOMAIN_RE =
  /^\s*shareable-skills\.domain:\s*"?([^"\n]+?)"?\s*$/;
const FRONTMATTER_VISIBILITY_RE =
  /^\s*shareable-skills\.visibility:\s*"?([^"\n]+?)"?\s*$/;
// requires/suggests are comma-separated in the converged schema; tolerate legacy
// whitespace separation too so a not-yet-migrated copy still parses cleanly.
const FRONTMATTER_REQUIRES_RE =
  /^\s*shareable-skills\.requires:\s*"?([^"\n]*)"?\s*$/;
const FRONTMATTER_SUGGESTS_RE =
  /^\s*shareable-skills\.suggests:\s*"?([^"\n]*)"?\s*$/;

// Knowledge-area tokens a skill name may use after the owner prefix. Languages
// get a short token (js, go, py, css); data/AI, platform, process, and meta
// areas get their own. Extend this as the org's skill set grows; keep the table
// in ref-md-agents-skills-authoring in sync.
const ALLOWED_DOMAINS = new Set([
  // languages & frameworks
  'js',
  'go',
  'py',
  'rb',
  'css',
  // data & AI
  'db',
  'data',
  'ai',
  // platform & process
  'api',
  'infra',
  'dev',
  'biz',
  // meta
  'agents',
  'repo',
]);
const ALLOWED_VISIBILITY = new Set(['repo-local', 'organization', 'public']);
// How far each visibility may travel; a required dep must be equal or wider so
// it can follow the skill wherever it is linked.
const VISIBILITY_RANK: Record<string, number> = {
  'repo-local': 0,
  organization: 1,
  public: 2,
};
const rankOf = (visibility: string | null): number | undefined =>
  visibility == null ? undefined : VISIBILITY_RANK[visibility];

interface SkillMeta {
  name: string;
  visibility: string | null;
  required: string[];
  optional: string[];
}

class CheckResult {
  failures: string[] = [];

  fail = (message: string): void => {
    this.failures.push(message);
  };

  ok = (): boolean => {
    return this.failures.length === 0;
  };
}

const isDirectory = (target: string): boolean => {
  try {
    return fs.statSync(target).isDirectory();
  } catch {
    return false;
  }
};

const listDirectories = (dir: string): string[] => {
  return fs
    .readdirSync(dir)
    .map((entry) => path.join(dir, entry))
    .filter(isDirectory)
    .sort((a, b) => a.localeCompare(b));
};

const readFrontmatterLines = (skillFile: string): string[] => {
  const lines = fs.readFileSync(skillFile, 'utf-8').split('\n');
  if (lines.length < 3 || lines[0].trim() !== '---') {
    return [];
  }

  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === '---') {
      return lines.slice(1, index);
    }
  }

  return [];
};

const validateSharingForDir = (
  skillDir: string,
  result: CheckResult,
): SkillMeta | null => {
  const skillName = path.basename(skillDir);
  const skillFile = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillFile)) {
    return null; // missing SKILL.md is reported by the authoring validator
  }

  let ownerPrefixValue: string | null = null;
  let ownerValue: string | null = null;
  let domainValue: string | null = null;
  let visibilityValue: string | null = null;
  let requiredDeps: string[] = [];
  let optionalDeps: string[] = [];
  for (const line of readFrontmatterLines(skillFile)) {
    const ownerPrefixMatch = FRONTMATTER_OWNER_PREFIX_RE.exec(line);
    if (ownerPrefixMatch != null) {
      ownerPrefixValue = ownerPrefixMatch[1];
    }
    const ownerMatch = FRONTMATTER_OWNER_RE.exec(line);
    if (ownerMatch != null) {
      ownerValue = ownerMatch[1];
    }
    const domainMatch = FRONTMATTER_DOMAIN_RE.exec(line);
    if (domainMatch != null) {
      domainValue = domainMatch[1];
    }
    const visibilityMatch = FRONTMATTER_VISIBILITY_RE.exec(line);
    if (visibilityMatch != null) {
      visibilityValue = visibilityMatch[1];
    }
    const requiresMatch = FRONTMATTER_REQUIRES_RE.exec(line);
    if (requiresMatch != null) {
      requiredDeps = requiresMatch[1].split(/[\s,]+/).filter(Boolean);
    }
    const suggestsMatch = FRONTMATTER_SUGGESTS_RE.exec(line);
    if (suggestsMatch != null) {
      optionalDeps = suggestsMatch[1].split(/[\s,]+/).filter(Boolean);
    }
  }

  // The name encodes owner + (for ref- skills) domain:
  // ref-<owner>-<domain>-<topic>, tool-<owner>-<verb>-<target>.
  const nameParts = skillName.split('-');
  const nameOwner = nameParts[1];

  if (ownerPrefixValue == null) {
    result.fail(`${skillFile}: missing shareable-skills.owner-prefix`);
  } else if (ownerPrefixValue !== nameOwner) {
    result.fail(
      `${skillFile}: owner-prefix '${ownerPrefixValue}' != name owner '${nameOwner}'`,
    );
  }

  if (ownerValue == null || ownerValue === '') {
    result.fail(
      `${skillFile}: missing shareable-skills.owner (canonical home, e.g. 'org/repo')`,
    );
  }

  if (domainValue == null) {
    result.fail(`${skillFile}: missing shareable-skills.domain`);
  } else if (!ALLOWED_DOMAINS.has(domainValue)) {
    result.fail(
      `${skillFile}: domain '${domainValue}' not one of ${[...ALLOWED_DOMAINS].join(', ')}`,
    );
  } else if (skillName.startsWith('ref-') && domainValue !== nameParts[2]) {
    result.fail(
      `${skillFile}: domain '${domainValue}' != name domain '${nameParts[2]}' (ref- skills mirror the name)`,
    );
  }

  if (visibilityValue == null) {
    result.fail(`${skillFile}: missing shareable-skills.visibility`);
  } else if (!ALLOWED_VISIBILITY.has(visibilityValue)) {
    result.fail(
      `${skillFile}: visibility '${visibilityValue}' not one of ${[...ALLOWED_VISIBILITY].join(', ')}`,
    );
  }

  return {
    name: skillName,
    visibility: visibilityValue,
    required: requiredDeps,
    optional: optionalDeps,
  };
};

// Cross-skill checks that need the full registry. Required deps must exist and
// be of equal-or-wider visibility (the linker brings them along). Suggests are
// intentionally NOT existence-checked: per ref-md-agents-shareable-skills they
// may be absent (unvendored, cross-repo, or linked only on request), and a
// missing suggested dep is skipped gracefully — not an error.
const validateDependencies = (
  skills: SkillMeta[],
  result: CheckResult,
): void => {
  const byName = new Map(skills.map((skill) => [skill.name, skill]));

  for (const skill of skills) {
    for (const dep of skill.required) {
      const target = byName.get(dep);
      if (target == null) {
        result.fail(
          `${skill.name}: requires entry '${dep}' is not an existing skill`,
        );
        continue;
      }

      const skillRank = rankOf(skill.visibility);
      const depRank = rankOf(target.visibility);
      if (skillRank != null && depRank != null && depRank < skillRank) {
        result.fail(
          `${skill.name} (${String(skill.visibility)}): requires entry '${dep}' has narrower visibility '${String(target.visibility)}' (must be equal or wider)`,
        );
      }
    }
  }
};

const main = (): number => {
  const result = new CheckResult();

  if (repoPathArg != null && repoPathArg !== '') {
    console.log(`Validating skill sharing metadata in ${ROOT}`);
  }

  if (!fs.existsSync(SKILLS_DIR)) {
    console.error(`ERROR: .claude/skills directory not found in ${ROOT}`);
    return 1;
  }

  const skills: SkillMeta[] = [];
  for (const skillDir of listDirectories(SKILLS_DIR)) {
    const meta = validateSharingForDir(skillDir, result);
    if (meta != null) {
      skills.push(meta);
    }
  }
  validateDependencies(skills, result);

  if (result.ok()) {
    console.log('OK: all sharing-metadata checks passed');
    return 0;
  }

  console.log('FAIL: sharing-metadata checks found issues');
  for (const failure of result.failures) {
    console.log(`- ${failure}`);
  }

  return 1;
};

process.exit(main());
