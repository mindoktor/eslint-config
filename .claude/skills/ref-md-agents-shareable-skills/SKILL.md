---
name: ref-md-agents-shareable-skills
description: >-
  Reference for skill metadata, portability, and sharing skills across repos.
  Use when: classifying a skill as repo-local, organization, or public; recording
  shareable-skills metadata (owner, domain, visibility, dependencies); deciding a
  skill's name; making a skill portable; vendoring, linking, or otherwise sharing
  a skill into another repo; or reviewing whether a skill should stay local.
  Covers the frontmatter param reference, the identity-vs-visibility model, the
  visibility and dependency tiers, the portability rule for cross-skill
  references, the cross-repo sharing approaches (vendor / link / reference /
  marketplace), how to compose a shared base skill with a separate repo-specific
  delta skill (skills have no native merge), and export-readiness checks.
metadata:
  author: mindoktor
  version: "3.16"
  shareable-skills.owner-prefix: "md"
  shareable-skills.owner: "mindoktor/agentic-tools"
  shareable-skills.domain: "agents"
  shareable-skills.visibility: "organization"
  shareable-skills.vendored-sha: "f996033"
  shareable-skills.vendored-time: "2026-07-13"
  shareable-skills.suggests: "ref-md-agents-skills-authoring, tool-md-make-skill-shareable"
---

# Shareable Skills

_Vendored from agentic-tools — edit the upstream skill there, not this copy; local edits are overwritten on re-vendor._

## Purpose

Define a skill's metadata — what each param means, where identity vs. visibility live — and how to validate a skill before linking or copying it into another repository or organization.

