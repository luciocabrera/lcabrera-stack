---
governs:
  - repository
---

# ADR-116 — A Grok catalog reviewer posts on pull requests and is not an accepted reviewer

**Status:** Accepted

**Date:** 2026-09-09
**Issue:** #1149
**Relates to:** #836 (Claude in-workflow review), #865 (reviewer App identity)

## Context

Pull requests already get three reviews, and they answer different questions.

Copilot's bot and `claude-review.yml` are generic: correctness, then whether the
change fits the surrounding code. Either one covering the head greens the
required `Copilot review complete` status. The agent-review verdict is
criterion-bound and only runs where `/epic` or `/refactor-verified` produced one.

`code-smell-zen` already holds the Clean Code / GoF / TypeScript / React catalog.
Nothing in CI runs it. Claude's prompt does not cite those IDs. A second generic
reviewer would duplicate Claude. The missing pass is the catalog, on every
non-draft pull request.

Two constraints from the existing review machinery, not preferences:

- Two in-workflow reviewers sharing `github-actions[bot]` collapse into one
  bucket (`docs/tooling/copilot-review-gate.md`). A new poster needs its own
  GitHub App.
- `ACCEPTED_REVIEWERS` is an OR-set that greens a required status. Adding a
  catalog reviewer there would let a catalog pass stand in for Claude.

## Decision

Every non-draft pull request is reviewed by Grok against the `code-smell-zen`
catalog. The workflow is
[`.github/workflows/grok-review.yml`](../../.github/workflows/grok-review.yml).
It copies Claude's posting shape: the model writes `grok-review-body.md` and
`grok-review-findings.json`, and `scripts/build-review-payload.mjs` submits them
under a dedicated GitHub App. The model is never handed a tool that can write to
GitHub.

The catalog lives in `.github/skills/code-smell-zen/SKILL.md`. The prompt points
at that file. The IDs are not copied into the workflow.

BLOCKER and HIGH findings become inline comments, so
`required_review_thread_resolution` holds the merge on them. MEDIUM, LOW and NIT
stay in the review body. A line that is not one the diff added is moved into the
body by the submit script, same as Claude.

The Grok App login is **not** in `ACCEPTED_REVIEWERS`. The catalog review does
not green `Copilot review complete`. The workflow does not dispatch
`copilot-review-gate.yml`. The job is not a required check of its own: a missing
secret or a crashed model must not hold every merge. Unresolved threads already
do the holding.

The workflow does not emit an `agent-review-verdict/v1`. #855 declined that for
Claude; the same reason applies.

The CLI is pinned by version and SHA-256 of the `linux-x86_64` binary. The
install script's "latest" pointer is not used. Auth is `XAI_API_KEY`. The model
id is one flag in the workflow; a retired slug is not kept as a silent redirect.

The workflow is repo-specific. It does not ship through `devkit`. Credentials do
not travel, and a seed that skipped every step without them would report success
to a consumer who has nothing working — the same reason `claude-review.yml` stays.

## Consequences

- Every `synchronize` on a ready pull request spends xAI tokens. Drafts are
  skipped so that bill is not paid twice.
- Until `XAI_API_KEY` and the Grok reviewer App secrets exist, the job is red on
  every non-draft pull request. It is not required, so merges still go through
  Claude. A red check that reviewed nothing is visible; a skipped job that looks
  like a clean pass is not.
- Creating the GitHub App, installing it, and adding the three secrets is
  operator work this repository cannot do in a pull request. The intended App
  slug is `grok-clean-code-reviewer`, so the login the exclusion test names is
  `grok-clean-code-reviewer[bot]`. A different slug still posts; the test would
  then name the wrong login.
- Catalog findings that cannot be anchored do not block. That is the same
  lesser-of-two-hazards Claude already accepted: one bad line would otherwise
  reject the whole review.
- Two models can disagree about the same line. Distinct authors make that
  disagreement visible. Resolving both threads is still required.

## Alternatives considered

1. **Extend Claude's prompt with the catalog.** Mixes two jobs in one review.
   A catalog miss and a correctness miss become the same thread author, and the
   catalog has no home of its own when Claude's prompt drifts.
2. **Replace Claude with Grok.** The request was an additional pass. Claude is
   currently the reviewer that greens the required status while Copilot's
   credits are exhausted.
3. **Add Grok to `ACCEPTED_REVIEWERS`.** Changes what `Copilot review complete`
   means, and OR would let a catalog review cover for Claude.
4. **A marketplace action or a Grok Tasks automation.** Not versioned with this
   repository, not tested here, and it would post under the wrong identity.
5. **The xAI HTTP API with no CLI.** The review would see the diff and not the
   files around the hunks. Claude's value is that it reads the surrounding code.
   The CLI is the matching tool, with the tool allowlist restricted to read,
   grep, list, and search-replace.

## References

- #1149 — the tracking issue
- [`.github/workflows/claude-review.yml`](../../.github/workflows/claude-review.yml)
- [`.github/skills/code-smell-zen/SKILL.md`](../../.github/skills/code-smell-zen/SKILL.md)
- [`docs/tooling/copilot-review-gate.md`](../tooling/copilot-review-gate.md)
- [`docs/agents/agent-review-contract.md`](../agents/agent-review-contract.md) §9
