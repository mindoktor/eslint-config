# Best Practices for Skill Authoring

## Main References

- <https://agentskills.io/skill-creation/best-practices> — writing well-scoped and calibrated skills.
- <https://agentskills.io/skill-creation/optimizing-descriptions> — testing and improving description triggering.
- <https://agentskills.io/skill-creation/evaluating-skills> — eval-driven iteration for skill quality.
- <https://agentskills.io/skill-creation/using-scripts> — bundling executable scripts in skills.
- <https://agentskills.io/specification> — the complete `SKILL.md` format reference.

## Start from Real Expertise

Generic skills written without domain context produce vague guidance ("handle errors appropriately"). Effective skills are grounded in:

- **Hands-on extraction**: complete a real task with an agent, then extract the reusable pattern — steps that worked, corrections you made, input/output formats, and context you provided.
- **Existing artifacts**: synthesize from internal docs, runbooks, API specs, code review comments, version history, and real failure cases. Project-specific material always beats generic references.

## Refine with Real Execution

The first draft usually needs work. Run the skill against real tasks, then feed the results — all of them, not just failures — back into the creation process. Even a single pass of execute-then-revise noticeably improves quality.

Read agent **execution traces**, not just final outputs. Common waste signals:

- Instructions too vague (agent tries several approaches)
- Instructions that do not apply to the current task (agent follows them anyway)
- Too many options without a clear default

## Spending Context Wisely

Once activated, the full `SKILL.md` body loads alongside conversation history, system context, and other active skills. Every token competes for attention.

### Add What the Agent Lacks

Focus on project-specific conventions, domain-specific procedures, non-obvious edge cases, and the particular tools to use. If the agent would handle it correctly without the skill, cut it.

Bad — agent already knows this:

```markdown
## Extract PDF text

PDF (Portable Document Format) files are a common file format...
```

Good — jumps to what the agent would not know:

```markdown
## Extract PDF text

Use pdfplumber for text extraction. For scanned documents,
fall back to pdf2image with pytesseract.
```

### Design Coherent Units

Scope a skill like you would scope a function: a coherent unit of work that composes well with other skills.

- **Too narrow**: multiple skills must load for a single task, risking overhead and conflicts.
- **Too broad**: hard to activate precisely and wastes context on irrelevant sections.

A skill for "querying a database and formatting results" is one coherent unit. A skill that also covers database administration is trying to do too much.

### Aim for Moderate Detail

Overly comprehensive skills can hurt. Concise, stepwise guidance with a working example tends to outperform exhaustive documentation. When you find yourself covering every edge case, consider whether most are better handled by the agent's own judgment.

### Don't Summarize an Exception-Bearing Rule in the Dispatcher

A `SKILL.md` dispatcher routes to a `references/*.md` file for authoritative detail. When the dispatcher instead **summarizes a rule that has exceptions** — stating the general form while the exception lives only in the reference — an agent acting on the summary feels it has enough and **skips the pointer**. A half-stated rule with exceptions is *worse* than a bare pointer: the more complete the summary reads, the more it suppresses the follow-through to the file that holds the detail that actually changes the answer, and the failure is silent until the wrong output appears.

Real failure (MDP-12002, 2026-07-08): a Quick Reference stated the git branch prefix as "your initials — see `git-workflow.md`". The reference carried a per-developer exception table (`Fabio Colella → fco`, because `fc` was taken). The agent acted on "your initials", produced `fc/…`, and the branch had to be renamed. The formula gave just enough to act and hid the one detail that mattered.

The fix depends on whether the rule has exceptions:

| Rule shape                                                        | Fix                                                                                                                                                                                                                                    | Why                                                                                                         |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Exception-bearing** (per-case table, overrides, "except when…") | **De-anticipate**: replace the formula with a pointer that *flags the hazard* — e.g. "branch prefix has **per-developer exceptions** — read `git-workflow.md` before naming a branch." State no value the agent could act on directly. | A pointer that signals "there's a catch here" makes skipping the reference feel unsafe, which is the point. |
| **Stable / exceptionless**                                        | **Self-sufficient** is fine: state the rule in the dispatcher so acting on it alone is safe (a pointer is optional).                                                                                                                   | No hidden exception means no trap; duplication cost is the only downside.                                   |

Rule of thumb: a dispatcher summary must be either **safe to act on alone** (exceptionless) or **clearly not actionable without the reference** (hazard-flagged). The dangerous middle is a summary that looks complete but isn't.

### Examples in a shared skill: neutral or show-both

When a skill is shared/vendored across repos and an example diverges between consumers (an import path, a token name, a key shape, a file layout), do **not** show one consumer's real value as the default — it misleads every other consumer, and swapping to the other repo's form just flips the victim. If the divergence is incidental to the lesson, use a **neutral placeholder** real in no consumer; if the divergence *is* the lesson, **show both, labeled** per consumer. Full rule and the false-neutral trap: `ref-md-agents-shareable-skills` → "Shared examples: neutral, or show-both".

