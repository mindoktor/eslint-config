# `.env` Deny Permissions — Canonical Claude Code Block

Read this file when adding harness-level `.env` protection to a repo's `.claude/settings.json`, or when wondering why the deny list is enumerated instead of one wildcard.

The behavioral rule ("never read `.env`") relies on the model following instructions. A `permissions.deny` rule is **defense-in-depth at the harness level**: Claude Code refuses `Read`/`Edit` (and recognized `Bash` file-reads) of secret files regardless of model behavior.

Put the block in the **committed** `.claude/settings.json` (team-wide, version-controlled), not `settings.local.json`. **Merge it into the existing `permissions` object — never replace existing `allow`/`deny` entries.** After editing, validate with `jq -e '.permissions.deny' .claude/settings.json` — a malformed `settings.json` silently disables *all* settings from that file.

## The Canonical Block

```json
{
  "permissions": {
    "deny": [
      "Read(**/.env)",
      "Read(**/.env.local)",
      "Read(**/.env.*.local)",
      "Read(**/.env.development)",
      "Read(**/.env.production)",
      "Read(**/.env.staging)",
      "Read(**/.env.test)",
      "Edit(**/.env)",
      "Edit(**/.env.local)",
      "Edit(**/.env.*.local)",
      "Edit(**/.env.development)",
      "Edit(**/.env.production)",
      "Edit(**/.env.staging)",
      "Edit(**/.env.test)",
      "Bash(cat .env*)",
      "Bash(less .env*)",
      "Bash(more .env*)",
      "Bash(head .env*)",
      "Bash(tail .env*)",
      "Bash(nano .env*)",
      "Bash(vim .env*)",
      "Bash(vi .env*)",
      "Bash(source .env*)",
      "Bash(. .env*)",
      "Bash(grep * .env*)"
    ],
    "allow": [
      "Read(**/.env.template)",
      "Read(**/.env.example)",
      "Read(**/.env.sample)",
      "Read(**/.env.dist)"
    ]
  }
}
```

## Why It Is Shaped This Way

Confirmed against the Claude Code permissions docs (`https://code.claude.com/docs/en/permissions.md`):

| Constraint                                                                                                   | Consequence                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Precedence is flat: `deny` > `ask` > `allow`; specificity is ignored                                         | You **cannot** `allow` a template out of a broad `deny: ["Read(**/.env.*)"]` — the deny always wins. This is *the* reason the deny list enumerates secret-bearing names instead of one wildcard. |
| `Read`/`Edit` patterns use gitignore syntax — no extended-glob or `!` negation                               | There is no "match `.env.*` except these" pattern; templates stay readable simply by not being denied. Listing them under `allow` is self-documentation.                                         |
| `Bash` patterns: `*` matches any sequence, anywhere                                                          | `Bash(cat .env*)` is valid and catches custom suffixes via shell.                                                                                                                                |
| `Read`/`Edit` denies also cover Bash commands Claude recognizes as file reads (`cat`, `head`, `tail`, `sed`) | The explicit Bash rules add what it does not treat as reads: editors (`vim`/`vi`/`nano`), pagers (`less`/`more`), sourcing (`source`/`.`), and `grep`.                                           |

## Known Gaps (Intentional)

- **Custom secret suffixes** (e.g. `.env.whatever`) are not caught by the enumerated `Read`/`Edit` denies — only standard dotenv/Next.js/Vite/Rails names are. The broad `Bash(cat .env*)` deny catches them via shell, and the behavioral rule covers the rest. Extend the enumeration if a repo uses custom suffixes.
- **Template asymmetry**: `.env.template` is readable via the **Read tool** but blocked from raw `cat .env.template` (caught by `Bash(cat .env*)`). Read templates with the Read tool. Deliberate — Bash cannot express "any `.env*` except templates" compactly.
- **Recursive searches are not caught.** A `grep -r`/`rg` over a directory tree reads `.env` without naming it, so no pattern above matches. That gap is behavioral — see the incidental-reads rule in `SKILL.md` → *.env Files — Absolute Prohibition*.

## Other Providers

This block is Claude Code-specific. Copilot and Gemini equivalents are best-effort (see the File-Access Policy table in `SKILL.md`); the behavioral directive remains the primary enforcement there.
