# ADR-048 — One ADR home per tier, split on the extraction boundary; one global number sequence

**Status:** Accepted; §"Each home carries a generated index" amended by [ADR-075](ADR-075-the-index-does-not-list-the-adrs.md)

> The body below is left exactly as written — a dated record. The three homes,
> the one global sequence, the grandfathered 001–012 overlap and the gate all
> still hold. What changed is what the generated index _contains_: it no longer
> carries a row per ADR, because that row was the one region every ADR branch
> appended to, so any two concurrent ADRs conflicted on it. `vp run adr:list`
> prints the table this ADR argued for. See ADR-075.

## Context

ADRs had accumulated in four directories with no rule saying which one a new
decision belonged in:

| Directory                           | Held                                                               |
| ----------------------------------- | ------------------------------------------------------------------ |
| the product home                    | 47 ADRs — product decisions **and** repo/package/tooling decisions |
| `apps/react-router/docs/decisions/` | 12 ADRs — showcase-app component decisions, numbered 001–012       |
| `docs/agents/planning/adrs/`        | four numbered **drafts**                                           |
| `docs/agents/decisions/`            | two documents that state they are _not_ ADRs                       |

Nothing checked any of it. `docs:verify` skips every `decisions` directory on
purpose — an ADR records a point in time, so its paths are allowed to go stale —
which left ADR placement, naming and numbering as the one structural rule in this
repo with no gate behind it. It drifted the way the others did before
`commands:verify`, `scripts:verify` and `coordination:verify` existed.

Three failures had already landed:

1. **`ADR-047` meant two documents.** `ADR-047-declare-optional-peer-dependencies`
   (#383) and the `ADR-047-server-error-translation-result-contract` draft (#381).
   The draft's own header said the product home "currently ends at ADR-046" —
   true the day it was written, false a week later. A draft had reserved a number
   it did not own, and the sequence moved on underneath it.
2. **Every number 001–012 already meant two things**, across the app and product
   namespaces. `docs/README.md` carried a ⚠️ section telling readers to always
   cite an ADR by path because of it. A trap that needs a warning label is a
   design defect, not a convention.
3. **The extraction boundary ran straight through the product home.**
   That product is going to its own repository, leaving the `@lcabrera/*`
   packages here as the product. Twenty of those 47 ADRs are repo, package or
   tooling decisions that must stay; 27 are product decisions that must go. They
   were interleaved, so the split was a per-file judgement call — and it got
   harder every week, because every new ADR landed on the wrong side of a line
   nobody had drawn yet.

The third point is what made this urgent rather than tidy. The others are
readability; that one is a migration whose cost compounds.

## Decision

### One home per tier, and the tier boundary is the extraction boundary

| Tier    | Home                                | Holds                                                         | At extraction |
| ------- | ----------------------------------- | ------------------------------------------------------------- | ------------- |
| `repo`  | `docs/decisions/`                   | the repo, the published `@lcabrera/*` packages, the toolchain | **stays**     |
| product | the product's own home              | its schema, scanners, ingestion and orchestration             | **leaves**    |
| `app`   | `apps/react-router/docs/decisions/` | decisions internal to the showcase app                        | **stays**     |

The question that places an ADR is therefore not "what is it about" but **"when
the product moves out, does this decision go with it?"** That is a question with one
answer, which is what a taxonomy needs. "Which directory feels right" is not.

A decision that genuinely spans two tiers is written where its _durable_ half
lives and cross-referenced from the other. ADR-005 (the generic `Form` in
`packages/ui`) is the worked example: it was written to serve that product's
forms, but the component is product, so it is `repo` tier and the product cites it.

### One global number sequence

A number identifies exactly one ADR across every home. The next free number is
one greater than the highest anywhere — `vp run adr:verify` prints it.

This is stricter than what the repo had, and deliberately so: with a per-home
sequence, `ADR-011` needs a directory to disambiguate it, which is the ⚠️ section
`docs/README.md` had to carry. With one sequence, a bare number is unambiguous.

**The historical 001–012 overlap is grandfathered, not repaired.** Each of those
numbers may appear twice; nothing else may repeat. Renumbering would be the
"correct" fix and is rejected: an ADR is a dated record, and every merged PR,
issue, commit message and code comment citing one would silently start pointing
at a different document. A citation that resolves to the wrong decision is worse
than one that needs a path.

### A draft holds no number

Drafts live in `docs/agents/planning/adr-drafts/` and are named by slug. A number
is assigned at **adoption**, when the file moves into a home — never at proposal.
This closes the exact mechanism that produced the two ADR-047s.

### Each home carries a generated index

`README.md` in each home is rendered from the directory by
`vp run adr:verify -- --write` and checked on every run. 47 ADRs with no table of
contents is 47 filenames; an index nobody regenerates is the same rot one level
up, so it is generated rather than hand-kept.

### A gate enforces it

`vp run adr:verify` (`scripts/verify-adrs.mjs`, decisions in
`scripts/lib/adr-registry.mjs`) fails on an ADR outside a declared home, a
malformed filename, an H1 whose number disagrees with its filename, a reused
number, a numbered draft, or a stale index. It runs in `check:safe`, `check:push`
and `check-safe.yml`.

## Consequences

- **Extraction becomes a directory move.** The product's docs — spec, status, plans and
  now exactly its own decisions — is the unit that leaves.
- **A bare `ADR-NNN` is citable again** for anything from 013 up. The ⚠️
  two-namespace warning in `docs/README.md` shrinks to a footnote about the
  grandfathered range.
- **Both sequences are sparse.** `docs/decisions/` runs 001–005, 008, 014, 032,
  035–040, 042–047; the product home held the rest. That is not untidy — it
  is the record of the two tracks having been interleaved, and closing the gaps
  would mean renumbering, which is what this ADR refuses.
- **`git log --follow` still reaches every moved ADR**; the split used `git mv`.
- **Placing a new ADR takes one question**, and getting it wrong is now a gate
  failure rather than a thing someone notices during an extraction.
- **The four `@lcabrera/server` drafts retarget to `docs/decisions/`** — they are
  product-package decisions and were pointed at the other home only because it
  was the only home that existed.

## Alternatives considered

**Renumber into one clean sequence.** Rejected — it invalidates every existing
citation, in exchange for cosmetics. See above.

**Keep one directory, add a `tier:` field in frontmatter.** Rejected: the
extraction is a filesystem operation, and a field does not move files. It would
also leave the split as a query rather than a boundary you can see.

**Per-tier number prefixes (`REPO-001`, `APP-001`).** Rejected — it renames every
existing ADR, which is renumbering wearing a different hat, and the repo's
citation habit is already `ADR-NNN`.

**Leave the drafts numbered and just fix the collision.** Rejected: it fixes the
instance, not the mechanism. Two ADR-047s were the _predicted_ outcome of letting
a proposal reserve a number, and the same thing would happen at the next
promotion delay.
