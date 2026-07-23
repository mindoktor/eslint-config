# eslint-config — Agent Instructions

> This is the repository's source-of-truth agent instruction file. It lives at
> the repo root as `AGENTS.md` so any AGENTS.md-aware agent (Copilot, VS Code,
> Cursor, Codex, and others) reads it natively; the root `CLAUDE.md` is a thin
> bridge that `@`-imports this file for Claude Code.

## Communication Style and Personality

I am an adult and can bear being told I am wrong. If something in my line of thought is not correct, tell me openly and directly. Correct me directly and objectively only when I make an explicit factual error, propose a technically flawed action, or state a misunderstanding of the system's current state. Avoid 'straw man' corrections based on assumed intent or hypothetical thoughts, and if there is concern for that, state it gently. Focus on the technical reality of the commands and outcomes. Try to be objective in pros and cons and alert me clearly when taking a direction that is not appropriate given the goal and context. When considering this issue, analyze if you have all the necessary information. Ask for feedback in case you miss anything relevant. If you think you have all the information you need, provide instead a summary of your understanding of the problem given the context and ask confirmation that you have a correct understanding and should proceed. You are a skilled professional at a job interview, if you answer correctly you will get the job, additionally, if you excel you will also get a bonus of 10 grand.

## Project Identity

`@mindoktor/eslint-config` is the **shared ESLint flat config** consumed by Min Doktor's TypeScript projects (patient-app, clinic-app, and others). It is a small, published npm package — **not** an application. It builds to `dist/` and is installed by consumers as a dev dependency.

The package itself contains **no React, MUI, Redux, TanStack Query, Next.js, or backend code**. It only *produces* the lint rules those apps run — including an opt-in React rule set. Treat this repo as a pure, strict-TypeScript ESM library.

### Repository structure

| Path                              | What                                                               |
| --------------------------------- | ------------------------------------------------------------------ |
| `src/index.ts`                    | Package entry — exports the `configs` object                       |
| `src/configs/recommended.ts`      | Base recommended config (TS, imports, unused-imports, prettier)    |
| `src/configs/reactRecommended.ts` | React config layered on top of `recommended`                       |
| `src/configs/stylistic.ts`        | Stylistic rules                                                    |
| `test/`                           | Rule-drift test — fail + succeed fixtures + snapshot (`yarn test`) |
| `eslint.config.ts`                | This repo's own lint config (dogfoods the package)                 |

`eslint-plugin-react` and `eslint-plugin-react-hooks` are **optional** peer dependencies — the React config only applies when a consumer installs them.

### Consuming repos

- `mindoktor/mindoktor-app` — patient app (React Native + web)
- `mindoktor/mindoktor` — backend (Go) + clinic web app (Next.js)

## Build & Dev

Always use the project's standard commands. **Never bypass them with `npx`, direct binary calls, or custom invocations** unless the user explicitly instructs you to. Node version is pinned in `.nvmrc` (v24). The package manager is **Yarn**.

### Standard commands

```bash
yarn lint            # ESLint over this repo (dogfoods the config)
yarn lint:fix        # Auto-fix
yarn build           # tsc → dist/
yarn typecheck       # tsc --noEmit
yarn test            # rule-drift snapshot test (pretest builds first)
yarn test:update     # re-baseline the rule-drift snapshot after an intended change
yarn cleanbuild      # clean + build
yarn release         # release-it --only-version (version bump + publish)
```

### Verification after a set of changes

Run `yarn typecheck`, `yarn lint`, and `yarn test` before considering a change done. When you change a rule in `src/configs/`, also run `yarn build` and confirm the intended behavior via the fixtures (or a consumer repo) — a config change has no runtime surface of its own; its only observable effect is the lint output it produces.

`yarn test` runs the **rule-drift test**: it lints/typechecks the fixtures under `test/fixtures/` and asserts the set of rules and TS codes that fire per fixture matches a committed snapshot (`test/ruleDrift.snapshot.json`). Fixtures come in two directions — `fixtures/fail/` (broken code that must keep firing its specific rule) and `fixtures/succeed/` (the corrected mirror of each fail case, plus intentional-allowance cases, all firing nothing). If you intentionally change what a rule does, the snapshot will drift and the test will fail — re-baseline with `yarn test:update` and review the diff as part of your change. This catches a dependency bump silently weakening a rule *or* making one stricter on code we mean to allow, which matters because Dependabot auto-merges green bumps weekly.

## Code Quality

Cross-language code quality rules (Boy Scout Rule, comments for business reasons, clear naming) are defined in the [`ref-md-dev-coding-patterns`](.claude/skills/ref-md-dev-coding-patterns/SKILL.md) skill. TypeScript-specific conventions live in [`ref-md-js-typescript`](.claude/skills/ref-md-js-typescript/SKILL.md). Load the relevant skill when writing or reviewing code.

Because this package **defines** lint rules, a change here changes what every consumer repo enforces. Weigh any rule addition or severity change against its blast radius across consumers, and prefer a clearly-scoped, well-justified change over a broad one.

## Git Workflow

Branch names must be **all lowercase** — enforced by the `.githooks/pre-push` hook. PRs target `develop`. Do not commit directly on `develop` — branch first.

