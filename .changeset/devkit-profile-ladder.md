---
'@lcabrera/devkit': minor
---

**Breaking, landing as a `minor` because this package is pre-1.0: the profile
that placed the harness is now called `repo`, and `full` names a larger rung.**

The profiles are a ladder of four rungs, each containing the one below it:
`agent` (what an agent reads), `repo` (adds what CI and git run: the workflows,
the hooks, the templates and `COMMANDS.md`), `monorepo` and `full`. `repo`
places exactly what `full` placed before. `monorepo` and `full` are accepted,
and in this version place what `repo` places; a run under either prints the
line saying so, and the line goes away when the rung places a group of its own.

A config with `"profile": "full"` still resolves, to the top rung, so nothing
breaks and nothing different is materialised today. It will widen when the
rungs above `repo` fill in. If the harness is what you wanted, set
`"profile": "repo"`: that is the rename. No runtime notice singles the old name
out beyond the placement line every rung above `repo` prints, because the name
is still valid and its meaning is what changed.

The `decisions` group, the ADR template and its home README, moves down to
`agent`: a record template and the README describing its home are prose a
directory holds, needing neither git nor a runner. A repository on `agent` that
already holds its own copies of both sees them reported as `conflict` on the
next `doctor`; acknowledge each with
`devkit doctor --accept <path> --reason "<why>"`, or let `sync` place the seeds
where the directory is empty.

`PROFILE_LADDER`, `includesRung`, `rungPlacedAs` and `placementNotice` are new
exports of `./config`; `PROFILES` now has four keys.
