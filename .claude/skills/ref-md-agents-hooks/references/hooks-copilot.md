# Hooks — GitHub Copilot CLI

## Events

| Event                 | Blocks                | Fires when                 | CLI | Cloud Agent        |
| --------------------- | --------------------- | -------------------------- | --- | ------------------ |
| `sessionStart`        | No                    | Session begins or resumes  | Yes | Yes                |
| `sessionEnd`          | No                    | Session terminates         | Yes | Yes                |
| `userPromptSubmitted` | —                     | User submits a prompt      | Yes | Yes (at most once) |
| `preToolUse`          | **Yes (fail-closed)** | Before a tool executes     | Yes | Yes                |
| `postToolUse`         | No                    | After a tool succeeds      | Yes | Yes                |
| `postToolUseFailure`  | No                    | After a tool fails         | Yes | Yes                |
| `agentStop`           | Yes                   | Main agent finishes a turn | Yes | Yes                |
| `subagentStart`       | —                     | Before a subagent spawns   | Yes | Yes                |
| `subagentStop`        | Yes                   | When a subagent completes  | Yes | Yes                |
| `errorOccurred`       | —                     | An error occurs            | Yes | Yes                |
| `preCompact`          | —                     | Before context compaction  | Yes | Auto-trigger only  |
| `permissionRequest`   | Yes                   | Before permission dialog   | Yes | **No**             |
| `notification`        | No                    | System notifications       | Yes | **No**             |

**Cloud agent restrictions:** Linux-only sandbox; only the `bash` field is honored (`powershell` ignored, `command` as fallback); no `permissionRequest` or `notification` events; network is restricted to GitHub/Copilot hosts; filesystem is ephemeral. Use `preToolUse` instead of `permissionRequest` in cloud environments.

## Naming Conventions

Copilot supports two JSON formats. Pick one consistently — do not mix within a session:

| Convention                 | Event name style         | Field style                           | When to use                               |
| -------------------------- | ------------------------ | ------------------------------------- | ----------------------------------------- |
| **Standard (CLI default)** | camelCase: `preToolUse`  | camelCase: `toolName`, `toolArgs`     | New hooks, CLI-only                       |
| **VS Code compatible**     | PascalCase: `PreToolUse` | snake_case: `tool_name`, `tool_input` | Hooks shared with Claude Code / Agent SDK |

In VS Code compatible format, Claude tool names map to Copilot tool names: `bash/powershell` → `Bash`, `view` → `Read`, `create` → `Write`, `edit` → `Edit`, `glob` → `Glob`, `grep/rg` → `Grep`, `web_fetch` → `WebFetch`, `task` → `Agent`.

## Configuration Files & Load Order

Hooks from all sources for the same event run together in this order:

1. **Policy** — `/etc/github-copilot/policy.d/*.json` (macOS/Linux) or `C:\ProgramData\GitHub\Copilot\policy.d\*.json` (Windows) or Windows Registry `HKLM\Software\Policies\GitHub\Copilot` — loaded first; cannot be disabled
2. **User** — `~/.copilot/hooks/*.json` (or `$COPILOT_HOME/hooks/`)
3. **Repository** — `.github/hooks/*.json` — the only location supported in cloud agent
4. **Inline (repository)** — `hooks` key in `.github/copilot/settings.json` or `.github/copilot/settings.local.json`
5. **Inline (user)** — `hooks` key in `~/.copilot/settings.json`
6. **Plugin** — `hooks.json` inside plugin installation directory

Hook configuration is loaded when the CLI starts; restart required to pick up changes.

## Handler Types

| Type      | Notes                                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------- |
| `command` | Shell command. Requires both `bash` and `powershell` fields for cross-platform support; `command` as a fallback |
| `http`    | HTTPS POST to an endpoint. HTTP only allowed for localhost with `COPILOT_HOOK_ALLOW_LOCALHOST=1`                |
| `prompt`  | Text prompt evaluated by the LLM                                                                                |

## Configuration Schema

