# Shareable Skill Checklist

Use this checklist when deciding how far a skill should travel and whether it is ready to export.

- Does the skill declare `shareable-skills.owner-prefix`, `shareable-skills.owner`, `domain`, and `visibility` (one of `repo-local`, `organization`, `public`)?
- Do `owner-prefix` and `domain` match what the name encodes, with no visibility token (`loc-`/`org-`/`pub-`) leaking into the name?
- If the skill is `repo-local`, is the reason obvious or recorded in `shareable-skills.reason`?
- If the skill is `organization`, does it genuinely encode org-specific conventions rather than generic knowledge that could be `public`?
- If the skill is `public`, can it move to another organization with only light adaptation?
- Are hard dependencies in `shareable-skills.requires` and soft ones in `shareable-skills.suggests` (not mixed)?
- Does every `shareable-skills.requires` entry exist and resolve to a skill of equal or wider visibility (no `public` → `organization`/`repo-local`, no `organization` → `repo-local`)?
- `shareable-skills.suggests` entries need **not** resolve — an optional dep may be absent (unvendored or cross-repo) and is skipped gracefully. They are not visibility-constrained either.
- If the dependency list is growing, should the skill be split into a smaller shared core and a narrower layer?
- Are repo-specific commands, paths, and wrappers still clearly identified so visibility decisions are honest?
- Is there a dry-run or equivalent check showing the linker can resolve the skill and its dependencies?

Typical fixes:

- Mark a skill `repo-local` when it depends on this repo's concrete scripts or policies.
- Demote `public` to `organization` when the skill leans on organization-specific conventions, services, or tools.
- Split a mixed skill so the reusable guidance becomes `organization` or `public` and the repo-specific layer stays `repo-local`.
- Move optional neighbors from `shareable-skills.requires` to `shareable-skills.suggests`.
- Add a short `shareable-skills.reason` when future reviewers would otherwise be forced to rediscover the portability boundary.
