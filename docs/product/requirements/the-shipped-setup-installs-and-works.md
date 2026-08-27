---
id: the-shipped-setup-installs-and-works
lines:
  - toolchain
persona: repository-maintainer
state: met
packages:
  - devkit
  - repo-standards
requires: []
issues: []
evidence:
  - type: command
    ref: vp run tarball:verify
  - type: command
    ref: vp run publish:verify
  - type: command
    ref: vp run attw:verify
  - type: code
    ref: scripts/verify-devkit-tarball.mjs
  - type: doc
    ref: docs/decisions/ADR-073-publishing-gates-check-the-packed-tarball.md
---

# The shipped setup works as installed

## Statement

I install the toolchain into my repository and run its setup. What arrives works
as it arrives. I do not want to discover afterwards that a git hook came without
its executable bit and has been silently doing nothing, or that a file the setup
needs was never in the tarball, or that the types resolve here and not under my
module resolution.

## Acceptance

- Each distributed package is packed and installed into a scratch repository
  holding none of this repository's files, and exercised there:
  `vp run tarball:verify`, which CI runs as its own step.
- A shipped git hook is executable **in the installed package**, not merely in
  the source tree — checked on the unpacked file's mode, since a `workspace:*`
  link resolves the source directory and never shows a mode at all.
- The published entry map resolves from the installed package
  (`vp run publish:verify`) and its types resolve under every module resolution
  mode (`vp run attw:verify`).
- Nothing a shipped file references is missing from what ships with it:
  `vp run devkit:closure -- --shipped`.

## Notes

`met` here rests on gates that run on every push and in CI, which is what the
state field is worth: the claim is attached to something that fails loudly when
it stops being true. The reasoning for reading the packed tarball rather than
the manifest's file list is
[ADR-073](../../decisions/ADR-073-publishing-gates-check-the-packed-tarball.md) —
negated patterns in `files` are honoured by one packer and ignored by another.
