---
id: node-version-floor
title: Pin and enforce the repo's Node version so an unsupported runtime fails the install
owner: agent:claude
status: active
branch: chore/378-pin-and-enforce-node-version
area:
  - .node-version
  - pnpm-workspace.yaml
  - package.json
started: 2026-07-25
updated: 2026-07-25
plan: (none)
issue: #378
pr: #379
---

## What

`engines.node` was advisory: pnpm ignores it without `engineStrict`, and nothing
else read it. The floor held only while Vite+ managed the runtime and resolved
`node` **from** that field — under nvm, fnm or a distro Node, an install on an
unsupported runtime proceeded silently.

Three declarations, layered rather than duplicated:

- `engineStrict: true` (`pnpm-workspace.yaml`) — an install outside the band fails.
- `engines.node: ">=26 <27"` — the band an install may proceed in.
- `.node-version` — the exact version everyone should actually be on. Vite+ reads
  it at highest priority, above `engines.node`.

Keeping the band wider than the pin is deliberate: making both exact would turn
every Node patch release into a hard install failure before anyone could update
the file.

## Status / next

- Current step: PR #379 open, all gates green; awaiting review.
- Blockers: none.
- Next: delete this file when #379 merges.