```json
{
  "version": 1,
  "disableAllHooks": false,
  "hooks": {
    "preToolUse": [
      {
        "type": "command",
        "bash": "/path/to/check.sh",
        "powershell": "powershell -File /path/to/check.ps1",
        "command": "/path/to/check.sh",
        "cwd": "/optional/working/dir",
        "env": { "MY_VAR": "value" },
        "timeoutSec": 30,
        "matcher": "bash|edit"
      }
    ]
  }
}
```

HTTP hook:

```json
{
  "type": "http",
  "url": "https://hooks.example.com/copilot",
  "headers": { "X-Source": "copilot-cli" },
  "allowedEnvVars": ["GITHUB_TOKEN"],
  "timeoutSec": 30
}
```

`allowedEnvVars` — lists env vars that may be interpolated into the URL or headers. HTTP hooks are **fail-open** for `preToolUse` (unlike command hooks, which are fail-closed).

## Input Payloads

All events include `sessionId`, `timestamp` (Unix ms), `cwd`.

**`preToolUse` (standard camelCase):**

```json
{
  "sessionId": "abc123",
  "timestamp": 1704614400000,
  "cwd": "/project",
  "toolName": "bash",
  "toolArgs": { "command": "npm test" }
}
```

**`agentStop`:**

```json
{
  "sessionId": "abc123",
  "timestamp": 1704614400000,
  "cwd": "/project",
  "transcriptPath": "/path/to/transcript",
  "stopReason": "end_turn"
}
```

**`notification`:**

```json
{
  "sessionId": "abc123",
  "timestamp": 1704614400000,
  "cwd": "/project",
  "hook_event_name": "Notification",
  "message": "Human-readable status",
  "title": "Optional title",
  "notification_type": "permission_prompt"
}
```

## Output Payloads

**`preToolUse`:**

```json
{
  "permissionDecision": "allow|deny|ask",
  "permissionDecisionReason": "Required when decision is deny",
  "modifiedArgs": { "command": "modified command" }
}
```

**`agentStop` / `subagentStop`:**

```json
{
  "decision": "block|allow",
  "reason": "Prompt injected as next user turn when blocking"
}
```

**`postToolUse`:**

```json
{
  "modifiedResult": { "resultType": "success", "textResultForLlm": "Replacement output" },
  "additionalContext": "Extra info (max 10 KB combined across all hooks)"
}
```

**`permissionRequest`:**

```json
{
  "behavior": "allow|deny",
  "message": "Reason fed to LLM when denying",
  "interrupt": false
}
```

`interrupt: true` with `deny` stops the agent entirely instead of just blocking the single tool call.

## Exit Codes

| Code           | Behavior                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| `0`            | Parse stdout as JSON                                                                                                |
| `2`            | Warning surfaced to user; `permissionRequest` treats it as deny; `postToolUseFailure` uses it as additional context |
| Other non-zero | Logged as failure; agent continues — **except `preToolUse` is fail-closed**                                         |
| Timeout        | Hook killed; `preToolUse` timeout = deny                                                                            |

## Progress Messages

Command hooks can write progress updates to stdout while running. Progress lines are stripped before final JSON parsing.

```bash
echo '{"type": "progress", "message": "Checking security policy…"}'
echo '{"type": "progress", "message": "Routing request…", "temporary": true}'
```

`temporary: true` replaces the previous transient line in the UI (spinner effect). Use for intermediate status; use non-temporary for permanent log lines.

## `disableAllHooks`

```json
{ "version": 1, "disableAllHooks": true }
```

In a single `hooks/*.json` file → skips that file only.
In `settings.json` → disables all hooks for that repository (policy hooks are unaffected).

## Tool Names for Matching

Built-in tools available for `preToolUse` / `postToolUse` matchers:

`ask_user`, `bash`, `create`, `edit`, `glob`, `grep`, `powershell`, `rg`, `task`, `update_todo`, `view`, `web_fetch`, `web_search`

## Cloud Agent Environment Variables

`GITHUB_COPILOT_API_TOKEN`, `GITHUB_COPILOT_GIT_TOKEN`, `COPILOT_AGENT_PROMPT`, `HOME=/root`. Note: `GITHUB_TOKEN` is **not** set in the cloud agent sandbox.
