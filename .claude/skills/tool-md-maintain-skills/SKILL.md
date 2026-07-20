---
name: tool-md-maintain-skills
description: >-
  Audit, update, and reorganize agent skills against current ref-md-agents-skills-authoring
  standards. Use when: a skill may be stale or outdated, the repo instruction
  index (AGENTS.md, or a legacy copilot-instructions.md)
  is bloated, multiple skills repeat the same rule, guidance is in the wrong file,
  a copied skill references the wrong stack, a skill needs structural review
  (folder layout, naming prefix, frontmatter, file placement), a long skill
  should be split into references, a PR introduces changes that affect documented
  conventions, or the user asks to synchronize skills with recent code changes.
  Covers compliance audit, staleness detection, deduplication, ownership decisions,
  structural fixes, reorganization, and diff-driven skill updates.
metadata:
  author: mindoktor
  version: "3.14"
  shareable-skills.owner-prefix: "md"
  shareable-skills.owner: "mindoktor/agentic-tools"
  shareable-skills.domain: "agents"
  shareable-skills.visibility: "organization"
  shareable-skills.vendored-sha: "f996033"
  shareable-skills.vendored-time: "2026-07-13"
  shareable-skills.requires: "ref-md-agents-skills-authoring"
  shareable-skills.suggests: "ref-md-agents-shareable-skills, ref-md-agents-local-tasks"
---

# Maintain Skills

_Vendored from agentic-tools — edit the upstream skill there, not this copy; local edits are overwritten on re-vendor._

Keep skills correct, current, and compliant with ref-md-agents-skills-authoring by auditing structure and content, fixing issues, and consolidating duplicated guidance.

## Routing Table

| Task                             | Read                                                                     |
| -------------------------------- | ------------------------------------------------------------------------ |
| Diff-driven skill updates        | [`references/diff-driven-updates.md`](references/diff-driven-updates.md) |
| Post-maintenance quality check   | [`references/checklist.md`](references/checklist.md)                     |
| Automated validation commands    | [`references/automation.md`](references/automation.md)                   |
| Skill structure and format rules | `ref-md-agents-skills-authoring`                                         |

## When to Use

- Auditing a skill against current ref-md-agents-skills-authoring standards.
- Checking folder layout, naming prefix, frontmatter, or file placement.
- Detecting and fixing stale content (wrong commands, outdated patterns, inherited references).
- Reducing duplication across `.claude/skills/`.
- Trimming the repo instruction index (`AGENTS.md`, or a legacy `.github/copilot-instructions.md`) without losing important rules.
- Moving guidance into the right owning skill.
- Adapting copied skill content to the actual stack of this repo.
- Splitting a large skill into smaller reference files.
- Reviewing whether a rule should be always-on or loaded on demand.
- Updating skills after the codebase, conventions, or tooling have changed.
- A PR or working tree diff introduced changes that affect documented conventions.
- Synchronizing skills with recent code changes after a feature is merged.

## Vendored Skills — Never Fix Drift In Place

