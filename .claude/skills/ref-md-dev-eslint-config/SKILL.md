---
name: ref-md-dev-eslint-config
description: >-
  Work in @mindoktor/eslint-config, the shared ESLint flat config consumed by
  Mindoktor's TypeScript projects. Use when: cutting or reasoning about a release,
  running release-it, changing an exported config or a lint rule, adding a config
  export, or judging the blast radius of a rule change across consumers.
  Covers the non-standard release model (git-branch-per-version, no npm publish),
  the exported configs, the load-order gotcha, and consumer install.
metadata:
  author: mindoktor
  version: "1.0"
  shareable-skills.owner-prefix: "md"
  shareable-skills.owner: "mindoktor/eslint-config"
  shareable-skills.domain: "dev"
  shareable-skills.visibility: "repo-local"
  shareable-skills.reason: "encodes this repo's bespoke release-it flow and config layout"
---

# eslint-config (repo)

The repo-specific knowledge for `@mindoktor/eslint-config`. Generic TypeScript conventions live in `ref-md-js-typescript`; cross-cutting code quality in `ref-md-dev-coding-patterns`. This skill holds only what those can't: the release flow and the config's public surface.

## Release Model — read before cutting a release

The release is **not** a standard npm publish. `release-it` (config in [`.release-it.ts`](../../../.release-it.ts), run via `yarn release`) does something bespoke:

| Fact                                                                                                   | Why it matters                                                                                      |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `npm.publish: false`, `git.tag: false`                                                                 | Nothing is pushed to the npm registry and **no version tag** is created. Don't expect either.       |
| A "release" is a **git branch named after the version** (`git switch -C ${version}`), pushed to origin | The version branch (e.g. `2.2.1`) **is** the published artifact.                                    |
| Built `dist/` is **force-added** into that branch (`git add dist -f`)                                  | `dist` is gitignored (built by `yarn cleanbuild` in `before:release`); the force-add is deliberate. |
| `requireBranch: 'develop'`, `requireCleanWorkingDir: true`                                             | Release only runs from a clean `develop`. `before:init` runs `git pull`, `yarn`, lint, typecheck.   |
| `after:release` switches back to `develop`                                                             | You end on `develop`, with the version branch left on origin.                                       |

**Consumers install by git URL, not from the registry** — `yarn add -D @mindoktor/eslint-config@mindoktor/eslint-config#<version>` resolves to that version branch (semver-named branches get semver treatment). See the README.

Because publish is disabled, `package.json`'s `"files"` allowlist does not gate an actual npm publish today — but it stays the correct hygiene (and would gate a publish if one is ever enabled), which is why non-`dist` files like `.claude/` are excluded from it.

## Config Surface

Entry: [`src/index.ts`](../../../src/index.ts) exports a `configs` object with three named configs, plus a `default` (`stylistic` + `recommended`):

| Export                     | Source                                                                        | What                                                                        |
| -------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `configs.recommended`      | [`src/configs/recommended.ts`](../../../src/configs/recommended.ts)           | ESLint + typescript-eslint **strict** type-checked, imports, unused-imports |
| `configs.reactRecommended` | [`src/configs/reactRecommended.ts`](../../../src/configs/reactRecommended.ts) | `recommended` + `eslint-plugin-react` + react-hooks                         |
| `configs.stylistic`        | [`src/configs/stylistic.ts`](../../../src/configs/stylistic.ts)               | Prettier via `eslint-plugin-prettier` (single quotes, TS parser)            |

- `eslint-plugin-react` and `eslint-plugin-react-hooks` are **optional peer dependencies** — `reactRecommended` only works when the consumer installs them.
- This package is pure config: no React/MUI/Redux/Next/Go/DB runtime code lives here, even though it *emits* React lint rules.

## Gotchas

- **Extends order is load-bearing.** Consumers must list `stylistic` before `recommended` (`extends: [configs.stylistic, configs.recommended]`) — a wrong order silently drops rules. This was a real bug fixed in [#12](https://github.com/mindoktor/eslint-config/pull/12) ("Change lint extends order to fix rules not being applied"). Keep the README examples in this order.
- **A rule change here propagates to every consumer** (patient-app, clinic-app, and others) on their next version bump. Weigh any rule addition or severity change against that blast radius; prefer a narrowly-scoped, well-justified change and note it in the PR.
- **`no-unused-vars` is intentionally handled by `unused-imports`**, not typescript-eslint — `recommended.ts` turns the tseslint rule off and delegates. Don't "restore" the tseslint rule.
- **`dist` is gitignored** and only committed onto a version branch at release time. Do not commit `dist/` to `develop`.

## Standard Commands

`yarn lint` · `yarn lint:fix` · `yarn build` (tsc → `dist/`) · `yarn typecheck` · `yarn cleanbuild` · `yarn release`. A config change has no runtime surface of its own — verify it by running `yarn lint` against `examples/` or a consumer repo and confirming the intended rule output.

## Related Skills

| Skill                        | When to load                                          |
| ---------------------------- | ----------------------------------------------------- |
| `ref-md-js-typescript`       | TypeScript conventions when editing the config source |
| `ref-md-dev-coding-patterns` | Cross-cutting code quality                            |
