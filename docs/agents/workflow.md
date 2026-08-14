# Agent Workflow

How agents create issues, open pull requests, and merge in this repository.

This page is the **entry point**, not a second rulebook. Where a rule is already
owned elsewhere it is linked, never restated — a convention written down twice
drifts, and this repo has been bitten by exactly that (a changelog job that
reported success through 159 commits; three agent-instruction files that went 92
lines stale because nothing checked them).

| You are about to…      | Read                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| Do anything            | [`AGENTS.md`](../../AGENTS.md) — the standing rules                                           |
| Start non-trivial work | [`docs/coordination/README.md`](../coordination/README.md) — claim it first                   |
| Open an issue          | [`standard_issue.md`](../../.github/ISSUE_TEMPLATE/standard_issue.md)                         |
| Open a PR              | [`pull_request_template.md`](../../.github/pull_request_template.md)                          |
| Merge                  | [`merge-checklist.md`](merge-checklist.md)                                                    |
| Write a commit message | [`scripts/lib/commit-convention.mjs`](../../scripts/lib/commit-convention.mjs) — the one spec |
| Run the checks         | [`COMMANDS.md`](../../COMMANDS.md)                                                            |

## 1. Creating an issue

Use the [standard issue template](../../.github/ISSUE_TEMPLATE/standard_issue.md)
and fill **every** section. Write "None" rather than deleting a heading: the
next agent cannot tell an omission from a considered no.

Reproduction steps are **mandatory for bugs** — steps, environment, expected,
actual, logs.

**Exemption.** Tracking issues opened by `vp run coordination:claim --new-issue`
are a link between a task file and the planning board; the task file carries the
detail. Holding those to the full template would put the repo's own tooling in
permanent violation of its own rule.

## 2. Opening a pull request

Use the [PR template](../../.github/pull_request_template.md) and fill every
section, including **Impact Analysis** — that section exists because several
agents work this repo in parallel and a change that is safe in isolation may not
be.

Two headings are load-bearing: **`## What` and `## Verification` are matched by
CI** (`scripts/lib/commit-convention.mjs`, run by
[`pr-standards.yml`](../../.github/workflows/pr-standards.yml)) and must keep those
exact spellings. Numbering, emoji or bold in _those two_ headings fails the gate.
Decorate the others freely.

The PR title is a Conventional Commit. The type list lives in the spec, not here.

## 3. Merging

Work through [`merge-checklist.md`](merge-checklist.md). Abort if any item fails.

Trust the automated checks for what they cover and spend the attention on the
`[judgement]` items — scope fidelity, contradiction of another agent's work,
ambiguity introduced for the next one.

## 4. Updating documentation

Follow the **Documentation Update Rule** in the
[`quality-gate-workflow` skill](../../.github/skills/quality-gate-workflow/SKILL.md#documentation-update-rule):
docs change in the _same commit_ as the code. It names the specific homes —
`ARCHITECTURE.md`, `INVENTORY.md`, `PATTERNS.md`, ADRs, `COMMANDS.md`.

Update **this** page only when the workflow itself changes, and
`merge-checklist.md` only when the merge bar changes. Neither is a general
changelog.

## 5. Modifying existing code

- Preserve the existing architectural pattern. If two approaches exist for one
  thing, that is the bug.
- Never switch approaches (A → B) without recording why in the PR, and in an ADR
  when the decision outlives the PR.
- Add tests for new logic, and check they fail without the change.
- Read the `ARCHITECTURE.md` covering the files you are touching **before**
  editing.

## 6. When something is ambiguous

Stop. Do not guess and do not paper over it with a workaround
([`AGENTS.md`](../../AGENTS.md) Rule 10). Open a clarification issue with the
standard template, describing what you know, what you cannot determine, and the
options — then ask.

## Relationship to `templates-spec.md`

[`templates-spec.md`](templates-spec.md), alongside this page,
is the source specification these files were generated from. It records the
intended structure; the files linked above are what agents actually use, and one
deliberate deviation is recorded in it: the PR template's `## What` and
`## Verification` headings keep their plain spelling so the existing enforced
gate keeps working.
