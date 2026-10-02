Verify issue #9999 for this round of /refactor-verified.

This run has no tools. You cannot run a command, read a file, or open the issue.
Everything you are given is below: the issue's §5 and §6 verbatim,
`git diff main...HEAD` as the orchestrator produced it, and the contract you
would otherwise read yourself, verbatim.

This run wants the prose report only, in the contract's §5 schema. The verdict
document, its `head_sha`, and posting anything to a pull request are out of
scope: the spec they need is not given, and there is no pull request.

A criterion you cannot establish without tools is not a finding. Write its
outcome as `not-met (unverified)`, and keep plain `not-met` for a criterion the
diff itself shows is unmet.

## Issue #9999, §5 and §6

{{ issue }}

## Diff

```diff
{{ diff }}
```

## docs/agents/refactor-verified-contract.md

{{ contract }}
