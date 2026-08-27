---
id: agent-instructions-do-not-contradict
lines:
  - toolchain
persona: repository-maintainer
state: unmet
packages:
  - devkit
  - repo-standards
requires: []
issues:
  - 993
  - 1002
evidence:
  - type: doc
    ref: docs/README.md
  - type: doc
    ref: packages/devkit/README.md
  - type: command
    ref: vp run seeds:verify
---

# Two shipped instructions never say opposite things

## Statement

I run a repository on this toolchain, and so do the agents working in it. They
read the instructions it ships and act on them without re-deriving them, so when
two documents state one fact differently, one of us acts on the wrong version —
and the agent will not stop to ask which. I want each fact stated in exactly one
place, with every other mention pointing at it or naming the command that prints
it.

## Acceptance

- Where two shipped surfaces state one fact, one states it and the others point;
  a restatement is a defect, not a convenience.
- A roster an automated operator acts on is derived from one source, so no
  operator can be reading a smaller set than the rules it enforces.
- No shipped rule instructs an agent to do what another shipped rule forbids.
- A shipped instruction that names a gate, a stage list or a template section
  list names the one that produces it rather than copying it.

## Notes

This is a requirement of the **toolchain product**, not repository housekeeping:
the instructions travel to other repositories inside `@lcabrera/devkit`, so a
contradiction here is a defect delivered to every consumer of it. The rule this
requirement is the product-side statement of — one canonical home per fact — is
[`docs/README.md`](../../README.md)'s opening line.
