# ADR-049 — Findings reports are produced on demand; only gate baselines are tracked

**Status:** Accepted

## Context

`reports/` held 22 tracked files, and they were doing two unrelated jobs under one
convention.

Some are **gate baselines**: `api-surface:verify` diffs the published type surface
against `reports/api-surface/*.txt`, and `fallow audit --gate new-only` scores
against `reports/fallow/baselines/*.json`. A gate compares against these, so they
must be in git — that is the whole mechanism.

The rest are **findings snapshots**: the fallow, oxlint, eslint, Biome and Sonar
reports, plus a regenerated complexity summary and two skill run logs. Nothing
compares against them. They exist so an agent can read what a tool found without
running it, and AGENTS.md said so explicitly — act on Sonar "from a file like they
do the lint/fallow reports — not the dashboard."

A committed findings snapshot is a **measurement in git**, and this repo already
has a rule about those: AGENTS.md §7, "never put a changing number in a comment or
a doc … name the command that produces the number instead." A snapshot is that
rule's failure mode at file scale. It is accurate the moment it is written and
wrong from the next commit onward, with nothing to say which it is.

That is not hypothetical here:

- **`reports/sonar/full-latest.json` sat wrong for 22 merges.** PR #283's analysis
  was committed as `main`'s state, reporting a failing gate and two findings `main`
  did not have — one already accepted in SonarCloud. An agent read it, believed it,
  and started work on correct code (#304). The freshness check could not catch it:
  a pull request's analysis one minute old is perfectly fresh and entirely wrong
  for that file.
- **The fix at the time was a guard, and the guard held.** Only a `main` analysis
  may write the tracked path; a test asserts the committed snapshot's own `target`.
  It fixed the instance and not the class — the file still only moved when someone
  remembered to move it, and nothing said how old it was.
- **Nothing regenerates any of them.** Not CI, not a hook, not the gate. Freshness
  depended entirely on someone running the command and committing the result.

They are also 5.7 MB of the repo's 6.6 MB of reports, re-serialised in full on
every regeneration, which makes them a recurring merge conflict on any branch that
refreshes one.

## Decision

**A gate compares against it → tracked. It reports what a tool found → produced on
demand.**

| Tracked (gate baselines)          | Compared against by            |
| --------------------------------- | ------------------------------ |
| `reports/api-surface/*.txt`       | `vp run api-surface:verify`    |
| `reports/fallow/baselines/*.json` | `fallow audit --gate new-only` |

Everything else is gitignored and named by the command that writes it:

| Produced on demand                                | Command                        |
| ------------------------------------------------- | ------------------------------ |
| `reports/{oxlint,eslint,biome}/full-latest.json`  | `vp run lint:report`           |
| `reports/fallow/*-latest.json`                    | `vp run fallow:full`           |
| `reports/fallow/complexity-threshold-analysis.md` | `vp run fallow:refresh-report` |
| `reports/sonar/runs/<target>.json`                | `vp run sonar:report`          |
| `reports/skills/*.md`                             | the skill runner scripts       |

The ignore rule is `reports/*/*-latest.json` plus three explicit paths — matched
one level below the tool directory, which is precisely what spares
`reports/fallow/baselines/`, a level deeper.

**The Sonar tracked-snapshot machinery is removed, not adjusted.** With nothing
committed, every target — `main` included — writes its own file under
`reports/sonar/runs/`. `TRACKED_REPORT_PATH` and `isMainSnapshot` are gone, along
with the test that read the committed file. A pull request's analysis being read as
`main`'s is now impossible rather than guarded, so the guard has nothing left to
protect.

## Consequences

- **An agent must run the command to see findings.** That is the point: the answer
  is then about the current tree rather than about whenever someone last committed.
  AGENTS.md now names the command instead of the file.
- **`docs:verify` needs to know these paths are expected to be absent**, or every
  doc naming one breaks on a fresh checkout. It matches them by shape, so a new
  tool's report is covered the day it exists — and the shape deliberately excludes
  the baselines, so a doc naming a missing baseline is still a real broken link.
- **No CI artifact upload is added here.** Nothing in CI reads these files today;
  the gates that matter (`fallow audit`, `api-surface:verify`, the Sonar issue
  gate) compute their own inputs. If a reviewer ever wants a run's reports without
  a checkout, uploading them is a small follow-up, not a prerequisite.
- **The three one-off assessments under `reports/` stay tracked** —
  `batch-column-settings-refactor-assessment.md`,
  `fallow/monorepo-baseline-report.md`,
  `ui-import-boundary-phase4-manifest.md`. They are dated write-ups, not tool
  output, so no command reproduces them. They are also referenced by nothing, and
  under AGENTS.md §7 that kind of narrative belongs in a PR or an issue; deciding
  to retire them is a separate call from this one.
- **A refresh no longer conflicts.** Regenerating a 3.1 MB JSON on a branch used to
  guarantee a merge conflict with any other branch that did the same.

## Alternatives considered

**Keep them tracked and add a freshness gate** — fail the build when a snapshot is
older than `HEAD`. Rejected: it makes every unrelated PR responsible for
regenerating and committing 5.7 MB of JSON, which trains people to bypass the gate.
The reason to keep them was convenience, and a gate is the opposite of that.

**Keep them tracked and regenerate in CI on `main`.** Rejected on evidence: this
was tried for `CHANGELOG.md` (`update-changelog.yml`) and never once succeeded —
the push is rejected by `main`'s required-status-checks ruleset, and making it work
needs either a ruleset bypass for every workflow with `contents: write` or a
long-lived PAT. AGENTS.md records that account.

**Keep only Sonar's snapshot, since it needs a token to reproduce.** Rejected: a
token makes a report _inconvenient_ to reproduce, not _safe_ to cache — and Sonar's
is the one that actually went wrong.

**Delete `reports/` entirely.** Rejected — two gates read from it.
