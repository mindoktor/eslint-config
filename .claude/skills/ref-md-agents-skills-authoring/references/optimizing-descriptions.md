# Optimizing Skill Descriptions

Reference: <https://agentskills.io/skill-creation/optimizing-descriptions>

A skill only helps if it gets activated. The `description` field in SKILL.md frontmatter is the primary mechanism agents use to decide whether to load a skill. An under-specified description means the skill won't trigger when it should; an over-broad description means it triggers when it shouldn't.

## How Triggering Works

Agents use progressive disclosure: at startup, they load only `name` and `description` of each skill — just enough to decide relevance. The full SKILL.md loads only when a task matches.

Important nuance: agents typically only consult skills for tasks that require knowledge or capabilities beyond what they can handle alone. A simple request like "read this PDF" may not trigger a PDF skill even with a perfect description, because the agent handles it with basic tools. Skills shine on specialized knowledge — unfamiliar APIs, domain-specific workflows, uncommon formats.

## Writing Effective Descriptions

- **Imperative phrasing**: "Use this skill when…" — the agent is deciding whether to act.
- **Focus on user intent**: what the user is trying to achieve, not the skill's internals.
- **Be pushy**: explicitly list contexts, including cases where the user doesn't name the domain directly.
- **Stay under 1024 characters**: this is the hard spec limit.

Before and after:

```yaml
# Before
description: Process CSV files.

# After
description: >-
  Analyze CSV and tabular data files — compute summary statistics,
  add derived columns, generate charts, and clean messy data. Use this
  skill when the user has a CSV, TSV, or Excel file and wants to
  explore, transform, or visualize the data, even if they don't
  explicitly mention "CSV" or "analysis."
```

## Designing Trigger Eval Queries

Create ~20 eval queries: 8-10 should-trigger, 8-10 should-not-trigger. Store them in a JSON file:

```json
[
  { "query": "I've got a spreadsheet in ~/data/q4_results.xlsx with revenue in col C and expenses in col D — can you add a profit margin column and highlight anything under 10%?", "should_trigger": true },
  { "query": "whats the quickest way to convert this json file to yaml", "should_trigger": false }
]
```

### Should-trigger queries

Vary along several axes:

- **Phrasing**: formal, casual, typos, abbreviations.
- **Explicitness**: some name the domain directly, others describe the need without naming it.
- **Detail**: mix terse prompts with context-heavy ones including file paths and column names.
- **Complexity**: single-step tasks alongside multi-step workflows where the skill's domain is buried in a larger chain.

The most useful should-trigger queries are ones where the connection isn't obvious from the query alone.

### Should-not-trigger queries

The most valuable negatives are **near-misses** — queries that share keywords but need something different:

- Weak: `"Write a fibonacci function"` — obviously irrelevant, tests nothing.
- Strong: `"can you write a python script that reads a csv and uploads each row to our postgres database"` — involves CSV, but the task is ETL, not analysis.

### Tips for realism

Real user prompts include file paths (`~/Downloads/report_final_v2.xlsx`), personal context (`"my manager asked me to…"`), specific details (column names, company names), and casual language.

## Testing Trigger Rates

Run each query through your agent with the skill installed and observe whether the agent loads the skill. Run each query **3+ times** (model behavior is nondeterministic) and compute a trigger rate:

- **Should-trigger**: passes if trigger rate > 0.5.
- **Should-not-trigger**: passes if trigger rate < 0.5.

General script structure (adapt the detection logic to your agent client):

```bash
#!/bin/bash
QUERIES_FILE="${1:?Usage: $0 <queries.json>}"
SKILL_NAME="my-skill"
RUNS=3

count=$(jq length "$QUERIES_FILE")
for i in $(seq 0 $((count - 1))); do
  query=$(jq -r ".[$i].query" "$QUERIES_FILE")
  should_trigger=$(jq -r ".[$i].should_trigger" "$QUERIES_FILE")
  triggers=0

  for run in $(seq 1 $RUNS); do
    # Replace with your agent client's detection logic:
    # returns 0 if skill was invoked, 1 otherwise
    check_triggered "$query" && triggers=$((triggers + 1))
  done

  jq -n \
    --arg query "$query" \
    --argjson should_trigger "$should_trigger" \
    --argjson triggers "$triggers" \
    --argjson runs "$RUNS" \
    '{query: $query, should_trigger: $should_trigger, triggers: $triggers, runs: $runs, trigger_rate: ($triggers / $runs)}'
done | jq -s '.'
```

With 20 queries at 3 runs each, that's 60 invocations. Scripting is essential.

## Avoiding Overfitting

Split your query set to prevent overfitting to specific phrasings:

- **Train set (~60%)**: queries you use to identify failures and guide improvements.
- **Validation set (~40%)**: queries you set aside and only use to check whether improvements generalize.

Both sets must contain a proportional mix of should-trigger and should-not-trigger queries. Keep the split fixed across iterations.

## The Optimization Loop

1. **Evaluate** the current description on both train and validation sets. Train results guide changes; validation results tell you whether changes generalize.
2. **Identify failures** in the train set only. Which should-trigger queries didn't trigger? Which should-not-trigger queries did?
3. **Revise the description**:
   - Should-trigger failures → description may be too narrow. Broaden the scope or add context about when the skill is useful.
   - Should-not-trigger failures → description may be too broad. Add specificity about what the skill does *not* do, or clarify the boundary with adjacent capabilities.
   - **Avoid adding specific keywords from failed queries** — that's overfitting. Find the general category those queries represent and address that.
   - If stuck after several iterations, try a structurally different description rather than incremental tweaks.
   - Check the description stays under 1024 characters — descriptions grow during optimization.
4. **Repeat** steps 1-3 until all train set queries pass or improvement plateaus.
5. **Select the best iteration** by validation pass rate — not necessarily the last one. Earlier iterations may generalize better than later ones that overfit to the train set.

Five iterations is usually enough. If performance isn't improving, the issue may be with the queries (too easy, too hard, or poorly labeled) rather than the description.

## Applying the Result

1. Update the `description` field in SKILL.md frontmatter.
2. Verify it's under 1024 characters.
3. Sanity check with 5-10 **fresh queries** (never used during optimization) — a mix of should-trigger and should-not-trigger. These give an honest check on generalization.
