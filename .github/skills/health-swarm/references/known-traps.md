# Known traps

Repo-specific facts that make a naive finding wrong. Each one has produced, or
would have produced, a confidently incorrect result.

## Duplication that is deliberate

**ADR-039 — duplicate over undeclared edges.** The column-filter shapes are
duplicated in `@lcabrera/ui` and `@lcabrera/server` **on purpose**. A package
must stand on its own to be publishable; it cannot rely on a consumer's tsconfig
`paths` to make an import resolve. Do not propose collapsing them.

**ADR-038 — public package topology by runtime.** `@lcabrera/api` is
browser-safe (its tsconfig omits `node` types); `@lcabrera/server` is Node-only
(no DOM lib). A client-safe package may only depend on workspace packages that
are themselves client-safe. Any proposed new cross-package edge must respect
this, and `packages/ui`'s `check:public-api` enforces it.

`docs/agents/cross-app-abstraction.md` walks the promote-or-duplicate decision.

## Dependencies that look unused and are load-bearing

- **`@vitest/coverage-v8`** in the root manifest — an optional peer of vitest,
  which pnpm resolves only while some manifest declares it. Removing it takes
  every `--coverage` run down (ADR-047).
- **Workspace `vitest` deps** — the `test` tasks ultimately invoke Vitest's own
  entry point from `node_modules` by path, so the dependency is load-bearing
  even where no import references it.
- **`react-doctor`** — `scripts/verify-react-doctor.mjs` spawns its binary by
  explicit path, invisible to an import-graph scanner, so fallow reports it
  unused on every run.

## Exports that look unused and are public API

The four `@lcabrera/*` packages have consumers **outside this repo**. An
unused-looking export from any of them is public API, not dead code. Check
`exports`/`publishConfig` and read `packages/CLAUDE.md`, which covers the two
rename traps that silently break a consumer.

## Performance

**ADR-004 — the React Compiler owns memoization.** Never propose manual
`useMemo`/`useCallback`/`React.memo`. Table performance comes from granular
selector subscriptions, row virtualization and split contexts.

A static-analysis flag is a **hypothesis, not a measurement**. Issue #454
already tracks "react-doctor flagged it but nobody benchmarked it", so
rediscovering that is a duplicate.

The client asset output directory under `apps/react-router` is **not emptied
between builds**, so any `find`-based byte total there mixes stale hashes from
previous builds. Separate current-build files by mtime.

## Linting

**Overlapping rules across engines are fine — good, even — when they agree.**
ADR-035 bans only _conflicting_ arbitration, where two engines demand
contradictory output. Do not propose dropping an agreeing duplicate.

A real conflict archetype: for a type-only re-export, ESLint wants inline
`export { type X } from` while Biome wants block `export type { X } from`. The
resolution is the block form, which both accept — **not** disabling a rule.

**Never propose suppressing, ignoring or disabling a rule as the fix**
(Non-Negotiable Rule 11). `packages/ui`, `packages/api`, `packages/server` and
`packages/utils` take no suppressions at all.

`vp fmt` reads the `fmt` block in the root `vite.config.ts`, and lint config
lives at the root only.

## Docs

**An ADR is a dated record.** A superseded ADR naming deleted code, or an ADR
naming the path it renamed away from, is correct — not drift. `docs/decisions/`
and `apps/react-router/docs/decisions/` are two homes on **one** number sequence
(ADR-048); `005` predates it and still means two things, so cite that pair with
its path. A third home left the repo with a second product, which is why an old
ADR may cite a number that now resolves only once.

`AGENTS.md` is the real file; `CLAUDE.md` is a symlink to it. Fixes go in
`AGENTS.md`.

Produced-on-demand paths (`reports/**`, `docs/coordination/BOARD.md`) are absent
from a fresh checkout by design (ADR-049, ADR-037) and are correctly documented.

## Environment

- A fresh worktree has **no generated route types**, so `vp lint .` reports
  `TS2307: Cannot find module '../+types/root'` until `vp run typegen:all` runs.
  Environmental, not a finding.
- A worktree also has no gitignored env files, and needs `vp install`. That is
  cheaper than it looks — pnpm hard-links from a warm content-addressable store
  rather than copying, so worktree isolation is not the expensive option it
  appears to be.
- The **primary checkout must stay on `main`**; `coordination:verify` fails when
  it sits on a feature branch, because HEAD moves under every other agent
  sharing the clone. Work in a worktree.
- `vp update <pkg>` only moves packages a manifest declares. A transitive
  dependency needs an `overrides` entry.
- From the repo root the eslint pass needs `-r`: `vp run -r lint:eslint:check`.
  Without it the task is not found and the exit code looks like a lint failure.
