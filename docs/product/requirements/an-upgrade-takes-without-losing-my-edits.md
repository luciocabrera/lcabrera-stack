---
id: an-upgrade-takes-without-losing-my-edits
lines:
  - toolchain
persona: repository-maintainer
state: unmet
packages:
  - devkit
requires:
  - the-shipped-setup-installs-and-works
issues:
  - 1083
  - 1077
  - 1072
evidence:
  - type: doc
    ref: docs/decisions/ADR-081-ship-the-repo-setup-as-two-packages.md
  - type: code
    ref: packages/devkit/scripts/sync.mjs
  - type: code
    ref: packages/devkit/scripts/accepted.mjs
---

# I take an upgrade and keep the changes I made

## Statement

I adapted some of what this toolchain gave me — a skill worded for my team, a
rule with our own exception in it. That is what those files are for. Later the
upstream improves the same file, and I want that improvement. I need the upgrade
to leave me with both, or to tell me plainly which upstream change it could not
apply and what it says, so I can take it deliberately.

What I must not get is silence: my version frozen, the improvement never
mentioned, and no way to discover what I have been missing without going to look
for it.

## Acceptance

- A file I edited and an upstream change to a **different part of that same file**
  both survive an update.
- Where the two overlap, my file is not overwritten **and** the upstream change is
  reported, showing what it would have applied, so declining it is a choice
  rather than an accident.
- A file whose local edit I previously acknowledged still reports an upstream
  change to it **by default**, not only under a verbosity flag.
- Code that enforces — the gates — updates atomically by version, not by
  file merge, and holds no copy in my repository that could diverge from the
  standard it enforces.
- The existing guarantee is unchanged: no local edit is ever overwritten without
  an explicit flag saying so.
- **The check fails when an upstream change is silently dropped.** A test edits a
  shipped file, moves the upstream copy, runs the update, and fails if the
  upstream change is neither applied nor reported.

## Notes

This is the requirement the toolchain's whole value rests on, and it is the one
currently furthest from met. Installing is a one-time event; upgrading is
forever, and a consumer who stops receiving improvements has effectively forked
without deciding to.

Today `devkit sync` never overwrites a local edit, which is correct and is the
entire point of the manifest
([ADR-081](../../decisions/ADR-081-ship-the-repo-setup-as-two-packages.md)).
What it has no answer for is the case where both sides moved: the file is
`modified`, it is left alone, and the upstream change never arrives. If the edit
was acknowledged the same thing happens **silently** — an acknowledgement quiets
a file even when the package's own copy moves on, and a verbosity flag is the
only way to find out.

Skills and rules are precisely the files a consuming repository is _meant_ to
edit, so this is the common case rather than an edge one.

Two changes shrink the surface before the merge itself is built: moving the gates
into packages takes code out of the merge path entirely, and deriving the
`package.json` scripts block removes the one instance guaranteed to fire for every
consumer on their second day. What remains is prose, where a clean refusal that
shows the declined hunk may be a better answer than a wrong merge.

One property must survive any change here: the acknowledgement record is keyed to
the file's on-disk hash rather than its path, so editing an acknowledged file
makes it report as modified again with no way to forget. Turning that into a
path-keyed opt-out would be a regression however convenient it looks.
