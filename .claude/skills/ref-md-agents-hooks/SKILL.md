---
name: ref-md-agents-hooks
description: >-
  What agent hooks are, how to write effective ones, and the event models for
  Claude Code / Agent SDK, GitHub Copilot CLI, and Gemini CLI. Use when:
  implementing tool-call interception, automating an action on every tool call,
  edit, or commit ("run lint after every edit", "from now on do X whenever Y"),
  session lifecycle automation, context injection, blocking dangerous
  operations, audit logging, or forwarding a notification when the agent
  finishes or needs input — on any of the three platforms. Covers the shared execution
  model (synchronous, JSON in/out, matchers, exit codes, security), a
  cross-platform event comparison table, and per-platform references for
  Claude Code CLI, Agent SDK (TypeScript/Python), GitHub Copilot, and
  Gemini CLI.
metadata:
  author: mindoktor
  version: "1.6"
  shareable-skills.owner-prefix: "md"
  shareable-skills.owner: "mindoktor/agentic-tools"
  shareable-skills.domain: "agents"
  shareable-skills.visibility: "organization"
  shareable-skills.vendored-sha: "f996033"
  shareable-skills.vendored-time: "2026-07-13"
---

# Agent Hooks

_Vendored from agentic-tools — edit the upstream skill there, not this copy; local edits are overwritten on re-vendor._

Hooks are shell commands (or SDK callback functions) that execute automatically at defined points in an agent's lifecycle — before/after a tool call, at session boundaries, when a subagent starts, and more. They let you block dangerous operations, inject context, log every action, modify tool arguments, or relay notifications to external services — without changing the agent's core prompt or model.

All three platforms share the same core model: **synchronous execution by default, JSON in/out, matchers to narrow which events fire**. They differ in available event types, handler kinds, and configuration format.

## Routing Table

| Topic                                                                                                                  | Read                                                         |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Shared concepts — execution model, universal event categories, matchers, exit codes, writing effective hooks, security | [`references/hooks-shared.md`](references/hooks-shared.md)   |
| Claude Code CLI (settings.json) + Agent SDK callback hooks (Python/TypeScript)                                         | [`references/hooks-claude.md`](references/hooks-claude.md)   |
| GitHub Copilot CLI (`.github/hooks/`) + cloud agent                                                                    | [`references/hooks-copilot.md`](references/hooks-copilot.md) |
| Gemini CLI (`.gemini/settings.json`)                                                                                   | [`references/hooks-gemini.md`](references/hooks-gemini.md)   |

## Event Cross-Reference

| Concept                             | Claude Code / SDK   | GitHub Copilot      | Gemini CLI            |
| ----------------------------------- | ------------------- | ------------------- | --------------------- |
| Before tool (blocking, fail-closed) | `PreToolUse`        | `preToolUse`        | `BeforeTool`          |
| After tool (success)                | `PostToolUse`       | `postToolUse`       | `AfterTool`           |
| Session start                       | `SessionStart`      | `sessionStart`      | `SessionStart`        |
| Session end                         | `SessionEnd`        | `sessionEnd`        | `SessionEnd`          |
| Subagent start                      | `SubagentStart`     | `subagentStart`     | —                     |
| Subagent stop                       | `SubagentStop`      | `subagentStop`      | —                     |
| Agent turn complete                 | `Stop`              | `agentStop`         | `AfterAgent`          |
| Notification                        | `Notification`      | `notification`      | —                     |
| Before model call                   | —                   | —                   | `BeforeModel`         |
| After model call                    | —                   | —                   | `AfterModel`          |
| Before tool selection               | —                   | —                   | `BeforeToolSelection` |
| Agent loop start                    | —                   | —                   | `BeforeAgent`         |
| Permission dialog                   | `PermissionRequest` | `permissionRequest` | —                     |
| Context compaction                  | `PreCompact`        | `preCompact`        | `PreCompress`         |

## Pattern: pre-write skill-load reminder

A recurring miss: an agent edits code in a stack area (e.g. a React component under `CLINIC_APP/**`) without loading the matching `ref-md-*` skill, then drifts from a convention the skill documents but CI does not enforce. A `PreToolUse` hook matching `Edit`/`Write` can close it — inspect the target path against a path → skill map and, when it matches a stack area, inject a reminder to load that skill (non-blocking, exit 0 with context) or block until acknowledged (fail-closed, exit 2).

```jsonc
// path → skill map the hook script owns, e.g.
// CLINIC_APP/**            → ref-md-js-react, ref-md-js-tanstack-query, ref-md-js-mui, ref-md-dev-coding-patterns
// **/*.go                  → ref-md-go-golang, ref-md-go-tests
```

This is the **highest-guarantee, highest-noise** enforcement option, and it is **opt-in per consumer repo**, not shipped here — a shared skill cannot register a `settings.json` hook (see the `agentic-tools hooks` installer in the `agentic-tools` repo's `AGENTS.md`). Weigh it against review being the current safety net before wiring it: a blocking variant that fires on every edit under a broad glob generates friction and false positives. The advisory instruction-index alternative (a load-skill *precondition* in the repo's `AGENTS.md`) is documented in `ref-md-agents-skills-authoring`; the convention the loaded skill then enforces is in `ref-md-dev-coding-patterns` (documented convention beats local imitation).

## Related Skills

| Skill                            | When to load                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------- |
| `ref-md-agents-auto-approve`     | Which Claude Code tool calls are safe to auto-approve via hooks                  |
| `ref-md-agents-security`         | Security rules when hooks handle env vars, secrets, or user-supplied data        |
| `ref-md-agents-skills-authoring` | The advisory load-skill precondition, the softer alternative to a pre-write hook |
| `ref-md-dev-coding-patterns`     | The convention a loaded skill enforces (documented convention beats imitation)   |
