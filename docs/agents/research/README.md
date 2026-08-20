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

## Before you write: four ways a write-up goes wrong

Every one of these was shipped by the first set of documents filed here, caught
in review rather than in writing, and each is cheap to prevent and expensive to
find. This is AGENTS.md §7 narrowed to the shapes that actually rot.

**1. A count you did not just produce with a command.** This is the one that
fails most. Reading a tree and counting by eye feels like evidence and is not;
every wrong number here was refutable in seconds against a clone that was
sitting on disk the whole time. So: run the command, paste the number, and
**leave the command next to it** — or enumerate the things you counted, which
serves the same purpose. `vp run research:verify` enforces exactly this and
nothing else, because it is the only part of a foreign-tree claim this repo can
check. It gates counts of four and up; below that a number-word is usually
prose, not a measurement.

**2. A path you wrote from memory instead of copying from output.** Copy paths
out of `find`/`ls` output rather than reconstructing them. A plausible-looking
path is worse than an obviously vague one, because it reads as verified detail —
and if a gate is pushing you toward a prefix, giving it the _shortest_ prefix
that clears the gate rather than the real one turns a hedge into a fabrication.

**3. A conclusion the evidence cannot discriminate.** Before writing a verdict,
ask what _else_ would produce the observation you are standing on. A local
authoring path does not tell you what a marketplace install does; if copy, cache
and symlink would all leave the same trace, the finding is "undocumented", not
"it is copied". Hedge in the write-up and hedge in the comparison — a verdict
that outruns its probe is the failure Rule 14 exists to name.

**4. The same fact told twice, in two documents.** A research _set_ is
especially prone to this: each document restates the others' context, and then
one of them is corrected. Every contradiction found in the first set here was of
this shape. Apply the repo's own rule — **one canonical home per fact, everything
else links to it** ([`docs/README.md`](../../README.md)). Where two write-ups
must both touch a fact, one states it and the other links; where a comparison
summarises a per-project document, the per-project document wins and the
comparison cites it.

**And one rule for claims about _us_.** A research doc that describes this
repository's own tooling — how a gate behaves, what a package does — must cite
the `file:line` that implements it, read at the time of writing. Those claims
look incidental next to the external research and are the most likely to be
acted on without re-derivation. Two of them shipped here explaining a gate
backwards.

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
