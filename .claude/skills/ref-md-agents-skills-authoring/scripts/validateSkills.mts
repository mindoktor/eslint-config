// Validates skill AUTHORING and STRUCTURE under .claude/skills: folder naming,
// the frontmatter essentials (name↔folder, description shape, author, version),
// the SKILL.md line budget, local link targets, markdown table alignment, and
// stale skill references in the repo instruction index (AGENTS.md, or a legacy
// .github/copilot-instructions.md). The SHARING / portability
// metadata (owner-prefix, owner, domain, visibility, requires/suggests, and the
// dependency graph) is validated separately by ref-md-agents-shareable-skills's
// scripts/validateSharing.mts — run both.
//
// Usage:
//   node validateSkills.mts [--repo-path <repo-name-or-path>]

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { alignMarkdownTables } from './alignTables.mts';

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

// Resolve a --repo-path value to a repo root: an absolute path is used as-is,
// a path that exists relative to the current directory is used next, and
// anything else is treated as a repo name under ~/dev.
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

const SKILL_NAME_RE = /^(tool|ref)-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FRONTMATTER_NAME_RE = /^name:\s*(.+?)\s*$/;
const FRONTMATTER_DESC_RE = /^description:\s*/;
const FRONTMATTER_AUTHOR_RE = /^\s*author:\s*(.+?)\s*$/;
const FRONTMATTER_VERSION_RE = /^\s*version:\s*(.+?)\s*$/;
const MARKDOWN_LINK_RE = /\[[^\]]+\]\(([^)]+)\)/g;
const FENCED_CODE_BLOCK_RE = /```[\s\S]*?```/g;

class CheckResult {
  failures: string[] = [];

  fail = (message: string): void => {
    this.failures.push(message);
  };

  ok = (): boolean => {
    return this.failures.length === 0;
  };
}

const readFrontmatterLines = (skillFile: string): string[] => {
  const lines = fs.readFileSync(skillFile, 'utf-8').split('\n');
  if (lines.length < 3 || lines[0].trim() !== '---') {
    return [];
  }

  let endIndex = -1;
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === '---') {
      endIndex = index;
      break;
    }
  }

  if (endIndex === -1) {
    return [];
  }

  return lines.slice(1, endIndex);
};

const normalizeLinkTarget = (target: string): string => {
  return target.split('#', 1)[0].trim();
};

// Some overlay/sandbox filesystems return Dirents without populated type
// info, so entry.isDirectory() is unreliable. Stat the path to be safe.
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

const listMarkdownFilesRecursively = (dir: string): string[] => {
  const files: string[] = [];

  const walk = (currentDir: string): void => {
    const entries = fs.readdirSync(currentDir);
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry);
      if (isDirectory(fullPath)) {
        walk(fullPath);
        continue;
      }
      if (fullPath.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  };

  walk(dir);
  return files.sort((a, b) => a.localeCompare(b));
};

const validateSkillDir = (skillDir: string, result: CheckResult): void => {
  const skillName = path.basename(skillDir);

  if (!SKILL_NAME_RE.test(skillName)) {
    result.fail(
      `${skillDir}: invalid folder name; expected tool-/ref- kebab-case`,
    );
  }

  const skillFile = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillFile)) {
    result.fail(`${skillDir}: missing SKILL.md`);
    return;
  }

  const lines = fs.readFileSync(skillFile, 'utf-8').split('\n');
  if (lines.length > 500) {
    result.fail(`${skillFile}: exceeds 500 lines (${lines.length})`);
  }

  const frontmatter = readFrontmatterLines(skillFile);
  if (frontmatter.length === 0) {
    result.fail(`${skillFile}: missing or invalid YAML frontmatter`);
    return;
  }

  let nameValue: string | null = null;
  let hasDescription = false;
  let hasAuthor = false;
  let hasVersion = false;
  const frontmatterText = frontmatter.join('\n');

  for (const line of frontmatter) {
    const nameMatch = FRONTMATTER_NAME_RE.exec(line);
    if (nameMatch != null) {
      nameValue = nameMatch[1].trim().replace(/^['"']|['"']$/g, '');
    }
    if (FRONTMATTER_DESC_RE.test(line)) {
      hasDescription = true;
    }
    if (FRONTMATTER_AUTHOR_RE.test(line)) {
      hasAuthor = true;
    }
    if (FRONTMATTER_VERSION_RE.test(line)) {
      hasVersion = true;
    }
  }

  if (nameValue !== skillName) {
    result.fail(
      `${skillFile}: frontmatter name '${String(nameValue)}' != folder name '${skillName}'`,
    );
  }

  if (!hasDescription) {
    result.fail(`${skillFile}: missing frontmatter description`);
  }

  if (!frontmatterText.includes('Use when:')) {
    result.fail(`${skillFile}: description should include 'Use when:'`);
  }

  if (!frontmatterText.includes('Covers')) {
    result.fail(`${skillFile}: description should include 'Covers'`);
  }

  if (!hasAuthor) {
    result.fail(`${skillFile}: missing metadata.author`);
  }

  if (!hasVersion) {
    result.fail(`${skillFile}: missing metadata.version`);
  }
};

