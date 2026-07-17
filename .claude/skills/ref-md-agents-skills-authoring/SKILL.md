---
name: ref-md-agents-skills-authoring
description: >-
  Write and maintain agent skill files across any project.
  Use when: creating a new skill, reviewing or updating an existing one,
  evaluating skill quality, optimizing descriptions for triggering,
  organizing subfiles, adapting copied skills to a different repo,
  or setting up cross-platform parity.
  Covers folder structure, frontmatter, Markdown conventions, naming,
  registration, evals, scripts, description optimization, and the
  agentskills.io spec.
metadata:
  author: mindoktor
  version: "2.34"
  shareable-skills.owner-prefix: "md"
  shareable-skills.owner: "mindoktor/agentic-tools"
  shareable-skills.domain: "agents"
  shareable-skills.visibility: "organization"
  shareable-skills.vendored-sha: "f996033"
  shareable-skills.vendored-time: "2026-07-13"
  shareable-skills.suggests: "tool-md-maintain-skills"
---

# Skill Authoring

_Vendored from agentic-tools — edit the upstream skill there, not this copy; local edits are overwritten on re-vendor._

Universal guidelines for writing agent skills that work across projects and AI providers.

## References

- <https://agentskills.io> — canonical spec for folder layout, file roles, best practices, and description optimization.
- <https://github.com/anthropics/skills> — Anthropic's reference implementation.

## Routing Table

| Task                              | Read                                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Create a new skill                | [`assets/template.md`](assets/template.md)                                                               |
| Choose a skill's domain           | [`references/choosing-a-domain.md`](references/choosing-a-domain.md)                                     |
| Design a tool skill               | [`references/tool-skills.md`](references/tool-skills.md)                                                 |
| Review or refactor a skill        | [`references/checklist.md`](references/checklist.md)                                                     |
| Write effective instructions      | [`references/best-practices.md`](references/best-practices.md)                                           |
| Evaluate skill quality with evals | [`references/evaluating-skills.md`](references/evaluating-skills.md)                                     |
| Bundle scripts in a skill         | [`references/using-scripts.md`](references/using-scripts.md)                                             |
| Optimize a skill's description    | [`references/optimizing-descriptions.md`](references/optimizing-descriptions.md)                         |
| Align markdown tables in a file   | `node .claude/skills/ref-md-agents-skills-authoring/scripts/alignTables.mts <file> [--write \| --check]` |

## Values

- Simplicity over cleverness.
- Maintainability over short-term convenience.
- One responsibility per skill.
- Provider-agnostic by default — skills must work with Copilot, Claude, Gemini, and others.

## Principle of Lack of Surprise

A skill's contents must not surprise the user in their intent. Skills must not contain malware, exploit code, or content that could compromise system security. A skill should be fully describable in a short sentence without omitting anything dangerous or misleading.

## Folder Structure

