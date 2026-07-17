---
name: tool-md-read-skills
description: >-
  Load relevant project and global skills based on the current conversation context.
  Use when: the user asks to load skills, at the start of a task, or whenever the
  work shifts into a new area, to ensure the right domain knowledge is available. Scans the conversation for keywords and
  matches them against the project's skill table in its instruction index
  (AGENTS.md, or a legacy .github/copilot-instructions.md).
  Covers keyword scanning, the skill-table lookup, and loading project and
  global skills by context.
metadata:
  author: mindoktor
  version: "1.3"
  shareable-skills.owner-prefix: "md"
  shareable-skills.owner: "mindoktor/agentic-tools"
  shareable-skills.domain: "agents"
  shareable-skills.visibility: "organization"
  shareable-skills.vendored-sha: "f996033"
  shareable-skills.vendored-time: "2026-07-13"
---

# Tool: Read Skills

_Vendored from agentic-tools — edit the upstream skill there, not this copy; local edits are overwritten on re-vendor._

Load relevant skills based on the current conversation context.

## Workflow

### 1. Identify the active project

Determine which repo the user is working in from:

- The current file's path (editor context)
- The current working directory
- Recent terminal commands

### 2. Load the skill indexes

Read both index files:

- **Project skills**: `<project>/AGENTS.md` (or `<project>/.github/copilot-instructions.md` in repos still on that layout) — contains the project's **Skills table**, the authoritative mapping of tasks to project skill files.
- **Global skills**: `~/.copilot/instructions/default.instructions.md` — contains the global **Skills table**, the authoritative mapping of cross-project workflows to global skill files.

### 3. Match context to skills

Analyze the current message (or the last few messages if the current one is empty) for:

- **File types being edited** — `.tsx`/`.ts` → `ref-md-js-react` / `ref-md-js-typescript`; MUI components → `ref-md-js-mui`; `.py` → `ref-md-py-python`; `.go` → `ref-md-go-golang` / `ref-md-go-tests`
- **Topics mentioned** — TanStack Query / data fetching → `ref-md-js-tanstack-query`; Redux / `connect()` → `ref-md-js-redux`; feature module layout → `ref-md-js-feature-first`; Next.js routing/config → `ref-md-js-nextjs`; Go conventions or tests → `ref-md-go-golang` / `ref-md-go-tests`
- **Operations requested** — committing → `tool-md-commit` / `ref-md-dev-workflow`; opening a PR → `tool-md-create-pr`; reviewing or handling PR comments → `tool-md-handle-pr-comments`; creating or handling a Jira task → `tool-md-create-task` / `tool-md-handle-task`; a dependency CVE → `tool-md-handle-cve` (plus `ref-md-go-cve` for Go vulnerability topics)
- **Build/config work** — ESLint/Prettier config, `package.json` scripts → the relevant `ref-md-js-*` skill

### 4. Load matched skills

Read each matched skill file using the file-reading tool. Load the SKILL.md first — it acts as a dispatcher and may route to specific pattern files.

If a skill's routing table points to a more specific pattern file for the task at hand, load that pattern file too.

### 5. Also check global skills

Always check whether any global skills apply:

| Skill                            | Triggers                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `ref-md-dev-workflow`            | Git operations, commits, branches, PRs                                        |
| `ref-md-biz-tasks-management`    | Writing or breaking down tasks, epics, stories                                |
| `ref-md-repo-dev-tools`          | Jira tooling & access options (jira-cli/jira-mcp), queries, transitions, CRUD |
| `tool-md-commit`                 | Committing changes                                                            |
| `tool-md-create-skill`           | Creating a new global or project skill                                        |
| `tool-md-create-task`            | Creating Jira tasks from user intent                                          |
| `tool-md-handle-task`            | Reading, planning, and executing Jira tasks                                   |
| `ref-md-agents-skills-authoring` | Writing, reviewing, or editing skill files                                    |
| `tool-md-maintain-skills`        | Auditing, updating, or reorganizing skills                                    |
| `ref-md-agents-security`         | Always loaded implicitly                                                      |

### 6. Report

List which skills were loaded and why (one line per skill). If no skills matched, say so.

### 7. Retry the action with the new context

If this message arrived **after** the agent had already started performing an action, and the user is now asking to load skills:

- Re-run or resume that action after loading the matched skills.
- Modify the action based on the newly loaded context, constraints, and conventions.
- Do not continue as if nothing changed — the point of loading the skills is to change how the action is performed.
- If the action already produced edits or output, review them against the loaded skills and correct course if needed.

## When the Message is Empty

If invoked with no specific context, scan the last few messages in the conversation for topics, file paths, and operations. Load skills that match the ongoing work.