**Upstream / lineage.** The `agentic-tools` repo began as a copy of [swiftpostlabs/agentic-tools](https://github.com/swiftpostlabs/agentic-tools), our **spiritual upstream** — the `shareable-skills` metadata model, the identity-vs-visibility split, and the vendor/link/reference sharing approaches all originate there. Two differences to keep in mind if you borrow from it: it places these fields at top-level `metadata` (`owner`, `scope`, `requires`/`suggests`) rather than under the `shareable-skills.` namespace, and it distributes skills through an `agentic-tools skills sync` CLI + `.agents/config.json` sources rather than our commit-pinned `vendored-sha` vendoring. We do not git-sync from it, but it is a live source of ideas — for example its `report-to` field for routing changes back to a skill's upstream — and it is mid-migration, so verify before adopting.

## Frontmatter Reference

All skill metadata lives under the `shareable-skills.` namespace:

| Param                            | Meaning                                                                                                          | Values                                                                   | When            |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------- |
| `shareable-skills.owner-prefix`  | Short name token / namespace (mirrors the name)                                                                  | `md` (a non-`md` prefix marks an imported skill)                         | always          |
| `shareable-skills.owner`         | Canonical home repo the skill is stewarded from                                                                  | `mindoktor/agentic-tools` (an upstream `org/repo` for a vendored copy)   | always          |
| `shareable-skills.domain`        | Knowledge area it belongs to                                                                                     | a recognized domain token (full set in `ref-md-agents-skills-authoring`) | always          |
| `shareable-skills.visibility`    | How far the skill may travel                                                                                     | `repo-local` · `organization` · `public`                                 | always          |
| `shareable-skills.requires`      | Hard deps — linked **with** it (apt `Depends`)                                                                   | comma-separated skill names                                              | if any          |
| `shareable-skills.suggests`      | Soft deps — linked on request (apt `Suggests`)                                                                   | comma-separated skill names                                              | if any          |
| `shareable-skills.reason`        | Why a surprising visibility or dependency                                                                        | free text, single line                                                   | when surprising |
| `shareable-skills.vendored-sha`  | Upstream commit a vendored copy was taken at (`owner` names the source repo); parsed by `checkVendoredDrift.mts` | `<short-sha>`                                                            | vendored copies |
| `shareable-skills.vendored-time` | When the copy was vendored (audit)                                                                               | ISO date, e.g. `2026-07-06`                                              | vendored copies |
| `shareable-skills.forked-from`   | Origin of a deliberate fork (you then set `owner` to your own repo)                                              | `<org/repo>@<sha>`                                                       | forks only      |

`owner-prefix` and `domain` mirror the skill **name** (`{ref|tool}-<owner>-<domain-or-verb>-…`) and are validated against it; `owner` records the canonical home repo, and the rest are not in the name. Every value is a flat string — the Agent Skills spec treats `metadata` as string-to-string (no YAML lists or nested objects).

**Provenance is required whenever a skill is vendored.** A vendored copy keeps `owner` pointing at the **upstream source repo** and adds `vendored-sha` (the source commit) plus `vendored-time`; `checkVendoredDrift.mts` reads these to flag *edited* and *stale* copies. A deliberate fork instead sets `owner` to the fork's own repo and records `forked-from`. Never drop this provenance — without it a copy silently loses its link to upstream.

## Core Principle: Identity vs. Visibility

Two independent axes, kept separate on purpose:

| Axis                                 | Question                        | Where it lives                            | How often it changes        |
| ------------------------------------ | ------------------------------- | ----------------------------------------- | --------------------------- |
| **Identity** (owner-prefix + domain) | *Whose* skill, and *what area*? | The **name** (mirrored in frontmatter)    | Almost never                |
| **Visibility**                       | *How far* can it travel?        | Frontmatter `shareable-skills.visibility` | Whenever a decision changes |

- The **name carries identity**: every skill here is Mindoktor's, so all are `md-` (e.g. `ref-md-js-typescript`, `tool-md-commit`). The owner prefix namespaces the skill — like npm's `@mindoktor/` — so it can't collide when symlinked into another repo, and it is multi-owner-ready (a future `acme-`). A non-`md-` prefix is reserved for skills imported from another owner.
- **Visibility stays in frontmatter**, never the name. There is no `loc-`, `org-`, or `pub-` name token.

Why visibility stays out of the name:

- It's the **most mutable** axis (a skill is promoted from `repo-local` to `organization` the day it is shared beyond its home repo). Encoding a mutable fact in the name forces a folder rename and re-points every symlink — exactly how stale symlinks accumulate.
- **Owner ≠ visibility.** The prefix names the steward; `visibility` independently sets reach. `md-` marks Mindoktor as maintainer — it does not by itself fix a skill at `repo-local`, `organization`, or `public`. (Today every skill in this repo is `organization`.)

## Visibility Tiers

`shareable-skills.visibility` takes one of three values:

| Visibility     | Meaning                                                                          | Linkable where                                 |
| -------------- | -------------------------------------------------------------------------------- | ---------------------------------------------- |
| `repo-local`   | Depends on one repo's scripts, file layout, services, or policies.               | Never linked out; lives only in its home repo. |
| `organization` | Reusable across this organization's repos, but encodes org-specific conventions. | Into this organization's repos.                |
| `public`       | Org-agnostic; reusable by anyone with light adaptation.                          | Into any repo, exportable outside the org.     |

## Dependency Tiers

Two kinds of dependency on other skills — both flat, comma-separated strings of skill names:

| Field                       | Meaning                                                       | apt analog | Linked by the CLI                                   |
| --------------------------- | ------------------------------------------------------------- | ---------- | --------------------------------------------------- |
| `shareable-skills.requires` | Hard deps — the skill does not work correctly without them.   | `Depends`  | Always, alongside the skill, resolved transitively. |
| `shareable-skills.suggests` | Soft deps — they enhance the skill but it works without them. | `Suggests` | Only when requested (a flag), one level deep.       |

- `requires` must point to a skill of **equal or wider visibility** (a `public` skill cannot require an `organization`/`repo-local` one) so the dependency travels wherever the skill does. `suggests` is advisory and not visibility-constrained — a missing optional dep simply is not offered.
- Use `requires` for "must be loaded for this to work," `suggests` for "also load if the user wants the adjacent capability."
- Keep both minimal and concrete. If `requires` keeps growing, split the skill.

## Portability

A shareable skill must stay valid wherever it lands:

- **Reference other skills by name**, in backticks (e.g. `` `ref-md-js-react` ``), **not** by a relative `../other-skill/` link. A relative cross-skill link dangles the moment the skill is copied or linked into a repo that lacks or renames that neighbor — and fails link validation there.
- **Relative links are only for** a skill's own `references/`/`assets/` (they always travel with it) and for skills in a **cohesive family that always travels together** (e.g. the `ref-md-js-*` set).
- `requires`/`suggests` already name skills (not paths), so they are portable by construction.
- **By-name references degrade gracefully** — the agent loads a named skill if present and skips it if not (a name is not a link; nothing errors or fails validation). Use this difference deliberately: a **required** dep travels with the skill, so its reference always resolves and can be stated firmly ("load `ref-md-js-typescript` first"). An **optional** dep may be absent, so reference it **conditionally** ("for MUI styling, see `ref-md-js-mui`" / "if available, also load …"). A missing optional dep is expected, not a failure; never phrase an optional dep as a mandatory step.

A portable skill has no dangling links in any repo: its only relative links point inside itself or to guaranteed-present family members, and any reference that may be absent is an optional, gracefully-skipped by-name pointer.

## Sharing a Skill Across Repos

Skills have **no native inheritance, overlay, or merge** — that is a [proposed standard](https://github.com/anthropics/claude-code/issues/25469), not a shipped feature. At runtime the agent simply loads all active skills **together** and reconciles conflicts by scope precedence (project > user > global). So "base + overlay" is **not a skill mechanism** — it is just **two ordinary skills that coexist**: a canonical **base** holding the common content, plus a separate **delta** skill (often the repo's app skill) that holds only the repo-specific bits and references the base **by name**. Nothing merges structurally; the agent has both in context.

**Pointing from base to delta — generically.** A base skill may tell readers where per-app specifics live, but it must name *no specific consumer*: write "see the skill named after your app" (its hub skill), never "see `ref-md-dev-clinic-app`". A generic pointer names no repo, so it vendors byte-identically everywhere; a concrete one dangles in every other consumer. The delta lives in the app's hub skill (e.g. a `references/testing.md` or `references/redux-state.md`) and references the base by name.

**Shared examples: neutral, or show-both — never one consumer's value as the default.** When an *example* in a shared skill diverges across consumers (import path, key shape, token name, file layout), a one-directional example silently biases toward whichever repo the author had in mind — and it misleads the *other* consumers exactly as much, so "de-biasing" by swapping to the other repo's form just flips the victim. Decide per divergence:

| The divergence is…                                                         | Do this                                                                                                                                                                     | Why                                                                                             |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Incidental** to what the example teaches (the differing token is noise)  | **Neutralize** — a placeholder real in *no* consumer (`colors.<neutralGrey>`, `<itemsQueryKey>`), with the concrete per-app forms in a nearby note or the app's delta skill | The reader learns the pattern without copying a value that only compiles in one repo            |
| **The teaching point itself** (or the reader needs a concrete form to act) | **Show both, labeled** per consumer (clinic-app: `…` / patient-app: `…`)                                                                                                    | Hiding a material difference behind a placeholder robs the reader of the guidance they came for |

The failure to avoid is the **false-neutral**: one consumer's real value relabeled "app-agnostic" (e.g. `colors.gray[700]` called neutral when only patient-app has it), or a placeholder so vague the reader can't act when they needed the real form. Test every shared example both ways — *"would a dev in the **other** repo copy this and be wrong?"* — not just against the repo you happened to check.

Getting the base into a consuming repo — four approaches, cheapest to richest:

- **Reference-only** — name the skill and rely on it being installed globally. Zero copy; each machine/CI needs the global skills.
- **Link / symlink** — the `agentic-tools` repo's `agentic-tools skills link` CLI (see [`references/sharing-across-repos.md`](references/sharing-across-repos.md) → The linking CLI). Single source; a symlink needs the source at a stable path.
- **Vendor (copy)** — commit a pristine copy + provenance + a drift check. Self-contained; the default for production repos.
- **Marketplace / plugin** — a private git repo or local dir as a marketplace. Native namespacing + auto-enable; most setup.

Full comparison, the coexisting-skills composition, and vendoring conventions: [`references/sharing-across-repos.md`](references/sharing-across-repos.md).

## Routing Table

| Task                                                                      | Read                                                                                   |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Finalize shareability metadata                                            | [`references/checklist.md`](references/checklist.md)                                   |
| Share a skill into another repo (vendor / link / reference / marketplace) | [`references/sharing-across-repos.md`](references/sharing-across-repos.md)             |
| Example trigger eval queries                                              | [`assets/trigger-eval-queries.example.json`](assets/trigger-eval-queries.example.json) |
| Skill naming grammar (owner prefix)                                       | `ref-md-agents-skills-authoring`                                                       |

## When to Use This Skill

- Classifying a skill as `repo-local`, `organization`, or `public`.
- Backfilling `shareable-skills.owner-prefix`, `owner`, `domain`, `visibility`, `requires`, `suggests`, or `reason`.
- Deciding a new skill's name (defer the full grammar to `ref-md-agents-skills-authoring`).
- Reviewing whether a shareable skill has too many hard dependencies.
- Preparing a skill for the shareable-skill linking CLI.
- Reviewing whether a `repo-local` skill should be split into reusable and repo-specific parts.

## Workflow Overview

What classifying a skill's shareability involves, as descriptive knowledge — the guided execution of these steps lives in `tool-md-make-skill-shareable`:

1. Inspect the skill's frontmatter, body, and referenced files.
2. Confirm `owner-prefix` and `domain` match the name (and `owner` records the home repo); set them if missing.
3. Record `shareable-skills.visibility` as `repo-local`, `organization`, or `public` (how far it can travel: one repo, the organization, or anyone).
4. Record hard deps in `shareable-skills.requires` and soft ones in `shareable-skills.suggests`.
5. Add `shareable-skills.reason` when the classification or a dependency would otherwise be surprising.
6. Validate the sharing metadata with `validateSharing.mts` and structure with `validateSkills.mts` (plus `skills-ref validate`); preview dependency links with `agentic-tools skills link` (it resolves and confirms deps before applying).

## Defaults

- Prefer `public` when the skill is org-agnostic and moves with only light adaptation — no org-only wrappers or conventions.
- Prefer `organization` when the skill is reusable across the organization's repos but encodes org-specific conventions, services, or tools.
- Prefer `repo-local` when the skill depends on one repo's concrete scripts, file layout, policies, or adoption workflow.
- Keep `shareable-skills.requires` short — it travels with the skill. If it grows, split the skill or extract a smaller shared dependency.
- Put related or nice-to-have neighbors in `shareable-skills.suggests`, never in `requires`.
- Prefer splitting a mixed skill over marking a broadly useful core as `repo-local` because one section is tied to a repo.

## Gotchas

- The Agent Skills spec treats `metadata` as a string-to-string mapping, so every `shareable-skills.*` value must be a flat single-line string — no YAML lists, nested objects, or folded (`>-`) scalars.
- Visibility lives **only** in frontmatter. Do not encode it in the name (no `loc-`/`org-`/`pub-` tokens) — the name carries identity, not visibility.
- A skill can be useful across repos and still be `repo-local` if exporting it would require hidden wrappers or repo-only assumptions.
- Hard dependencies should be rare. If everything depends on everything else, the skills are scoped poorly.
- A skill must not have a `requires` entry of narrower visibility: `public` ↛ `organization`/`repo-local`, and `organization` ↛ `repo-local`.
- The linker should reject `repo-local` skills rather than silently exporting them.
- A relative `../other-skill/` link makes a skill **non-portable** — it breaks when the skill is shared into a repo that lacks or renames that neighbor. Reference other skills by name (see Portability).
- Skills do **not** merge. "Base + overlay" is two coexisting skills (a base + a separate delta skill), not a feature — inheritance is only [proposed](https://github.com/anthropics/claude-code/issues/25469). Don't design around a merge that doesn't exist.

## Validation

- Confirm `owner-prefix`, `owner`, `domain`, and `visibility` are present; `domain` is one of the recognized domains (the `ALLOWED_DOMAINS` set in this skill's `scripts/validateSharing.mts`); `visibility` is one of `repo-local`/`organization`/`public`.
- Confirm `owner-prefix` and `domain` match what the name encodes (`ref-` skills: domain is the name token; `tool-` skills: domain is frontmatter-only).
- Confirm every `requires` entry points to an existing skill name. Do **not** require `suggests` to resolve — an optional dep may be absent (unvendored or cross-repo) and is skipped gracefully, so its absence is never a validation failure.
- Confirm no `requires` entry is narrower-visibility (`public` ↛ `organization`/`repo-local`; `organization` ↛ `repo-local`).
- After metadata changes, run `validateSharing.mts` (owner/domain/visibility and the dependency graph) and `validateSkills.mts` (naming, structure); for vendored copies, also `checkVendoredDrift.mts`. To preview link resolution, `agentic-tools skills link` confirms extra deps before applying and `agentic-tools skills prune --dry-run` lists stale links.

## Related Skills

| Skill                            | When to load                                                        |
| -------------------------------- | ------------------------------------------------------------------- |
| `ref-md-agents-skills-authoring` | The skill naming grammar (owner prefix) and broader authoring rules |
| `tool-md-make-skill-shareable`   | Guided shareability decision for an existing skill                  |
