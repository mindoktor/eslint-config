# Hooks — Gemini CLI

## Events

Gemini CLI exposes 10 lifecycle events. Several are unique to Gemini — they fire at **model-call granularity** rather than just tool granularity, giving finer-grained control than the other platforms:

| Event                 | Blocks                | Fires when                                            | Unique to Gemini |
| --------------------- | --------------------- | ----------------------------------------------------- | ---------------- |
| `SessionStart`        | No                    | Session begins                                        |                  |
| `SessionEnd`          | No                    | Session ends                                          |                  |
| `BeforeAgent`         | Yes                   | After prompt submission, before the agent loop starts | ✓                |
| `AfterAgent`          | Yes                   | After the agent loop completes a turn                 | ✓                |
| `BeforeModel`         | Yes                   | Before every LLM API request                          | ✓                |
| `AfterModel`          | Yes                   | After every LLM response                              | ✓                |
| `BeforeToolSelection` | Yes                   | Before the model selects which tool to call           | ✓                |
| `BeforeTool`          | **Yes (exit 2 only)** | Before a tool executes                                |                  |
| `AfterTool`           | Yes                   | After a tool executes                                 |                  |
| `PreCompress`         | No                    | Before context compression                            |                  |

**Prefer `AfterAgent` over `AfterModel` for end-of-turn validation.** `AfterModel` fires on every model call including streaming chunks; `AfterAgent` fires once per completed turn. Use `AfterModel` only when you need real-time per-response processing.

**`BeforeToolSelection`** is a lighter intervention than `BeforeTool` — it lets you filter the available tool list before the model even picks one, rather than blocking after the model has already committed to a tool call.

## Configuration

Hooks are defined in `settings.json` under a `hooks` key. Configuration layers (highest to lowest precedence):

1. Project: `.gemini/settings.json`
2. User: `~/.gemini/settings.json`
3. System: `/etc/gemini-cli/settings.json`
4. Extensions

```json
{
  "hooks": {
    "BeforeTool": [
      {
        "matcher": "write_file|replace",
        "hooks": [
          {
            "name": "security-check",
            "type": "command",
            "command": "${GEMINI_PROJECT_DIR}/.gemini/hooks/security.sh",
            "timeout": 5000,
            "description": "Validates writes against security policy"
          }
        ]
      }
    ]
  }
}
```

Only `"command"` type is currently supported.

## Hook Fields

| Field         | Required | Notes                                                                |
| ------------- | -------- | -------------------------------------------------------------------- |
| `type`        | Yes      | `"command"` only                                                     |
| `command`     | Yes      | Shell command or script path                                         |
| `name`        | No       | Friendly identifier shown in logs and the `/hooks` panel             |
| `timeout`     | No       | Milliseconds (default 60000)                                         |
| `description` | No       | Purpose explanation shown in the UI                                  |
| `matcher`     | No       | Regex for tool events; exact string for lifecycle events (see below) |

Make scripts executable before use: `chmod +x .gemini/hooks/*.sh`

## Matchers

Matcher behavior differs by event type — a single field but two semantics:

| Event type                                                          | Matcher evaluated as   | Example                               |
| ------------------------------------------------------------------- | ---------------------- | ------------------------------------- |
| Tool events (`BeforeTool`, `AfterTool`)                             | **Regular expression** | `"write_.*"`, `"write_file\|replace"` |
| Lifecycle events (`BeforeAgent`, `AfterAgent`, `BeforeModel`, etc.) | **Exact string**       | `"startup"`                           |
| `*` or `""` or omitted                                              | Wildcard — matches all |                                       |

## Input to Hooks

Hooks receive JSON on **stdin**. All events include `session_id`. Tool events add `tool_name` and `tool_args`:

```json
{
  "session_id": "abc123",
  "tool_name": "write_file",
  "tool_args": { "path": "src/foo.ts", "content": "..." }
}
```

**Environment variables set for every hook process:**

| Variable             | Value                                         |
| -------------------- | --------------------------------------------- |
| `GEMINI_PROJECT_DIR` | Project root                                  |
| `GEMINI_PLANS_DIR`   | Plans directory                               |
| `GEMINI_SESSION_ID`  | Current session ID                            |
| `GEMINI_CWD`         | Current working directory                     |
| `CLAUDE_PROJECT_DIR` | Alias of `GEMINI_PROJECT_DIR` (compatibility) |

## Exit Codes & Output

| Exit code | Behavior                                                               |
| --------- | ---------------------------------------------------------------------- |
| `0`       | Parse stdout as JSON                                                   |
| `2`       | Critical block; stderr becomes the rejection message shown to the user |
| Other     | Non-fatal warning; execution continues with original parameters        |

**stdout must contain only valid JSON.** Malformed output causes the CLI to default to "Allow" and surface the error as a system message.

**Block a tool call:**

```json
{ "decision": "deny", "reason": "Path is restricted to /src" }
```

**Stop the agent loop entirely:**

```json
{ "continue": false }
```

**Suppress metadata from session logs** (user-facing messages still display):

```json
{ "suppressOutput": true }
```

## Project Hook Fingerprinting

Gemini generates a unique identity for each project hook based on its `name` and `command`. When a hook runs for the first time, or when its `command` changes, the CLI warns the user before executing. This prevents silent substitution attacks — a PR that modifies a hook script will trigger the warning on the next run.

Project hooks (`.gemini/` directory) are untrusted by default. Review hook scripts from third-party sources before enabling.

## `environmentVariableRedaction`

Off by default. Prevents env var values from appearing in logs or hook output. Enable explicitly:

```json
{
  "security": {
    "environmentVariableRedaction": {
      "enabled": true,
      "allowed": ["MY_REQUIRED_TOOL_KEY"]
    }
  }
}
```

## Gemini-Specific Best Practices

| What                                                         | Why                                                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Use `AfterAgent` not `AfterModel` for end-of-turn checks     | `AfterModel` fires on every chunk; `AfterAgent` fires once per turn                               |
| Use `BeforeToolSelection` to filter available tools          | Lighter than blocking at `BeforeTool` — prevents the model from committing to a tool you'd reject |
| Cache per-session lookups in `.gemini/hook-cache.json`       | Avoid repeating expensive policy or auth lookups on every tool call                               |
| Set tight `timeout` for fast validators (`5000` ms)          | Default is 60 s — a validator that takes 60 s visibly delays the agent                            |
| Use precise matchers on tool events                          | Tool matchers are regex; `"write_file\|replace"` instead of `".*"`                                |
| Enable `environmentVariableRedaction` for any hook that logs | Prevents accidental secret leakage into hook output or debug files                                |
| Version-control hook scripts alongside `settings.json`       | Keeps the fingerprint stable; use `.gitignore` only for cache files and logs                      |
