# Sharing Skills Across Repos

How to align common skills across repositories while keeping repo-specific deltas — and the constraint that shapes every option: **skills have no native merge.**

## No native inheritance or merge

The Agent Skills spec has **no `extends`, overlay, or partial-override primitive**. Skill inheritance is an open [proposal](https://github.com/anthropics/claude-code/issues/25469) ("skill-memories as inheritance for SKILL.md"), not a shipped feature.

What skills *do* at runtime:

- Multiple active skills are loaded **together**; the agent reconciles their directives in context.
- Same-name skills at different levels **shadow** each other (whole-skill replace), resolved by scope precedence (project > user > global).
- Plugin skills are **namespaced** (`plugin:skill`), so they coexist without collision.

Implication: to share common content while keeping local deltas, you don't "merge" — you keep **two ordinary skills that coexist**.

## Composition: a canonical base + a separate delta skill

- One **base** skill holds the common content, kept in one place (the source/org repo) and shared into consumers.
- A separate **delta** skill — often the repo's existing app skill — holds only the repo-specific bits and references the base **by name**. It may list the base in `requires` so both load together.
- They **coexist**. `shareable-skills.visibility` (frontmatter), not a name token, is what distinguishes a shared skill from a repo-local delta. Do **not** invent owner tokens (`mdr`/`mdx`) to dodge collisions — that re-encodes scope into the name, which we deliberately keep in frontmatter. A distinct delta-skill name (or plugin namespacing) handles collisions.

There is no structural merge: the agent simply has both skills in context and reconciles them. "Base + overlay" is a useful analogy, not a skill feature.

## Distribution: getting the base into a consuming repo

| Approach                                                 | Self-contained?                                | Drift                       | Setup  | Use when                                        |
| -------------------------------------------------------- | ---------------------------------------------- | --------------------------- | ------ | ----------------------------------------------- |
| **Reference-only** — name it, rely on the global install | No — each machine/CI needs the global skills   | none                        | none   | everyone already runs the global skill set      |
| **Link / symlink** — the skills CLI                      | No — symlink needs the source at a stable path | none                        | low    | one dev / consistent local layout               |
| **Vendor (copy)** — commit a pristine copy               | Yes — works for everyone and CI                | needs re-sync + drift guard | low    | production repos (the default)                  |
| **Marketplace / plugin** — private git repo or local dir | Yes                                            | versioned                   | higher | org-wide distribution, namespacing, auto-enable |

The prevailing ecosystem norm is **point to shared docs, don't duplicate** — so prefer the lightest approach that meets your self-containment need.

## The linking CLI (`agentic-tools skills`)

The `agentic-tools` repo **ships the linker** — use it, do not hand-roll `ln -s`:

- **Link all skills into home** (`~/.claude/skills`): `yarn agentic-tools skills link --global --all`
- **Link specific skills into a project**: `yarn agentic-tools skills link --path <repo> <skill…>` (add `-o` to also link optional/soft deps)
- **Unlink**: `yarn agentic-tools skills unlink --global <skill…>` (or `--path <repo> <skill…>`)
- **Prune stale links** after a rename/removal: `yarn agentic-tools skills prune --global` (or `--path <repo>`); add `--dry-run` to preview

It resolves `requires`, **refuses to link `repo-local` skills outward**, and prompts before linking any dependency you did not name (`--yes` to skip). This is the **symlink** approach — for the **copy** approach, see Vendoring conventions below.

## Vendoring conventions (the production default)

When you commit a copy of a shared skill:

- Copy it **pristine** (unmodified) so a later re-sync or replace stays clean.
- Record provenance in frontmatter: keep `shareable-skills.owner` pointing at the upstream source repo, and add `shareable-skills.vendored-sha` (the source commit) and `shareable-skills.vendored-time` (the date).
- Add a one-line "edit upstream" note at the top of the body, in the **exact form the drift check recognizes** so it is treated as a marker (not content drift): a line matching `^_Vendored from …_$`, e.g. `_Vendored from <source-repo> — edit the upstream skill there, not this copy; local edits are overwritten on re-vendor._`. `checkVendoredDrift.mts` strips this note and the `vendored-sha`/`vendored-time` lines before comparing.
- **Drift check**: run [`scripts/checkVendoredDrift.mts`](../scripts/checkVendoredDrift.mts) (`--repo-path <consumer>`) — it compares each `vendored-sha` copy against its pinned upstream commit and flags **edited** (the copy changed) and **stale** (upstream moved) skills, ignoring the vendoring markers and blank-line runs. It is a **local** tool (it needs both repos checked out), not a CI gate.
- Vendor a **cohesive family together** (e.g. all `ref-md-js-*`) so their intra-family relative links resolve.

## Review feedback on a vendored file

When a review comment on a **consumer** repo's PR lands on a vendored file (`vendored-sha` present, the `_Vendored from …_` notice at the top), the fix lives **upstream**, not in the copy the reviewer is looking at. The review UI anchors attention to the consumer file, so the wrong first move — editing that copy — feels natural; resist it. The copy is pristine-by-contract, and a local edit is lost on the next re-vendor and never reaches the other consumers. The sequence:

1. Recognize the flagged file is vendored (owner is the upstream repo, `vendored-sha` present, notice line at the top).
2. Make the fix **upstream** (its `shareable-skills.owner` repo), commit it there.
3. **Re-vendor** into the consumer (bumps `vendored-sha`) — that re-vendor commit is what actually appears in the consumer PR.
4. In the reply, note the fix round-tripped through upstream, so the reviewer knows the change is not detached from its origin.

This is a human/agent round-trip under the `vendored-sha` model — not an automated route. (The swiftpostlabs upstream's `report-to` field addresses the same downstream→upstream direction, but is coupled to its `skills sync` distribution and is not adopted here; see the upstream/lineage note in [`../SKILL.md`](../SKILL.md).)

## Portability is the prerequisite

A skill is only cleanly shareable if it is **portable**: cross-skill references are **by name**, not relative `../other-skill/` links (see the Portability section in [`../SKILL.md`](../SKILL.md)). A relative cross-skill link dangles wherever the neighbor is absent or renamed and fails link validation. Make skills portable before vendoring or linking them.
