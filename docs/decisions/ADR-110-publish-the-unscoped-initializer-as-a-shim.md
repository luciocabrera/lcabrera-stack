---
governs:
  - create-lcabrera-stack
  - devkit
---

# ADR-110 — Publish the initializer as an unscoped shim over `devkit create`

**Status:** Accepted

**Date:** 2026-09-06
**Issue:** [#1074](https://github.com/luciocabrera/lcabrera-stack/issues/1074)
**Relates to:** [ADR-040](./ADR-040-npm-scope-for-the-public-packages.md),
[ADR-069](./ADR-069-publish-the-shared-toolchain.md),
[ADR-081](./ADR-081-ship-the-repo-setup-as-two-packages.md),
[ADR-107](./ADR-107-the-stack-is-a-precondition-of-the-packages.md)

## Context

`@lcabrera/devkit` sets up a repository that already exists. `devkit create`
now makes one, which closes the gap for someone starting from nothing — but only
once they know the toolchain is called devkit. Reaching the command requires
having already found the package, and the toolchain's success condition is
repositories outside this one adopting it and staying.

The package managers answer that with one convention. `pnpm create <name>` and
`npm create <name>` resolve `create-<name>`, install it, and run its bin. The
name is theirs, not ours: it is unscoped, it is derived mechanically from what
the user typed, and there is no spelling of it that a scoped package can serve.

The constraint pulling the other way is that this repository has too many
published names already, and each one is permanent — an npm version cannot be
replaced, and a package name cannot be reused after unpublishing.

## Options considered

1. **No initializer; document `devkit init` and `devkit create`.** Rejected: it
   is the state that prompted the issue. Every path to the toolchain starts with
   already knowing its name.
2. **Move the behaviour into the initializer and have devkit depend on it.**
   Rejected: the setup commands belong beside the assets they place and the
   manifest they record, and splitting one verb out of the CLI would make
   `devkit create` and `pnpm create lcabrera-stack` two implementations that
   only agree by inspection.
3. **Publish a shim with no behaviour of its own.** _Chosen._ One bin, which
   spawns the `devkit` CLI with `create` in front of the arguments it was given.

## Decision

`create-lcabrera-stack` is published, unscoped, and is a shim: it declares
`@lcabrera/devkit` as a dependency, resolves that package's `bin.devkit` through
node's own resolution, and spawns it with `create` prepended. It exports nothing
but its manifest, it parses no argument, and it holds no default.

Two gates hold it to that shape rather than a review habit:

- It is on the API-surface ratchet (`publishing.publicPackageDirs`), and what
  the ratchet reads is the manifest's `exports` map — what a consumer can
  import, not what the files happen to declare. The shim names no subpath there,
  so its snapshot under `reports/api-surface/` is empty; adding one puts every
  symbol that entry reaches into the snapshot, which is a diff a reviewer has to
  accept deliberately. A bare `export` in the bin with no subpath pointing at it
  is unreachable from an install — dead code inside the tarball rather than a
  second surface — so it is deliberately not what this gate answers for.
- `vp run tarball:verify` packs it, installs it beside the packages it wraps in
  a scratch repository outside this tree, and runs it. The finding it asserts is
  the tree that comes out — a repository, with a commit, with the config the
  profile wrote — because a shim that cannot resolve what it wraps exits and
  leaves an empty directory, which reads afterwards exactly like a consumer who
  never ran it.

**Its name is deliberately in neither scope, and this is the only package for
which that is true.** AGENTS.md §1 reads an unscoped package as a sign that
nobody asked whether it ships, which is the history behind
`@lcabrera/eslint-plugin` ([ADR-057](./ADR-057-publish-the-custom-lint-rules.md)).
Here the question was asked and answered: it ships, and it cannot be scoped,
because the package manager derives the name from what the user types. No
existing package is renamed to match.

## Consequences

A permanent npm name is taken for a package that will never have a feature. That
is the price, and it is paid once.

The version story is the cost that recurs. The shim resolves the CLI at runtime,
so its own version says nothing about the behaviour a consumer gets; a
`pnpm create` run installs the shim fresh each time and takes whatever
`@lcabrera/devkit` its dependency range admits. Read the shim's changelog as a
record of the wrapper, never of the setup — `@lcabrera/devkit`'s changelog is
where the setup's history is.

Being unscoped also means the name is squattable in a way a scoped one is not,
so it is worth publishing before it is needed rather than after.

## Alternatives considered

- **Ship the initializer as a bin of `@lcabrera/devkit`.** Rejected on how the
  package managers resolve: `pnpm create lcabrera-stack` looks up a package
  named `create-lcabrera-stack` and never reads another package's bin table, so
  no bin name in devkit can be reached this way.
- **Give the shim its own flags — a template choice, a package manager choice.**
  Rejected: two front doors to the same command, differing in what they accept,
  is the drift this ADR's shape exists to prevent. A new option belongs on
  `devkit create`, where both doors reach it.

## References

- [#1074](https://github.com/luciocabrera/lcabrera-stack/issues/1074) — the
  issue, and the comment settling the publish decision.
- `packages/create-lcabrera-stack/README.md`
- `scripts/verify-devkit-tarball.mjs`
