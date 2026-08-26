# ADR-045 — Adopt `vite-plus/test` imports; retire the `vitest`-direct convention

- **Status:** Accepted
- **Date:** 2026-07-23
- **Issue:** [#346](https://github.com/luciocabrera/lcabrera-stack/issues/346)
- **Relates to:** [#344](https://github.com/luciocabrera/lcabrera-stack/issues/344)/[#345](https://github.com/luciocabrera/lcabrera-stack/pull/345) — part A (single Vite instance), the base this builds on. [ADR-043](ADR-043-release-tooling-changesets-over-pnpm-native.md)/[ADR-044](ADR-044-decline-pnpm-global-virtual-store.md) — the dependency-tooling exploration this closes out.

## Context

Test files imported test utilities from `vitest` directly, per a documented
convention: AGENTS.md said "For tests, import test utilities from `vitest`
directly." That line predated full vite-plus adoption — it sat in the **same
sentence** as "import Vite config from `vite-plus`, not `vite`," an asymmetry that
only makes sense as a leftover from before `vp test` became the runner. A
documented convention is not immovable: when the toolchain underneath it changes,
the honest thing is to re-evaluate it and adjust where there is a real win, not
comply out of habit. This ADR records that re-evaluation.

## What `vite-plus/test` is

`vite-plus/dist/test/index.d.ts` is, in full:

```ts
import 'vitest';
export * from 'vitest';
```

So `vite-plus/test` is a **pure re-export of Vitest** — the identical API
(`describe`, `it`, `expect`, `vi`, the lifecycle hooks). The difference is not the
surface; it is _which_ Vitest resolves:

- `from 'vitest'` resolves the workspace's **own** Vitest — a dependency each
  package must declare, version, and keep peer-synced.
- `from 'vite-plus/test'` resolves the **vite-plus-bundled** Vitest — so there is
  no self-managed `vitest` to declare or drift, and the test runtime is always
  exactly what the toolchain ships.

## Decision

**Import test utilities from `vite-plus/test`.** Every source `from 'vitest'` is
rewritten (841 files); the AGENTS.md convention is updated to match. This is the
last part of the toolchain not routed through vite-plus, and unifying it removes a
whole class of version-skew and peer-split risk while giving config and tests one
`vite-plus/*` surface. It is vite-plus's own intended convention — the tool ships
a `prefer-vite-plus-imports` lint rule for exactly this.

The change is safe here specifically, verified before landing: no
`declare module 'vitest'` augmentations, no `@nuxt/test-utils`, no `vitest/*`
subpath imports, no browser providers, and test files never ship to consumers
(`files` excludes `*.test.*`). Because `vite-plus/test` is `export * from 'vitest'`,
there is no behavioural change — the part-A PoC confirmed the fully-rewritten tree
passes `typecheck:all`.

## Consequences

- The convention now points at `vite-plus/test`, recorded here so a future reader
  sees it was a **re-evaluation with a reason**, not drift. The general principle
  it demonstrates: a written convention is re-assessed when its ground shifts.
- **Enforcement is a follow-up.** An unenforced convention is exactly what let the
  old rule drift, so a `no-restricted-imports` ban on `vitest` (pointing at
  `vite-plus/test`) will be added in both the react and base ESLint configs. It is
  a separate PR because the base config has no `no-restricted-imports` today and
  adding one is delicate lint-config surgery that needs its own deliberate-violation
  verification.
- The direct `vitest` devDeps are now vestigial in most packages (tests no longer
  import `vitest`), but they are left in place: they are cheap `catalog:test`
  references, and `packages/plugins`' test script still invokes `vitest` directly.
  Dropping them is a further cleanup, not part of this decision.
- The `vite`/`vitest` versions and the single-instance topology are unchanged —
  that was part A ([#345](https://github.com/luciocabrera/lcabrera-stack/pull/345)).