const validateLinks = (markdownFile: string, result: CheckResult): void => {
  // Strip fenced code blocks: links inside them are sample output or
  // illustrations (e.g. CLI snapshot paths), not real documentation links.
  const text = fs
    .readFileSync(markdownFile, 'utf-8')
    .replace(FENCED_CODE_BLOCK_RE, '');

  for (const match of text.matchAll(MARKDOWN_LINK_RE)) {
    const rawTarget = normalizeLinkTarget(match[1]);
    if (rawTarget === '') {
      continue;
    }
    if (
      rawTarget.startsWith('http://') ||
      rawTarget.startsWith('https://') ||
      rawTarget.startsWith('mailto:') ||
      rawTarget.startsWith('#')
    ) {
      continue;
    }

    const resolved = path.resolve(path.dirname(markdownFile), rawTarget);
    if (!fs.existsSync(resolved)) {
      const relativeFile = path.relative(ROOT, markdownFile);
      result.fail(`${relativeFile}: broken local link target '${rawTarget}'`);
    }
  }
};

// Enforce the aligned-table convention: a file fails if alignTables would
// change it. The fix is mechanical — run alignTables.mts --write on the file.
const validateTableAlignment = (
  markdownFile: string,
  result: CheckResult,
): void => {
  const content = fs.readFileSync(markdownFile, 'utf-8');
  if (alignMarkdownTables(content) !== content) {
    const relativeFile = path.relative(ROOT, markdownFile);
    result.fail(
      `${relativeFile}: markdown tables not aligned — run 'node .claude/skills/ref-md-agents-skills-authoring/scripts/alignTables.mts ${relativeFile} --write'`,
    );
  }
};

// The repo instruction index is a root AGENTS.md by default; older repos may
// still keep it at .github/copilot-instructions.md. Prefer AGENTS.md, fall back
// to the legacy path so this check keeps working during the transition.
const INSTRUCTION_INDEX_CANDIDATES = [
  path.join(ROOT, 'AGENTS.md'),
  path.join(ROOT, '.github', 'copilot-instructions.md'),
];
const SKILL_REF_RE = /`((?:ref|tool)-[a-z0-9]+(?:-[a-z0-9]+)*)`/g;

const validateInstructionIndexRefs = (result: CheckResult): void => {
  const indexFile = INSTRUCTION_INDEX_CANDIDATES.find((candidate) =>
    fs.existsSync(candidate),
  );
  if (indexFile == null) {
    return;
  }

  const existingSkills = new Set(
    fs
      .readdirSync(SKILLS_DIR)
      .filter((entry) => isDirectory(path.join(SKILLS_DIR, entry))),
  );

  const relativeIndex = path.relative(ROOT, indexFile);
  const text = fs.readFileSync(indexFile, 'utf-8');
  for (const match of text.matchAll(SKILL_REF_RE)) {
    const skillName = match[1];
    if (!existingSkills.has(skillName)) {
      result.fail(`${relativeIndex}: stale skill reference '${skillName}'`);
    }
  }
};

const main = (): number => {
  const result = new CheckResult();

  if (repoPathArg != null && repoPathArg !== '') {
    console.log(`Validating skills in ${ROOT}`);
  }

  if (!fs.existsSync(SKILLS_DIR)) {
    console.error(`ERROR: .claude/skills directory not found in ${ROOT}`);
    return 1;
  }

  for (const skillDir of listDirectories(SKILLS_DIR)) {
    validateSkillDir(skillDir, result);
  }

  for (const markdownFile of listMarkdownFilesRecursively(SKILLS_DIR)) {
    validateTableAlignment(markdownFile, result);
    // Template placeholders intentionally include non-resolving sample links.
    if (path.basename(markdownFile) === 'template.md') {
      continue;
    }
    validateLinks(markdownFile, result);
  }

  validateInstructionIndexRefs(result);

  if (result.ok()) {
    console.log('OK: all skill checks passed');
    return 0;
  }

  console.log('FAIL: skill checks found issues');
  for (const failure of result.failures) {
    console.log(`- ${failure}`);
  }

  return 1;
};

process.exit(main());
