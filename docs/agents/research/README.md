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

| Write                                           | Instead of                          | Why                                                          |
| ----------------------------------------------- | ----------------------------------- | ------------------------------------------------------------ |
| `/scripts/link-skills.sh`                       | the same path with no leading `/`   | it resolves against our own `scripts/`, and passes silently  |
| `orchestrate/skills/orchestrate/scripts/cli.ts` | a shortened `orchestrate/scripts/…` | shortest prefix that clears the gate — and no such directory |

The failure this prevents is not a broken link — it is a **silent pass**: a
foreign path that happens to match a directory we have reports exactly what a
correct one does (AGENTS.md Rule 14). The second row is the trap worth naming:
a prefix added only to escape the gate is a fabricated path, and worse than the
bare form it replaced.

The one exception is a path inside a **verbatim quotation**, which stays exactly
as quoted — rewriting it would falsify the quote. If the gate reports it, that is
what `scripts/docs-paths-baseline.json` is for, one entry at a time through
`node scripts/verify-docs-paths.mjs --accept … --reason "…"`.

## Counts

A count is the claim most likely to be wrong and least likely to be re-checked —
this directory's first four documents shipped six wrong ones. AGENTS.md §7 bans
a bare number in a live doc outright; a dated record may carry one, because it is
pinned to a commit, but **name the command that produces it** so the next reader
can re-run it rather than trust it.
