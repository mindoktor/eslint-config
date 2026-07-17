# Maintenance Checklist

Use this checklist after auditing, reorganizing, updating, or consolidating skills and instructions.

## Naming Compliance

- [ ] Folder name uses the correct prefix: `tool-` for action skills, `ref-` for reference skills.
- [ ] Folder name is kebab-case, 1–64 chars, no leading/trailing/consecutive hyphens.
- [ ] `tool-` names use a concrete action verb after the prefix (not `tool-helper` or `tool-utils`).
- [ ] `ref-` names use a knowledge domain after the prefix (not `ref-misc`).

## Frontmatter

- [ ] `name` field matches the folder name exactly.
- [ ] `description` starts with an action verb, includes "Use when:" triggers, ends with "Covers …" topics.
- [ ] `description` is 1–1024 chars and contains keywords that help agents match tasks.
- [ ] `metadata.author` and `metadata.version` are present.
- [ ] Optional fields (`license`, `compatibility`, `allowed-tools`) are used only when appropriate.

## Folder Structure

- [ ] `SKILL.md` exists and acts as a dispatcher, not a monolith.
- [ ] Documentation lives in `references/`, not inlined in SKILL.md.
- [ ] Templates, scaffolds, and output format examples live in `assets/`, not `references/`.
- [ ] Executable code lives in `scripts/`.
- [ ] Test cases live in `evals/`.
- [ ] No stray files in the skill root beside SKILL.md.

## Content Structure

- [ ] SKILL.md is under 500 lines.
- [ ] Routing table maps tasks to subfiles.
- [ ] All subfile links use relative paths (`./references/...`, `./assets/...`).
- [ ] File references are one level deep — no deeply nested reference chains.
- [ ] Sections follow recommended anatomy where applicable: title, purpose, routing table, when-to-use, scope, rules, related skills. Simple skills need not include every section.

## Deduplication

- [ ] Each rule has one clear source of truth — no near-copies across files.
- [ ] Duplicated wording was removed, not just annotated.
- [ ] If a rule exists in both home and project scope, ownership is intentional and documented.

## Placement

- [ ] The repo instruction index (`AGENTS.md`, or a legacy `.github/copilot-instructions.md`) contains only repo-wide rules, workflow, routing, and safety guidance — not domain detail.
- [ ] Domain-specific guidance lives in the owning skill.
- [ ] Large examples, checklists, and templates live in `references/`, `assets/`, or `scripts/`.

## Freshness

- [ ] Commands in rules match the repo's actual `package.json` scripts.
- [ ] Library and framework references match the repo's real dependencies.
- [ ] File paths in rules point to files that actually exist.
- [ ] Copied guidance has been fully adapted — no inherited commands, library names, or conventions from the source project remain.
- [ ] Rules reflect current conventions, not historical ones.

## Discoverability

- [ ] Skill `description` fields contain keywords for the moved or updated guidance.
- [ ] Routing tables in the instruction index (`AGENTS.md`, or a legacy `.github/copilot-instructions.md`) and affected skills are up to date.
- [ ] "Related skills" sections reflect current dependencies.

## Automation Checks

- [ ] Run `node .claude/skills/ref-md-agents-skills-authoring/scripts/validateSkills.mts` and ensure it exits `0`.
- [ ] If available, run `skills-ref validate` against changed skills.
- [ ] Re-run automated checks after each fix pass until clean.
- [ ] Keep manual checklist as final semantic review (automation is necessary, not sufficient).

## Markdown Quality

- [ ] No MD032 violations (blank lines around lists).
- [ ] No MD024 violations (duplicate headings).
- [ ] No MD033 violations (inline HTML — use backtick-wrapping for generic type syntax).
- [ ] Tables use aligned style — pipe characters line up across all rows (project convention).

## Registration

- [ ] New or renamed skills are registered in the appropriate instructions file.
- [ ] Removed skills are unregistered.
- [ ] Cross-references in other skills updated after any rename.
