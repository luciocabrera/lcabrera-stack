---
governs:
  - repository
---

# ADR-135 — A Grok subscription reviewer posts with the runner token and is not an accepted reviewer

**Status:** Accepted

**Date:** 2026-10-17
**Issue:** #1375
**Relates to:** [ADR-116](./ADR-116-a-grok-catalog-reviewer-posts-on-pull-requests-and-is-not-an-accepted-reviewer.md)

## Context

[ADR-116](./ADR-116-a-grok-catalog-reviewer-posts-on-pull-requests-and-is-not-an-accepted-reviewer.md) adds a catalog reviewer. That workflow is `.github/workflows/grok-review.yml`. Its auth is `XAI_API_KEY`, it posts under its own GitHub App, and its login is not in `ACCEPTED_REVIEWERS`.

A second review was asked for on the Grok Build session, the file `~/.grok/auth.json`, so the run is billed to that subscription. The catalog job stays on its API key. The CLI uses an API key when no session is active, so this job must not have one in its environment.

`latestReviewPerReviewer` in `scripts/lib/copilot-review.mjs` buckets `acceptedReviews` by login. `github-actions[bot]` is not an accepted login, so a review posted with `GITHUB_TOKEN` never enters that map. The collapse ADR-116 names is two accepted reviewers sharing that login. This job sits outside the set.

On `pull_request`, GitHub runs the workflow from the merge ref. Secrets are passed to a pull request whose head is in this repository, and withheld from a fork. A branch in this repository can edit `.github/workflows/grok-pr-review.yml`, and the edited file is the one that receives `GROK_AUTH_JSON`.

## Decision

`.github/workflows/grok-pr-review.yml` reviews every non-draft, non-fork pull request with the Grok Build session in the `GROK_AUTH_JSON` secret. It does not read `XAI_API_KEY`.

The model writes two files. `scripts/submit-pr-review.mjs` posts them with `GITHUB_TOKEN`, so the author is `github-actions[bot]`. That login stays out of `ACCEPTED_REVIEWERS`. The job is not a required check and does not dispatch `copilot-review-gate.yml`.

The model step blanks `GITHUB_TOKEN` and `GH_TOKEN`, unsets `GROK_AUTH_JSON` before the CLI starts, and passes `--deny` rules for `Read` and `Edit` on the grok home. Those are the CLI's rule names. A `Read` rule also covers `grep`. An `Edit` rule covers `search_replace`. `--always-approve` does not override a matching deny. The probe below was run on 2026-10-17 against the binary this workflow pins, and it is redone when that pin changes. Each run had one denied path and one sibling that was allowed, with `--tools` limited to the tool under test:

- `--deny 'Read(**/secret.txt)'` with `--tools grep` refused `secret.txt` (`deny rule on read`) and returned the sibling file.
- `--deny 'Edit(**/secret.txt)'` with `--tools read_file,search_replace` refused `search_replace` on `secret.txt` (`deny rule on edit`) and updated the sibling file.

The session file is removed before the submit step.

The trigger stays `pull_request`. The job does not declare a GitHub environment. On this event the merge ref is the workflow that runs, so a branch that deletes an `environment` key never waits for the reviewers that key would have required. `pull_request_target` is not used. That event runs the workflow from the default branch and passes secrets, including on a fork, and this job checks out the pull request and runs the prompt and the submit script from that checkout.

## Consequences

- A same-repo branch that rewrites this workflow receives the live session. Replacing `GROK_AUTH_JSON` is the revocation. The catalog job has the same trigger. Its credential is a key, and this one is a login.
- A pull request that leaves the workflow alone still hands the model the workspace. The deny rules are what keep that model off the session file. The strings in `scripts/lib/grok-pr-review-workflow.test.mjs` only prove the flags are present. The probe above is what shows the pinned CLI honors them.
- Every `synchronize` on a ready same-repo pull request spends subscription quota. Drafts and forks do not.
- Until the secret exists, a same-repo pull request fails the model step. The job is not required, so the merge does not wait on it.
- This review cannot green `Copilot review complete`. A dedicated GitHub App would give the threads a distinct author. It would still not green the gate unless that login were added to `ACCEPTED_REVIEWERS`. This decision leaves the login out.

## Alternatives considered

1. **Amend ADR-116 so one record covers both credentials.** That record decides the catalog reviewer. Folding a second credential into it rewrites a dated decision. This record stands beside it.
2. **Post under the catalog App.** That App belongs to the API-key reviewer. A subscription review would then share the catalog's thread author. The two credentials stay separate.
3. **Add `github-actions[bot]` to `ACCEPTED_REVIEWERS`.** The gate would treat this job as a reviewer that can green `Copilot review complete`. ADR-116 alternative 3 rejected that for the catalog, and the same OR applies here.
4. **A GitHub environment with required reviewers on this `pull_request` job.** Protection rules apply to a job that references an environment. The workflow file that runs is the merge ref, so the branch can delete the key and skip the wait. The wait would also hold every unattended review for a person.
5. **`pull_request_target`.** The workflow file would be the one on the default branch, which is the property an `environment` key cannot get from `pull_request`. GitHub passes secrets on that event, including to a fork, and says to avoid it when the job builds or runs pull-request code. This job does both.

## References

- #1375 — the tracking issue
- #1376 — the probe transcript
- [ADR-116](./ADR-116-a-grok-catalog-reviewer-posts-on-pull-requests-and-is-not-an-accepted-reviewer.md)
- [`.github/workflows/grok-pr-review.yml`](../../.github/workflows/grok-pr-review.yml)
- [`docs/tooling/copilot-review-gate.md`](../tooling/copilot-review-gate.md)
