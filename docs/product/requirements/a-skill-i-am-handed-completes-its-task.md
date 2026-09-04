---
id: a-skill-i-am-handed-completes-its-task
lines:
  - toolchain
persona: repository-maintainer
state: unmet
packages:
  - devkit
requires:
  - agent-instructions-do-not-contradict
issues:
  - 1071
  - 1068
evidence:
  - type: command
    ref: vp run skills:validate
  - type: command
    ref: vp run devkit:closure
---

# A skill that arrived with the setup does its job in my repository

## Statement

The toolchain ships instructions my agents read and act on without re-deriving
them. I need each one to actually work where it landed: to be found when the
situation it covers arises, to point only at things my repository has, and to
leave the task in the state it describes. A skill that is never triggered and a
skill that does not exist are the same thing from where I sit — and the first one
still costs me maintenance.

## Acceptance

- Every shipped skill, path rule and subagent definition is structurally
  well-formed: frontmatter parses, required fields are present, and the file
  matches the contract its kind declares — `vp run skills:validate`.
- Every path any of them references resolves in a repository holding only the
  installed package — `vp run devkit:closure`.
- Each one's description states **when to use it**, specifically enough to
  discriminate: a description that would match any task, or none, is a defect
  reported by name.
- **The checks fail when an artifact is broken.** A malformed frontmatter, a
  reference to a moved file, and a description too vague to trigger each produce
  a finding, proven by planting each one.
- Invocation is measurable for the artifacts where invocation is observable, and
  the report says which kinds those are — a path rule is auto-loaded by glob and
  nothing fires, so it has no invocation to count and is reported as
  unmeasurable rather than given a proxy.

## Notes

The last criterion is the honest boundary of this requirement, and it is worth
being explicit about what it concedes. Whether a skill _completes its task well_
is a judgement, and the only instrument for it is a model reading the output —
which is non-deterministic, costs money per run, and must never gate a merge. So
this requirement asserts the three things a machine can settle (well-formed,
resolvable, discriminating) and stops.

That is a narrower claim than the title promises, deliberately. The alternative
was an acceptance criterion nobody could decide, which is the specific failure
that makes a register unusable.

A zero invocation count does not settle anything either. It has three causes that
end differently: the description never triggers (fix it and re-measure), the job
moved somewhere else (delete it and leave a pointer), or it is genuinely
unneeded (delete it). The count opens that classification; it does not close it.

Usage data is per-harness and local — Copilot and Gemini leave no transcript at
all — so absence of a record is not evidence of absence of use.
