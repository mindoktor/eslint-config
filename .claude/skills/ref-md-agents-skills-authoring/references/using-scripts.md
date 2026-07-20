# Using Scripts in Skills

Reference: <https://agentskills.io/skill-creation/using-scripts>

Skills can instruct agents to run shell commands and bundle reusable scripts in a `scripts/` directory.

## One-Off Commands

When an existing package already does what you need, reference it directly in `SKILL.md` without a `scripts/` directory. Use runtime-resolving tools:

| Tool       | Ecosystem | Example                   |
| ---------- | --------- | ------------------------- |
| `uvx`      | Python    | `uvx ruff@0.8.0 check .`  |
| `npx`      | Node.js   | `npx eslint@9.0.0 .`      |
| `bunx`     | Bun       | `bunx biome check .`      |
| `deno run` | Deno      | `deno run npm:prettier .` |

Tips:

- **Pin versions** so behavior is stable over time.
- **State prerequisites** in `SKILL.md` (e.g. "Requires Node.js 18+") or use the `compatibility` frontmatter field.
- **Move complex commands into scripts** — a one-off works for simple tool invocations, not multi-step logic.

## Self-Contained Scripts

Bundle scripts in `scripts/` that declare their own dependencies inline. The agent runs them with a single command — no separate install step.

### Python (PEP 723)

```python
# /// script
# dependencies = ["beautifulsoup4>=4.12,<5"]
# requires-python = ">=3.11"
# ///

from bs4 import BeautifulSoup
# ...
```

Run with: `uv run scripts/extract.py`

Use `uv lock --script` to create a lockfile for full reproducibility.

### Deno / Bun

Deno and Bun support inline dependency resolution via import maps or direct URL imports. Use `deno.json` for pinned versions.

## Referencing Scripts from SKILL.md

List available scripts so the agent knows they exist:

```markdown
## Available scripts

- **`scripts/validate.sh`** — Validates configuration files
- **`scripts/process.py`** — Processes input data
```

Then instruct the agent to run them with relative paths:

```markdown
## Workflow

1. Run validation: `bash scripts/validate.sh "$INPUT_FILE"`
2. Process results: `python3 scripts/process.py --input results.json`
```

Relative paths work from the skill directory root. The same convention works in reference files.

## Designing Scripts for Agentic Use

Agents read stdout and stderr to decide what to do next. A few design choices make scripts dramatically easier for agents to use:

- **No interactive prompts** — agents run in non-interactive shells. Accept all input via flags, environment variables, or stdin.
- **Document with `--help`** — this is how agents learn the interface. Include description, available flags, and usage examples. Keep it concise.
- **Helpful error messages** — say what went wrong, what was expected, and what to try.
- **Structured output** — JSON/CSV over free-form text. Data to stdout, diagnostics to stderr.
- **Idempotency** — agents may retry. "Create if not exists" is safer than "create and fail on duplicate."
- **Meaningful exit codes** — use distinct codes for different failure types and document them in `--help`.
- **Predictable output size** — default to summaries and support `--offset` or `--output FILE` for large results.
- **Dry-run support** — for destructive or stateful operations, a `--dry-run` flag lets the agent preview what will happen.
