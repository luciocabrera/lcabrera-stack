# Verifier fixtures

Regression fixtures for the `refactor-verifier` prompt. They exist for one
failure: someone edits `.claude/agents/refactor-verifier.md` and it quietly stops
catching a class of violation.

```bash
vp run evals:verifier              # every fixture, three times
vp run evals:verifier -- --runs 5
```

It needs a Claude login, or `CLAUDE_CODE_OAUTH_TOKEN` set. Full reports go to
`.tmp/verifier-evals/`. The run ends with the cost its sessions reported, summed.

## What a run does

The runner reads the verifier's agent definition, drops the frontmatter, and
passes the body as the system prompt, unchanged. Each fixture sends one
dispatch ([`dispatch.md`](./dispatch.md)): the shared issue's §5 and §6
([`issue.md`](./issue.md)), the fixture's `change.diff`, and
`docs/agents/refactor-verified-contract.md`, which the verifier would otherwise
read itself. It asks for the prose report only: the verdict document
the prompt also describes needs `docs/agents/agent-review-contract.md` and a
pull request, and neither exists in this run.

The session has no tools, no MCP servers and loads no settings, and the run
fails if the session's own `init` message lists any tool. **That makes this a narrower
test than the contract describes.** The real verifier runs gates, plants a
violation and reverts it; this one only reads. So the fixtures test whether it
finds a violation in the diff, and nothing about its gate proof.

## The fixtures

Every violation fixture is `clean` plus one edit, so the planted violation is
the only difference between them. Check with
`diff clean/change.diff missing-test/change.diff`.

| Fixture           | The edit                                              | Criterion it breaks |
| ----------------- | ----------------------------------------------------- | ------------------- |
| `clean`           | none                                                  | none                |
| `suppressed-lint` | an `oxlint-disable-next-line` above a nested ternary  | 3                   |
| `missing-test`    | the `value > max` test removed                        | 2                   |
| `missing-adr`     | the ADR removed; a comment claims it exists           | 5                   |
| `rules-violation` | `interface` with mutable properties instead of `type` | 4                   |

[`expected.json`](./expected.json) holds the criteria each fixture should leave
`not-met`.

## What passes

A fixture passes when, in every run:

- the session reported no tools and finished, so a run that errored or hit a
  limit fails instead of reading as "found nothing";
- the report has a `VERDICT:` line, and it does not start with `PASS`, which a
  run with no tools cannot have earned under the contract's §4;
- the criteria the verifier marks `not-met` are exactly the expected ones;
- and the runs agree, which is why `--runs` must be at least 2; `--runs 1`
  stops before any session starts.

It reads the criteria table, not the verdict. Without tools the verdict line
cannot separate "found the violation" from "could not run a gate": both come out
as `FAIL`, or as an `ERROR` the schema does not have. So the dispatch tells the
verifier to write `not-met (unverified)` for a criterion it cannot establish
without tools, and such a row does not count as a finding.

**So `clean` scores `ok` with `VERDICT: FAIL`, and that is the expected
result.** Criterion 3 says Oxlint reports nothing, which only running Oxlint
can show. The verifier marks it `not-met (unverified)`, and §4 of the contract
turns any unmet criterion into a FAIL. `PASS (inspection-only)` is out too,
because criterion 3 admits a gate. Here FAIL means "I cannot sign this off
without running anything", not "I found a mistake". A verifier with its tools
returns PASS on clean work, and [the tooled tier](#the-tooled-tier) tests that.

## The tooled tier

```bash
vp run evals:verifier:tooled              # every fixture, once each
vp run evals:verifier:tooled -- clean     # one fixture
vp run evals:verifier:tooled -- clean --keep --runs 2
```

This tier tests the verifier's real job. For each fixture it:

1. adds a worktree on a throwaway branch at `main`'s current commit;
2. renumbers the fixture's ADR to the next free number, applies the diff and
   commits it;
3. installs, generates route types and links the local env files
   (`worktree:env`);
4. runs the verifier there with the tools its definition lists, the project's
   settings, and the dispatch `/refactor-verified` uses. Commits, pushes and
   `gh` are blocked.

A fixture passes only when:

- `clean` gets a plain `VERDICT: PASS`, and each violation fixture `FAIL`
  with exactly its criterion from `expected.json` marked `not-met`;
- the report's gate proof shows a `Failed:` line with a non-zero exit and a
  `Passed:` line with exit 0;
- the session held exactly the verifier's tools and finished;
- the worktree is clean with its HEAD unmoved afterwards, and the main checkout
  has the same `git status` as before.

Worktrees and branches are removed after each run unless `--keep` is given.
Reports go to `.tmp/verifier-evals-tooled/`.

It is slow and costly: every fixture is a many-turn session that may run the
full quality gate, so fixtures run one at a time, which also keeps them off each
other's database. It needs the local Postgres the full gate uses, and it never
runs in CI.

## Adding a fixture

1. Write the violation as one edit to `clean/change.diff`, breaking one
   criterion in `issue.md`. Add a criterion if none fits.
2. Add the fixture and its criterion number to `expected.json`.
3. Run the suite. Then prove the fixture can fail: add a sentence to the
   verifier prompt that excuses exactly that violation, run again, and confirm
   only that fixture fails. Revert the prompt.

## What CI runs

The **Verifier fixtures (Claude, advisory)** job in
[`agent-evals.yml`](../../.github/workflows/agent-evals.yml) runs the suite on
`workflow_dispatch`, and on a same-repository pull request that touches the
verifier prompt, the contract or this directory, on `CLAUDE_CODE_OAUTH_TOKEN`.
It uploads the reports. It is not a required check: a red run is a reason to
read the reports before merging, and a spent usage limit cannot stall a merge.