## The 3 Ws Framework — What, Why, When

Every instruction the agent receives should answer three questions:

- **What**: the concrete action to perform.
- **Why**: the rationale — so the agent can reason about edge cases and adapt when context changes.
- **When**: the trigger condition — so the agent knows which situations call for this action.

This replaces flat rule lists ("do X") with contextual guidance the agent can reason about. It directly activates the reasoning component: an agent that understands *why* makes better decisions than one following rigid directives.

### Flat rules → 3 Ws table

Before — the agent knows *what* but not *why* or *when*:

```markdown
## Rules

- Use parameterized queries.
- Pin dependency versions.
- Run the linter before committing.
```

After — the agent can reason about each rule in context:

```markdown
## Rules

| What                          | Why                                        | When                                  |
|-------------------------------|--------------------------------------------|---------------------------------------|
| Use parameterized queries     | String interpolation creates SQL injection | Any database query with user input    |
| Pin dependency versions       | Unpinned deps break reproducibility        | Adding or updating a dependency       |
| Run the linter before commit  | Catches style issues early                 | Every commit, no exceptions           |
```

### Multi-step workflows → sequenced 3 Ws table

When a task requires multiple steps, add a **Step** column. This gives the agent planning context (sequence + dependencies) alongside reasoning context (why + when):

```markdown
## Database migration workflow

| Step | What                        | Why                                       | When                             |
|------|-----------------------------|-------------------------------------------|----------------------------------|
| 1    | Back up the database        | Enables rollback if migration fails       | Before any schema change         |
| 2    | Run schema migration        | Adds new columns without data loss        | After backup is verified         |
| 3    | Backfill data               | Populates new columns from legacy fields  | After schema migration succeeds  |
| 4    | Validate with spot checks   | Confirms data integrity before cleanup    | After backfill completes         |
| 5    | Drop legacy columns         | Removes technical debt                    | After validation passes          |
```

### When to use each format

| Situation                                     | Format                         |
| --------------------------------------------- | ------------------------------ |
| Independent rules (no ordering)               | 3 Ws table (no Step column)    |
| Ordered workflow with dependencies            | Sequenced 3 Ws table           |
| Single fragile command (no flexibility)       | Prescriptive prose (see below) |
| Flexible guidance (multiple valid approaches) | 3 Ws table with relaxed *What* |

### Mixing 3 Ws with other patterns

The 3 Ws framework composes well with gotchas, validation loops, and checklists:

- **Gotchas** are essentially rows where *Why* explains a non-obvious failure mode and *When* is "always" or "whenever you touch X."
- **Checklists** are sequenced 3 Ws tables with checkboxes in the *What* column.
- **Validation loops** are sequenced tables where the last row is a conditional ("If validation fails, return to step N").

## Calibrating Control

Match the specificity of instructions to the fragility of the task.

### Give freedom when multiple approaches are valid

Use 3 Ws tables with a relaxed *What* column — describe the goal, not the exact command:

```markdown
## Code review process

| What                                   | Why                                        | When                           |
|----------------------------------------|--------------------------------------------|--------------------------------|
| Check queries for SQL injection        | Parameterized queries prevent injection    | Any code touching the database |
| Verify auth checks on endpoints        | Unauthenticated access is a security hole  | Every new or modified endpoint |
| Look for race conditions               | Concurrent paths can corrupt shared state  | Code using shared resources    |
| Confirm error messages are safe        | Leaked internals aid attackers             | Any user-facing error path     |
```

### Be prescriptive when operations are fragile

Some operations have no flexibility. Use prose with an explicit prohibition:

``````markdown
## Database migration

Run exactly this sequence:

```bash
python scripts/migrate.py --verify --backup
```

Do not modify the command or add additional flags.
``````

### Provide Defaults, Not Menus

Pick a default and mention alternatives briefly:

```markdown
Use pdfplumber for text extraction.
For scanned PDFs requiring OCR, use pdf2image with pytesseract instead.
```

### Favor Procedures over Declarations

Teach *how to approach a class of problems*, not what to produce for a specific instance:

```markdown
| Step | What                                            | Why                                     | When                    |
|------|-------------------------------------------------|-----------------------------------------|-------------------------|
| 1    | Read schema from `references/schema.yaml`       | Identifies relevant tables and joins    | Start of any query task |
| 2    | Join tables using `_id` foreign key convention   | Project convention, not always obvious  | Multi-table queries     |
| 3    | Apply user's filters as WHERE clauses            | Translates natural language to SQL      | User specifies criteria |
| 4    | Aggregate numeric columns, format as markdown    | Structured output is easier to consume  | Final output step       |
```

