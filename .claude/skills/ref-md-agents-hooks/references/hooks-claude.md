# Hooks — Claude Code CLI + Agent SDK

Two interfaces share the same event names and JSON schema but differ in how hooks are registered and what languages are supported:

| Interface                         | Where hooks live        | Handler format                                                            |
| --------------------------------- | ----------------------- | ------------------------------------------------------------------------- |
| **Claude Code CLI**               | `settings.json` files   | Shell commands, HTTP endpoints, MCP tool calls, LLM prompts, or subagents |
| **Agent SDK (TypeScript/Python)** | `options.hooks` in code | Async callback functions — no shell spawned                               |

---

## A. Claude Code CLI — Shell Command Hooks

### Configuration Files & Load Order

| Location                                                                                                                   | Scope                                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `/Library/Application Support/ClaudeCode/managed-settings.json` (macOS) / `/etc/claude-code/managed-settings.json` (Linux) | Organization policy — loaded first; cannot be disabled by `disableAllHooks`; requires elevated privileges |
| `~/.claude/settings.json`                                                                                                  | All projects for this user                                                                                |
| `.claude/settings.json`                                                                                                    | This project (commit to share)                                                                            |
| `.claude/settings.local.json`                                                                                              | This project (gitignored)                                                                                 |
| Plugin `hooks/hooks.json`                                                                                                  | While the plugin is enabled                                                                               |

Resolution order: managed policy → user → project → local → plugin. All matching hooks for an event run; policy hooks cannot be overridden by project settings.

> **Installing a hook from a source repo — symlink for `~/.claude`, copy for a
> project.** When you export a hook script into the user location
> (`~/.claude/hooks/`), **symlink** it to the source repo — exactly like skills
> are symlinked into `~/.claude/skills/` — so edits to the source stay live and
> the installed copy can't silently drift. Only **copy** when vendoring into a
> separate project that is committed and cloned on other machines, where an
> absolute symlink back to the source repo could not resolve. The `command` path
> in `settings.json` is unaffected either way — it points at the same location;
> only the file behind it (link vs copy) differs.

