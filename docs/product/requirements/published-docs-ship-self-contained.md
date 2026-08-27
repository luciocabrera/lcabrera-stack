---
id: published-docs-ship-self-contained
lines:
  - application
  - toolchain
persona: application-developer
state: unmet
packages:
  - devkit
  - repo-standards
  - server
  - ui
requires: []
issues:
  - 988
  - 992
evidence:
  - type: doc
    ref: packages/ui/README.md
  - type: doc
    ref: packages/devkit/README.md
  - type: doc
    ref: packages/repo-standards/README.md
  - type: command
    ref: vp run docs:verify
---

# A shipped document reads with only its package on disk

## Statement

I installed one of these packages. The documentation that came with it — and the
page the registry renders from its README — has to work from where I am standing:
every link opens, every claim it makes is stated rather than cited to somewhere I
cannot reach, and nothing it names is a directory that only exists in the
repository it was written in.

## Acceptance

- No published README contains a relative link resolving outside its own package
  directory.
- A citation that stays is an absolute URL, matching the pattern published
  READMEs already use for external references.
- Reasoning a reader needs is **stated** in the shipped document, not replaced by
  a pointer to a document that does not ship.
- No shipped document's prose implies a file is installed when it is not.
- A document a consumer never needs is not shipped at all, rather than shipped
  full of references it cannot follow.

## Notes

The existing doc gate asks whether a path resolves **in this repository**, which
is the inverted question for a published artifact: a link can resolve perfectly
here and point at nothing in the install. That is why `vp run docs:verify`
appears in `evidence` as where to look rather than as what settles this — the
check that would settle it reads the packed tarball.
