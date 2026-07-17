# Hooks — Shared Concepts

Concepts that apply across Claude Code, Copilot CLI, and Gemini CLI. For platform-specific event lists, configuration format, and handler types, see the sibling reference files.

## Execution Model

Hooks run **synchronously** in the agent loop by default — the agent pauses until all matching hooks for an event complete before continuing. This makes them reliable for blocking decisions and context injection, but means slow hooks directly delay the agent.

Use **async / fire-and-forget mode** (when the platform supports it) for pure side effects — logging, telemetry, webhooks — where you do not need to influence the agent's behavior. In async mode the agent continues immediately without waiting.

## Universal Event Categories

Every platform organizes events into the same conceptual buckets:

| Category         | What it covers                                                          | Block capable                                    |
| ---------------- | ----------------------------------------------------------------------- | ------------------------------------------------ |
| **Session**      | Session start and end — initialization, cleanup, inject initial context | Typically no (advisory)                          |
| **Tool**         | Before and after each tool call — the primary interception point        | Yes — fail-closed varies by platform (see below) |
| **Agent turn**   | When the agent loop finishes a turn, or is about to start one           | Yes                                              |
| **Subagent**     | When a subagent is spawned or finishes                                  | Depends on platform                              |
| **Compaction**   | Before context is compressed                                            | Claude only (`PreCompact`); advisory elsewhere   |
| **Notification** | System messages from the agent — relay to Slack, PagerDuty, etc.        | No (fire-and-forget)                             |

See the platform-specific reference for the full event list and which events can block vs. are advisory.

## Matchers

All platforms support filtering hooks by **tool name** or **event subtype** using a matcher. Matchers keep hooks focused and avoid spawning processes for irrelevant events.

| Matcher value                  | Behavior                                 |
| ------------------------------ | ---------------------------------------- |
| Omitted / `*` / `""`           | Fires for every occurrence of the event  |
| `Write`, `Bash`                | Exact tool name match                    |
| `Write\|Edit` or `Write, Edit` | Exact match for either name              |
| Contains any other character   | Treated as a regex: `^mcp__`, `write_.*` |

**Matchers filter by tool name only** — not by file path or command arguments. To filter by path, check `tool_input.file_path` inside the hook body.

Use precise matchers whenever possible. A wildcard matcher spawns the hook process for every tool call; a `Write|Edit` matcher spawns it only for file-write tools.

## Exit Codes (shell hooks)

| Code           | Meaning                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| `0`            | Success — parse stdout as JSON; empty stdout means no decision                                                |
| `2`            | Blocking error — ignore stdout; use stderr as the error message; block the action where the event supports it |
| Other non-zero | Non-blocking error — logged, execution continues                                                              |

**`PreToolUse` hooks are fail-closed on Claude Code and Copilot CLI:** a crash, non-zero exit, or timeout denies the tool call automatically. **Gemini CLI's `BeforeTool` is fail-closed only on exit 2** — any other non-zero exit or malformed stdout JSON is a non-fatal warning and the tool executes with its original parameters (fail-open).

## The Golden Rule: stdout = JSON, stderr = logs

All platforms require that **stdout contains only valid JSON** when you want structured output. Any plain text in stdout causes JSON parsing to fail and the hook's decision to be ignored.

Write all debugging, tracing, and logging to **stderr**:

```bash
echo "debug: checking path: $path" >&2            # ✓ stderr — never parsed
echo '{"permissionDecision":"deny","permissionDecisionReason":"Path blocked"}'  # ✓ stdout — JSON only
```

Validate your JSON before deploying:

```bash
echo "$output" | jq empty 2>/dev/null || { echo "Invalid JSON" >&2; exit 1; }
```

## Common Output Fields

All platforms support a subset of these top-level fields in JSON output:

| Field                             | What it does                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `continue` / `continue_` (Python) | `false` stops the agent entirely after this hook fires                          |
| `systemMessage`                   | Warning message shown to the user (not injected into model context)             |
| `additionalContext`               | Extra text injected into the conversation for the **model** to see (max ~10 KB) |

Event-specific decisions (allow/deny/block, modified inputs, replacement outputs) go inside a nested `hookSpecificOutput` object on Claude and Copilot, or as top-level `decision` fields on Gemini. See the platform references for exact schemas.

**When multiple hooks fire for the same event: deny wins.** A single deny blocks the operation regardless of what other hooks return.

## Writing Effective Hooks

| What                                       | Why                                                            | How                                                                  |
| ------------------------------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------- |
| Keep hooks fast                            | Hooks block the agent loop — slow hooks = slow agent           | Exit early; cache expensive lookups; use async mode for side effects |
| Use precise matchers                       | Avoid spawning processes for irrelevant events                 | `Write\|Edit` instead of no matcher for file-write hooks             |
| Write one hook per concern                 | Focused hooks are easier to test and reason about              | Block in one hook, log in another                                    |
| Validate JSON input before acting          | LLM-supplied args may be malformed or adversarial              | `jq empty` before parsing tool arguments                             |
| Test hooks in isolation                    | Catch output format bugs before deployment                     | `echo '{"tool_name":"Bash",...}' \| bash hook.sh`                    |
| Provide clear denial reasons               | The model uses the reason to avoid retrying the blocked action | `"permissionDecisionReason": "Writes to /etc are not allowed"`       |
| Write logs to stderr or a file, not stdout | Text in stdout breaks JSON parsing                             | `echo "debug: ..." >&2` or `>> .claude/hooks/debug.log`              |
| Handle errors internally                   | Uncaught exceptions can interrupt the agent                    | Wrap HTTP calls and side effects in try/catch                        |
| Use `jq` for JSON parsing                  | `grep`/`sed` on JSON is fragile                                | `tool=$(echo "$input" \| jq -r '.tool_name')`                        |

## Security

- Hooks run with **your user's privileges** — they inherit your full environment, including secrets set in `.env` files that your shell has sourced.
- **Never trust LLM-supplied arguments without validation.** Prompt injection can cause the model to call tools with attacker-controlled values. Always validate `tool_input` fields before acting on them.
- **Do not log or echo secret values** from env vars or hook input — hook stdout and stderr may appear in session transcripts.
- Set strict `timeout` values on hooks that call external services to prevent denial-of-service delays against the agent loop.
- Project-level hooks in public repositories are untrusted by default on some platforms (Gemini fingerprints them; Claude Code and Copilot have policy controls). Review hook scripts from third-party sources before enabling.
