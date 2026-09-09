---
applyTo: 'docs/coordination/**'
---

# Reviewing a coordination claim

A file under `docs/coordination/tasks/` is a **work claim**, not part of the
change it accompanies. It records who is touching which paths while the work is
in flight, so a second agent can see the area is taken.

It belongs on the work branch and merges with the work. That is deliberate, and
[ADR-074](../../docs/decisions/ADR-074-the-claim-lives-on-its-work-branch.md) is
the decision: `main`'s ruleset would hold a claim-only PR behind a full CI run,
which lands the lock after the moment it is meant to precede. A CI job deletes
the file once the PR merges.

So do not report a claim file as something that should not have been merged, as
a leftover, or as scope that belongs in a separate PR. Its presence in a feature
PR is the convention working.

What is worth reporting about one:

- Its `area` globs do not cover the paths the PR actually changes.
- Its `issue:` field is missing or points at nothing.
- Its `status` still reads `active` on a PR that is ready for review, or its
  stated blockers contradict the PR description.
