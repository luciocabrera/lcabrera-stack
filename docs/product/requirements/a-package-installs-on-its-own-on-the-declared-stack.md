---
id: a-package-installs-on-its-own-on-the-declared-stack
lines:
  - application
persona: application-developer
state: unmet
packages:
  - api
  - node-runtime
  - server
  - ui
  - utils
requires: []
issues:
  - 1081
evidence:
  - type: doc
    ref: docs/decisions/ADR-107-the-stack-is-a-precondition-of-the-packages.md
  - type: command
    ref: vp run publish:verify
  - type: code
    ref: packages/repo-standards/scripts/publish-smoke.mjs
---

# One package, in my own repository, on my own stack

## Statement

I already have an application. I want to install one of these packages into it —
not adopt a whole repository setup, not run a scaffolder over a tree I have
already built — and have it work, provided I am on the stack the packages ask
for. What I must not discover is that the package silently expects a config file
some generator writes, and that my repository is the wrong shape because it was
not generated.

## Acceptance

- A package installs from its published tarball into a repository built by hand
  on the declared stack (ADR-107), and its documented public surface can be used
  there.
- That repository contains **no file the bootstrapper emits**. This is what the
  criterion is for: a package tested only inside a generated repository can
  depend on the generator's output without anything noticing.
- What is checked is what the package publishes: the packed tarball, its
  `exports` map and its `files` field, not the source directory a
  `workspace:*` link would resolve.
- **The gate fails when the invariant is broken.** A package made to depend on an
  emitted config — a tsconfig it did not declare, a Vite plugin only the
  generator wires, a catalog entry — makes it fail.
- **The gate fails when it installed nothing.** A tarball that packed no source,
  an entry point that resolved to nothing, and a scratch repository whose install
  silently no-opped are each reported as a defect rather than a pass.

## Notes

Off the declared stack this requirement makes no claim. That is deliberate rather
than a gap, and
[ADR-107](../../decisions/ADR-107-the-stack-is-a-precondition-of-the-packages.md)
says why. `@lcabrera/ui` publishes TypeScript source and needs StyleX in the
consumer's build, so there is no configuration of a Tailwind-and-Next.js
repository in which it works. Pretending otherwise would make this requirement
unfalsifiable.

What already exists is worth knowing, so this requirement is not read as covering
more than it does. `vp run publish:verify` packs every public package that builds
and has a fresh Node process import each published subpath from a temporary
directory, so `api`, `server`, `utils` and `node-runtime` are already resolved
outside this tree. `@lcabrera/ui` is not, and neither gate would take it as
things stand: `publish:verify` selects on a `build` script, which `ui` has none
of, and `tarball:verify` selects from a hardcoded roster holding the two `.mjs`
packages. Adding a build script would enrol `ui` in the first and not the
second.

So this requirement adds two things rather than one. It covers `ui` at all, and
it changes the question for the rest from "does the import resolve" to "does the
package work in a repository on the declared stack" — compiling StyleX in
someone else's build is not something resolving a subpath can answer.

The scratch repository is the hard part to keep honest. It has to be minimal
enough that its contents are visibly not the bootstrapper's output, and it has to
move as the stack moves — a stale one would keep passing while checking a stack
nobody is on. Generating it from the stack contract rather than hand-maintaining
it is worth considering when the gate is built.

Start with `@lcabrera/ui`: it has the most preconditions of any package here and
is the only one that publishes source rather than a build, so it is where an
undeclared dependency on the generator would surface first.
