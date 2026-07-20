# Tool Skills

Use this reference when creating or reviewing skills whose name starts with `tool-`.

## What Makes a Tool Skill Different

A tool skill is not just a topic area. It exists to **perform an action while eliciting the right knowledge, constraints, and workflow from the agent**.

Examples of well-named tool skills:

- `tool-md-create-db-migration` — create a database migration while loading naming conventions, SQL patterns, and testing workflow
- `tool-md-maintain-skills` — audit and maintain skills while loading compliance, freshness, and deduplication rules
- `tool-md-create-task` — create a Jira task while loading task templates, refinement questions, and workflow
- `tool-md-update-siths-certificate` — update a local certificate while loading K8s context and file placement rules

The **name** should state the action. The **body** should encode the knowledge the agent needs to perform that action correctly.

## Naming Rule

See the **Naming Conventions** section in [`SKILL.md`](../SKILL.md) for the full `tool-` / `ref-` taxonomy, naming patterns, and decision heuristic.

## Description Pattern

The description for a tool skill should do two jobs:

1. State the action the skill performs.
2. State the knowledge, workflow, or constraints it loads so the agent can perform that action correctly.

### Good pattern

```yaml
description: >-
  Commit pending changes with focused, well-structured commits.
  Use when: the user asks to commit, or after completing a unit of work.
  Analyzes the working tree, groups related files, runs project checks,
  and follows GPG signing discipline.
```

This works because the first sentence names the action (`Commit`), while the rest explains the knowledge it loads (grouping, checks, GPG discipline).

## Anatomy of a Strong Tool Skill

Tool skills usually benefit from these sections:

1. **Title** — action-oriented, often `# Tool: <Action>`
2. **Purpose** — one sentence describing the action
3. **Prerequisites** — required skills, tools, or setup
4. **Workflow** — ordered action steps
5. **Scope** — what the tool skill covers and what it does not
6. **Related skills** — adjacent tool or domain skills

### Why this structure works

| Section        | Why it matters for tool skills                           | When it is most important                  |
| -------------- | -------------------------------------------------------- | ------------------------------------------ |
| Prerequisites  | Tool actions often depend on other skills or CLIs        | Commits, PRs, Jira, security, deployment   |
| Workflow       | Tool skills benefit from explicit sequencing of actions  | Any multi-step action                      |
| Scope          | Prevents a tool skill from becoming a vague catch-all    | Broad or reusable tool skills              |
| Related skills | Tool skills often compose with domain or workflow skills | When the action depends on other knowledge |

## How Tool Skills Elicit Knowledge

A tool skill should not only say *what to do*. It should actively load the knowledge the agent needs to avoid mistakes.

| What the tool skill does  | What knowledge it should elicit                       |
| ------------------------- | ----------------------------------------------------- |
| Executes an action        | Concrete workflow steps and stop conditions           |
| Makes decisions           | Trade-offs, defaults, and selection rules             |
| Uses external tools       | Invocation patterns, flags, expected outputs          |
| Writes or edits artifacts | Structure, templates, registration, validation checks |
| Risks side effects        | Safety constraints, approvals, validation loops       |

This is why `tool-md-create-db-migration` is not just "run goose create" and `tool-md-maintain-skills` is not just "check the checklist." The skill exists to inject judgment and process, not merely a command.

## Checklist for Tool Skills

When reviewing a tool skill, ask:

- Does the name clearly describe the action?
- Does the description start with the action and then explain the loaded knowledge?
- Does the workflow show how the agent performs the action safely?
- Does the skill load any prerequisite skills or references explicitly?
- Does the skill say what the action does **not** cover?
- Would a different tool skill name trigger more precisely?
