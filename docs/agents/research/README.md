# Research write-ups

How **other** projects solved a problem this repository is deciding, read from
source and written down before the decision is made. Each document is a **dated
record**: it is true as of the commit or page it cites, and it stays as written
once the decision it fed has landed.

Following [ADR-075](../../decisions/ADR-075-the-index-does-not-list-the-adrs.md),
this page deliberately lists none of them — the directory is the listing.

## What belongs here, and what does not

|                                                                | Home                                           |
| -------------------------------------------------------------- | ---------------------------------------------- |
| What another project does, read from its source                | here                                           |
| What **we** intend to do — a plan, a planning summary, a draft | [`../planning/`](../planning/)                 |
| The decision itself, once made                                 | an ADR ([`docs/decisions/`](../../decisions/)) |

## Two rules that are easy to get wrong

**Amend above the body; never rewrite it.** When the decision a write-up fed
moves on, add a dated status block at the top saying what changed and where it
landed. Editing the body to match today falsifies the reason the decision was
made, which is the one thing the record exists to hold — the same rule ADR-081's
readers rely on, and the one `docs/README.md` states for ADRs written in an
earlier era.

**Write an external repo's paths so they cannot be read as ours.** `docs:verify`
resolves every root-anchored token against _this_ tree, and these documents are
full of paths that belong to someone else's. Give the file its **real, full path
inside its own repository**, with a leading `/` marking that repository's root:

| Write                                           | Instead of                          | What the gate does                                       |
| ----------------------------------------------- | ----------------------------------- | -------------------------------------------------------- |
| `/scripts/link-skills.sh`                       | the same path with no leading `/`   | a leading `/` is disqualified, so it is never classified |
| `orchestrate/skills/orchestrate/scripts/cli.ts` | a shortened `orchestrate/scripts/…` | nothing — the first segment is not one of our repo roots |

The two rows fail differently, and only one of them is the gate's business.

A **root-anchored** token — one whose first segment is a directory this repo has
at its top level, enumerated as `REPO_ROOTS` in `scripts/lib/docs-paths.mjs` — is
checked against this tree. Most
foreign paths do not exist here, so the gate reports them loudly and you fix them
on the spot. The hazard is the **collision**: a foreign path that happens to name
something we also have — `docs/` is the live example — passes in silence and
reads afterwards as verified. That is the case the leading `/` exists for, and
why the rule is worth following even where a bare token would currently fail
noisily. A clean pass that a wrong path would have produced identically is not
evidence (AGENTS.md Rule 14).

The second row was never gated at all: `orchestrate` is not a repo root, so both
the long form and the shortened one sail through untouched. The discipline there
is not the gate, it is **truthfulness** — a prefix invented so a path looks
plausible is a fabricated path, and worse than the bare form it replaced, because
it reads as verified detail. Both of these were shipped in this directory before
review caught them.

The one exception is a path inside a **verbatim quotation**, which stays exactly
as quoted — rewriting it would falsify the quote. If the gate reports it, that is
what `scripts/docs-paths-baseline.json` is for, one entry at a time through
`node scripts/verify-docs-paths.mjs --accept … --reason "…"`.

## Counts

A count is the claim most likely to be wrong and least likely to be re-checked —
this directory's first four documents shipped a run of them. AGENTS.md §7 bans
a bare number in a live doc outright; a dated record may carry one, because it is
pinned to a commit, but **name the command that produces it** so the next reader
can re-run it rather than trust it.
