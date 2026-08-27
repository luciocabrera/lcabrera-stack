---
id: published-docs-ship-self-contained
lines:
  - application
  - toolchain
persona: repository-maintainer
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

I am deciding whether to adopt one of these packages, and the registry page is
where I decide — I have not cloned anything and I am not going to. Every link on
it has to open, every claim has to be stated rather than cited to a directory I
have no access to, and nothing it names may be a path that exists only in the
repository it was written in. The same holds for any document that arrives in the
install: the agents working in my repository read those and act on them without
checking whether the thing being cited is reachable.

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

**Why this persona, on a requirement that covers both lines.** `packages` names
two toolchain packages and two application-stack ones, so either persona would be
well-formed here — which is precisely why the register's tie-breaker is the
failure list rather than the package roster. A document that ships broken fails
hardest for the repository maintainer: the registry page is where they evaluate
the toolchain **before** adopting it, so a dead link there costs them the
decision itself, and it is their agents that act on a shipped document without
being able to check what it cites. The application developer's failures are
resolution and type errors, which this is not. Both lists are in
[`VISION.md`](../VISION.md).

It stays **one** requirement rather than splitting per line. The sentence is the
same sentence for all four packages — a shipped document reads with only its
package on disk — and two files would state it twice, which is the duplication
the register exists to avoid. Keeping it whole also keeps it a single file for
#992 to flip.
