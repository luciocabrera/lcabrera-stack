# ADR-003: Give `packages/ui`/`packages/api` their own tsconfig

**Status:** Accepted

## Context

Reported symptom: editing a file directly inside `packages/ui` (e.g. `GlobalSettingsContext/selectors`) showed `Cannot find module '@repo/ui/contexts/GlobalSettingsContext/selectors'` in the editor, even though `vp fmt`/`vp lint`/`tsc --noEmit`/`vp run test` all passed clean when run from `apps/react-router`.

Root cause: `packages/ui` and `packages/api` had no `tsconfig.json` of their own (matching `@repo/utils`'s no-build-step convention from ADR-001). The `@repo/ui/*`/`@repo/api/*` path aliases only existed in `apps/react-router/tsconfig.app.json` — correct for typechecking _through_ that app (which is what every `tsc -p apps/react-router/tsconfig.app.json` run in this session's verification actually did), but useless for any tool that resolves the _nearest_ tsconfig by walking up from a file's own location: an editor's language server opening a file inside `packages/ui/src/...`, or `tsc`/`vp lint` invoked directly against the package's own directory. Both walk up from the file and find the repo-root `tsconfig.json` (minimal, no `paths` at all) long before they'd ever discover `apps/react-router`'s config, since that's a sibling directory, not an ancestor.

This also retroactively explains an anomaly dismissed during Step 1: `vp lint packages/ui` (invoked from the repo root, during the ADR-001 verification pass) produced a cascade of `no-redundant-type-constituents`/"acts as any" warnings and a few hard "cannot find module" errors on self-referencing imports. At the time this was attributed to "an unsupported invocation context" rather than fixed — it was this exact root cause.

## Decision

Extend this monorepo's existing config-generation tool (`@repo/ts-configs`) rather than hand-writing bespoke configs — this is how every app's tsconfig is already produced, and `packages/ts-configs/tsconfig.app.json`/`tsconfig.node.json` for apps are themselves **generated files**; hand-editing them (as an earlier ADR-002 step briefly did, directly patching `apps/react-router/tsconfig.app.json`) would have been silently reverted by the next `pnpm run generate` — so that hand-edit is folded into the generator here too.

1. **`tsconfig.shared.ts`** gains two new optional factory params: `paths` (merged on top of the default `@/*` → `./src/*` mapping, not replacing it) and `types` (appended to the default `['vite/client']`). Both default to no-ops, so every existing app's generated config is byte-for-byte unaffected unless a caller explicitly passes them.
2. **`generate.ts`** gets three new/changed entries:
   - `apps/react-router/tsconfig.app.json` now passes `paths: { '@repo/api/*': [...], '@repo/ui/*': [...] }` — this makes the earlier hand-edit durable/regenerable instead of a one-off that the next generator run would wipe.
   - New `packages/ui/tsconfig.app.json` — self-referencing `@repo/ui/*` → `./src/*` plus a cross-reference to `@repo/api/*`, and `types: ['node']` appended (see below for why).
   - New `packages/api/tsconfig.app.json` — self-referencing `@repo/api/*` → `./src/*`. **Uses `createAppTsConfig`, not `createNodeTsConfig`**, despite `packages/api` having no React: it runs client-side (its tests reference `Window`/`Location`, its `api.util.ts` reads `import.meta.env`) and needs DOM lib + `vite/client` types, which `createNodeTsConfig` deliberately omits. Confirmed via grep that no `node:`-prefixed import or `process.*` reference exists anywhere in `packages/api` before making this call — it was initially (wrongly) set up with `createNodeTsConfig`, caught by the same standalone-typecheck verification this ADR is about.
   - `packages/ui` needed `types: ['node']` appended (not swapped to `createNodeTsConfig`, since it also needs `vite/client`) because its `src/` mixes browser-context components with the Node-context SSR entry utilities from ADR-002 (`packages/ui/src/entry/`) — apps keep these cleanly separated across two tsconfig projects (`tsconfig.app.json` / `tsconfig.node.json`), but this package has no `vite.config.ts` to anchor a second project around, so both type roots live in the one config.
3. Both packages get a thin hand-written `tsconfig.json` (`{ "files": [], "references": [{ "path": "./tsconfig.app.json" }] }`), matching every app's existing convention exactly.
4. Both packages get a `package.json` dependency correction pass, since pnpm's strict linking means a package can only resolve what it explicitly declares: `packages/ui` needed `vite` (for `vite/client` types) and `@types/node` (for the `entry/` utilities' `node:stream`/`process` usage) added; `packages/api` needed `vite` added (and an initially-added `@types/node` removed once `createAppTsConfig` replaced `createNodeTsConfig`, since it turned out unnecessary).
5. `packages/ui/src/vite-env.d.ts` (new) declares the two StyleX virtual modules (`virtual:stylex:runtime`, `virtual:stylex.css`) that `DevStyleXInject` needs — previously only ambiently declared in `apps/react-router/src/vite-env.d.ts`, invisible to `packages/ui`'s own standalone program.

## Consequences

- `packages/ui`/`packages/api` now typecheck and lint cleanly **in isolation** (`tsc -p packages/ui/tsconfig.app.json`, `vp lint packages/ui` from the repo root), not just as part of a consuming app's program — fixing both the reported editor symptom and the dismissed Step 1 anomaly.
- Any future workspace package added to this monorepo that needs to self-resolve its own path aliases should follow the same recipe: an entry in `generate.ts` (not a hand-written `tsconfig.app.json`), a thin `tsconfig.json` wrapper, and real `package.json` dependencies for anything its own `types` array or source pulls in — do not assume a consuming app's tsconfig is sufficient once a package is more than a couple of flat utility files (the `@repo/utils` no-tsconfig pattern remains fine for genuinely tiny, dependency-free packages; it stopped being fine here once `packages/ui` grew to the scale ADR-001/002 produced).
- `apps/admin_system` is unaffected — none of its generator entries changed, confirmed via a standalone `tsc --noEmit` re-run (same single pre-existing, unrelated error as always).

## Verification performed

Regenerated all configs (`node --experimental-strip-types packages/ts-configs/generate.ts`), reinstalled, then: `tsc --noEmit` scoped to `packages/ui`'s own new tsconfig — clean (was previously failing on the reported error). Same for `packages/api` — clean. `vp lint packages/ui` and `vp lint packages/api` from the repo root — clean (previously the source of the dismissed Step 1 cascade). Full gate re-run from `apps/react-router` — 317 test files, 1331 tests, fmt/lint/typecheck all clean, same single pre-existing unrelated error. `apps/admin_system`'s own standalone typecheck re-run to confirm no unintended side effect.
