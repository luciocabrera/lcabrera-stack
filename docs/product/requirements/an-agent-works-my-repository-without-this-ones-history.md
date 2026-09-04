---
id: an-agent-works-my-repository-without-this-ones-history
lines:
  - toolchain
persona: repository-maintainer
state: unmet
packages:
  - devkit
  - repo-standards
requires:
  - agent-instructions-do-not-contradict
  - published-docs-ship-self-contained
issues:
  - 1069
  - 1070
evidence:
  - type: command
    ref: vp run devkit:closure
  - type: command
    ref: vp run seeds:verify
  - type: doc
    ref: packages/devkit/CLASSIFICATION.md
---

# An agent works my repository knowing nothing about the one this came from

## Statement

Agents work in my repository, reading the instructions this toolchain shipped.
Those instructions have to stand on their own. They must not assume a document
that lives in the repository they were written in, name a package only that
repository has, or tell an agent to run a task my repository never defined. When
one does, the agent does not stop and ask — it acts on the wrong version, or it
invents a substitute, and I find out from the result.

## Acceptance

- Every shipped file resolves against a repository holding only the installed
  package: every link, every referenced path, every command named in prose —
  `vp run devkit:closure`.
- No shipped file names anything only the originating repository has: a package
  name, a secret, a task runner, or a task defined only there —
  `vp run seeds:verify`.
- Closure reaches **every kind** of shipped artifact, not only the ones written
  in markdown. A workflow seed, a hook and a subagent definition each have their
  references resolved; an artifact kind that closure cannot read is reported as
  unchecked rather than passing.
- Every shipped file carries a recorded verdict for why it is shippable, against
  a stated criterion — not a per-file judgement made once and forgotten.
- **The checks fail when a reference is dead.** A shipped file pointing at a path
  outside the shipped set, and one naming the originating repository, each produce
  a finding, proven by planting each one.

## Notes

The third criterion is the one that is currently false, and it fails in the
quietest possible way. `devkit closure` reads markdown structure — links, fenced
commands, inline paths — so a workflow seed or a hook, which have none, produce
no findings at all. That is reported identically to a file with nothing wrong in
it. `verify-devkit-seeds.mjs` exists because of this and covers part of the gap
by grepping for the originating repository's identity, which is a different
question from whether a reference resolves.

As the shipped set grows to the whole harness, and then to configs and scripts,
the unread fraction grows with it. An artifact kind closure
cannot parse has to be reported as unchecked, or the coverage number means
nothing.

This requirement is about **reachability**, not correctness: it says an
instruction can be followed in the repository it landed in, not that following it
produces good work. Whether the instruction is any good is
[`a-skill-i-am-handed-completes-its-task`](./a-skill-i-am-handed-completes-its-task.md),
and whether two instructions agree is
[`agent-instructions-do-not-contradict`](./agent-instructions-do-not-contradict.md).
