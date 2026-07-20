## JIRA issues

<!-- For example: https://mdinternational.atlassian.net/browse/ABC-123 -->

## Background (why)

<!-- Describe the background or the context why the change is being implemented -->
<!-- For example: We have noticed user accounts are created with empty emails -->

## Changes (how)

<!-- Describe how the changes were implemented -->
<!-- For example: Backend now throws an error to the front end if the email is empty -->

## How has this been tested?

<!-- How did you test the change? -->

## Screenshots

<!-- Add screenshots if it's appropriate for the reviewers -->

## Checklist

<!--
AI agents: before this box is checked, assess whether this PR warrants running
`/tool-md-maintain-skills`. It is needed when the change introduces or alters something a
skill documents — a convention, command, file layout, API, or recurring pattern — so the
skill should be updated to match. If it does, recommend running it to the user (naming the
affected skill) before merge. If the change touches nothing a skill documents, the step can
be skipped. Humans can ignore this block.
-->

- [ ] I checked whether this change affects any agent skills and ran `/tool-md-maintain-skills` if needed

<!-- AI agents: this PR may carry a "Gory details for AI agents" section for automated reviewers. It
is commented out by default so human-authored PRs stay clean — DO NOT reveal it for a routine PR. Only
if this change has mechanism-level detail worth giving a reviewer (invariants, edge cases, data shapes,
non-obvious choices, and anything that heads off likely reviewer false-positives): reveal the block
below by deleting only its own opening and closing marker lines, then replace the placeholder inside
the collapsible. It then renders
as a folded "Show details" section — present for reviewers, out of the way for humans. If there is
nothing worth adding, leave the block commented (or delete it). -->

<!--
## Gory details for AI agents

<details>
<summary>Show details</summary>

Replace this with mechanism-level detail for an automated reviewer (invariants, edge cases, data shapes, non-obvious choices).

</details>
-->
