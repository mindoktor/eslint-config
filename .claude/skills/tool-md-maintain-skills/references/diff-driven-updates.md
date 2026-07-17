# Diff-Driven Skill Updates

When a PR or working tree diff introduces changes that may affect documented conventions, use this procedure instead of the full audit. It starts from the diff rather than from the skills themselves.

## Workflow

| Step | What                                                      | Why                                                           | When                              |
| ---- | --------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------- |
| 1    | Gather the diff against `develop` (or the specified base) | The diff is the source of truth for what changed              | Always — first step               |
| 2    | Classify changed files by domain                          | Skills are organized by domain; classification drives routing | After the diff is gathered        |
| 3    | Load affected skills                                      | Must read current content before proposing changes            | After classification              |
| 4    | Identify skill gaps                                       | New patterns, commands, or conventions may not be covered yet | While reading affected skills     |
| 5    | Draft the update plan                                     | The user must review before any edits happen                  | After gaps are identified         |
| 6    | Present the plan to the user                              | Ensures alignment and avoids unwanted changes                 | Always — unless user pre-approved |
| 7    | Execute the approved plan                                 | Apply skill updates and create new skills as needed           | After user confirms               |
| 8    | Suggest doc updates if skill changes are insufficient     | Some changes belong in `docs/` rather than skills             | After skill updates are complete  |

## Step 1 — Gather the Diff

Diff against the repo's default branch (often `develop`, or `main` in some repos — substitute `<default-branch>` accordingly):

```bash
git diff <default-branch> --stat
git diff <default-branch> --name-only
```

For a PR number:

```bash
gh pr diff <number> --name-only
gh pr diff <number>
```

## Step 2 — Classify Changed Files

Map each changed file to its domain skill. Adapt this mapping table to the project's actual skill inventory:

| Path pattern                                   | Likely skill                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `.claude/skills/`                              | `ref-md-agents-skills-authoring`                                   |
| `docs/architecture/`                           | architecture skill                                                 |
| `Makefile`, `package.json`                     | Instruction index (`AGENTS.md` / legacy `copilot-instructions.md`) |
| `AGENTS.md`, `.github/copilot-instructions.md` | meta — affects all skills                                          |

## Step 3 — Load Affected Skills

Read each affected skill's `SKILL.md` and relevant reference files. Pay attention to:

- Commands and scripts referenced in the skill.
- File paths and directory structures described.
- Patterns, conventions, or rules that the diff may have changed.
- Routing tables that may need new entries.

## Step 4 — Identify Skill Gaps

| Change type                     | Skill action needed                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| New convention or pattern       | Add to the relevant skill (or create a new reference)                                           |
| New or changed feature          | Document how the domain area works now (see below)                                              |
| Changed command or script       | Update the command in the affected skill                                                        |
| New directory or file structure | Update project structure section in the affected skill                                          |
| Removed or renamed feature      | Remove or update references in the affected skill                                               |
| New integration or service      | May need a new skill or a new reference file                                                    |
| Build or tooling change         | Update the instruction index (`AGENTS.md` / legacy `copilot-instructions.md`) standard commands |

### Documenting Features

When a diff introduces a new capability or significantly changes how a domain area works, the relevant skill must reflect the new reality. This is not about logging what changed — it is about ensuring the skill describes **how things work now**.

**Writing style**: describe the feature as stable, present-tense documentation. Do not write "we have added X" or "as of PR #1234" — write "the chat supports X" or "system messages render via Y." Skills are living reference material, not changelogs.

**What to capture** (the things an agent cannot easily infer from reading code, or that would take too long to piece together):

- Purpose and scope: what the feature does, why it exists, when it's used.
- Architecture: key components, how they relate, where they live (entry points, not exhaustive file lists).
- Non-obvious behaviors: hidden logic, intentional omissions, constraints that are easy to miss.
- Extension points: how to add a new variant, with a concise step list.

**What NOT to capture** (things obvious from reading the code itself):

- Props of every component — the agent can read the file.
- Full enumeration of every type/variant — unless the grouping logic is non-obvious.
- Implementation details of individual functions.
- Type definitions that are self-documenting.

**Level of detail**: write for a fellow agent that needs to extend or modify the feature. It should know: (1) that the feature exists and what it does, (2) where to start looking, (3) what surprising constraints exist, and (4) how to add/change things. A short reference file (40–80 lines) is usually the right size. If you're listing every component's props, you've gone too deep. If you're only saying "messages exist," you're too shallow.

**Where to put it**: add or update a domain-specific reference file in the owning skill. If the feature spans multiple domains, document each domain's portion in its own skill.

## Steps 5–6 — Draft and Present the Plan

Always present the plan to the user and wait for confirmation unless the user has pre-approved (e.g., "go ahead and update skills").

Structure as:

- **Updates to existing skills** — what changes, where, why.
- **New skills or references** — only when an existing skill cannot absorb the change.
- **Documentation suggestions** — things that belong in `docs/` rather than skills.

## Steps 7–8 — Execute and Suggest Doc Updates

After approval, apply changes following `ref-md-agents-skills-authoring` conventions. Commit skill updates separately from code changes when possible.

If the diff introduced changes better documented in `docs/` than in skills (architecture decisions, API contracts, setup guides), list them as suggestions — do not act on them autonomously.

## Gotchas

- Do not update skills based on draft or work-in-progress code.
- Prefer adding a reference file to an existing skill over creating a new skill.
- If a change affects both a project skill and the instruction index (`AGENTS.md`, or a legacy `.github/copilot-instructions.md`), update the skill first, then update routing.
- Verify the diff is against the correct base branch.
