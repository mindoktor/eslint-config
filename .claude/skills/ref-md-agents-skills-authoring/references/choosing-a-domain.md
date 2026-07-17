# Choosing a Skill's Domain

Decision guide for the `<domain>` slot in a skill name. Load this when creating or reclassifying a skill and the domain is not obvious. The authoritative allow-list is `ALLOWED_DOMAINS` in `ref-md-agents-shareable-skills`'s `scripts/validateSharing.mts`; the quick-reference table is in [`../SKILL.md`](../SKILL.md).

## First: `ref-` or `tool-`?

- `tool-` — a step-by-step action a developer invokes. Name it by the **verb** (`commit`, `create`, `handle`, `maintain`, `test`, …). It does **not** take a domain.
- `ref-` — read-only knowledge or conventions. Pick a **domain** below.

## The domains

| Domain                            | What it is                                                                  | Realistic examples                                                               |
| --------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `js` · `go` · `py` · `rb` · `css` | One short token per language or framework                                   | `ref-md-js-react`, `ref-md-go-error-handling`, `ref-md-rb-cve`, `ref-md-css-…`   |
| `db`                              | Databases, schemas, migrations                                              | `ref-md-db-migrations`, `ref-md-db-indexing`                                     |
| `data`                            | The data itself — privacy/anonymization, pipelines, quality, labeling       | `ref-md-data-anonymization`, `ref-md-data-pii-handling`, `ref-md-data-pipelines` |
| `ai`                              | Models & intelligence — LLM/prompt-engineering, RAG, NLP, ML, eval          | `ref-md-ai-prompt-engineering`, `ref-md-ai-llm-judge`, `ref-md-ai-ner`           |
| `api`                             | API contracts & docs (REST, GraphQL, OpenAPI)                               | `ref-md-api-docs`                                                                |
| `infra`                           | CI/CD, deployment, infrastructure                                           | `ref-md-infra-ci`, `ref-md-infra-terraform`                                      |
| `dev`                             | Cross-cutting engineering practice (dev-facing): code quality, git/PR, docs | `ref-md-dev-coding-patterns`, `ref-md-dev-workflow`                              |
| `biz`                             | Business / cross-department process                                         | `ref-md-biz-tasks-management`                                                    |
| `agents`                          | The agent/skills system itself                                              | `ref-md-agents-skills-authoring`, `ref-md-agents-security`                       |
| `repo`                            | One specific repository                                                     | `ref-md-repo-dev-tools`, `ref-md-repo-mindoktor-testing`                         |

## Two tests for "does X deserve its own domain?"

A token earns a domain only if it passes **both**:

1. **Clear boundary** — you can place a skill in it without agonizing (low overlap with other domains).
2. **Proportionate volume** — enough actual or expected skills to justify a bucket, not one lonely skill.

Fail either → fold it into a broader domain, and revisit if it grows (see "Adding a domain later"). This is why `llm`/`nlp`/`ml` collapsed into `ai` (heavy mutual overlap + tiny volume), while `data` stayed separate (clean boundary, distinct discipline).

## Tie-breakers (the calls that actually recur)

| Unsure between…          | Rule                                                                                                                                                                | Example                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| a language vs `dev`      | Tied to one language → the language; applies across languages → `dev`                                                                                               | "const arrow functions" → `js`; "leave code better" → `dev` |
| `dev` vs `biz`           | Audience: developer-only → `dev`; POs/designers also touch it → `biz`                                                                                               | PR conventions → `dev`; Jira story authoring → `biz`        |
| `db` vs `data`           | Where data *lives* (schema, migrations) → `db`; what you *do* with it → `data`                                                                                      | migration files → `db`; anonymization → `data`              |
| `data` vs `ai`           | "Could it exist with no model?" Yes → `data`; inherently about a model → `ai`                                                                                       | PII pipeline → `data`; NER → `ai`                           |
| `api` vs `infra`         | The contract/docs → `api`; the pipeline that builds/ships it → `infra`                                                                                              | OpenAPI spec → `api`; deploy workflow → `infra`             |
| `agents` vs `dev`        | About the *skills/agent system* → `agents`; about building the *product* → `dev`/lang                                                                               | skill-authoring → `agents`; product code style → `dev`      |
| `repo` vs a topic domain | "How *this repo* works" → `repo`; a reusable convention that merely lives there → the topic domain (keep repo-specific bits in the `repo`/app skill — base + delta) | mindoktor build quirks → `repo`; generic React rules → `js` |

## Concerns are not domains

Some things are **activities you perform on a subject**, not knowledge areas. They attach to the domain that owns the subject (plus the audience) — they never get their own domain:

| Concern             | Where it goes                                                                          |
| ------------------- | -------------------------------------------------------------------------------------- |
| Documentation       | engineering docs → `dev`; API docs → `api`; skill docs → `agents`; user-facing → `biz` |
| Testing             | unit tests → the language (`js`); e2e → the testing `repo`                             |
| Git / commits / PRs | `dev` (the workflow practice)                                                          |
| Code review         | `dev`                                                                                  |

If you are tempted to add `docs`, `testing`, `git`, or `review` as a domain, that is the signal it is a concern — route it to the owning domain instead.

## Adding a domain later

When a folded area genuinely grows (several skills **and** a clean boundary — e.g. `ai` splitting into `ai-llm` vs `ai-nlp`, or a real technical-writing practice earning `docs`): add the token to `ALLOWED_DOMAINS` in `ref-md-agents-shareable-skills`'s `scripts/validateSharing.mts` **and** the table in [`../SKILL.md`](../SKILL.md) in the same change. Keep language tokens short (`js`, `go`, `py`).