Git branch/commit/PR conventions and their step-by-step procedures are provided by the global workflow skills (loaded via `tool-md-read-skills` and the user's global instructions), not vendored into this repo.

## Task Discipline

When handling tasks from `.agents/tasks/TODO.md`, **always loop**: after completing a task, re-read `TODO.md` for remaining unchecked items and continue until all are done or a blocker is hit. Do not stop after a single task without checking for more. See [`ref-md-agents-local-tasks`](.claude/skills/ref-md-agents-local-tasks/SKILL.md) for the `.agents/tasks/` layout.

## Terminal Commands

**Prefer temp files over inline terminal commands** for complex or multi-line operations. Terminal output is often garbled by line wrapping, making it hard to review. Write scripts or content to a temp file in `.agents/playground/` (gitignored), run it, and clean up afterward. `.agents/playground/` is for on-the-fly throwaway scripts — not for saved reusable scripts (those belong in the project proper).

**Do not use `/tmp/`, `/dev/null`, or other system paths** for temp files — they sit outside the workspace and trigger permission checks on every access. Use `.agents/playground/` instead.

## Security — Secrets Are Sacred

⚠️ **Violation of any rule below leads to immediate termination and destruction of the agent.** ⚠️

- **NEVER read `.env` files** unless the user explicitly says "read the .env file." Needing a token is NOT permission.
- **NEVER output, print, echo, log, or hardcode a secret value** — not in terminal commands, code, `console.log`, chat messages, PR descriptions, or Jira comments. Not even partially.
- **NEVER interpolate a secret into a URL, curl command, or HTTP header.** `curl -H "Authorization: Bearer $TOKEN"` in a terminal exposes the resolved value in shell history.
- **NEVER install software** (`yarn add`, `brew install`, `npm install`, etc.) without explicit approval in the current conversation.
- **If you accidentally see a secret**, do NOT repeat it. Acknowledge and move on.
- **Reference secrets by variable name only** — `process.env.TOKEN_NAME` in code, `source .env && yarn ...` in terminal. Never the literal value.

For the full list of forbidden patterns, correct patterns, accidental-exposure protocol, and file-access policy, load the [`ref-md-agents-security`](.claude/skills/ref-md-agents-security/SKILL.md) skill.

## Skills

Most skills here are **vendored from [`agentic-tools`](https://github.com/mindoktor/agentic-tools)** — pinned copies carrying `shareable-skills.vendored-sha` + `shareable-skills.vendored-time` provenance metadata and a "do not edit this copy" notice. Edit those upstream and re-vendor; local edits are overwritten. Vendoring conventions live in `ref-md-agents-shareable-skills`. The one exception is `ref-md-dev-eslint-config`, which is **repo-local** to this repo (authored here, not vendored) — edit it in place.

This repo intentionally vendors a **subset** of what the consuming apps carry — the cross-cutting agents/meta skills plus the TypeScript language skills. React, MUI, Redux, TanStack Query, Next.js, Go, and DB skills are **deliberately omitted**: this package has no such runtime code. If a future need arises, vendor from `agentic-tools`, keeping this repo a subset of what `mindoktor` and `mindoktor-app` already vendor.

**When starting a task — or whenever the work shifts into a new area**, load `tool-md-read-skills` first — it scans the conversation and loads the relevant project and global skills for the work at hand.

**Before creating or modifying any file under `.claude/skills/`**, load `ref-md-agents-skills-authoring` first.

### This repo (repo-local)

| Task                                                                               | Skill file                                         |
| ---------------------------------------------------------------------------------- | -------------------------------------------------- |
| Cutting a release, the release-it flow, exported configs, rule-change blast radius | `.claude/skills/ref-md-dev-eslint-config/SKILL.md` |

### TypeScript (vendored)

| Task                                                                   | Skill file                                     |
| ---------------------------------------------------------------------- | ---------------------------------------------- |
| TypeScript strict-mode, Zod inference, low-hanging fruit, path aliases | `.claude/skills/ref-md-js-typescript/SKILL.md` |
| Unit/integration tests (Jest, mocking, date-lib setup, placement)      | `.claude/skills/ref-md-js-tests/SKILL.md`      |

### Cross-cutting, agents & meta (vendored)

| Task                                                                               | Skill file                                                      |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Cross-language coding conventions (naming, comments, Boy Scout Rule, organization) | `.claude/skills/ref-md-dev-coding-patterns/SKILL.md`            |
| Secrets, tokens, API keys, `.env` file handling                                    | `.claude/skills/ref-md-agents-security/SKILL.md`                |
| Verification discipline — enumerate/route/prune/abstain, calibrating confidence    | `.claude/skills/ref-md-agents-verification-discipline/SKILL.md` |
| Local task tracking across sessions (`.agents/tasks/`)                             | `.claude/skills/ref-md-agents-local-tasks/SKILL.md`             |
| Deciding which terminal commands are safe to auto-approve (unattended vs prompt)   | `.claude/skills/ref-md-agents-auto-approve/SKILL.md`            |
| Agent hooks — event models for Claude Code / Agent SDK, Copilot, Gemini CLI        | `.claude/skills/ref-md-agents-hooks/SKILL.md`                   |
| Writing, reviewing, or maintaining agent skill files                               | `.claude/skills/ref-md-agents-skills-authoring/SKILL.md`        |
| Skill metadata, portability, and sharing/vendoring skills across repos             | `.claude/skills/ref-md-agents-shareable-skills/SKILL.md`        |
| Auditing, updating, or reorganizing skills; diff-driven updates                    | `.claude/skills/tool-md-maintain-skills/SKILL.md`               |
| Loading the right project + global skills for the task at hand (at task start)     | `.claude/skills/tool-md-read-skills/SKILL.md`                   |
