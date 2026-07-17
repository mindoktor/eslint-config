# Automated Skill Validation

Use this after any skill update to run objective checks before finalizing.

## Why

Manual review is still needed for judgment calls, but structural quality checks should be automated to avoid regressions and reduce reviewer load.

## Command Sequence

Run these from the repo root.

```bash
git status --short
```

```bash
node .claude/skills/ref-md-agents-skills-authoring/scripts/validateSkills.mts
```

Node runs these `.mts` scripts directly via native type-stripping, so no `ts-node` bootstrap is required — but it needs **Node 24** (type-stripping on by default) or **Node ≥ 22.6** with `--experimental-strip-types`. Pin the same version in CI; older Node will fail on the scripts' type annotations.

```bash
node .claude/skills/ref-md-agents-shareable-skills/scripts/validateSharing.mts
```

Validates portability metadata — `owner-prefix`/`owner`/`domain`/`visibility` — and the dependency graph.

```bash
# When the repo holds vendored copies of upstream skills
node .claude/skills/ref-md-agents-shareable-skills/scripts/checkVendoredDrift.mts
```

Checks vendored copies against their `vendored-sha` pins and flags drift from upstream.

```bash
# Optional: if available in your environment
skills-ref validate .claude/skills/ref-md-agents-skills-authoring
```

## What the local validators check

`validateSkills.mts`:

- Skill folder naming prefix (`tool-` / `ref-`) and kebab-case constraints.
- Presence of `SKILL.md` in every skill folder.
- Frontmatter essentials (`name`, `description`, `metadata.author`, `metadata.version`).
- `name` equals folder name.
- `description` contains both `Use when:` and `Covers`.
- `SKILL.md` line-count budget (<= 500 lines).
- Local markdown links resolve to existing files.
- Markdown table alignment — any `.md` file whose tables `alignTables.mts` would reformat fails; fix it with `node .claude/skills/ref-md-agents-skills-authoring/scripts/alignTables.mts <file> --write` (or check one file with `--check`).

`validateSharing.mts`:

- `shareable-skills.owner-prefix`, `owner`, `domain`, and `visibility` are present and consistent with the skill name.
- The dependency graph: `requires` targets exist and are not narrower in visibility than the depending skill.

`checkVendoredDrift.mts` (only relevant when the repo holds vendored copies):

- Each vendored skill's content matches its `vendored-sha` pin — flags copies that drifted from upstream or carry a stale pin.

## Interpreting output

- Exit code `0`: all checks passed.
- Exit code `1`: one or more checks failed; fix listed issues and re-run.

## Scope limits

The validator does not replace semantic review. It cannot decide if guidance is correct for the codebase; it only verifies structure and integrity.
