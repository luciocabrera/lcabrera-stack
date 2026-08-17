# Scout charter — DEPS

Outdated and vulnerable packages, plus **lockfile drift verified by a clean
from-scratch install, not an incremental one.**

## Run this scout in an isolated worktree

Its charter requires destroying and rebuilding `node_modules`. Doing that in the
shared checkout corrupts every other scout mid-flight and the user's working
tree. Give it `isolation: "worktree"`, and tell it never to touch the primary
checkout.

## Required probes

1. **Clean from-scratch install.** In an empty worktree, `vp install`, then
   `git status --short pnpm-lock.yaml` and `git diff --stat pnpm-lock.yaml`.
   **A lockfile that changes on a clean install is drift** — and this is the
   headline probe precisely because an incremental install cannot reproduce it:
   an already-applied lockfile and a correct one are indistinguishable once
   `node_modules` exists. Confirm CI parity with
   `vp install --frozen-lockfile --ignore-scripts`.
2. **Vulnerabilities.** `pnpm audit`. Report severity, path, and **whether the
   vulnerable path is actually reachable in production** — "it is in the tree"
   and "it ships and runs" are different claims, and that distinction is the
   discriminating part. The last sweep's advisory was on a real production edge
   whose vulnerable middleware was never mounted.
3. **Currency.** What is behind, and whether the catalog in `pnpm-workspace.yaml`
   pins it. Distinguish a patch bump from a major with a migration.

## Traps

Read `known-traps.md`. Beyond the load-bearing dependencies listed there:
`engineStrict: true` makes pnpm refuse to install outside the `engines.node`
band — **install the Node version the repo asks for; never relax the setting to
get past a failure.** Node here is nvm-managed, so `vp env doctor`'s "not vp
shim" warning is intended, not a finding. `vp update <pkg>` only moves packages a
manifest declares; a transitive dependency needs an `overrides` entry.

Use `vp` for anything it wraps. The genuine exceptions live in
`scripts/deps-refresh.sh` (`vp run deps:refresh`) — read it before deciding.

## Prior findings

Handled: the hono ReDoS advisory, now pinned forward by an `overrides` entry
with its removal condition recorded beside it.

Still open (#516): no gate runs `pnpm audit` at all — the supply chain is the
one thing this repo does not check; `minimumReleaseAge` is commented out while
its exclude list has rotted; the in-range currency gap and the `vp` local/global
version split; the unsatisfied `@babel/core` peer; the `jsdom` 30 major. (The undeclared
`@babel/preset-typescript` listed here left with the CQMS workspaces in #683 —
re-probe rather than assuming it is still open elsewhere.)

If the environment blocks a probe, **record it as unverified rather than
papering over it.**
