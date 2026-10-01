---
governs:
  - devkit
---

# ADR-127 — A higher rung supersedes a lower rung's file, and a file no rung ships retires

**Status:** Accepted

## Context

`@lcabrera/devkit` places files by group, and each group sits on one rung of the
profile ladder. A profile holds its own rung's groups and every group below it.
`planSync` planned one entry per held asset and never compared two entries'
target paths. Two held groups that map onto the same path therefore produced two
entries for it. Both were written, one after the other. On the next run the
loser's hash no longer matched the file on disk, so `doctor` reported it for
ever.

A higher rung has to be able to replace a file a lower rung places, at the same
path. It also has to be able to remove a lower rung's file that its own content
makes obsolete, at a path it does not ship. The `full` rung is the first rung
that will need both. Without a rule for either, the only way to do it is to stop
shipping the lower file, which takes it away from every profile that stops at
the lower rung.

The manifest only grew. `nextManifest` added and updated records and never
removed one. A file the package stopped shipping stayed on disk and in the
record, and no run reported it.
[ADR-120](./ADR-120-reconcile-the-emitted-task-block-key-by-key.md) solved the
same problem for the task block. A recorded task this version no longer ships is
`removed`. The departed set is read against every name the version ships at any
profile, so running at a narrower profile does not delete tasks that belong to a
higher rung.

## Decision

**Where two held groups map onto one target path, the higher rung's asset is the
one planned.** `planSync` ranks the groups a profile holds in ladder order,
lowest rung first, and keeps one asset per target path, from the highest-ranked
group. The plan never holds two entries for one path. The existing
classification then decides what happens to the file. The manifest records what
the lower rung wrote, so:

- A tree moving up a rung, whose file still matches that record, is `updated`
  to the higher rung's content.
- An edited file is `modified` and left alone, the same as any other local edit.

Two groups on the same rung are ranked by their order in the rung's list. No two
groups on one rung ship the same path today.

**A recorded file that no group of this version ships at any profile retires.**
Each run compares the manifest's records with the target path of every asset the
package ships, whether or not the run holds that asset's group. A record with no
match is planned as one of two states:

- `retired` — the file on disk still matches the record, or it is already gone.
  The file is deleted and the record leaves the manifest. This is a write, so
  `doctor --check` counts it as drift until `sync` runs.
- `kept` — the consumer edited the file. The file is left alone and reported,
  and the record leaves the manifest. This is a reported state, so
  `doctor --check` fails until `sync` runs.

Two boundaries make this safe.

**Retirement is read against every group, not the held ones.** This follows
ADR-120. `sync --profile` overrides the configured profile, and a config that
names no profile falls back to `agent`. If retirement were read against the held
groups, a single run at a lower profile would delete every unmodified file a
higher rung placed. A file this version still ships under a rung the run does not
hold is left out of the plan, as before.

**An edited file's record leaves with it.** A `modified` file keeps its record,
because the package still ships that path and reverting the edit should let the
next run update it again. A `kept` file is different: nothing in this version
will write to that path again, so its record has nothing left to protect. If the
record stayed, the file would be reported on every run, `doctor --check` would
fail for ever, and the only fix would be to delete a file the consumer chose to
keep. The run that retires the record names the file once. After that the file
belongs to the consumer, like any other file the kit never wrote.

**A rung can declare the asset paths it retires.** `RUNG_RETIREMENTS` in
`config.mjs` sits beside `RUNG_GROUPS` and lists, per rung, the asset paths that
rung makes obsolete. A declaration applies only while the profile includes the
declaring rung; `retiredAssetsFor` answers the paths for one profile. While it
applies, the path is left out of the placed entries even though a lower group
still ships it, and a recorded file there is planned as `retired` or `kept` by
the same rule as above. A path the manifest does not record is left alone,
because the kit never wrote it.

A run at a profile below the declaring rung does not see the declaration. The
lower group still ships the path, so the file is planned like any other: left
alone when it matches, written back when it is missing. A declaration names an
asset path rather than a target path, so it follows the consumer's `paths`
configuration the way the asset does. No rung declares a path yet.

## Consequences

A higher rung can ship a file at a lower rung's path, and a tree moving up takes
the new file without losing a local edit. A file a later version removes from
every group is deleted where it is untouched. Where it was edited, it is reported
once and then belongs to the consumer.

A recorded path also retires when the consumer changes the `paths` entry it was
placed under. The new location is `added`. The old one is `retired` if untouched
and `kept` if edited. Before this decision both copies stayed, and so did both
records.

The comparison uses the whole file's hash, because the asset that named a
consumer-owned region
([ADR-126](./ADR-126-the-default-catalog-is-a-region-the-consumer-owns.md)) is
no longer shipped. A retiring file that holds such a region is therefore `kept`
rather than deleted. The error goes toward keeping content, not toward removing
it.

A tree moved down a rung gets back a file the higher rung retired, because the
lower rung still ships it. That is the lower rung's content, placed as for any
tree at that rung.

## Alternatives considered

1. **Read retirement against the groups the run holds.** Rejected: a one-off run
   at a lower profile, or a config with no profile, would delete every
   unmodified file a higher rung placed. ADR-120 rejected the same reading for
   the task block.

2. **Keep the record of an edited retired file, as ADR-120 does for a task.**
   Rejected: a task key the consumer edited stays visible in a block the kit still
   reconciles. A file at a path the kit no longer ships would be reported on every
   run, and the only fix would be to delete it.

3. **Retire a lower rung's file by shipping an empty file at its path from the
   higher rung.** Rejected: the tree would hold an empty file the kit records as
   its own, rather than no file.

4. **Refuse to plan when two groups map onto one path.** Rejected: that leaves a
   higher rung no way to replace a lower rung's file. Every rung would have to
   choose paths that no rung below it uses.

## References

- [#1220](https://github.com/luciocabrera/lcabrera-stack/issues/1220)
- [ADR-109](./ADR-109-decide-a-shipped-files-update-path-by-who-may-edit-it.md)
- [ADR-120](./ADR-120-reconcile-the-emitted-task-block-key-by-key.md)
- [ADR-126](./ADR-126-the-default-catalog-is-a-region-the-consumer-owns.md)