Some skills are **vendored**: copied from an upstream repo that owns them (look for a `vendored-sha` pin in the skill's frontmatter — see `ref-md-agents-shareable-skills`). Editing a vendored copy directly causes drift — the change is lost on the next re-vendor and never reaches the other consumers.

When maintenance finds drift, staleness, or any needed fix in a vendored skill, **do not edit the vendored copy to correct it.** The fix must happen upstream and be re-vendored back, so every consumer stays in sync. File it as a local task instead:

- **If the upstream repo is cloned locally** (for skills owned by `mindoktor/agentic-tools`, check `~/dev/agentic-tools`) — create a new local task **in the upstream repo** according to `ref-md-agents-local-tasks`, so the agentic-tools agent picks it up.
- **Otherwise** — create a new local task in the **repo currently in use** according to `ref-md-agents-local-tasks`, then tell the user the normal procedure: the fix must be made in `agentic-tools` upstream and re-vendored. They can clone `agentic-tools` themselves to action it, or hand it off to another dev (likely Fabio) who maintains that repo.

Write the task for a fresh agent: which skill, what is wrong, why it matters, and any local workaround applied. This is a **problem hand-off** — the upstream agent owns the skill and has context you may lack. Any fix you include is a **hint, not a prescription**: frame it as one possible way to be validated on the way in, and leave the solution open for the handling agent to analyze and decide. See `ref-md-agents-local-tasks` (Rules for the AI) — a filed solution is a hint, never a prescription.

The only exception is a **deliberate, repo-specific delta** the user explicitly wants to keep local (it then diverges from upstream — set `forked-from` per `ref-md-agents-shareable-skills`). Do not take this route to "just fix" drift — ask the user first, and default to the upstream-task route.

## Procedure

| Step | What                                           | Why                                                           | When                                                      |
| ---- | ---------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------- |
| 1    | Load `ref-md-agents-skills-authoring`          | It is the source of truth for structure, naming, and patterns | Start of every maintenance pass                           |
| 2    | Audit each skill against the standard          | Catches structural drift before addressing content            | After ref-md-agents-skills-authoring is confirmed current |
| 3    | Inventory content and detect staleness         | Cannot fix without knowing what exists and what is wrong      | After audit — before moving anything                      |
| 4    | Choose the right home for each rule            | One source of truth prevents contradictions                   | After inventory is complete                               |
| 5    | Fix, consolidate, and restructure              | Apply audit findings and deduplication in one pass            | When the target state for each skill is decided           |
| 6    | Update descriptions, routing, and registration | Moved or renamed guidance must remain discoverable            | After edits are done                                      |
| 7    | Verify the result                              | Catches broken links, lost guidance, and remaining issues     | After all edits are committed                             |

### Step 1 — Load `ref-md-agents-skills-authoring`

- Read `ref-md-agents-skills-authoring` first.
- If the maintenance task suggests the authoring rules themselves may be stale, revisit the external resources referenced there.
- If refreshing `ref-md-agents-skills-authoring` would expand scope, ask the user before proceeding.

### Step 2 — Audit Against the Standard

For each skill in scope, check every item below. Flag violations but do not fix yet — collect the full picture first.

#### Naming

- Every skill uses either `tool-` or `ref-` — no unprefixed skills.
- `tool-` skills guide multi-step workflows; name uses a concrete action verb (`tool-md-create-db-migration`, not `tool-helper`).
- `ref-` skills provide read-only knowledge (conventions, rules, lookup tables); name uses a knowledge domain (`ref-md-db-migrations`, not `ref-utils`).
- No `ref-` skill orchestrates a workflow (extract to `tool-` if it does).
- Folder name is kebab-case, 1–64 chars, no leading/trailing/consecutive hyphens.

#### Frontmatter

- `name` field matches the folder name exactly.
- `description` starts with an action verb, includes "Use when:" triggers, ends with "Covers …" topics.
- `description` is 1–1024 chars and contains keywords for discoverability.
- `metadata.author` and `metadata.version` are present.
- Optional fields (`license`, `compatibility`, `allowed-tools`) are used appropriately.

#### Folder Structure

- `SKILL.md` exists and serves as the dispatcher (metadata + routing), not a monolith.
- Documentation lives in `references/`, not inlined in SKILL.md.
- Templates, scaffolds, and output format examples live in `assets/`, not `references/`.
- Executable code lives in `scripts/`.
- Test cases live in `evals/`.
- Custom subdirectories beyond the four named ones are **allowed** (the spec permits "any additional files or directories") — do not flag a directory as spec-divergent purely because its name is not `references/`/`assets/`/`scripts/`/`evals/`. Flag it only when its content fits one of the four standard roles and should move there.
- No files are placed directly in the skill root beside SKILL.md (use subdirectories).

#### Content Structure

- SKILL.md is under 500 lines.
- Routing table maps tasks to subfiles.
- Subfile links use relative paths only.
- File references are one level deep (no reference loading another reference loading another).
- Sections follow the recommended anatomy where applicable: title, purpose, prerequisites, routing table, when-to-use, scope, rules, related skills. Simple skills need not include every section.

#### Markdown Quality

- No markdownlint violations: MD032 (blank lines around lists), MD024 (duplicate headings), MD033 (inline HTML).
- Tables use aligned style — pipe characters line up across all rows (project convention).
- Comments explain business reasons, not logic restated in English.

### Step 3 — Inventory and Detect Staleness

Check every rule and example against the repo's actual state:

| Signal                                          | Action                                                     |
| ----------------------------------------------- | ---------------------------------------------------------- |
| Command references a tool not in `package.json` | Rewrite to use the repo's actual command                   |
| Example uses a library not in dependencies      | Replace with the library this repo actually uses           |
| File path in a rule does not exist              | Update to the correct path or remove the reference         |
| Rule contradicts current conventions            | Rewrite to match current practice, or delete if obsolete   |
| Skill was copied from another project           | Audit every command, path, and framework reference for fit |

Also check for duplicated guidance across skills and between skills and the repo instruction index (`AGENTS.md`, or a legacy `.github/copilot-instructions.md`).

Do not preserve inherited content that does not apply. Stale guidance is worse than no guidance.

#### Diff-Driven Gap Analysis

When on a feature branch or when the working tree has uncommitted changes, **always** run a diff-driven analysis as part of this step — do not rely solely on static audit. Follow the procedure in [`references/diff-driven-updates.md`](references/diff-driven-updates.md):

1. Gather the diff against the repo's default branch (`git diff <default-branch> --name-only` — resolve it with `git symbolic-ref refs/remotes/origin/HEAD`; often `develop` or `main`).
2. Classify changed files by domain skill using the mapping table in that reference.
3. Load each affected skill and compare its documented patterns against what the diff introduced.
4. Identify skill gaps — three categories:
   - **Conventions/gotchas**: new patterns, constraints, or pitfalls discovered during implementation.
   - **Feature documentation**: new capabilities or changed behavior that the skill should describe as stable, present-tense reference material (not changelog entries).
   - **Structural changes**: new directories, renamed files, updated commands.
5. Present a concrete update plan to the user before making changes.

This ensures maintenance always captures lessons learned from recent work — not just structural compliance but also an up-to-date description of how each domain area works.

### Step 4 — Choose the Right Home

| If the rule…                                                  | Then it belongs in…                                                                     |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Applies to most work in the repo (workflow, safety, approval) | The repo instruction index (`AGENTS.md`, or a legacy `.github/copilot-instructions.md`) |
| Is specific to a domain (styling, testing, deployment)        | The owning domain skill                                                                 |
| Is a long example, checklist, or template                     | A skill's `references/` or `assets/` subfile                                            |
| Applies across all repos (personal workflow, security)        | Home-level instructions or home-level skill                                             |

### Step 5 — Fix, Consolidate, and Restructure

- **Audit fixes**: rename prefixes, move misplaced files to the right subdirectory, update frontmatter fields, split oversized SKILL.md files.
- **Deduplication**: remove duplicate wording — do not keep multiple nearly-identical copies.
- **Routing summaries**: leave short routing entries in the instruction index (`AGENTS.md`, or a legacy `.github/copilot-instructions.md`) when the detailed rule now lives in a skill.
- **Stack alignment**: replace stale stack references with the repo's actual tools and conventions.
- **Scope conflicts**: if a rule exists in both home instructions and a project skill, the project skill wins for project-specific behavior; home instructions win for personal workflow.

### Step 6 — Update Descriptions, Routing, and Registration

- Update `description` fields so moved or renamed guidance stays discoverable via keywords.
- Update routing tables in the instruction index (`AGENTS.md`, or a legacy `.github/copilot-instructions.md`) and affected skills.
- Add or update "Related skills" sections if dependencies changed.
- Register new or renamed skills in the appropriate instructions file; unregister removed skills.

### Step 7 — Verify

Run the [maintenance checklist](./references/checklist.md).

Then run the automated checks in [`references/automation.md`](references/automation.md) so the pass is repeatable and not dependent on manual inspection.

If this maintenance pass was performed as part of a PR, mark the skill-maintenance checklist item in the PR template as done:

```text
- [x] I ran `/tool-md-maintain-skills` and updated skills
```

## Decision Rules

| What                                                                                           | Why                                                            | When                                                                                                             |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Keep always-on rules in the instruction index (`AGENTS.md` / legacy `copilot-instructions.md`) | They must load without skill activation                        | Workflow, safety, approval gates                                                                                 |
| Move domain detail into the owning skill                                                       | Reduces top-level bloat, improves discoverability              | Styling, framework, testing, deployment rules                                                                    |
| Split long skills into reference files                                                         | Keeps `SKILL.md` under 500 lines for fast activation           | When a skill exceeds ~400 lines                                                                                  |
| Rewrite stale content, do not preserve it                                                      | Wrong guidance is worse than missing guidance                  | Copied skills, outdated conventions                                                                              |
| Fix prefix violations before content issues                                                    | Structure errors affect every future interaction               | During audit                                                                                                     |
| Ask before duplicating a rule                                                                  | Duplication creates future drift                               | When ownership is unclear                                                                                        |
| Never fix drift in a vendored skill in place                                                   | Editing the copy drifts from upstream and is lost on re-vendor | The skill has a `vendored-sha` pin — file a local task (upstream clone if present, else the repo in use) instead |

## Related Skills

| Skill                            | When to load                                                              |
| -------------------------------- | ------------------------------------------------------------------------- |
| `ref-md-agents-skills-authoring` | Structure, format, and naming rules for skills                            |
| `ref-md-agents-shareable-skills` | Vendoring model, `vendored-sha` pins, visibility before editing a copy    |
| `ref-md-agents-local-tasks`      | `.agents/tasks/new/` structure when filing an upstream-fix task for drift |
