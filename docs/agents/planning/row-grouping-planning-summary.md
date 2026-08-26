# Planning session — grid row grouping (2026-08)

> **The backlog is on GitHub.** This is the dated synthesis of the session that
> filed it, kept for the reasoning and the identifier map GitHub does not hold.
> Status, milestones, dependencies and acceptance criteria live on the issues —
> that is what [ADR-036](../../decisions/ADR-036-github-planning-layer.md) makes
> canonical, so nothing here restates them.
>
> Orchestrator synthesis of a two-agent session (Systems Architect +
> Implementation Engineer) over
> [`table-row-grouping-plan.md`](./table-row-grouping-plan.md).

## Where the work is

Three epics, each with its children linked as real sub-issues, across M1–M5:

| Epic | Issue                                                                                                       |
| ---- | ----------------------------------------------------------------------------------------------------------- |
| E-1  | [#547](https://github.com/luciocabrera/vite-react-compiler/issues/547) — server-driven row grouping         |
| E-2  | [#548](https://github.com/luciocabrera/vite-react-compiler/issues/548) — grid foundations grouping rides on |
| E-3  | [#549](https://github.com/luciocabrera/vite-react-compiler/issues/549) — self-healing governance, round 2   |

Each issue body carries a provenance line naming its planning id. The planning
document was a one-shot input under the gitignored `.tmp/planning/` and is
retired, so **this table is what resolves an old reference to one**:

| Plan | Issue | Plan | Issue | Plan | Issue | Plan | Issue |
| ---- | ----- | ---- | ----- | ---- | ----- | ---- | ----- |
| P-01 | #550  | P-09 | #558  | P-17 | #566  | P-25 | #575  |
| P-02 | #551  | P-10 | #559  | P-18 | #568  | P-26 | #576  |
| P-03 | #552  | P-11 | #560  | P-19 | #569  | P-27 | #577  |
| P-04 | #553  | P-12 | #561  | P-20 | #570  | P-28 | #567  |
| P-05 | #554  | P-13 | #562  | P-21 | #571  | P-29 | #578  |
| P-06 | #555  | P-14 | #563  | P-22 | #572  | P-30 | #579  |
| P-07 | #556  | P-15 | #564  | P-23 | #573  | P-31 | #580  |
| P-08 | #557  | P-16 | #565  | P-24 | #574  |      |       |
| G-01 | #581  | G-04 | #584  | G-07 | #587  |      |       |
| G-02 | #582  | G-05 | #585  | G-08 | #588  |      |       |
| G-03 | #583  | G-06 | #586  | G-09 | #589  |      |       |

The session proposed five decisions. The grouping-legality one is adopted as
[ADR-058](../../decisions/ADR-058-grouping-legality-by-analytical-role.md); the
rest are still in [`adr-drafts/`](./adr-drafts/) and hold no ADR number until
adoption ([ADR-048](../../decisions/ADR-048-adr-taxonomy-and-one-sequence.md)).

## High-level direction

Adopt the design, with two corrections that change what gets built and in what
order.

1. **The genericity premise does not hold, and its own guard rail hides that.**
   The design derives group-key and aggregate legality from
   `TableColumnDataType`. That vocabulary has five members and reports `point`,
   `jsonb` and `numeric` all as `string`, so a `point` column arrives as the type
   the design calls "the best key" — and fails `GROUP BY` with `could not identify
an equality operator`. `min(jsonb)` does not exist while `GROUP BY` on jsonb
   succeeds, so the failure is per-type, not per-family; and a `numeric` column
   mapped to `string` is never offered `sum`. The probe owns a fixture carrying
   those types. Legality now comes from two gates — the column's analytical role
   (dimension / fact / unsupported) as the bar, the Postgres catalogue as the
   floor — adopted as
   [ADR-058](../../decisions/ADR-058-grouping-legality-by-analytical-role.md)
   (#552) and implemented in #563, merged into the catalog query the cardinality
   guard already issues.

2. **The prerequisite work is real, independently valuable, and was folded into
   grouping where it should stand alone.** The capability-availability predicate,
   stable row identity, the focus model, the URL codec and four dead seams each
   ship value without grouping and each get worse if grouping is built on top of
   them first. That is E-2 (#548).

Everything else in the design survived: `GROUPING SETS` as the internal
primitive, the single variadic mask, one flat query, the URL-versus-client state
split, unpaginated grouped reads, and the `GROUPING`-led ordering.

## Load-bearing nuance (from the feasibility pass)

**Schedule the falsifier first.** No domain route carries a type that disproves
the genericity claim, so the design deferred the question to the final rollout
slice — after the builder, the guard rails and cube were all built on the premise.
It is now #550, in Wave 1, as a probe owning a fixture with the awkward types,
before anything depends on it.

**Two mechanisms the design reasons about do not exist as described.** The loader
remount key it proposes to extend is produced and read by nothing (#557), so its
expansion-cost analysis rests on a remount that never happens. And the compact
URL representation has no slot for an aggregate's filter or alias, so the
filtered aggregates introduced in #569 cannot round-trip through the only
transport the architecture has — extend the codec or defer them explicitly.

**Rolling out to the other three routes is not configuration.** They fetch over
HTTP from the external API rather than reading Postgres in process, so grouping
them means an endpoint in its domain layer, an Express route, a Fastify plugin and
new fetchers — plus three more unguarded copies of the grouping shape, which is
the mechanism the design's own Risk 7 forbids. #575 proves the same genericity
claim with a type probe that owns its fixture instead; crossing the external-API
boundary is deferred, and `wide-alltypes-150` is not a rollout target at all — it
is a rendering playground for very wide grids, not a domain schema.

**Risk 7 is confirmed and already user-visible.** The two review agents reached
opposite conclusions here, and the disagreement was a probe artifact: searching
the apps for the type _names_ finds nothing, searching by _shape_ finds three
more copies under different names. Both greps reproduce; the first could not
discriminate "no copy" from "a copy under another name". `NumberFilter.value` is
`number | undefined` in both packages — documented as undefined mid-typing — and
required in all three app-side copies, so a filter the react-router route
correctly drops makes the external API's route reject the request (#567). The
downstream conclusion still stands: no shared contracts package, because
[ADR-039](../../decisions/ADR-039-duplicate-over-undeclared-edges.md)'s promotion
trigger is a third _consumer_, not a third _copy_.

**Two ADRs moved home.** The design placed the state-split and focus-model
decisions in the app's ADR home. ADR-048's test is whether a decision leaves with
the extracted product; both candidate homes stay, so the tie-break is package-versus-app, and
every line of grouping code is in `packages/ui` and `packages/server`. ADR-011
and ADR-012 sat in the app home only because they predated the Table's extraction
into the package — grandfathered, not precedent.

## Governance

Nine gaps were verified absent and filed under E-3 (#549). The largest is that
`execution-waves.md` requires a wave on every issue while a wave is representable
nowhere — no template field, no validator key, no parser support, no label. That
is the same failure mode #409 fixed for the dependency block, still live for
waves, and it is why every wave in this session's backlog is a comment rather
than a field.