Follows the [agentskills.io specification](https://agentskills.io/specification):

```text
.claude/skills/<skill-name>/
├── SKILL.md              — required dispatcher: metadata + routing
├── references/           — optional: documentation loaded on demand
├── assets/               — optional: templates, output format examples, static resources
├── scripts/              — optional: executable code
├── evals/                — optional: test cases for evaluating skill quality
└── ...                   — optional: any additional files or directories
```

- `SKILL.md` is the **dispatcher**: describes the domain, lists tech stack (if relevant), and routes tasks to subfiles.
- `references/` is for **documentation** — deep-dive guides on a single concern. The agent reads these when it needs to understand a topic.
- `assets/` is for **templates and resources** — SKILL.md scaffolds, output format templates, config samples, and other files the agent uses as-is or adapts. If a file is a fill-in-the-blanks structure rather than an explanation, it belongs in `assets/`.
- `scripts/` is for **executable code** — scripts the agent runs during a workflow.
- `evals/` is for **test cases** — prompts, assertions, and input files for evaluating skill quality. (Not in the canonical spec diagram — our own added convention, which is itself evidence the set is open, not fixed.)
- **The four named directories are recommended homes with defined roles, not an exhaustive allowlist.** The spec's diagram ends with `└── ... # Any additional files or directories`, so a skill **may** contain subdirectories with other names. Introduce one only when the content is a genuinely distinct category that does not fit the four standard roles — e.g. `environments/` for per-environment reference docs, `scenarios/` for e2e scenario bundles. Prefer the standard four whenever the content fits their role; a custom directory is not an excuse to bypass `references/`. The one-level-deep file-reference rule below still applies inside any custom directory.
- Link subfiles with **relative paths only**: `./references/...`, `./assets/...`, `./scripts/...`.
- Keep file references **one level deep** from `SKILL.md`. Avoid deeply nested reference chains (a reference loading another reference loading another).
- Reference **other skills by name** (in backticks, e.g. `` `ref-md-js-react` ``), not by relative path — a relative `../other-skill/` link breaks the moment the skill is copied or linked into a repo that lacks or renames that neighbor. Keep relative cross-skill links only inside a **cohesive family** that always travels together (e.g. the `ref-md-js-*` set). This keeps a skill **portable**: valid on its own, with no dangling links, wherever it is vendored.

## Frontmatter

Every `SKILL.md` requires YAML frontmatter with at least `name` and `description`.

```yaml
---
name: kebab-case-name
description: >-
  Brief description — action-led for tool- skills, a noun phrase naming
  the domain is fine for ref- skills.
  Include "Use when:" with comma-separated triggers.
  End with "Covers ..." listing key topics.
metadata:
  author: mindoktor
  version: "1.0"
---
```

- `name` **must match** the skill folder name.
- `name` must be 1–64 chars, lowercase alphanumeric + hyphens only. No leading/trailing/consecutive hyphens.
- `description` must be 1–1024 chars. Use imperative phrasing ("Use when…"), focus on user intent, and include keywords that help agents match tasks.
- `license` is optional. Keep it short: a license name (`Apache-2.0`) or a reference to a bundled file (`Proprietary. LICENSE.txt has complete terms`).
- `compatibility` is optional (1–500 chars). Only include it when the skill has specific environment requirements: intended product, system packages, network access, language versions (e.g., `Requires Python 3.14+ and uv`).
- `allowed-tools` is optional and **experimental**. A space-separated string of pre-approved tools (e.g., `Bash(git:*) Bash(jq:*) Read`). Support varies by agent client.
- `metadata` is optional but recommended for traceability. Keys should be reasonably unique to avoid conflicts.
- `metadata.version` uses semver-like numbering. Bump it when the skill's behavior changes meaningfully (new sections, removed guidance, altered procedures). Cosmetic edits (typo fixes, rewording) do not require a bump.
- For home and standard team skills, set `metadata.author` to `mindoktor` unless the user explicitly requests a different owner.

## Progressive Disclosure

Skills load in three stages (per the agentskills.io spec):

1. **Discovery** (~100 tokens) — only `name` + `description` are loaded at startup for all skills.
2. **Activation** (<5000 tokens recommended) — the full `SKILL.md` body loads when a task matches.
3. **Execution** (as needed) — reference files, scripts, and assets load only when required.

Keep `SKILL.md` under **500 lines**. Move detailed material to `references/`.

## Naming Conventions

Skills use a **two-prefix taxonomy** to separate what human developers explicitly invoke from what agents consume as background knowledge. The distinction borrows from the [Model Context Protocol](https://modelcontextprotocol.info/docs/concepts/) (MCP), where **Tools** are actions a user or model triggers and **Resources** are context data loaded behind the scenes.

| Prefix  | Audience         | Purpose                                                 |
| ------- | ---------------- | ------------------------------------------------------- |
| `tool-` | **Dev-facing**   | Actions and workflows a developer explicitly invokes    |
| `ref-`  | **Agent-facing** | Documentation and conventions the agent loads as needed |

Both prefixes are equally available to the agent — it can load either kind autonomously. The difference is discoverability for humans: a dev typing `/tool` in Copilot sees every action skill they can trigger, without wading through internal reference material.

### Prefix rules

Every skill **must** use either `tool-` or `ref-` as its prefix. There are no unprefixed skills.

| Category         | Pattern                     | Examples                                                                        |
| ---------------- | --------------------------- | ------------------------------------------------------------------------------- |
| Action skills    | `tool-md-<verb>[-<target>]` | `tool-md-create-db-migration`, `tool-md-create-task`, `tool-md-maintain-skills` |
| Reference skills | `ref-md-<domain>[-<topic>]` | `ref-md-db-migrations`, `ref-md-js-react`, `ref-md-go-error-handling`           |

Use **kebab-case** for all folder and skill names.

### Deciding between `tool-` and `ref-`

Ask: **would a human developer invoke this skill to run a workflow, or is it background knowledge the agent consumes?**

- If a dev would say "run this for me" (commit my code, create a Jira task, review this PR, test this feature) → `tool-`.
- If it teaches conventions, templates, CLI references, or rules that tool skills load as context → `ref-`.
- If the skill does both, split it: the workflow goes in `tool-*`, the reference material goes in `ref-*`. The tool skill loads the ref skill via its routing table or related-skills section.

### `tool-` naming

- The token after `tool-md-` is a **concrete action verb**: `commit`, `read`, `create`, `review`, `handle`, `maintain`, `explore`, `test`.
- Add `-<target>` only when needed to disambiguate: `tool-md-create-db-migration`, `tool-md-update-siths-certificate`, `tool-md-test-e2e-new-feature`.
- A `tool-` skill **guides the agent through a multi-step workflow**. The name describes the action; the body teaches the knowledge, constraints, and steps that make the action reliable.
- Avoid vague names like `tool-helper`, `tool-utils`, or `tool-workflow`. If the action is unclear, the skill will trigger poorly and overlap with other skills.

### `ref-` naming

- The token after `ref-md-` names the **knowledge domain**: `js`, `dev`, `agents`, `testing`, or a repo short name.
- A `ref-` skill is **read-only knowledge** — conventions, rules, lookup tables, navigation. It teaches, it does not orchestrate.
- Ref skills are the shared knowledge base that tool skills consume. Changing a ref skill improves every tool that references it.
- If a ref skill starts orchestrating multi-step workflows, extract the workflow into a `tool-` skill.

### Owner/domain grouping

Every skill name is `{ref|tool}-md-<domain>[-<topic>]` — an owner prefix, then a domain.

- **Owner** (`md`) — who owns/stewards the skill. Every skill in this repo is Mindoktor's, so all carry `md-`. It is a namespace (like npm's `@mindoktor/`): it keeps names from colliding when symlinked into another repo, and it is multi-owner-ready. A non-`md-` prefix is reserved for skills **imported** from another owner (which keep their original owner, e.g. a hypothetical `ref-acme-deploy`).
- **Domain** — the knowledge area the skill clusters under (`js`, `go`, `py`, `db`, `data`, `ai`, `dev`, `agents`, `repo`, …). For `tool-` skills the token after `md-` is the action verb instead (`commit`, `handle`, `create`).

The prefix encodes **identity** (owner + domain), not visibility. How far a skill may travel (`repo-local`/`organization`/`public`) is the mutable source of truth in frontmatter (see `ref-md-agents-shareable-skills`). Never put a visibility token (`loc-`, `org-`, `pub-`) in a name — visibility changes would force renames and break symlinks, and such a token discards *which* owner the name carries.

The name's owner token and domain are also **mirrored in frontmatter** (`shareable-skills.owner-prefix`/`domain`), validated against the name, so tooling can read them without parsing names. `shareable-skills.owner` additionally records the canonical home repo (`mindoktor/agentic-tools`, or an upstream `org/repo` for a vendored copy). Frontmatter also carries what the name does not: `visibility`, `requires`, `suggests`, `reason`.

| Domain (after `md-`)              | What it covers                                              | Examples                                                      |
| --------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| `js` · `go` · `py` · `rb` · `css` | A language or framework convention (one token per language) | `ref-md-js-typescript`, `ref-md-go-…`, `ref-md-rb-cve`        |
| `db`                              | Databases, schemas, and migrations                          | `ref-md-db-migrations`                                        |
| `data`                            | Data handling — privacy/anonymization, pipelines, quality   | `ref-md-data-anonymization`                                   |
| `ai`                              | Models & intelligence — LLM/prompt-engineering, NLP, ML     | `ref-md-ai-prompt-engineering`, `ref-md-ai-ner`               |
| `api`                             | API design and documentation (REST, GraphQL, OpenAPI)       | `ref-md-api-docs`                                             |
| `infra`                           | CI/CD, deployment, and infrastructure                       | `ref-md-infra-…`                                              |
| `dev`                             | Cross-cutting engineering practice (developer-facing)       | `ref-md-dev-coding-patterns`, `ref-md-dev-workflow`           |
| `biz`                             | Business / cross-department process (PO, designer, dev)     | `ref-md-biz-tasks-management`                                 |
| `agents`                          | The agent/skills system itself                              | `ref-md-agents-skills-authoring`, `ref-md-agents-security`    |
| `repo`                            | A specific Mindoktor repository                             | `ref-md-repo-dev-tools`, `ref-md-repo-mindoktor-testing`      |
| verb (for `tool-`)                | An action a developer invokes                               | `tool-md-commit`, `tool-md-create-task`, `tool-md-handle-cve` |

The set is extensible — add a domain when a genuinely new knowledge area appears, keeping language tokens short (`js`, `go`, `py`). The authoritative list the validator enforces is `ALLOWED_DOMAINS` in `ref-md-agents-shareable-skills`'s `scripts/validateSharing.mts` (the domain token is portability metadata); keep this table in sync with it.

**Choosing the domain:**

- A language or framework convention → its short token (`js`, `go`, `py`, `css`, …)
- Databases → `db`; data handling/privacy → `data`; models / LLM / NLP / ML → `ai`
- An API surface → `api`; CI / deploy / infrastructure → `infra`
- A cross-cutting engineering practice (developer-facing) → `dev`; a business / cross-department process → `biz`
- The agent/skills system itself → `agents`; one specific repository → `repo` + the repo's short name
- A `tool-` workflow → the action verb (`commit`, `handle`, `create`, `maintain`)

For the full decision logic — the two tests, the tie-breakers (`data` vs `ai`, `db` vs `data`, `dev` vs `biz`, …), why "concerns" like docs/testing/git are **not** domains, and realistic per-domain examples — see [`references/choosing-a-domain.md`](references/choosing-a-domain.md).

`dev` vs `biz` is an **audience** split: `dev` is developer-only (git, code, CI); `biz` is the cross-department/business process.

### Shareability metadata

Visibility — how far a skill may travel — and the rest of a skill's metadata live in frontmatter under `shareable-skills.`. `ref-md-agents-shareable-skills` is canonical (full param reference); the summary:

```yaml
metadata:
  shareable-skills.owner-prefix: "md"              # name token / namespace; mirrors the name
  shareable-skills.owner: "mindoktor/agentic-tools" # canonical home repo
  shareable-skills.domain: "agents"                # knowledge area; mirrors the name (for ref-)
  shareable-skills.visibility: "organization"      # repo-local | organization | public
  shareable-skills.requires: "ref-md-agents-skills-authoring"  # hard deps — linked with the skill
  shareable-skills.suggests: "ref-md-repo-dev-tools"           # soft deps — linked only on request
  shareable-skills.reason: "encodes mindoktor service structure"    # when surprising
```

Key meanings, one line each:

- `owner-prefix` / `owner` / `domain` — identity: the name's owner token, the canonical home repo, and the knowledge area.
- `visibility` — how far the skill may travel: `repo-local` (one repo) / `organization` / `public`.
- `requires` — hard deps, linked with the skill; `suggests` — soft deps, linked only on request.
- `reason` — why a surprising visibility or dependency was chosen.

The full rules — the visibility tiers, requires/suggests semantics, the narrower-visibility prohibition,
and the flat-string constraint — live in `ref-md-agents-shareable-skills`.

**Upstream / lineage.** The `agentic-tools` repo's spiritual upstream is [swiftpostlabs/agentic-tools](https://github.com/swiftpostlabs/agentic-tools) (the `sp-` owner prefix, a `.agents/skills/` layout). Full lineage and divergence notes live in `ref-md-agents-shareable-skills`.

### Common mistakes

| Mistake                                                  | Why it's wrong                                                        | Fix                                                                                  |
| -------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Unprefixed skill (`architecture`, `coding-patterns`)     | Agents cannot distinguish action from reference                       | Add `ref-` (it's read-only knowledge) or `tool-` (it's a workflow)                   |
| `ref-` skill with a procedure section                    | Reference skills don't orchestrate                                    | Extract the procedure into a `tool-` skill                                           |
| `tool-` skill named with a noun (`tool-deployment`)      | Tool names need an action verb                                        | Rename to `tool-deploy` or `tool-run-deployment`                                     |
| Vague name (`tool-helper`, `ref-utils`)                  | Poor discoverability, overlaps with everything                        | Name the specific action or domain                                                   |
| Visibility token in the name (`ref-pub-x`, `tool-org-x`) | Visibility is mutable; encoding it forces renames and breaks symlinks | Use the owner prefix in the name; record visibility in `shareable-skills.visibility` |

## SKILL.md Anatomy

A well-structured dispatcher draws from these sections — include only those that add value for the specific skill. Simple linear skills may only need a title, routing table, and rules:

1. **Title** — `# Skill Name` (optionally `— project-name` for project skills)
2. **Purpose / intro** — one-sentence summary
3. **Prerequisites** — skills, tools, or setup required before use
4. **Routing table** — maps tasks to reference files
5. **Tech stack** — framework, language, key tools (project skills only)
6. **When to use** — bullet list of trigger conditions
7. **Scope** — what the skill covers and what goes elsewhere (with links). Include it **whenever the skill borders or overlaps another** (clustered skills like `ref-md-js-*`, or the `dev`/`biz`/`coding-patterns` trio) so the boundary stays explicit and doesn't erode. A standalone skill with no neighbor can rely on the description's `Covers …`.
8. **Rules / Instructions** — concise, actionable guidance
9. **Related skills** — table linking to companion skills

## Adapting Copied Skills

When a skill is copied from another project:

- Replace commands, packages, file paths, and framework references with the target repo's real stack.
- Remove stale references to the source project's conventions.
- If the skill is project-specific, make that explicit in the wording.

## Cross-Platform Parity

Keep effective guidance consistent across provider entry files:

| File                                                        | Role                                       |
| ----------------------------------------------------------- | ------------------------------------------ |
| `AGENTS.md` (or a legacy `.github/copilot-instructions.md`) | Source of truth                            |
| `GEMINI.md`                                                 | Thin stub — reads the source-of-truth file |
| `CLAUDE.md`                                                 | Thin stub — reads the source-of-truth file |

The default source of truth is a root `AGENTS.md`, read natively by most agents; a mature `.github/copilot-instructions.md` remains the source of truth in Copilot-centric repos that have not migrated. For the full model see `ref-md-agents-instructions-authoring`. Provider stubs are created per-repo as needed — a repo only carries the stubs for the providers actually used there (a repo where nobody runs Gemini has `CLAUDE.md` but no `GEMINI.md`).

Only add provider-specific text when there is a real platform-specific need.

## Markdown Conventions

- **Tables**: use aligned style — pipe characters line up across all rows.
- **Fenced code blocks**: always specify a language identifier (` ```json `, ` ```bash `, ` ```text `).
- **Spacing**: one blank line before and after every code block and list.
- **Keep `SKILL.md` concise**: move long checklists, templates, or examples into `references/`.

### JavaScript / TypeScript Script Conventions

- Script filenames should use **camelCase** in JS/TS contexts (for example, `validateSkills.mts`, not `validate_skills.mts`).
- Use **`.mts`** (or `.mjs`) for runnable scripts so they are treated as ES modules without requiring `"type": "module"` in `package.json`. Prefer `.mts` over `.ts` for standalone scripts.
- Prefer modern **ES module imports** (`import ... from ...`) over `require(...)` in TypeScript scripts.

### Markdownlint Gotchas

- **MD032**: a list that follows a paragraph needs a blank line before it — even when the paragraph ends with a colon.
- **Table alignment** (project convention): every row in an aligned table must have pipe characters at the exact same column positions. Do not eyeball — run `node .claude/skills/ref-md-agents-skills-authoring/scripts/alignTables.mts <file> --write` to fix a file, or `--check` to verify one. `validateSkills.mts` enforces this, so a misaligned table fails validation.
- **MD024**: heading text must be unique across the entire file. Under repeated parent sections, prefix the heading: `### Reasoning Patterns`, not `### Patterns`.
- **MD033**: angle-bracket text like `<Event>` or `<module>` is interpreted as inline HTML. Wrap in backticks: `` `<Event>` ``.

## Writing Effective Descriptions

The `description` carries the entire burden of triggering. If it does not convey when the skill is useful, the agent will not activate it.

- **Imperative phrasing**: "Use this skill when…" not "This skill does…"
- **Focus on user intent**: describe what the user is trying to achieve, not the skill's internals.
- **Be pushy**: list contexts where the skill applies, including cases the user might not name explicitly.
- **Keep it concise**: a few sentences to a short paragraph. Hard limit: 1024 chars.

For **tool skills**, make the description action-led: start with the action the skill performs, then say what knowledge or workflow it loads into the agent to perform that action correctly.

For **ref skills**, an action-verb opener is **not** required — a noun phrase naming the domain ("Tracking conventions for mindoktor-app.", "Redux legacy patterns for …") is a perfectly good opener, since the skill *is* the knowledge rather than an action. The "Use when:" triggers and "Covers …" tail still carry the triggering burden either way.

## Spending Context Wisely

Every token in a skill competes for the agent's attention. Focus on what the agent would get wrong without the skill.

- **Add what the agent lacks, omit what it knows** — no need to explain standard concepts.
- **Design coherent units** — not too narrow (forces multi-skill loading) or too broad (hard to activate precisely).
- **Moderate detail** — concise stepwise guidance with a working example beats exhaustive documentation.
- **Provide defaults, not menus** — pick a default tool, mention alternatives briefly.
- **Favor procedures over declarations** — teach *how to approach a class of problems*, not what to produce for a specific instance.
- **Use the 3 Ws** — structure every rule or step as **What** (the action), **Why** (the rationale), **When** (the trigger condition). See below.

## The 3 Ws Framework

Every instruction in a skill should answer three questions: **What** to do, **Why** it matters, and **When** (in which situations) it applies. This replaces vague rules like "handle errors appropriately" with contextual guidance the agent can reason about.

For **standalone rules**, use a table:

```markdown
| What                         | Why                                        | When                               |
| ---------------------------- | ------------------------------------------ | ---------------------------------- |
| Use parameterized queries    | String interpolation creates SQL injection | Any database query with user input |
| Pin dependency versions      | Unpinned deps break reproducibility        | Adding or updating a dependency    |
| Run the linter before commit | Catches style issues early                 | Every commit, no exceptions        |
```

For **multi-step workflows**, add a sequence column:

```markdown
| Step | What                      | Why                                      | When                            |
| ---- | ------------------------- | ---------------------------------------- | ------------------------------- |
| 1    | Back up the database      | Enables rollback if migration fails      | Before any schema change        |
| 2    | Run schema migration      | Adds new columns without data loss       | After backup is verified        |
| 3    | Backfill data             | Populates new columns from legacy fields | After schema migration succeeds |
| 4    | Validate with spot checks | Confirms data integrity before cleanup   | After backfill completes        |
| 5    | Drop legacy columns       | Removes technical debt                   | After validation passes         |
```

This format works because it activates agent reasoning (the *Why* gives purpose), perception (the *When* narrows scope), and planning (the step sequence defines order). See [`references/best-practices.md`](references/best-practices.md) for more examples.

## Key Patterns for Instructions

See [`references/best-practices.md`](references/best-practices.md) for full examples. Summary:

| Pattern                 | When to use                                                           |
| ----------------------- | --------------------------------------------------------------------- |
| Gotchas section         | Non-obvious facts that defy the agent's assumptions                   |
| Output template         | When output must match a specific format                              |
| Checklist               | Multi-step workflows with dependencies or validation gates            |
| Validation loop         | Agent must verify its own work before proceeding                      |
| Plan-validate-execute   | Batch or destructive operations                                       |
| Bundled scripts         | Agent reinvents the same logic across runs                            |
| Load-skill precondition | A stack area has a matching `ref-md-*` skill the agent keeps skipping |

### Load-skill precondition

A `description:` trigger is advisory — the agent still *decides* whether the skill fits. For a self-contained feature ("add a tooltip"), an agent often judges the stack conventions irrelevant and writes the code without loading them, then drifts from rules the skill already documents. Description tuning does not fix this when the trigger already matches (it usually does); the miss is the agent's relevance judgment, not the phrasing.

A consumer repo can close the gap by promoting its instruction-index skill table from advisory to a **precondition**: *before writing code in a stack area, load the matching `ref-md-*` skill(s).* Wire it per path in the repo's own `AGENTS.md` / instruction index (e.g. `CLINIC_APP/**` → React / TanStack Query / MUI / coding-patterns), and, once loaded, apply the precedence rule from `ref-md-dev-coding-patterns` — documented convention beats local imitation (imitate a neighbor only when it already conforms to the skill). A stronger, opt-in enforcement — a pre-write hook that fires the same path → skill map — is documented in `ref-md-agents-hooks`; it is the highest-guarantee, highest-noise option, so weigh it against review being the current safety net.

## Evaluating Skills with Evals

Run structured evaluations to verify a skill works reliably across varied prompts. See [`references/evaluating-skills.md`](references/evaluating-skills.md) for the full workflow. Summary:

1. **Design test cases** — 2-3 realistic prompts with expected outputs, stored in `evals/evals.json`.
2. **Run with and without the skill** — each test case runs twice for comparison.
3. **Write assertions** — verifiable statements about the output (not "output is good").
4. **Grade** — PASS/FAIL with specific evidence from the output.
5. **Iterate** — generalize from failures, keep the skill lean, explain the why. Stop when feedback is consistently empty.

## Eliciting Agent Capabilities

Skills can deliberately activate specific cognitive modes — reasoning, memory, planning, perception, validation, communication, and tool calling. See the "Combining Agent Components" section in [`references/best-practices.md`](references/best-practices.md) for the pattern.

## Skills Directories

Skills live in a `.claude/skills/` directory under some root:

| Directory | Path                     | Holds                                                 |
| --------- | ------------------------ | ----------------------------------------------------- |
| Global    | `~/.claude/skills/`      | User-wide skills an agent reads across every repo.    |
| Project   | `<repo>/.claude/skills/` | Skills owned by, or linked into, a single repository. |

Call the user-wide one **global**, never "home" — "home instructions" is a separate thing (the `~/.copilot/instructions/` index below). Both directories share the same `.claude/skills` segment, so tooling should build every skills path from one segment constant rather than repeating the literal.

To create or remove these symlinks, use the `agentic-tools` repo's **`agentic-tools skills`** CLI (`link` / `unlink` / `prune`) — never hand-rolled `ln -s`. It resolves dependencies and refuses to link `repo-local` skills outward. See `ref-md-agents-shareable-skills` → The linking CLI for the commands.

## Registration

After creating a skill, register it so agents can discover it:

| Scope   | Where to register                                               |
| ------- | --------------------------------------------------------------- |
| Project | `AGENTS.md` (or `.github/copilot-instructions.md`) Skills table |
| Global  | `~/.copilot/instructions/default.instructions.md` Skills table  |

## Validation

Use the [`skills-ref`](https://github.com/agentskills/agentskills/tree/main/skills-ref) reference library to validate a skill's frontmatter and naming conventions:

```bash
skills-ref validate ./my-skill
```

In the `agentic-tools` repo (where skills are authored) — or in any consumer repo that vendors these validators (they ship inside the vendored skill, so a repo's own CI runs them from `.claude/skills/…`, no `agentic-tools` checkout required) — also run the two local validators. `validateSkills.mts` (in this skill) covers authoring and structure — naming, frontmatter essentials, line budget, broken local links, and markdown table alignment:

```bash
node .claude/skills/ref-md-agents-skills-authoring/scripts/validateSkills.mts
```

`validateSharing.mts` (in `ref-md-agents-shareable-skills`) covers the portability metadata — owner-prefix/owner/domain/visibility and the dependency graph (targets exist and are equal-or-wider visibility):

```bash
node .claude/skills/ref-md-agents-shareable-skills/scripts/validateSharing.mts
```

Modern Node runs `.mts` files directly, so no `ts-node` setup is required.

Recommended order:

1. Run both local validators (`validateSkills.mts` + `validateSharing.mts`) for broad repo-level checks.
2. Run `skills-ref validate` for spec-focused validation.
3. Run markdown diagnostics and resolve remaining issues.

## Related Skills

| Skill                     | When to load                                        |
| ------------------------- | --------------------------------------------------- |
| `tool-md-maintain-skills` | Auditing, reorganizing, or updating existing skills |
