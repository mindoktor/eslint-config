# Evaluating Skill Output Quality

Reference: <https://agentskills.io/skill-creation/evaluating-skills>

Run structured evaluations (evals) to test whether a skill produces good outputs reliably — across varied prompts, in edge cases, and better than no skill at all.

## Designing Test Cases

A test case has three parts:

- **Prompt**: a realistic user message — the kind of thing someone would actually type.
- **Expected output**: a human-readable description of what success looks like.
- **Input files** (optional): files the skill needs to work with.

Store test cases in `evals/evals.json` inside the skill directory:

```json
{
  "skill_name": "my-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "Realistic user message with file paths and context...",
      "expected_output": "Human-readable success description.",
      "files": ["evals/files/input.csv"]
    },
    {
      "id": 2,
      "prompt": "A casual phrasing of a different scenario...",
      "expected_output": "What the output should contain or achieve.",
      "files": []
    }
  ]
}
```

Tips for writing good test prompts:

- **Start with 2-3 test cases.** Don't over-invest before the first round of results.
- **Vary the prompts.** Different phrasings, levels of detail, and formality. Some casual, others precise.
- **Cover edge cases.** At least one prompt that tests a boundary condition — malformed input, unusual request, or ambiguous instructions.
- **Use realistic context.** Real users mention file paths, column names, and personal context. "Process this data" is too vague to test anything.

## Running Evals

Run each test case twice: once **with** the skill and once **without** it (or with a previous version). This gives a baseline to compare against.

### Workspace Structure

```text
my-skill/
├── SKILL.md
└── evals/
    └── evals.json
my-skill-workspace/
└── iteration-1/
    ├── eval-test-case-1/
    │   ├── with_skill/
    │   │   ├── outputs/
    │   │   ├── timing.json
    │   │   └── grading.json
    │   └── without_skill/
    │       ├── outputs/
    │       ├── timing.json
    │       └── grading.json
    ├── eval-test-case-2/
    │   └── ...
    └── benchmark.json
```

### Spawning Runs

Each eval run should start with a clean context — no leftover state. In environments that support subagents, this isolation comes naturally. Without subagents, use a separate session for each run.

For each run, provide:

- The skill path (or no skill for the baseline)
- The test prompt
- Any input files
- The output directory

### Capturing Timing Data

Record token count and duration after each run:

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332
}
```

## Writing Assertions

Add assertions after you see the first round of outputs — you often don't know what "good" looks like until the skill has run.

Good assertions:

- `"The output file is valid JSON"` — programmatically verifiable
- `"The bar chart has labeled axes"` — specific and observable
- `"The report includes at least 3 recommendations"` — countable

Weak assertions:

- `"The output is good"` — too vague to grade
- `"The output uses exactly the phrase 'Total Revenue: $X'"` — too brittle

Add assertions to each test case in `evals/evals.json`:

```json
{
  "id": 1,
  "prompt": "...",
  "expected_output": "...",
  "assertions": [
    "The output includes a chart image file",
    "Both axes are labeled",
    "The chart title mentions revenue"
  ]
}
```

Not everything needs an assertion. Writing style, visual design, and "does this feel right" are better caught during human review.

## Grading Outputs

Grade each assertion against the actual outputs. Record PASS or FAIL with **specific evidence** — quote or reference the output, don't just state an opinion.

```json
{
  "assertion_results": [
    {
      "text": "The output includes a chart image file",
      "passed": true,
      "evidence": "Found chart.png (45KB) in outputs directory"
    },
    {
      "text": "Both axes are labeled",
      "passed": false,
      "evidence": "Y-axis labeled 'Revenue ($)' but X-axis has no label"
    }
  ],
  "summary": {
    "passed": 1,
    "failed": 1,
    "total": 2,
    "pass_rate": 0.50
  }
}
```

Grading principles:

- **Require concrete evidence for a PASS.** Don't give the benefit of the doubt.
- **Review the assertions themselves** — notice when assertions are too easy, too hard, or unverifiable.
- For comparing two skill versions, try **blind comparison**: present both outputs to an LLM judge without revealing which version produced each.

## Aggregating Results

Compute summary statistics per configuration:

```json
{
  "run_summary": {
    "with_skill": {
      "pass_rate": { "mean": 0.83 },
      "tokens": { "mean": 3800 }
    },
    "without_skill": {
      "pass_rate": { "mean": 0.33 },
      "tokens": { "mean": 2100 }
    },
    "delta": {
      "pass_rate": 0.50,
      "tokens": 1700
    }
  }
}
```

The `delta` tells you what the skill costs (more tokens) and what it buys (higher pass rate). A skill that adds tokens but improves pass rate by 50 percentage points is worth it. A skill that doubles token usage for a 2-point improvement might not be.

## Analyzing Patterns

After aggregating:

- **Remove assertions that always pass in both configurations** — they don't reflect skill value.
- **Investigate assertions that always fail in both** — broken assertion, too-hard test, or wrong check.
- **Study assertions that pass with skill but fail without** — this is where the skill adds value.
- **Tighten instructions for inconsistent results** — if the same eval passes sometimes and fails others, the skill may be ambiguous.
- **Check token outliers** — read execution transcripts to find bottlenecks.

## Blind Comparison

For a more rigorous comparison between two skill versions, use blind evaluation: present both outputs to an independent LLM judge labeled "A" and "B" — without revealing which version produced each. The judge evaluates on a rubric:

1. **Content**: correctness, completeness, accuracy (1-5 each).
2. **Structure**: organization, formatting, usability (1-5 each).
3. **Overall**: combined score scaled to 1-10.

The judge picks a winner with specific evidence. If assertions are available, check them against both outputs as secondary evidence — rubric scores take priority.

After the blind comparison, an unblinded analysis step reads both skills and execution traces to understand *why* the winner won: clearer instructions, better scripts, more comprehensive examples. This produces actionable improvement suggestions for the loser.

Blind comparison is optional and most useful when:

- Aggregate metrics are close and you need a tiebreaker.
- You suspect the skill is helping for the wrong reasons.
- You want to eliminate confirmation bias in human review.

## The Iteration Loop

1. Give the eval signals and current `SKILL.md` to an LLM and ask it to propose improvements.
2. Review and apply the changes.
3. Rerun all test cases in a new `iteration-<N+1>/` directory.
4. Grade and aggregate the new results.
5. Review with a human. Repeat.

Stop when you're satisfied, feedback is consistently empty, or improvements plateau.

Guidelines for each iteration:

- **Generalize from feedback** — fixes should address underlying issues, not narrow patches for specific examples.
- **Keep the skill lean** — fewer, better instructions often outperform exhaustive rules.
- **Explain the why** — reasoning-based instructions work better than rigid directives.
- **Bundle repeated work** — if every run independently writes the same helper logic, put it in `scripts/`.
