---
id: an-agent-works-my-repository-without-this-ones-history
lines:
  - toolchain
persona: repository-maintainer
state: met
packages:
  - devkit
  - repo-standards
requires:
  - agent-instructions-do-not-contradict
  - published-docs-ship-self-contained
issues: []
evidence:
  - type: command
    ref: vp run devkit:closure:shipped
  - type: test
    ref: packages/devkit/scripts/closure-shipped-plant.test.mjs
  - type: command
    ref: vp run seeds:verify
  - type: command
    ref: vp run classification:verify
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
  `vp run devkit:closure:shipped`. The same gate holds a task that a shipped
  file runs, outside a comment, as `npm run`, `pnpm run`, `yarn run`, `bun run`,
  `vp run`, `{{commands.run}}` or the configured `commands.run` value followed by
  the task. The task must be wired by the profile being checked at its own rung,
  be run by a value in the consumer's `commands` block, or be documented in the
  shipped `COMMANDS.md` while the kit wires it at no rung. Three cases are not
  checked:
  the shipped `COMMANDS.md` itself, which documents every rung; a run that
  passes the runner an option before the task (`--filter`, `-r`, `-w`); and a
  bare `pnpm <task>` or `yarn <task>`, unless `commands.run` is that runner.
- No shipped file names anything only the originating repository has: a package
  name, a secret or a task runner — `vp run seeds:verify`.
- Closure reaches **every kind** of shipped artifact, not only the ones written
  in markdown. A workflow seed, a hook and a subagent definition each have their
  references resolved; an artifact kind that closure cannot read is reported as
  unchecked rather than passing.
- Every shipped file carries a recorded verdict for why it is shippable, against
  a stated criterion — not a per-file judgement made once and forgotten. A file
  shipped with no row, or a row naming a path that no longer ships, fails
  `vp run classification:verify`.
- **The checks fail when a reference is dead.** A shipped file pointing at a path
  outside the shipped set, and one naming the originating repository, each produce
  a finding, proven by planting each one.

## Notes

The probes are plants, and each one fails its gate: a shipped skill running
`npm run harness:verify` inline or in a fenced block, a hook or workflow step
running a script outside the shipped set, a blueprint import only the created
manifest declares — `closure-shipped-plant.test.mjs` holds them. A shipped file
of a kind no resolver reads is listed as unchecked under every profile that
ships it rather than passing silently.

The split between the two gates is by question. `devkit closure --shipped` asks
whether a reference resolves in the receiving repository, which is the question
a task name poses: `npm` exists everywhere, the task after `npm run` only where
a manifest defines it. `seeds:verify` asks whether a file names the originating
repository's identity, which no resolver can answer.

A task a consumer adds is theirs to define and is not judged: closure checks
only the shipped set, and a runner invocation passing an option before the task
names a workspace's task, which the shipped set does not resolve.

This requirement is about **reachability**, not correctness: it says an
instruction can be followed in the repository it landed in, not that following it
produces good work. Whether the instruction is any good is
[`a-skill-i-am-handed-completes-its-task`](./a-skill-i-am-handed-completes-its-task.md),
and whether two instructions agree is
[`agent-instructions-do-not-contradict`](./agent-instructions-do-not-contradict.md).
