# ADR-043 — Release tooling: keep Changesets over pnpm-native releases

- **Status:** Accepted
- **Date:** 2026-07-23
- **Issue:** [#334](https://github.com/luciocabrera/lcabrera-stack/issues/334)
- **Relates to:** [#266](https://github.com/luciocabrera/lcabrera-stack/pull/266) — the Changesets adoption, which recorded the wiring but not the alternatives.

## Context

The four `@lcabrera/*` packages are versioned and published with **Changesets**,
adopted in #266 (2026-07-22). That PR documented _how_ the release is wired — the
human-opened "Version Packages" PR, the manual first publish under trusted
publishing, the `private`-flag gate — but not _why_ Changesets over the
alternatives, and no ADR was written.

pnpm gained **native release management in v11.13.0**. At #266 the repo was pinned
to **pnpm@11.13.1** — so the native option was installed at adoption time and, on
the record available, was **not evaluated**: neither #266 nor any ADR mentions it.
This ADR closes that gap — it evaluates pnpm-native against the repo's actual
needs and records the decision, so a future reader knows it was a choice, not an
oversight.

## What pnpm-native provides (PoC)

pnpm-native is a drop-in for the changeset _workflow_ — it reads the same
`.changeset/*.md` "change intents": `pnpm change` (record) → `pnpm version -r`
(bump) → `pnpm publish -r`. A PoC on this repo (a throwaway `@lcabrera/utils`
patch intent, fully reverted) established:

**Parity confirmed**

- `pnpm version -r` bumped `@lcabrera/utils` via the intent **and** patch-bumped
  its dependents `@lcabrera/api` and `@lcabrera/ui` — matching
  `.changeset/config.json`'s `updateInternalDependencies: patch`. Private packages
  stayed at `0.0.0`.
- `pnpm publish -r --dry-run` targeted the four public packages at
  `registry.npmjs.org` and skipped the private ones.

**Behavioural gaps**

- **Changelogs land in `.changeset/changelogs/`, not per-package root
  `CHANGELOG.md`.** The publishing invariant (AGENTS.md §1) requires each package
  to carry its own root `CHANGELOG.md` in `files` so npm publishes it;
  pnpm-native's location does not satisfy that without extra wiring — a
  regression against a shipped artifact.
- **`pnpm version -r` requires a clean working tree** and did not consume the
  intent file the way `changeset version` does, so the CI "Version PR" flow would
  need rebuilding rather than reusing `changesets/action`.

## Decision

**Keep Changesets. Do not migrate to pnpm-native now.** This is a decision made
_after_ evaluating the alternative (the PoC above), not a default carried over
from #266 — so the record is unambiguous that pnpm-native was assessed and set
aside for concrete reasons, and can be reassessed against the same checklist when
they change.

The migration's cost is real and its benefit is marginal:

- The release _complexity_ this repo actually paid for in #266 is **CI wiring** —
  the `GITHUB_TOKEN`-opened PR that never triggers required checks, the
  scoped-package `E404` on a first publish under OIDC, provenance, and the
  `private` gate. **None of that is the Changesets CLI**, so pnpm-native does not
  simplify any of it.
- Migrating would **regress the per-package published changelog** and require
  **rebuilding the Version-PR CI** that `changesets/action` provides for free.
- The only thing gained is dropping the `@changesets/cli` dev-dependency and one
  Action.
- Changesets was adopted one day earlier and works; churning fresh, working
  release infrastructure for a marginal gain is not warranted.

**Revisit when** pnpm-native reaches changelog parity (per-package root
`CHANGELOG.md`) and offers a first-class Version-PR CI story — at which point
dropping `@changesets/cli` becomes a clean simplification rather than a lateral
move. The re-evaluation has a concrete checklist: changelog location, intent
consumption, and a CI Version-PR equivalent.

## Consequences

- The release toolchain is unchanged; this ADR is the missing record of the
  choice, and pnpm-native is on file as a proven future option, not an unknown.
- `vite-plus` remains uninvolved in releases (it exposes only `pack`, no
  release/version/publish command), so there is no vp/Changesets overlap to
  reconcile.
- See also the pnpm-direct policy in AGENTS.md §4: the deps-refresh script's use
  of `pnpm`/`taze` directly is a separate, sanctioned case of "use pnpm where
  `vp` has no equivalent," decided alongside this evaluation.
