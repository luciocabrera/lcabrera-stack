# ADR-044 — Decline pnpm `enableGlobalVirtualStore` (breaks the rolldown native binding)

- **Status:** Accepted
- **Date:** 2026-07-23
- **Issue:** [#331](https://github.com/luciocabrera/vite-react-compiler/issues/331)
- **Relates to:** [#328](https://github.com/luciocabrera/vite-react-compiler/pull/328) — the pnpm 11.16 bump that made the feature available; the multi-worktree agent workflow ([coordination README](../../coordination/README.md)) that motivated it.

## Context

The repo's multi-agent workflow spins up a git worktree per task, and each pays a
full `vp install` and duplicates `node_modules` on disk. pnpm's
`enableGlobalVirtualStore` promises to fix exactly that: worktrees share **one**
content-addressable virtual store (`<storeDir>/links`) instead of each building
its own `.pnpm` hardlink farm. #331 asked whether to adopt it.

It was **spiked**, not assumed — in an isolated detached worktree, pnpm 11.16.0 /
Node 26.5.0 / Linux x64, never merged. The spike overturned the prior guess (that
the risk would be `NODE_PATH`/ESM resolution — it is not; the layout is
symlink-based and Node follows it).

## What it buys (measured, gvs on vs off, same worktree)

| Metric                      | Off (baseline) | On                      | Δ              |
| --------------------------- | -------------- | ----------------------- | -------------- |
| Per-worktree `node_modules` | 942M           | 4.4M                    | ~99.5% smaller |
| Per-worktree inodes/entries | 46,268         | 925                     | ~98% fewer     |
| Fresh install (warm store)  | 1.40s          | 1.39s                   | ~no change     |
| `@lcabrera/ui` link         | source symlink | source symlink (intact) | ✓              |

Two corrections to the issue's premise fell out of the numbers. The win is
**disk/inodes, not time** — a fresh worktree install is already ~1.4s here against
a warm store, not the ~5.4s the issue cited. And the StyleX concern (theme
identity derived from source paths) is a **non-issue**: workspace packages stay
symlinked to source regardless of the setting; gvs only relocates _external_ deps.

## Why it's declined

With `enableGlobalVirtualStore: true`, **every `vp` command dies before doing any
work**:

```
[Vite+] resolve universal vite config error: Error: Cannot find native binding.
  … Cannot find module '../rolldown-binding.linux-x64-gnu.node'
  … Cannot find module 'vite-plus/binding'
error: Failed to load task graph
```

Root cause, verified rather than inferred: `@rolldown/binding-linux-x64-gnu` —
rolldown's platform-specific native `.node`, an **optionalDependency** — is present
in the global store but is **not linked as a sibling** into
`@voidzero-dev/vite-plus-core`'s `node_modules` under the global-store layout
(that dir carries `jiti`, `lightningcss`, `postcss`, … but no `@rolldown/binding-*`).
rolldown's `requireNative` then cannot `require('@rolldown/binding-linux-x64-gnu')`.
This is the optional-native-dep gap in pnpm's **experimental** global virtual
store, and this repo's entire toolchain (Vite / Rolldown / Vitest / Oxlint via
`vp`) rests on that binding — so nothing downstream (typecheck, build, test, lint)
can even start.

**Causality — one-variable toggle.** Same worktree, only `enableGlobalVirtualStore`
changed: on → the binding failure above; off → reinstall, and `vp run
typecheck:all` returns exit 0 with all 20 tasks green. The setting is the cause,
not anything else in the worktree.

## Decision

**Do not adopt `enableGlobalVirtualStore`.** The disk/inode win is real and would
suit the multi-worktree workflow, but it is gated behind an experimental pnpm
feature that does not yet link platform-specific optional native dependencies —
which this repo's rolldown-based `vp` toolchain requires. It is a hard
incompatibility, not a tuning problem, so there is no partial adoption to fall
back to.

**Revisit when** pnpm's global virtual store links optional native/platform
bindings as siblings of their consumer (or `@voidzero-dev/vite-plus-core` resolves
its rolldown binding in a gvs-compatible way). Re-running the spike is one
worktree plus one line in `pnpm-workspace.yaml`; the discriminating check is
whether `@rolldown/binding-<platform>` appears next to `@voidzero-dev/vite-plus-core`
in the resolved tree.

## Consequences

- `pnpm-workspace.yaml` carries a one-line pointer to this ADR at the top, so the
  next maintainer who considers adding the setting meets the decision at the point
  of use rather than rediscovering the break.
- No change to installs or the worktree workflow; per-worktree `node_modules`
  stays a full `.pnpm` hardlink farm (cheap in data via store hardlinks, but heavy
  in inodes — the cost this feature would have removed).
- The measurements and the failing output live on [#331](https://github.com/luciocabrera/vite-react-compiler/issues/331)
  as the dated evidence behind this record.
