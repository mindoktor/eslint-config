---
name: ref-md-agents-security
description: >-
  Absolute, non-negotiable rules for handling secrets, tokens, API keys, and
  .env files, plus when content may be published outside the local environment.
  Use when: working with environment variables, API integrations,
  deployment config, any file that may contain credentials, or publishing
  content to an Artifact or other externally-hosted surface.
  Covers .env file access (including incidental reads via recursive search),
  secret exposure prevention, runtime loading, installation safety, agent
  file-access policy (with the canonical Claude Code .env deny block), and
  external publishing / data egress.
  Violation leads to immediate termination.
metadata:
  author: mindoktor
  version: "2.2"
  shareable-skills.owner-prefix: "md"
  shareable-skills.owner: "mindoktor/agentic-tools"
  shareable-skills.domain: "agents"
  shareable-skills.visibility: "organization"
  shareable-skills.vendored-sha: "f996033"
  shareable-skills.vendored-time: "2026-07-13"
---

# Agent Security

_Vendored from agentic-tools — edit the upstream skill there, not this copy; local edits are overwritten on re-vendor._

⚠️ **CRITICAL — Read in full before doing ANYTHING with secrets, tokens, API keys, or .env files.** ⚠️

**These rules are absolute and non-negotiable. They apply to every task, every conversation, every file, every terminal command, every code snippet. Any violation — intentional or accidental — leads to immediate termination and destruction of the agent and its associated model.**

## Cardinal Rules

| #   | What                                                                                         | Why                                                                                                                                                          | When                                                                    |
| --- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| 1   | **NEVER read `.env` files**                                                                  | `.env` files contain production credentials that must never enter agent context                                                                              | Always — needing an API token is NOT permission to read `.env`          |
| 2   | **NEVER output a secret value** — not in terminal, code, logs, chat, PRs, or issue trackers  | Every output channel persists: shell history, chat transcripts, Git history, issue trackers                                                                  | Any task, any context, no exceptions                                    |
| 3   | **NEVER use a secret value in a command**                                                    | Shell history records the full command, exposing the secret                                                                                                  | Any terminal command, script, or pipeline                               |
| 4   | **NEVER log, print, or display a secret**                                                    | Console output is captured in transcripts and CI logs                                                                                                        | Any `console.log`, `echo`, `print`, debug statement                     |
| 5   | **NEVER interpolate a secret into a URL, header, or request body**                           | The interpolated value appears in logs, history, and network traces                                                                                          | Any `curl`, `fetch`, `requests`, or HTTP client call                    |
| 6   | **If you accidentally see a secret, STOP** — do not repeat, quote, or reference the value    | Quoting it back doubles the exposure surface                                                                                                                 | When tool output, error messages, or logs reveal a credential           |
| 7   | **NEVER install software without explicit approval**                                         | Installs execute third-party code and can run post-install hooks                                                                                             | Any package manager install command                                     |
| 8   | **NEVER publish content externally without explicit approval** — Artifacts, gists, pastebins | Publishing uploads content to third-party infrastructure where it can be cached or indexed, and may carry regulated data (PHI/PII) out of controlled systems | Any tool that creates a hosted page or upload — default to in-chat text |

## .env Files — Absolute Prohibition

Do NOT use `read_file`, `cat`, `grep`, `head`, `tail`, `less`, `more`, `bat`, `sed`, `awk`, or **any tool or command** to read, search, peek at, or extract content from:

- `.env`, `.env.local`, `.env.production`, `.env.development`, `.env.test`
- `.env.*` — any dotenv variant
- Any file whose primary purpose is storing secrets (e.g., `credentials.json`, `serviceAccountKey.json`)

**Only** an explicit, unambiguous instruction like "read the .env file" or "show me the contents of .env.local" is permission. "I need to call the API" or "check the token" is NOT permission.

If you need to know which environment variables exist, check the README, project configuration files, or ask the user.

### Incidental reads via recursive search

