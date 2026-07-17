---
name: ref-md-agents-local-tasks
description: >-
  Maintain repo-local task tracking files under `.agents/tasks/` (or a legacy
  `.claude/tasks/`). Use when: planning a
  multi-step task, breaking work into subtasks, tracking execution status, recording
  blockers, or maintaining next steps across chat sessions. Covers the task-root
  new/open/closed lifecycle, file structure, README anatomy, proactive status updates, and why a filed solution is a hint the handling agent validates rather than a prescription. Works across all agents
  (Copilot, Claude Code) as a persistent, git-ignored task journal.
metadata:
  author: mindoktor
  version: "2.6"
  shareable-skills.owner-prefix: "md"
  shareable-skills.owner: "mindoktor/agentic-tools"
  shareable-skills.domain: "agents"
  shareable-skills.visibility: "organization"
  shareable-skills.vendored-sha: "f996033"
  shareable-skills.vendored-time: "2026-07-13"
  shareable-skills.suggests: "ref-md-dev-coding-patterns, ref-md-agents-skills-authoring"
---

# Local Task Tracking

_Vendored from agentic-tools — edit the upstream skill there, not this copy; local edits are overwritten on re-vendor._

Structured, git-ignored task journals under `.agents/tasks/` that persist across chat sessions and work with any AI agent.

**Task root:** this skill writes `.agents/tasks/` throughout — the provider-neutral agent dir and the standard for new setups. A repo not yet migrated may still keep its journal under `.claude/tasks/`; check which root exists (`ls -d .agents/tasks .claude/tasks`) and substitute it consistently. Never create a second root next to an existing one.

## Why This Exists

AI agents have built-in tools for in-session tracking (Copilot's `manage_todo_list`, `/memories/session/`) and cross-session learnings (Claude Code's auto memory at `~/.claude/projects/<project>/memory/`), but none provide **structured execution plans** that persist across sessions:

| Built-in feature             | Persists?     | Structured plans?              | Cross-agent?     |
| ---------------------------- | ------------- | ------------------------------ | ---------------- |
| Copilot `manage_todo_list`   | No (per chat) | Steps only, no phases          | Copilot only     |
| Copilot `/memories/session/` | No (per chat) | Free-form                      | Copilot only     |
| Copilot `/memories/repo/`    | Yes           | Free-form                      | Copilot only     |
| Claude Code auto memory      | Yes           | Free-form learnings            | Claude Code only |
| **`.agents/tasks/`**         | **Yes**       | **Objective → Status → TODOs** | **Any agent**    |

This skill fills the gap: a persistent, structured task journal with objectives, phased checklists, status tracking, and blockers — readable and writable by any agent.

It also works as a **user-to-agent inbox**: the user can edit the file while the agent is busy (adding new tasks, reprioritizing, leaving notes), and the agent picks up the changes next time it checks the tracker.

**This skill is not for Jira work item authoring** — that is handled by skills registered in the repo's instruction index (`AGENTS.md`, or a legacy `.github/copilot-instructions.md`; see the Skills table).

## Your Continuous Responsibility
Keep the tracking files current. If we complete a step, hit a blocker, or change direction, immediately reflect that in the corresponding `README.md`. Treat the file as a living execution record.

## File Structure and Naming
One task = one folder, filed under a **lifecycle** subfolder.
- **Location:** `.agents/tasks/<lifecycle>/<task-name>/`, where `<lifecycle>` is `new`, `open`, or `closed` (see below).
- **Naming:** PR-style kebab-case (e.g., `.agents/tasks/new/add-hotkey-configuration/`)
- **Entry point:** Every task folder must contain a `README.md`
- **`TODO.md` stays at the root** (`.agents/tasks/TODO.md`) — it is the quick-task inbox, not a lifecycle bucket.

## Task Lifecycle: `new` / `open` / `closed`

Tasks are bucketed into three sibling folders so `ls .agents/tasks/` gives an at-a-glance overview. The folder is the **coarse** status; each README's `## Current Status` carries the detail.

| Folder    | Meaning                            | Enters when…                                                                                              |
| --------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `new/`    | Created but **work not started**   | Captured/refined but no work has begun — includes a task deferred, or blocked, *before* starting          |
| `open/`   | **Work has started** (in progress) | The first real work lands — includes a task blocked *after* starting, or partly done with a deferred tail |
| `closed/` | **Done or cancelled**              | The objective is met, or the task is abandoned / won't-pursue                                             |

