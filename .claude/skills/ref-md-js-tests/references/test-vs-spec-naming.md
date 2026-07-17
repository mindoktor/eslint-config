# Test File Naming: `.test` vs `.spec`

**Convention: name new test files `*.test.ts` / `*.test.tsx`.** Use `*.spec.*`
only when extending a folder that already uses it. This is not a style
preference — it reflects the measured reality of the codebases.

## The Evidence

A file-naming survey of the two main repos (May 2026) shows `.test` is the
dominant and current convention; `.spec` is a shrinking legacy minority.

> **Snapshot, not live counts.** The figures below are the May 2026 survey;
> exact numbers drift as tests are added (phoenix stands at ~14 `.test` / 3
> `.spec` as of July 2026). It's the *ratio and trend* that matter, and they
> hold — re-run the commands in [How to Reproduce](#how-to-reproduce-the-check)
> for authoritative current figures.

### mindoktor-app

| Bucket                     | `.spec.*` | `.test.*` | Dominant |
| -------------------------- | --------- | --------- | -------- |
| phoenix (newer)            | 3         | 8         | `.test`  |
| non-phoenix (incl. legacy) | 18        | 31        | `.test`  |
| **Total**                  | **21**    | **39**    | `.test`  |

Three findings refute the common assumptions about `.spec`:

- **Not more common.** `.test` leads roughly 2:1 overall.
- **Not newer.** The 25 most-recently-touched test files are *all* `.test`.
  Current work (booking, auth, data-tracking, May 2026) is uniformly `.test`.
- **Not the phoenix convention.** `.test` wins inside phoenix too (8 vs 3 at
  survey time; 14 vs 3 as of July 2026).
  Of the 21 `.spec` files, 10 sit in one old module —
  `packages/apps/patient/legacy/apotekhjartat` — with the rest scattered
  across `utils/validations`, `pulse`, and `localization`.

### mindoktor

| `.spec.*` | `.test.*` |
| --------- | --------- |
| 0         | 13        |

Unanimous: zero `.spec` files, all tests are `.test` (CLINIC_APP). One wrinkle:
older CLINIC_APP tests use a **dash variant** — `*-test.ts(x)` inside
`__tests__/` folders (e.g. `__tests__/displaySex-test.ts`). Treat it like
`.spec`: legacy, picked up via Jest's default `__tests__/` glob, fine to extend
in place, but not for new test files outside those folders.

### Conclusion

`.test.{ts,tsx}` is the de facto and trending convention in both repos.
`.spec` survives mainly in legacy pharmacy code and should not be used for new
tests.

## How to Reproduce the Check

Run from the repo root. Excludes `node_modules`.

### Count by pattern

```bash
echo -n ".spec: "; find . -path ./node_modules -prune -o -type f \
  \( -name "*.spec.ts" -o -name "*.spec.tsx" -o -name "*.spec.js" -o -name "*.spec.jsx" \) \
  -print | grep -vc node_modules
echo -n ".test: "; find . -path ./node_modules -prune -o -type f \
  \( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.test.js" -o -name "*.test.jsx" \) \
  -print | grep -vc node_modules
```

### Where the `.spec` files cluster

```bash
find . -path ./node_modules -prune -o -type f -name "*.spec.*" -print \
  | grep -v node_modules | sed -E 's|/[^/]+$||' | sort | uniq -c | sort -rn
```

### Recency — are `.spec` files newer? (rank by last commit date)

```bash
for f in $(find . -path ./node_modules -prune -o -type f \
  \( -name "*.spec.*" -o -name "*.test.*" \) -print | grep -v node_modules); do
  case "$f" in *.spec.*) kind=SPEC;; *) kind=test;; esac
  echo "$(git log -1 --format=%cs -- "$f") $kind $f"
done | sort -r | head -25
```

### Split by area (e.g. phoenix vs legacy)

```bash
echo -n "spec in phoenix: "; find . -path ./node_modules -prune -o -type f -name "*.spec.*" -print | grep -v node_modules | grep -ci phoenix
echo -n "test in phoenix: "; find . -path ./node_modules -prune -o -type f -name "*.test.*" -print | grep -v node_modules | grep -ci phoenix
```

Re-run these if the convention is ever questioned — the numbers, not opinion,
settle it.
