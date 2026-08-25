# ADR-040 — The public packages publish under `@lcabrera`, internal ones stay `@repo`

**Status:** Accepted · **Date:** 2026-07-21

## Context

`packages/ui`, `api`, `server` and `utils` are the product ([ADR-039](ADR-039-duplicate-over-undeclared-edges.md)); the apps exist to exercise them. They were all named `@repo/*`, which is the placeholder `create-turbo` scaffolds with. `@repo` is not a scope anyone owns — every probe of `@repo/<anything>` on the npm registry 404s — so nothing could ever be published under it, and a consumer resolving `@repo/ui` would fail.

The other six workspaces — `vite-configs`, `ts-configs`, `plugins`, `node-runtime` and the two server-side ones — are build and tooling infrastructure. They are not published and there is no plan to publish them.

## Decision

**The four publishable packages become `@lcabrera/*`. The six internal ones stay `@repo/*`.**

The scope is an npm organisation created for this purpose. `@lcabrera` was chosen over the longer `@luciocabrera` (also owned) because the scope appears in every import line in every consuming project, permanently.

### The split is deliberate, not a half-finished migration

A uniform rename would have been less work. Two scopes carry information the single scope cannot: **`@lcabrera/*` means this ships and has consumers outside this repo; `@repo/*` means internal, change it freely.** That is the distinction the first section of `AGENTS.md` leads with, and the import line now states it. A reader deciding whether a breaking change is cheap or expensive gets the answer from the specifier.

The cost is that anyone extending the repo must know which scope a new package belongs to. The rule: does it ship? Then `@lcabrera`, and it inherits the never-baseline standard and the publishing invariants in `AGENTS.md` §1. Otherwise `@repo`.

### `publishConfig.access: "public"` on all four

npm defaults a scoped package to restricted, and a free organisation cannot host private packages, so the first publish would fail on permissions with an error that does not say which field is missing. All four now declare it. They remain `private: true` until there is a build and a version; that flag is the only thing preventing an accidental publish.

## Consequences

**This had to happen before the first release, not after.** StyleX derives every custom-property name from `packageName:pathRelativeToPackageRoot`, computed without reading the file. Renaming the package renames every theme variable `@lcabrera/ui` defines. Today that costs nothing because nothing is published; after `v0.1.0` it silently breaks every consumer's `createTheme` — the same failure mode as moving a `*.stylex.ts` file, which `packages/ui/src/stylex-module-paths.test.ts` guards. That guard freezes paths, not the package name, so it would not have caught this.

**Historical ADRs were not rewritten.** The mechanical rename initially edited 15 of them, including making [ADR-008](ADR-008-packages-api-renamed-data-access.md) claim a rename of `@lcabrera/api → @repo/data-access` that never happened. All were reverted. An ADR is a dated record of what was true when written; ADR-008 says so about its own predecessors, and this one is the pointer for anyone reading them later.

**Two scopes mean tooling must know about both.** `scripts/lib/docs-paths.mjs` matched `@repo/` only, so after the rename it would have stopped validating every `@lcabrera/*` specifier in the docs — reporting the same clean pass as having nothing to check. It now matches either scope, with a test for each.
