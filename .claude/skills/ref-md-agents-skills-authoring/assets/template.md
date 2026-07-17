# Skill Starter Template

Use this template when creating a new skill. Adapt it to the real repo before keeping it.

````markdown
---
name: my-skill
description: >-
  Brief description (action-led for tool- skills; a domain noun phrase is fine for ref- skills).
  Use when: trigger condition 1, trigger condition 2.
  Covers topic A, topic B.
metadata:
  author: mindoktor
  version: "1.0"
  shareable-skills.owner-prefix: "md"                  # name token; mirrors the name
  shareable-skills.owner: "mindoktor/agentic-tools"    # canonical home repo
  shareable-skills.domain: "agents"                    # knowledge area; mirrors the name (for ref-)
  shareable-skills.visibility: "organization"          # repo-local | organization | public
  # shareable-skills.requires: "ref-md-other-skill"    # hard deps (comma-separated), if any
  # shareable-skills.suggests: "ref-md-neighbor-skill" # soft deps (comma-separated), if any
  # shareable-skills.reason: "why a surprising visibility or dependency" # optional, when non-obvious
  # Provenance (vendored-sha / vendored-time, or forked-from) is NOT authored here — the
  # vendoring/fork workflow stamps it onto a COPY; never set it on an original. See tool-md-vendor-skill.
---

# Skill Title

## Purpose

One-sentence description of what this skill enforces or enables.

## Prerequisites

- Required skills, tools, or setup the agent needs before using this skill.
- Remove this section if there are no prerequisites.

## When to Use This Skill

- Trigger condition 1.
- Trigger condition 2.

## Scope

This skill covers X. It does not cover Y or Z.
Remove this section if scope is obvious from the description.

## Routing Table

| Task                  | Read                                                |
|-----------------------|-----------------------------------------------------|
| Short task descriptor | [`references/filename.md`](references/filename.md)  |

## Rules

Use the 3 Ws (What / Why / When) to structure each rule:

| What                      | Why                                    | When                               |
|---------------------------|----------------------------------------|------------------------------------|
| Action the agent must take | Business or technical rationale       | Situation that triggers this rule  |

For multi-step workflows, add a Step column:

| Step | What        | Why                  | When                    |
|------|-------------|----------------------|-------------------------|
| 1    | First action | Reason it comes first | Trigger for this step  |
| 2    | Next action  | Reason it follows    | After step 1 succeeds  |

## Examples

```text
Concrete example showing the expected output or structure.
```

## Related Skills

| Skill                        | When to load           |
|------------------------------|------------------------|
| `other-skill`                | Brief trigger          |
````

## Adaptation Reminders

- Replace all placeholder names, commands, and file paths with the real repo's values.
- Set `shareable-skills.owner-prefix` and `shareable-skills.domain` to match the skill's name, and choose a `visibility` (`repo-local` / `organization` / `public`). Uncomment `requires` / `suggests` / `reason` only as needed. Leave the provenance fields alone — they belong to the vendoring workflow, not to authoring an original skill.
- If this is a tool skill, rename it to `tool-md-<verb>[-<target>]` and make both the title and description action-led.
- Remove sections that add no value for this skill's responsibility.
- Move bulky examples, checklists, or reference docs into `references/`. Move output format templates and scaffolds into `assets/`.
- If the skill is repo-specific, make that explicit in the name.
