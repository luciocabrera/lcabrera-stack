---
governs:
  - devkit
---

# ADR-126 — The default catalog is a region the consumer owns

**Status:** Accepted

## Context

`@lcabrera/devkit` records a hash for every file it materialises and compares the
file on disk against it on the next run. A file whose hash moved is `modified`:
it is never written again and it is reported on every run, which fails
`doctor --check`.

The `monorepo` rung materialises `pnpm-workspace.yaml`. In a tree holding that
file, adding a dependency the ordinary way (`vp add -D -w <pkg>`) writes the
version into the file under a top-level `catalog:` key and points the manifest
at `catalog:`. The package
manager edits the file in place: it appends a blank line, `catalog:` and one
indented line per dependency after the file's last key, and leaves every other
byte as it was. The first dependency a consumer adds therefore turns the file
`modified`, and it stays that way.

`doctor --accept` quiets the report, but an acknowledgement is keyed to the
file's hash. Once a consumer accepts the file, no later catalog range, pnpm
setting or peer rule the kit ships reaches them.

[ADR-120](./ADR-120-reconcile-the-emitted-task-block-key-by-key.md) solved the
same shape for the root manifest's task block by reconciling it key by key. It
declined to generalise that to prose, and left a region the recorded hash does
not cover as the open answer for files a consumer must edit (#1156).

## Decision

A materialised file may name one top-level YAML key as **a region its consumer
owns**. The shipped file never carries that key. `consumer-region.mjs` maps asset
paths to their key. It maps `pnpm-workspace.yaml` to `catalog`, the default
catalog. The kit ships only the named `catalogs:`.

The region is the key's line, every indented line under it, and any column-zero
comment lines directly above it. `planSync` splits it off the on-disk content
before hashing, so the state is judged on the rest of the file alone:

- A file whose only change is a default-catalog block is `current`, and
  `doctor --check` passes.
- A file that is otherwise untouched, where the kit's copy has moved on, is
  `updated`. `applySync` writes the kit's new content and appends the region
  after one blank line, the way the package manager placed it.
- A change anywhere else is still `modified` and still reported. That includes a
  changed or added entry in one of the kit's named catalogs, which is where
  `vp add --save-catalog-name <group>` writes.

An acknowledgement is keyed to the same hash `planSync` computes, so it covers
the kit's part of the file and not the region.

## Consequences

A consumer can add dependencies with `vp add` and keep taking the kit's updates to
the rest of the workspace file, with no acknowledgement.

The region is a region and not a merge. A consumer who puts a dependency in one of
the kit's named groups has edited a kit-owned block, and that file stops taking
updates until the edit is reverted or acknowledged. The README tells a consumer
to keep their own dependencies in the default catalog for this reason.

The rule depends on the shipped file never holding the region's key. If it ever
did, the kit's own entries would be read as the consumer's and never updated. A
test asserts that splitting the shipped asset finds no region.

The splitter reads lines, not YAML. A default catalog written in a shape the
package manager does not produce, such as a column-zero comment between its
entries, leaves part of the block in the kit's half. That part then reads as an
edit and is reported. It errs toward reporting a change, never toward hiding one.

An acknowledgement recorded for `pnpm-workspace.yaml` before this change was
keyed to the whole file's hash. If the file holds no default `catalog:` block,
that hash is unchanged and the acknowledgement still matches. If it holds one,
the hash now leaves the block out, so the acknowledgement stops matching. Where
the default catalog was the only edit, the file is now `current` and the stale
entry does nothing. Otherwise the file is reported again and has to be accepted
once more, with `devkit doctor --accept pnpm-workspace.yaml --reason "<why>"`.

Other keys the package manager can write, such as build approvals under
`allowBuilds`, are not regions. They are keys the kit ships, so a change to one
is still a local edit.

## Alternatives considered

1. **Reconcile every catalog entry key by key, as ADR-120 does for tasks.**
   Rejected: it needs a YAML parser that keeps comments and key order, and a
   record of every entry the kit last wrote. That is a new dependency and a second
   record shape in a package that has neither, to serve entries the consumer
   adds, which the default catalog already keeps apart from the kit's.

2. **Tell the consumer to `doctor --accept` the file.** Rejected: it is the
   failure described above. The acknowledgement freezes the whole file.

3. **Stop materialising `pnpm-workspace.yaml` after `create`.** Rejected: the
   engine guarantee and the toolchain catalog are in that file. A consumer who
   never takes a kit update to either drifts from the gates the rest of the kit
   ships, and nothing reports it.

## References

- [#1193](https://github.com/luciocabrera/lcabrera-stack/issues/1193)
- [#1156](https://github.com/luciocabrera/lcabrera-stack/issues/1156)
- [ADR-120](./ADR-120-reconcile-the-emitted-task-block-key-by-key.md)