## Writing Skill Instructions

How you phrase instructions matters as much as what they say.

| What                                    | Why                                                                                                                                           | When                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Explain the *why* behind every rule     | Today's LLMs have good theory of mind -- a rule with reasoning is followed more reliably and adapted more intelligently than a bare directive | Always, but especially for constraints and quality requirements |
| Prefer reasoning over rigid directives  | Heavy-handed ALL-CAPS MUSTs and strict templates cause brittle compliance -- reframe as "this matters because..."                             | When you catch yourself writing ALWAYS or NEVER                 |
| Generalize from specific feedback       | Narrow patches ("add a comma after the title") overfit to one example and fail on the next                                                    | When iterating on eval results                                  |
| Keep the skill lean                     | Extra instructions compete for attention and can cause the agent to waste effort following irrelevant guidance                                | After every iteration -- cut what isn't pulling its weight      |
| Read execution traces, not just outputs | Traces reveal where the agent is confused, retrying, or following instructions that don't apply to the current task                           | When investigating why a skill underperforms                    |
| Bundle repeated work into scripts       | If every run independently writes the same helper logic, that's wasted tokens and a reliability risk                                          | When you see the same boilerplate in 2+ execution traces        |

## Key Instruction Patterns

### Gotchas Sections

The highest-value content: concrete corrections to mistakes the agent will make without being told. Keep in `SKILL.md` where the agent reads them before encountering the situation.

```markdown
## Gotchas

- The `users` table uses soft deletes. Queries must include
  `WHERE deleted_at IS NULL` or results will include deactivated accounts.
- The user ID is `user_id` in the database, `uid` in the auth service,
  and `accountId` in the billing API. All three refer to the same value.
- The `/health` endpoint returns 200 even if the database is down.
  Use `/ready` to check full service health.
```

When an agent makes a mistake you have to correct, add the correction to the gotchas section.

### Output Templates

More reliable than describing formats in prose. Short templates live inline in `SKILL.md`; longer ones go in `assets/` (not `references/` — templates are fill-in-the-blanks structures, not documentation).

```markdown
## Report structure

Use this template, adapting sections as needed:

# [Analysis Title]

## Executive summary
[One-paragraph overview of key findings]

## Key findings
- Finding 1 with supporting data
- Finding 2 with supporting data

## Recommendations
1. Specific actionable recommendation
2. Specific actionable recommendation
```

### Checklists for Multi-Step Workflows

Explicit checklists help the agent track progress and avoid skipping steps:

```markdown
## Form processing workflow

Progress:
- [ ] Step 1: Analyze the form (run `scripts/analyze_form.py`)
- [ ] Step 2: Create field mapping (edit `fields.json`)
- [ ] Step 3: Validate mapping (run `scripts/validate_fields.py`)
- [ ] Step 4: Fill the form (run `scripts/fill_form.py`)
- [ ] Step 5: Verify output (run `scripts/verify_output.py`)
```

### Validation Loops

Instruct the agent to validate its work before moving on:

```markdown
## Editing workflow

1. Make your edits
2. Run validation: `python scripts/validate.py output/`
3. If validation fails:
   - Review the error message
   - Fix the issues
   - Run validation again
4. Only proceed when validation passes
```

### Plan-Validate-Execute

For batch or destructive operations, create an intermediate plan, validate it, then execute:

```markdown
## PDF form filling

1. Extract form fields: `python scripts/analyze_form.py input.pdf` → `form_fields.json`
2. Create `field_values.json` mapping each field name to its intended value
3. Validate: `python scripts/validate_fields.py form_fields.json field_values.json`
4. If validation fails, revise `field_values.json` and re-validate
5. Fill the form: `python scripts/fill_form.py input.pdf field_values.json output.pdf`
```

The key ingredient is the validation step that checks the plan against a source of truth.

## Optimizing Descriptions

See [`optimizing-descriptions.md`](optimizing-descriptions.md) for the full workflow including trigger eval queries, train/validation splits, the optimization loop, and applying results.

## Evaluating Skill Quality

See [`evaluating-skills.md`](evaluating-skills.md) for the full eval workflow including test cases, assertions, grading, and the iteration loop.

## Using Scripts in Skills

See [`using-scripts.md`](using-scripts.md) for one-off commands, self-contained scripts with inline dependencies, and script design guidelines for agentic use.

## Combining Agent Components

Real-world skills combine multiple cognitive modes. A good skill might:

1. **Perceive**: read the project structure and identify the tech stack.
2. **Plan**: decompose the task into phases with dependencies.
3. **Reason**: apply chain-of-thought to choose the right approach.
4. **Act**: invoke scripts and CLI tools to execute the plan.
5. **Validate**: run tests and check output against expected results (learning loop).
6. **Communicate**: format the result for the intended audience.
