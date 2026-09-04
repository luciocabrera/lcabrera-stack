---
id: a-gate-i-install-fires-on-my-violation
lines:
  - toolchain
persona: repository-maintainer
state: unmet
packages:
  - devkit
  - repo-standards
requires:
  - the-shipped-setup-installs-and-works
issues:
  - 1082
evidence:
  - type: doc
    ref: docs/agents/refactor-verified-contract.md
---

# A gate I installed fires on my violation, and stays quiet otherwise

## Statement

I installed this toolchain for its gates. What I need to know is that each one
still catches the thing it claims to catch — in my repository, not in the one it
was written in. A gate that has quietly stopped reading its input reports exactly
what a gate over clean code reports, so a green build tells me nothing on its
own, and I will trust it anyway. That is the failure I cannot detect by using the
tool.

I also need it quiet when nothing is wrong. A gate that fires on correct code
gets disabled within a week, and then it protects nothing at all.

## Acceptance

- For each gate covered, a violation of the specific property that gate guards is
  introduced into a working tree, the gate runs, and it exits non-zero with a
  message naming the violation it found.
- The same gate over the same tree without the violation exits zero. Both halves
  are required: a gate that always fails and a gate that never fails are equally
  useless, and only running both tells them apart.
- The violation is **generated against the tree under test**, never replayed from
  a stored diff or pinned to a line number. A stored fixture encodes a tree state,
  the tree moves, and the fixture then either fails spuriously or passes
  vacuously — the second silently.
- Coverage is decided by whether a broken version would be observable: a gate
  whose failure is loud is out of scope, and a gate that could stop reading its
  input without anyone noticing is in.
- The checks run with no model in the loop, and run on every pull request.
- A gate whose control has never run — because it was added without one — is
  reported, so the absence of a control is itself visible.

## Notes

This is the requirement behind the practice `refactor-verifier` already performs
by hand: it plants a deliberate violation to prove a gate fires before it will
certify a change. Doing it live, once per review, means nothing is retained and
the same proof is re-derived every time.

The "stays quiet otherwise" half is not decoration. This repository has gates
that were tightened until they fired on correct code, and the response was
suppression rather than repair — which is why the public packages take no
suppressions at all. A requirement that only demanded firing would push in
exactly that direction.

Not in scope: whether a gate guards the _right_ property. That is a judgement
about the standard, not about the gate, and no automated check can settle it.