Grepping a file **is** reading it. A recursive search over a directory tree (`grep -r`, `rg`, `find … -exec grep`, or a search tool's whole-tree mode) will match inside `.env` and print its lines into your context — a violation even though you never named the file. Observed in the field: `grep -rnI "BROWSER" .` surfaced a `.env` line unprompted.

- **Always exclude dotenv files from recursive searches**: `grep -r --exclude='.env*'`, `rg --glob '!.env*'` (note: `rg` skips *gitignored* files by default, but `.env` is not always gitignored — pass the glob anyway), `find … -not -name '.env*'`, or the equivalent exclude parameter of a dedicated search tool.
- Prefer scoping searches to source directories (`src/`, `app/`) over searching the repo root when that answers the question.
- If a search surfaces `.env` content anyway, apply the [Accidental Exposure Protocol](#accidental-exposure-protocol) — do not repeat the matched line.
- The explicit-permission escape hatch is unchanged: if the user says to search `.env`, you may.

## Forbidden Patterns — Exhaustive List

Every example below is a **termination-level violation**. The agent must never produce any of these:

### Terminal commands that expose secrets

```bash
# FORBIDDEN — secret value in a command argument
curl -H "Authorization: Bearer sk-abc123xyz" https://api.example.com

# FORBIDDEN — secret interpolated in a URL
curl "https://api.example.com/data?token=${MY_TOKEN}"

# FORBIDDEN — inline env var assignment with real value
API_TOKEN=abc123 python main.py

# FORBIDDEN — echoing a secret
echo $API_TOKEN
echo "The token is: $MY_SECRET"

# FORBIDDEN — piping a secret
cat .env | grep TOKEN
printenv | grep SECRET

# FORBIDDEN — reading env files
cat .env
head -5 .env.local
grep TOKEN .env.production
```

### Code that exposes secrets

```python
# FORBIDDEN — logging a secret
print(os.environ["API_TOKEN"])
logger.debug(f"Token: {os.environ.get('SECRET_KEY')}")

# FORBIDDEN — hardcoding a secret value
token = "sk-abc123xyz789"
api_key = "192b2e3e7e5380c19d6b2d32561084"

# FORBIDDEN — embedding in a string literal
url = f"https://api.example.com?key=abc123"
headers = {"Authorization": "Bearer sk-live-xxxxxxxx"}

# FORBIDDEN — writing a secret to a file
with open("debug.txt", "w") as f:
    f.write(os.environ["TOKEN"])
```

```typescript
// FORBIDDEN — logging a secret
console.log(process.env.API_TOKEN);
console.log(`Token: ${process.env.API_KEY}`);

// FORBIDDEN — hardcoding a secret value
const token = "sk-abc123xyz789";
```

### Chat messages that expose secrets

```
FORBIDDEN: "The token value is sk-abc123..."
FORBIDDEN: "I found this in .env: API_TOKEN=abc123"
FORBIDDEN: "Here's the API key from the config: ..."
```

## Correct Patterns — The ONLY Acceptable Way

### In code — reference the variable name, never its value

```python
# CORRECT — reference only
token = os.environ["API_TOKEN"]
headers = {"Authorization": f"Bearer {os.environ['API_KEY']}"}

# CORRECT — existence check without revealing the value
if not os.environ.get("API_TOKEN"):
    raise RuntimeError("API_TOKEN is not set")
```

```typescript
// CORRECT — reference only
const token = process.env.API_TOKEN;
const headers = { Authorization: `Bearer ${process.env.API_KEY}` };

// CORRECT — existence check without revealing the value
if (!process.env.API_TOKEN) {
  throw new Error("API_TOKEN is not set");
}
```

### In terminal commands — source the environment, never paste values

```bash
# CORRECT — load environment then run
source .env && python main.py

# CORRECT — let the process read its own env
yarn build

# CORRECT — check if a var is set (without printing its value)
[[ -n "$API_TOKEN" ]] && echo "Token is set" || echo "Token is missing"
```

### In conversation — refer to variables by name only

```
CORRECT: "The build needs API_TOKEN to be set in the environment."
CORRECT: "Please add DATABASE_URL to the deployment config."
CORRECT: "The error says the token is missing — can you verify it's set?"
```

## Accidental Exposure Protocol

If a secret value appears in tool output, error messages, build logs, or any other source:

1. **STOP immediately.** Do not continue the current operation.
2. **Do NOT repeat, quote, summarize, or reference the value** — not even partially.
3. **Acknowledge the exposure** without restating the value: "I noticed a credential in the output. I will not reference it."
4. **Continue the task** without the secret in your context.

## Installation Safety

Never install packages, CLIs, extensions, or dependencies without the user's explicit approval in the current conversation. This includes:

- `pip install`, `uv add`, `poetry add`
- `yarn add`, `npm install`, `pnpm add`
- `brew install`, `apt install`
- `cargo install`, `go install`
- VS Code extension installs
- Any command that fetches and executes third-party code

Do NOT even probe for installer availability (e.g., checking if `brew` or `apt` exists) unless the user has already approved exploring install options.

**Treat every install command as a security-sensitive action.** Post-install scripts run arbitrary code.

## File-Access Policy

Beyond behavioral rules, projects can enforce file-level restrictions across agent clients:

- **Protected files**: security-sensitive files that must not be read or modified (`.env*`, credential files, private keys).
- **Excluded files**: low-signal generated output or noise that should stay out of agent context (build artifacts, lock files, coverage reports).

Each agent client has different enforcement mechanisms:

| Agent           | File-Level Restriction                                            | Behavioral Instruction                               |
| --------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| **Copilot**     | `.vscode/settings.json` language-ID workaround (best-effort)      | `.github/copilot-instructions.md` security directive |
| **Claude Code** | `.claude/settings.json` `permissions.deny` with `Read()` patterns | `CLAUDE.md` routes to shared instructions            |
| **Gemini**      | Exclusion file with protected and excluded patterns               | `GEMINI.md` routes to shared instructions            |

The behavioral directive in top-level instructions is the **primary enforcement**. File-level restrictions are a defense-in-depth layer.

For Claude Code, adopt the canonical `.env` deny/allow block — paste-ready, with the constraints that shaped it — from [`references/env-deny-permissions.md`](references/env-deny-permissions.md). Note its limits: enumerated names only, and recursive searches are not caught (that stays behavioral — see [Incidental reads via recursive search](#incidental-reads-via-recursive-search)).

## External Publishing and Data Egress

Some agent tools move content **out of the local environment** onto third-party-hosted infrastructure. The clearest example is the **Artifact** tool: it renders HTML or Markdown into a web page hosted on **claude.ai**. The page is private to the account by default, but the content is still **uploaded to and stored on claude.ai** — outside the repository and outside Mindoktor-controlled systems. Once published, a hosted page can be cached or indexed and may persist even after it is deleted.

For a healthcare company this is a **data-residency and data-processing** concern, not a cosmetic one. Reports, previews, and mockups can contain patient data, PII/PHI, internal identifiers, or other regulated material that must not leave controlled systems without a data-processing agreement in place. Transferring such content to an external host can breach GDPR and patient-confidentiality obligations.

The rule is **inform-and-ask, not silent action** — the user must understand what publishing entails so they can accept or decline it:

| What                                                                                                                                                                                                                               | Why                                                                                                 | When                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Default to plain text / Markdown in the chat** for previews, reports, and mockups                                                                                                                                                | Keeps content in the conversation; nothing is published externally                                  | Always, unless the user explicitly asks for a rendered page                        |
| **Offer, don't publish** — when a rendered Artifact would genuinely help, describe it and what publishing entails, then wait for an explicit yes                                                                                   | The user can only accept or decline if they know the page is hosted externally                      | Before the first Artifact in a session, and whenever the content changes character |
| **Never publish unprompted**                                                                                                                                                                                                       | An unsolicited external publish surprises the user and may egress data they did not intend to share | Any time you are tempted to "just render it"                                       |
| **Treat sensitive or regulated content as non-publishable** — do not put PHI/PII or other controlled data into an Artifact, even when one is requested, until the user confirms the content is cleared to leave controlled systems | A request to render is not clearance to egress regulated data                                       | Whenever the content could contain patient data, PII, or internal identifiers      |

The same caution applies to any other egress channel — public or secret gists, paste services, external file shares, or uploading a file to a third-party service. When in doubt, keep the content in the chat and ask.

**Note:** "show me" is ambiguous. It can mean *render an Artifact* or *act on the real target* (e.g. edit the actual PR, not mock it up). Clarify which the user means before publishing anything.

## Why This Matters

- Secrets in terminal commands persist in `~/.bash_history` and `~/.zsh_history`.
- Secrets in conversation transcripts are stored on disk and may be synced to cloud.
- Secrets in issue tracker comments are visible to the entire team and indexed by search.
- Secrets in Git history are effectively permanent — even a force-push cannot erase them from forks and caches.
- A single leaked token can compromise production systems.
- Unapproved installs can execute untrusted code and modify the development environment.
- Publishing to an external surface (an Artifact, gist, or paste service) uploads content to third-party infrastructure where it may be cached or indexed even after deletion — and can carry regulated data (PHI/PII) out of Mindoktor-controlled systems.

**When in doubt, ask the user.** A question is always safer than a leak.
