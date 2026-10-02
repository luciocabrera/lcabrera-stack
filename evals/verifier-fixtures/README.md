# Verifier fixtures

Regression fixtures for the `refactor-verifier` prompt. They exist for one
failure: someone edits `.claude/agents/refactor-verifier.md` and it quietly stops
catching a class of violation.

```bash
vp run evals:verifier              # every fixture, twice
vp run evals:verifier -- --runs 3
```

It needs a Claude login, or `CLAUDE_CODE_OAUTH_TOKEN` set. Full reports go to
`.tmp/verifier-evals/`.

## What a run does

The runner reads the verifier's agent definition, drops the frontmatter, and
passes the body as the system prompt, unchanged. Each fixture sends one
dispatch ([`dispatch.md`](./dispatch.md)): the shared issue's §5 and §6
([`issue.md`](./issue.md)), the fixture's `change.diff`, and
`docs/agents/refactor-verified-contract.md`, which the verifier would otherwise
read itself.

The session has no tools and loads no settings. **That makes this a narrower
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

- the criteria the verifier marks `not-met` are exactly the expected ones;
- the verdict is not a plain `PASS`, which a run with no tools cannot have
  earned under the contract's §4;
- and the runs agree.

It reads the criteria table, not the `VERDICT:` line. Without tools the verdict
line cannot separate "found the violation" from "could not run a gate": both
come out as `FAIL`, or as an `ERROR` the schema does not have. A row whose
outcome reads `not-met (unverified)` or `unverified` is a criterion the verifier
could not check, and does not count as a finding.

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
