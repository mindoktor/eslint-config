---
name: ref-md-agents-auto-approve
description: >-
  Decide which terminal commands are safe to auto-approve (run unattended)
  versus which must always prompt. Use when: configuring
  chat.tools.terminal.autoApprove or Claude Code permissions, adding an
  allowlist entry, reducing how often the agent stops to ask ("stop prompting
  me for this", "let it run without asking"), or judging whether a
  git/gh/yarn/jira-cli command can run without confirmation. Core principle:
  reading is safe, writing and
  destructive actions always ask. Covers the read-vs-write classification,
  the security exceptions, regex pattern gotchas, and a never-auto-approve list.
metadata:
  author: mindoktor
  version: "1.3"
  shareable-skills.owner-prefix: "md"
  shareable-skills.owner: "mindoktor/agentic-tools"
  shareable-skills.domain: "agents"
  shareable-skills.visibility: "organization"
  shareable-skills.vendored-sha: "f996033"
  shareable-skills.vendored-time: "2026-07-13"
  shareable-skills.requires: "ref-md-agents-security"
  shareable-skills.reason: "The classification and example patterns target this org's stack (yarn, uv run jira-cli, gh); each repo keeps its actual allowlist in its own settings."
---

# Agent Auto-Approve Policy

_Vendored from agentic-tools — edit the upstream skill there, not this copy; local edits are overwritten on re-vendor._

Guidance for deciding which terminal commands an agent harness may run **without
prompting the user**, and which must always require explicit confirmation.

## Guiding Principle

> **Reading is safe to auto-approve. Writing, editing, and destructive actions always ask.**

A command qualifies for auto-approval only when it **observes** state without
changing it: listing, viewing, diffing, searching, checking status. Anything that
**mutates** state — the filesystem, git history, a remote, a tracker, the machine
— must prompt, every time.

When in doubt, **do not auto-approve.** A prompt costs a click; an unattended
destructive command costs recovery work or worse.

## The Security Exception — Some Reads Are Still Not Safe

"Reading is safe" has one hard carve-out: **reads that conflict with
`ref-md-agents-security` are never
auto-approved**, because they can expose secrets even though they only "read."

| Never auto-approve (even though it reads)                              | Why                                                      |
| ---------------------------------------------------------------------- | -------------------------------------------------------- |
| `cat .env`, `head .env.local`, `grep TOKEN .env*`                      | Reads credential files — forbidden by the security skill |
| `printenv`, `env`, `echo $TOKEN`, `set`                                | Dumps environment variables, exposing secret values      |
| `gh api` / `curl` returning secret-bearing payloads                    | Response body can surface tokens into transcripts        |
| Reading `credentials.json`, `*.pem`, `*.key`, `serviceAccountKey.json` | Secret material — forbidden by the security skill        |

The security skill's prohibitions **override** this skill. If a read touches
secrets, treat it as forbidden, not as a safe read.

## How to Classify a Command

| Step | What                                                                      | Why                                                           | When                                 |
| ---- | ------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------ |
| 1    | Identify the verb's effect: observe vs mutate                             | Mutation is the dividing line                                 | Every classification                 |
| 2    | If it can expose secrets, stop — it is forbidden, not safe                | Security overrides read-safety                                | Any command touching env/credentials |
| 3    | Check the **flags**, not just the subcommand                              | Flags flip safe verbs into destructive ones (`git branch -D`) | Any command with options             |
| 4    | Prefer **whitelisting** the safe form over blacklisting the dangerous one | A blacklist misses forms you did not predict                  | When writing a regex pattern         |
| 5    | If any branch of the command can write, exclude the whole command         | Partial safety is not safety                                  | Compound or flag-variable commands   |

## Example Read-Safe Allowlist (and Why)

An illustrative set of read-safe patterns, shown in VS Code
`chat.tools.terminal.autoApprove` regex form — the same classification applies
to Claude Code `permissions.allow` rules. A repo's **actual** allowlist lives in
that repo's own config (`.vscode/settings.json` or `.claude/settings.json`);
use this table as the reference for what a well-scoped entry looks like:

| Pattern                                                                                      | What it allows                       | Safe because                                              |
| -------------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| `^yarn typecheck$`                                                                           | Type checking                        | Read-only analysis                                        |
| `^yarn lint( --quiet)?$`                                                                     | Linting                              | Read-only analysis                                        |
| `^yarn test( .*)?$`                                                                          | Test runs                            | Tests do not mutate tracked state                         |
| `^git (diff\|log\|show\|status)( .*)?$`                                                      | Inspect history, changes, and status | Pure reads                                                |
| `^git branch( -(a\|r\|v+\|av+\|rv+)\| --(show-current\|all\|remotes\|verbose\|list))?$`      | List branches                        | **Whitelisted flags only** — excludes `-d`/`-D`/`-m`/`-M` |
| `^gh (pr (view\|list\|checks\|diff\|status)\|issue (view\|list))( .*)?$`                     | Read PRs/issues + comments           | Read-only GitHub queries                                  |
| `^gh api (?!.* (-X\|--method\|-f\|-F\|--field\|--raw-field\|--input)).*$`                    | Pure GET API calls                   | Excludes any method override or body/field flag           |
| `^uv run .* jira-cli (issue (view\|list)\|sprint list\|board list\|project list\|me)( .*)?$` | Read Jira tasks/comments             | Read-only jira-cli subcommands                            |

## Pattern Gotchas

Lessons that make a "read-only" pattern leak into write territory:

| Gotcha                              | What goes wrong                                                                    | Fix                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **`gh api` field flags imply POST** | `gh api repos/o/r/issues -f title=x` writes without `-X`/`--method` ever appearing | Exclude `-f`/`-F`/`--field`/`--raw-field`/`--input` too                        |
| **Glued short flags**               | `gh api -XPOST ...` bypasses a pattern that only matches `-X POST` (with a space)  | Match the flag token without requiring a following space                       |
| **`git branch` is dual-purpose**    | `-d`/`-D` delete, `-m`/`-M` rename — destructive                                   | Whitelist only the read flags; never use an open `git branch .*`               |
| **Blacklist blind spots**           | Listing forbidden verbs misses synonyms and new flags                              | Whitelist the safe form; reject everything else by default                     |
| **`matchCommandLine`**              | Without it, only the program name is matched, ignoring args/flags                  | Set `"matchCommandLine": true` so the whole line is evaluated                  |
| **Compound commands**               | `git log && rm -rf x` reads then destroys                                          | Anchor patterns with `^...$`; reject `&&`, `;`, `\|` to files, `>` redirection |

## Never Auto-Approve

Always prompt for these — they mutate state or run untrusted code:

- **Git writes/destructive**: `git commit`, `push`, `reset`, `rebase`, `merge`,
  `checkout`/`switch`, `branch -d`/`-D`/`-m`/`-M`, `clean`, `stash drop`,
  `tag -d`, `cherry-pick`, `revert`, `restore`.
- **GitHub writes**: `gh pr create`/`merge`/`close`/`edit`/`comment`/`review`,
  `gh issue create`/`close`/`comment`, `gh api` with `-X`/`--method` or any
  field/input flag, `gh release create`, `gh repo delete`.
- **Jira writes**: `jira-cli` `create`, `edit`, `transition`, `assign`,
  `comment add`, or any mutating subcommand.
- **Filesystem destructive**: `rm`, `mv`, `cp` over existing files, `>`/`>>`
  redirection into tracked files, `truncate`, `chmod`/`chown` at scale.
- **Installs**: any package manager install (`yarn add`, `npm install`,
  `brew install`, `pip install`, `uv add`, …) — including **bare `yarn`**,
  which defaults to `yarn install` and runs postinstall scripts — forbidden
  without explicit approval per `ref-md-agents-security`.
- **Anything touching secrets**: see the security exception above.

## Where This Is Enforced

Auto-approval is a **harness/client feature**, configured per agent client.
The behavioral judgment in this skill is the source of truth; the config is the
mechanism.

| Agent client          | Mechanism                                                           | Location                |
| --------------------- | ------------------------------------------------------------------- | ----------------------- |
| **Copilot / VS Code** | `chat.tools.terminal.autoApprove` regex map with `matchCommandLine` | `.vscode/settings.json` |
| **Claude Code**       | `permissions.allow` / `permissions.deny` tool patterns              | `.claude/settings.json` |

When adding an entry, document *why* it is read-safe (mirror the table above) so
the next reviewer can audit the allowlist quickly.

## Related Skills

| Skill                    | When to load                                                               |
| ------------------------ | -------------------------------------------------------------------------- |
| `ref-md-agents-security` | Secrets, `.env` files, installs — the overriding exceptions to read-safety |
