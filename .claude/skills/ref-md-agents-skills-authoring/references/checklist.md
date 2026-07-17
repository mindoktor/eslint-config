# Skill Authoring Checklist

Use this checklist when creating, reviewing, or refactoring a skill.

## Structure

- [ ] Skill lives at `.claude/skills/<skill-name>/SKILL.md`
- [ ] Folder name is kebab-case
- [ ] `SKILL.md` stays concise — long content moved to `references/`, `assets/`, or `scripts/`
- [ ] All subfile links use relative paths (`./references/...`)

## Frontmatter

- [ ] YAML frontmatter includes `name` and `description`
- [ ] `name` field matches the folder name exactly
- [ ] `name` is 1–64 chars, lowercase alphanumeric + hyphens, no leading/trailing/consecutive hyphens
- [ ] `description` is 1–1024 chars, includes "Use when:" triggers and "Covers ..." topics
- [ ] `description` uses imperative phrasing and focuses on user intent
- [ ] `metadata` block present (recommended, not required)
- [ ] `metadata.author` is `mindoktor` unless the user explicitly requested a different owner
- [ ] If this is a tool skill, the name follows `tool-md-<verb>[-<target>]`
- [ ] If this is a tool skill, the description starts with the action and explains what knowledge or workflow it loads into the agent

## Content

- [ ] Skill has one clear responsibility — not mixing unrelated domains
- [ ] Includes a "When to use" section or equivalent trigger list
- [ ] Guidance uses the target repo's actual commands, file paths, and packages
- [ ] No stale references from a source project were preserved
- [ ] Concrete examples or file structures provided to reduce ambiguity
- [ ] Values stated explicitly, not left implicit
- [ ] Adds only what the agent would get wrong without the skill
- [ ] Provides defaults, not menus — alternatives mentioned briefly
- [ ] Favors procedures over declarations — teaches approach, not specific output
- [ ] Explains the "why" for critical rules (reasoning > rigid directives)
- [ ] Rules and steps use the 3 Ws format (What / Why / When) where applicable

## Agent Capabilities

Check the items that apply to this skill's domain. Not every skill needs all seven:

- [ ] Reasoning: includes chain-of-thought steps or self-reflection checkpoints where decisions matter
- [ ] Memory: gotchas capture past failures; reference files serve as structured knowledge
- [ ] Planning: complex tasks are decomposed into phases with dependencies
- [ ] Perception: input formats and context-gathering steps are declared
- [ ] Learning: validation loops let the agent check and correct its own work
- [ ] Communication: output format templates match the audience
- [ ] Tool calling: scripts are listed, invocation patterns are clear, output is structured

## Progressive Disclosure

- [ ] `SKILL.md` is under 500 lines / 5000 tokens
- [ ] Detailed reference material lives in `references/` or `assets/`
- [ ] Reference file loading is conditional ("Read X if Y happens"), not blanket
- [ ] The dispatcher does not summarize an **exception-bearing** rule as a complete formula (which suppresses reading the reference) — it either states an exceptionless rule in full or flags the hazard and points on (see `best-practices.md` → "Don't Summarize an Exception-Bearing Rule in the Dispatcher")

## Formatting

- [ ] Tables use aligned style — pipes line up across all rows (verify with character count, not eyeballing)
- [ ] Fenced code blocks have a language identifier
- [ ] Blank lines surround every code block and list (MD032)
- [ ] Heading text is unique across the file — prefix with context if needed (MD024)
- [ ] Angle-bracket text like `<Event>` is wrapped in backticks (MD033)
- [ ] Workflow labels are concrete and operational (not vague)
- [ ] Run markdownlint and fix all warnings before finalizing

## Provider Agnosticism

- [ ] No provider-specific assumptions unless a real exception exists
- [ ] If provider files are referenced, the reference-first pattern is preserved
- [ ] Effective guidance is consistent across Copilot, Gemini, and Claude

## Registration

- [ ] Skill registered in the appropriate instructions file (project or home)

## Automation Gates

- [ ] Run `node .claude/skills/ref-md-agents-skills-authoring/scripts/validateSkills.mts` and ensure it passes.
- [ ] Run `skills-ref validate ./my-skill` (or the actual skill path) when available.
- [ ] Re-run markdown diagnostics and clear all reported issues.
- [ ] If the validator reports broken links, fix link paths before final review.

## Naming

- [ ] Every skill uses either `tool-` or `ref-` prefix — no unprefixed skills
- [ ] `tool-` skills use `tool-md-<verb>[-<target>]` with a concrete action verb — they guide multi-step workflows
- [ ] `ref-` skills use `ref-md-<domain>[-<topic>]` naming the knowledge domain — they provide read-only knowledge, not workflows
- [ ] No `ref-` skill contains a procedure/workflow section (extract to a `tool-` skill if it does)
- [ ] No `tool-` skill is named with a noun instead of a verb
