---
governs:
  - devkit
  - repo-standards
---

# ADR-110 — Ship the gate bins as JavaScript, and name the Node they need

**Status:** Accepted

**Date:** 2026-09-06
**Issue:** [#1096](https://github.com/luciocabrera/lcabrera-stack/issues/1096)
**Relates to:** [ADR-069](./ADR-069-publish-the-shared-toolchain.md),
[ADR-073](./ADR-073-publishing-gates-check-the-packed-tarball.md),
[ADR-107](./ADR-107-the-stack-is-a-precondition-of-the-packages.md)

## Context

`@lcabrera/repo-standards` and `@lcabrera/devkit` ship `.mjs` source and do not
build. Both declare bins, and a bin is the one published artifact a consumer
executes with Node directly, out of `node_modules/.bin`, with nothing of their
own in front of it. That is what separates these two from `@lcabrera/ui`, which
also publishes source: `ui`'s source is compiled by the installing toolchain and
never handed to Node as it is.

Twenty-six more gates moved into `repo-standards` in #1099, as `.mjs`. Whether
they should instead be TypeScript was put to a decision rather than settled by
the extension they happened to arrive with.

Neither package declares `engines`, and nor does any other package published
here. So nothing tells an installer which Node these bins were written for, and
the first sign of a mismatch is the bin failing after it is already installed.

## Problem

A published `.ts` bin does not run at all. Node's type stripping refuses any file
under `node_modules`, which is the only directory a published bin ever runs from.
On Node 26.7.0, with the same one-line annotated file placed at a directory root
and under `node_modules/probe-pkg/`, and no flags:

```
$ node outside.ts
hi there
$ node node_modules/probe-pkg/bin.ts
Error [ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING]: Stripping types is
currently unsupported for files under node_modules, for
".../node_modules/probe-pkg/bin.ts"
```

Running it from the source directory is what makes the opposite look true, and a
`workspace:*` link resolves the source directory — the same blind spot that let
the shipped git hooks arrive inert (ADR-073). This repository already knows the
error code: `targetProblems` in
[`packages/repo-standards/scripts/publish-surface.mjs`](../../packages/repo-standards/scripts/publish-surface.mjs)
names it when an `exports` entry points at a `.ts` file. Nothing said it about a
bin, because `bin` is not part of the `exports` map the gate walks.

## Options considered

1. **Publish TypeScript source and run it under type stripping.** Rejected on
   the probe above. It is not a trade-off with a cost attached; the artifact
   does not execute, and no Node flag reachable from `node_modules/.bin` turns
   it on.
2. **Build to JavaScript.** Rejected on what one manifest key costs. `shipsSource`
   in
   [`packages/repo-standards/scripts/api-surface-config.mjs`](../../packages/repo-standards/scripts/api-surface-config.mjs)
   is `manifest.scripts?.build === undefined`, and `isBuiltPublicPackage` in
   `publish-surface.mjs` is that key plus `publishConfig.access`. Adding a
   `build` script therefore moves a package out of the source class in three
   gates at once. Planted on `repo-standards` and run: `api-surface:verify`
   demanded a `.d.mts` beside every one of its export subpaths, `attw:verify`
   demanded a `dist/`, and `publish:verify` demanded a `publishConfig.exports`
   block naming built paths. `toBuiltPaths` maps `./src/` to `./dist/` and
   nothing else, so a package whose sources live in `scripts/` does not fit the
   mapping without either moving every file into `src/` or widening a rule that
   every built package here shares. On top of that, every in-repo invocation of
   a gate — including the git hooks, which run before anything has had a chance
   to build — would start depending on build output being present and fresh, and
   a gate reporting a pass from a stale build is exactly the failure Rule 14
   exists for.
3. **Keep the bins as JavaScript source, and put a Node floor on them.**
   _Chosen._

## Decision

**A package that ships a bin ships that bin as JavaScript.** `repo-standards`
and `devkit` continue to ship `.mjs` and `.cjs` source and continue not to
build, so they stay outside `publish:verify` and `attw:verify` by those gates'
own filter, with `vp run tarball:verify` answering for them instead — the
arrangement ADR-073 set up and this decision declines to disturb.

**A package that ships a bin declares `engines.node`.** The floor is `>=26`: the
version `.node-version` pins is the only one these bins are exercised on, in
CI and in the scratch consumer `tarball:verify` installs them into. It is a
floor and not a band. Root `engines.node` is `>=26 <27` because that is the range
an install of _this_ repository may proceed in, with the exact version pinned
separately; a published package with an upper bound would refuse a consumer's
Node the day the next major ships, for no fault of theirs.

The floor is part of the stack ADR-107 states. That ADR keeps versions out of
the stack list on purpose, and names the exception it is making room for: a
version belongs in prose where it is a floor a reader must clear. This is that
case, and `engines.node` is its machine-readable half.

**The gate that holds it** is `vp run tarball:verify`, which reads the packed
manifest of every distributed package and reports one that declares bins and no
`engines.node`. Checking the packed manifest rather than the workspace one is
the point: `files` and `publishConfig` can differ between them, and only the
packed one is what an installer reads.

**The size ceiling follows the file, not the extension.** `scripts:verify` used
to measure `.mjs` and `.cjs` alone, so a tooling script renamed to `.ts` left the
ceiling silently — and a gate measuring fewer files reports the same clean pass
as a clean tree. It now measures any `.js`, `.ts`, `.mts` or `.cts` under a
`scripts/` directory as well, which is the set `.claude/rules/scripts.md` already
claimed to govern. Nothing in the tree matches the widened half today, so it adds
no baseline entry; it is there so that the day one of these files is ported, the
ceiling ports with it.

## Consequences

**The gate scripts stay outside the type checker, and that is the cost.**
Renaming the files #1099 moved to `.ts` and pointing their imports at each other
produces 1,334 `tsc` errors across 93 of 105 files, 1,093 of them a missing type
on a parameter or a destructured binding. Those are boundaries nobody has ever
written down, and the delivery question above does not make them go away — it
only says that renaming the files is not how they get written.

**The way to close it does not touch the delivery.** Both workspaces already
compile their `.mjs` through `allowJs`. Adding `checkJs` puts every gate script
under the same strict checker with the same 1,334 errors to answer, and none of
the packaging consequences, because the published artifact does not change. That
is the follow-up this decision leaves open, and it is a different shape of work:
typing 15,000 lines of existing behaviour, one module at a time, against tests
that must keep deciding what they decided before.

**`.mjs` keeps a trap the ratchet only just reaches.** The API-surface extractor
reads a package's entries through its workspace tsconfig, and without `allowJs`
it loads no `.mjs`, snapshots an empty surface, and passes exactly as a correct
one would. Both generated tsconfigs set `allowJs` for that reason
(`packages/ts-configs/tsconfig.entries.ts`), and this decision keeps the
condition load-bearing rather than retiring it.

**A consumer on an older Node now fails at install rather than at first run.**
That is louder and earlier, and it is still a refusal: someone who would have got
away with Node 24 no longer will. The floor names what is exercised, not what
happens to work.

## Alternatives considered

**Port only the files #1099 moved, and leave the rest.** Rejected on the shape of
the directory. Those 105 files sit in one flat directory with 119 others and
import across the line in both directions — 59 edges out of the moved set into
modules that stay, and 3 back. Half a directory in one language and half in
another is a boundary every future change has to reason about, and it buys
nothing that porting all of it later would not buy more cheaply.

**Declare `engines.node` as `>=26 <27`, matching the root.** Rejected: the root
band bounds an install of this repository, where the exact version is pinned
alongside it and moved deliberately. A published package inherits none of that
management, and an upper bound on it is a breakage scheduled for a date nobody
picked.

**Say nothing about Node and let the syntax error speak.** Rejected for the
reason ADR-107 rejected the same shape: a failure a consumer cannot distinguish
from a bug is one they will file as a bug.

## References

- [#1096](https://github.com/luciocabrera/lcabrera-stack/issues/1096) — this decision
- [#1099](https://github.com/luciocabrera/lcabrera-stack/pull/1099) — the move that raised it
- [ADR-073](./ADR-073-publishing-gates-check-the-packed-tarball.md) — why only a packed tarball answers
- [ADR-107](./ADR-107-the-stack-is-a-precondition-of-the-packages.md) — the stack this floor joins