### JSON Structure

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/check.sh",
            "if": "Bash(rm *)",
            "timeout": 30,
            "statusMessage": "Running safety check…"
          }
        ]
      }
    ]
  }
}
```

### Event Reference

| Event                 | Blocks                | Fires when                                           |
| --------------------- | --------------------- | ---------------------------------------------------- |
| `SessionStart`        | No                    | Session begins or resumes                            |
| `Setup`               | No                    | Launched with `--init-only` / `--maintenance`        |
| `SessionEnd`          | No                    | Session terminates                                   |
| `UserPromptSubmit`    | Yes                   | Before Claude processes the user prompt              |
| `UserPromptExpansion` | Yes                   | When a slash command expands, before reaching Claude |
| `PreToolUse`          | **Yes (fail-closed)** | Before a tool executes                               |
| `PostToolUse`         | No                    | After a tool succeeds                                |
| `PostToolUseFailure`  | No                    | After a tool fails                                   |
| `PostToolBatch`       | Yes                   | After a parallel batch of tool calls resolves        |
| `PermissionRequest`   | Yes                   | Before the permission dialog appears                 |
| `PermissionDenied`    | —                     | After a tool is denied by the auto-mode classifier   |
| `Stop`                | Yes                   | When Claude finishes a turn                          |
| `StopFailure`         | —                     | When a turn ends due to API error                    |
| `SubagentStart`       | —                     | When a subagent is spawned                           |
| `SubagentStop`        | Yes                   | When a subagent finishes                             |
| `TeammateIdle`        | Yes                   | When a team member goes idle                         |
| `TaskCreated`         | Yes                   | When a task is being created                         |
| `TaskCompleted`       | Yes                   | When a task is marked complete                       |
| `Notification`        | No                    | System notifications (fire-and-forget)               |
| `MessageDisplay`      | No                    | While an assistant message displays                  |
| `PreCompact`          | Yes                   | Before context compaction                            |
| `PostCompact`         | —                     | After context compaction                             |
| `FileChanged`         | —                     | When a watched file changes                          |
| `CwdChanged`          | —                     | When the working directory changes                   |
| `ConfigChange`        | Yes                   | When a config file changes                           |
| `InstructionsLoaded`  | —                     | When CLAUDE.md / `.claude/rules/*.md` loads          |
| `WorktreeCreate`      | —                     | When a git worktree is created                       |
| `WorktreeRemove`      | —                     | When a git worktree is removed                       |
| `Elicitation`         | —                     | When an MCP server requests user input               |
| `ElicitationResult`   | —                     | After the user responds to an MCP elicitation        |

**Matcher field** for events that support it — filters by:

| Event                            | Matches against                                              |
| -------------------------------- | ------------------------------------------------------------ |
| Tool events                      | Tool name                                                    |
| `SessionStart`                   | Session source: `startup`, `resume`, `clear`, `compact`      |
| `SessionEnd`                     | End reason: `clear`, `resume`, `logout`, `other`             |
| `Notification`                   | Notification type: `permission_prompt`, `auth_success`, etc. |
| `SubagentStart` / `SubagentStop` | Agent type name                                              |
| `FileChanged`                    | Literal filename                                             |
| `Setup`                          | CLI flag: `init`, `maintenance`                              |

### Handler Types

| Type       | Use for                                                                                |
| ---------- | -------------------------------------------------------------------------------------- |
| `command`  | Shell scripts or any executable — the most common type                                 |
| `http`     | HTTP or HTTPS POST to a configured endpoint `url`                                      |
| `mcp_tool` | Call a tool on a connected MCP server; supports `${path}` substitution from hook input |
| `prompt`   | Ask Claude (a sub-model) to make a yes/no decision                                     |
| `agent`    | Spawn a subagent for complex verification (experimental)                               |

**Command hook fields:**

| Field           | Notes                                                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `command`       | Without `args` → shell form (supports pipes, `&&`, globs). With `args` → exec form (no shell; each element is one argument) |
| `args`          | Array — use for paths with `${CLAUDE_PROJECT_DIR}` placeholders to avoid word splitting                                     |
| `if`            | Bash pattern filter: `"Bash(rm *)"` — pre-filters before spawning the hook process                                          |
| `async`         | `true` = fire-and-forget; agent continues without waiting                                                                   |
| `asyncRewake`   | `true` = re-wake Claude when the async hook exits with code 2                                                               |
| `timeout`       | Seconds (default 600 for command/http/mcp_tool, 30 for prompt)                                                              |
| `statusMessage` | Custom spinner text shown to the user while the hook runs                                                                   |
| `once`          | `true` = runs once per session then removes itself (skill frontmatter only)                                                 |

> **Gotcha — `if` is a best-effort pre-filter, not a reliable gate.** It (and
> `matcher`) narrow on the *tool*, not on the command's content, and a malformed
> rule fails *open* — the hook then runs on every matched call. Observed in
> practice: an `if: "Bash(gh pr create*)"` entry fired its reminder on *every*
> Bash command. Do the authoritative gating **inside the script**: read the
> tool-call JSON on stdin, match the field you care about (e.g.
> `.tool_input.command`), and produce output only on a real match. Treat
> `matcher`/`if` as a cheap optimization, never as correctness.
>
> **A soft (non-blocking) `PreToolUse` hook must `exit 0`.** Exit 2 blocks the
> tool call (see *Exit Code 2* below), so a hook that only injects
> `additionalContext` should print its JSON on a match, print nothing otherwise,
> and always exit 0 — never let a "reminder" turn into an accidental block.

**Path placeholders** (resolved in `command` and `args`):

| Placeholder             | Value                            |
| ----------------------- | -------------------------------- |
| `${CLAUDE_PROJECT_DIR}` | Project root                     |
| `${CLAUDE_PLUGIN_ROOT}` | Plugin installation directory    |
| `${CLAUDE_PLUGIN_DATA}` | Plugin persistent data directory |

**`CLAUDE_ENV_FILE`** — Available in `SessionStart`, `Setup`, `CwdChanged`, and `FileChanged` hooks. Write `export VAR=value` lines to this file to persist variables into subsequent Bash commands for the rest of the session.

```bash
#!/bin/bash
# SessionStart hook — inject branch info
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo "export CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)" >> "$CLAUDE_ENV_FILE"
fi
```

### JSON Input

All events receive this JSON on stdin:

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/project",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "effort": { "level": "high" }
}
```

Tool events add `tool_name` and `tool_input`. Subagent events add `agent_id` and `agent_type`.

### JSON Output — Universal Fields

| Field              | Default | Effect                                                                                    |
| ------------------ | ------- | ----------------------------------------------------------------------------------------- |
| `continue`         | `true`  | `false` stops Claude entirely; shows `stopReason` to the user                             |
| `suppressOutput`   | `false` | Hide hook stdout from the session transcript                                              |
| `systemMessage`    | —       | Warning shown to the user (not the model)                                                 |
| `terminalSequence` | —       | Terminal escape sequence — use instead of writing to `/dev/tty` (OSC 0/1/2/9/99/777, BEL) |

### JSON Output — Event-Specific

**`PreToolUse`:**

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Writes to /etc are not allowed",
    "additionalContext": "Extra info injected for Claude",
    "updatedInput": { "command": "modified command" }
  }
}
```

`permissionDecision` values: `allow`, `deny`, `ask`, `defer`. When multiple hooks fire: `deny` > `defer` > `ask` > `allow`.

**`PostToolUse`:**

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "This file is generated — edit src/schema.ts instead.",
    "updatedToolOutput": "Replacement output that Claude sees instead of the real result"
  }
}
```

**`SessionStart`:**

```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "Branch: main\nLast CI: green",
    "initialUserMessage": "First message to send automatically",
    "sessionTitle": "Auto-generated session name",
    "watchPaths": ["/path/to/watch"],
    "reloadSkills": true
  }
}
```

**`Stop` / `SubagentStop` / `PostToolBatch` / `UserPromptSubmit`:**

```json
{
  "decision": "block",
  "reason": "Explanation injected as the next user turn when blocking"
}
```

### Exit Code 2 — Blocking Effects

| Events                                                                         | Effect                                                  |
| ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `PreToolUse`, `PermissionRequest`, `UserPromptSubmit`, `Stop`, `PostToolBatch` | Blocks the action                                       |
| `SubagentStop`, `TaskCreated`, `TaskCompleted`, `ConfigChange`, `PreCompact`   | Blocks the action                                       |
| `PostToolUse`, `PostToolUseFailure`                                            | Shows stderr to Claude (tool already ran; cannot block) |
| `Notification`, `SessionStart`, `SessionEnd`, etc.                             | Shows stderr to the user                                |

### Policy Controls

```json
{ "disableAllHooks": true }
```

In a single `hooks/*.json` file → skips that file only.
In `settings.json` → disables all hooks for that project (policy hooks are unaffected).

`allowManagedHooksOnly` in managed policy → blocks all user/project/plugin hooks; only force-enabled plugin hooks run.

---

## B. Agent SDK — Callback Function Hooks

SDK hooks are **async callback functions** registered in code. No shell is spawned; the callback runs in the same process. Both Python and TypeScript SDKs support the same event model with minor API differences.

### Configuration

```typescript
// TypeScript
for await (const message of query({
  prompt: "...",
  options: {
    hooks: {
      PreToolUse: [{ matcher: "Write|Edit", hooks: [myCallback] }]
    }
  }
})) { ... }
```

```python
# Python
options = ClaudeAgentOptions(
    hooks={"PreToolUse": [HookMatcher(matcher="Write|Edit", hooks=[my_callback])]}
)
async with ClaudeSDKClient(options=options) as client:
    await client.query("...")
```

To also load shell command hooks from settings files, pass the appropriate `settingSources` / `setting_sources`:

```python
options = ClaudeAgentOptions(setting_sources=["project"])  # loads .claude/settings.json
```

### HookMatcher Fields

| Field     | Type       | Default  | Notes                              |
| --------- | ---------- | -------- | ---------------------------------- |
| `matcher` | string     | —        | Same pattern rules as CLI matchers |
| `hooks`   | callback[] | required | Array of async functions           |
| `timeout` | number     | 60       | Seconds                            |

### Callback Signature

```typescript
// TypeScript
const myHook: HookCallback = async (input, toolUseID, { signal }) => {
  // input — typed per event: PreToolUseHookInput, PostToolUseHookInput, etc.
  // toolUseID — correlates PreToolUse ↔ PostToolUse for the same tool call
  // signal — AbortSignal; pass to fetch() so HTTP requests cancel on timeout
  return {};  // empty = allow, no modification
};
```

```python
# Python
async def my_hook(input_data, tool_use_id, context):
    # input_data: dict; input_data["hook_event_name"] tells you the event type
    # tool_use_id: correlates Pre ↔ Post for the same call
    return {}
```

All hook inputs share `session_id`, `cwd`, `hook_event_name`. `agent_id` and `agent_type` are set when the hook fires inside a subagent.

### Available Events

| Event                | Python | TypeScript | Notes                                                          |
| -------------------- | ------ | ---------- | -------------------------------------------------------------- |
| `PreToolUse`         | Yes    | Yes        | Fail-closed; supports deny/allow/ask/defer                     |
| `PostToolUse`        | Yes    | Yes        | Can inject `additionalContext` or replace output               |
| `PostToolUseFailure` | Yes    | Yes        | Tool already failed                                            |
| `PostToolBatch`      | No     | Yes        | Fires once per parallel batch before the next model call       |
| `UserPromptSubmit`   | Yes    | Yes        | Can block or add context                                       |
| `MessageDisplay`     | No     | Yes        | Redact/reformat displayed text without changing the transcript |
| `Stop`               | Yes    | Yes        | Can block to force continuation                                |
| `SubagentStart`      | Yes    | Yes        |                                                                |
| `SubagentStop`       | Yes    | Yes        |                                                                |
| `PreCompact`         | Yes    | Yes        |                                                                |
| `PermissionRequest`  | Yes    | Yes        |                                                                |
| `Notification`       | Yes    | Yes        | Use `async: true` — fire-and-forget                            |
| `SessionStart`       | **No** | Yes        | Python: use shell hooks in `.claude/settings.json`             |
| `SessionEnd`         | **No** | Yes        | Python: same workaround                                        |
| `Setup`              | No     | Yes        |                                                                |
| `TeammateIdle`       | No     | Yes        |                                                                |
| `TaskCompleted`      | No     | Yes        |                                                                |
| `ConfigChange`       | No     | Yes        |                                                                |
| `WorktreeCreate`     | No     | Yes        |                                                                |
| `WorktreeRemove`     | No     | Yes        |                                                                |

### Output Format

```typescript
return {
  // Top-level — all events
  systemMessage: "Warning shown to user",
  continue: true,          // false = stop agent entirely

  // Event-specific
  hookSpecificOutput: {
    hookEventName: "PreToolUse",       // required — identifies the event
    permissionDecision: "deny",
    permissionDecisionReason: "Not allowed",
    updatedInput: { file_path: "/sandbox/foo.txt" },  // modified args
    additionalContext: "Info for Claude"
  }
};
```

Return `{}` to allow the operation without changes. `hookSpecificOutput` must always include `hookEventName`.

### Async Side Effects

```typescript
// TypeScript
return { async: true, asyncTimeout: 30000 };
```

```python
# Python — avoid the reserved keyword
return {"async_": True, "asyncTimeout": 30000}
```

Async hooks cannot block, modify, or inject context — the agent has already continued. Use only for logging, telemetry, and notifications.

### Multiple Hooks — Parallel Execution & Priority

When multiple hooks match an event, they run **in parallel**. For permission decisions, the most restrictive wins: `deny` > `defer` > `ask` > `allow`. Write each hook to act independently — do not rely on another hook having run first.

### Python vs TypeScript Differences

|                                         | Python                                                 | TypeScript      |
| --------------------------------------- | ------------------------------------------------------ | --------------- |
| `async` return field                    | `async_` (reserved keyword)                            | `async`         |
| `continue` return field                 | `continue_`                                            | `continue`      |
| `SessionStart` / `SessionEnd`           | Not available as SDK callbacks                         | Available       |
| `PostToolBatch`, `MessageDisplay`, etc. | Not available                                          | Available       |
| `agent_id` / `agent_type`               | `PreToolUse`, `PostToolUse`, `PostToolUseFailure` only | All hook inputs |