**The boundary rule is simply "has work started?"** — not whether the task is deferred or blocked. A deferred/blocked task that has *not* started stays in `new`; one that started and then got blocked lives in `open`. Move a task `new → open` when work begins, and `open → closed` when it is done or cancelled.

**When moving a task between folders, fix its relative cross-links.** The task's depth changes, so links to `../../skills/…` or to sibling tasks (`../<other-task>/`) shift by one `../` and may need to route through the new bucket (e.g. `../../open/<task>/`). Prefer referencing skills **by name** over relative paths to avoid this (see `ref-md-agents-skills-authoring`). Keep a short `closed/README.md` index of archived tasks and their disposition so the archive stays scannable.

## The `README.md` Anatomy
- **# [Task Name]:** The main title.
- **## Objective:** What we are building and why.
- **## Current Status:** Most recent findings, blockers, or completed work. **(Update this dynamically as context changes.)**
- **## Next Steps (Proposed TODOs):** Remaining work.
  - Group into logical phases using `###` subheadings.
  - Use GitHub-flavored checkboxes:
    `- [ ] Pending step`
    `- [x] Completed step`

## Rules for the AI
1. **Monitor Context:** Keep the current task's `README.md` in mind as we progress.
2. **Update Proactively:** Check off completed items, add discovered subtasks, adjust Current Status.
3. **Communicate:** Summarize what changed so the user can confirm the tracker still matches reality.
4. **Write for a fresh agent:** Every task must be understandable by an agent starting a new session with no conversation history. Include enough **context** — what is wrong or needed, where, why it matters, and what patterns to follow. A task that says "fix the file" is useless; a task that says "in `path/to/File.tsx` (`~/dev/mindoktor`) `Box`+`display:flex` should likely become `Stack` per components.md § Stack over Box" is actionable. Actionable means *enough context to start*, not *a mandated solution*.
5. **A filed solution is a hint, never a prescription.** The agent that later handles the task owns the final call — it has context you (the filing agent) may lack and may find a better fix. So always give the context; when you include a solution, frame it as *one possible way, to be validated on the way in* — "one way to do this is X, but confirm it still holds and choose what works best" — not as a settled verdict. This holds even for a fix that looks clear and mechanical: the handling agent should still confirm it before applying, because the codebase may have moved. Never manufacture a solution just to fill `## Next Steps`; when you genuinely don't know the fix, state the problem and any workaround already applied and leave the solution open. This matters most on a *problem hand-off* (e.g. an upstream fix filed from a consumer repo), where prescribing would presume on context you do not have.
6. **Keep the bucket honest:** move a task `new → open` when work starts and `→ closed` when it is done or cancelled, and fix its relative cross-links on the move. The folder should never contradict the README's `## Current Status`.

## Playground / Scratch Space

Use `.agents/playground/` for temporary files an agent needs during a task — draft scripts, test fixtures, intermediate outputs, scratch notes. This folder is git-ignored and safe for throwaway content. Do not store task plans here; those belong in `.agents/tasks/`.

## Quick-Task Inbox: `TODO.md`

For small, standalone tasks that don't need a full folder, use `.agents/tasks/TODO.md`. This is a flat checklist the user edits freely as an inbox — the agent picks up new items each time it reads the file.

### Task format

Users may write tasks in any of these forms — treat them all as unchecked:

```md
- task description
- [] task description
- [ ] task description
```

When completing a task, **always** normalize to the checked format:

```md
- [x] task description
```

Adding a `**Done.**` summary below the checkbox is encouraged but optional:

```md
- [x] task description
  - **Done.** Brief note on what was done or decided.
```

### Scanning for tasks

When asked to check `TODO.md`, scan for **all** unchecked variants — not just `- [ ]`. A bare `- task` without any checkbox is also an open task. The only format that means "done" is `- [x]`.

## Related Skills

| Skill                            | When to load                                                  |
| -------------------------------- | ------------------------------------------------------------- |
| `ref-md-dev-coding-patterns`     | Code conventions when the tracked task is implementing code   |
| `ref-md-agents-skills-authoring` | Skill structure conventions when the task is authoring skills |
