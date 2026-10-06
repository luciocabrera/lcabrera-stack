# Evals

Checks for the agent-facing surface: the skills under `.github/skills/`, the
subagents under `.claude/agents/` and the path rules under `.claude/rules/`.
`vp run harness:verify` already checks each one's frontmatter and that every
path it names resolves; nothing here repeats that. CI runs this directory in
[`agent-evals.yml`](../.github/workflows/agent-evals.yml). Locally, `check:push`
and `check:safe` run the rules check, and `test:all` and `test:ci` run the
suites' own tests.

| Suite                                    | Run locally                   | Calls a model |
| ---------------------------------------- | ----------------------------- | ------------- |
| [Rules consistency](./rules-consistency) | `vp run evals:rules:verify`   | no            |
| [Skill triggers](./skills)               | `vp run evals:skills`         | yes           |
| [Skill quality](./skill-quality)         | `vp run evals:skills:quality` | yes           |
| [Verifier fixtures](./verifier-fixtures) | `vp run evals:verifier`       | yes           |
| The suites' own tests                    | `vp run test:evals`           | no            |

## What a run leaves behind

Every runner, the tooled verifier (`vp run evals:verifier:tooled`) included,
writes one run envelope to `.tmp/eval-results/<suite>/<run_id>.json`, with the
run's transcripts beside it in `<run_id>/`. The envelope is the schema in
[`@repo/eval-history`](../packages/eval-history) and holds the run's identity,
settings and environment, the hash of every subject and task, and one trial per
session, with its tokens, cost and durations. Each suite's own output under
`.tmp/` is still written, and skill quality builds `report.html` from the
envelope.

The envelope is written on every way out: `complete` on a normal finish,
`partial` when the run throws, and `aborted` on Ctrl-C or SIGTERM. A runner
whose envelope fails the schema writes none, names each failing field and exits 1.

Beside the envelope's path, each runner prints a `Pass rate:` line. It gives
n, the number passed, the rate and its Wilson interval at the `z` in
[`regression.config.json`](#regression-thresholds). Errors, timeouts and skipped
trials are left out of n, and the line says how many there were. With fewer
counted trials than `minTrialsForRate`, the line reads `insufficient data`. The
envelope's `totals.pass_rate` holds the same figures, with `rate`, `lower` and
`upper` set to null when the data is insufficient.

## What a full run costs

The skill-trigger and verifier suites run each task or fixture three times by
default, so a task that fails one trial in three shows as flaky rather than
broken. To measure what one full run costs, run each suite at its defaults
under `time`:

```bash
time vp run evals:skills
time vp run evals:verifier
```

Each runner ends with a `Cost:` line: the sum of the `total_cost_usd` every
session reported, and how many sessions reported none. On a Claude subscription
that figure is notional, priced as if the tokens were billed per call, so it
compares one run with another and is not a bill. The count of sessions is the task
count times `--runs`, so `--runs 1` on the skills runner costs about a third of
the default. The verifier refuses fewer than 2 runs.

The recorded measurement, with its date, model and the task set it ran
against, is on [#1292](https://github.com/luciocabrera/lcabrera-stack/issues/1292).

## Turning a real failure into a task

When an agent in real work loads the wrong skill, or misses one it needed,
keep the prompt that caused it as a task in [`skills/`](./skills):

1. Add a file under `evals/skills/<skill>/tasks/` for the skill that should
   have loaded (a trigger task) or should have stayed out (a near-miss task).
   Copy the user's words, cut to what the decision needed, and end the prompt
   with the sentence every prompt ends with.
2. Give it an `id` the skill's other tasks do not use, `set: capability` and
   `source: incident`. `capability` because the skill just failed it.
3. Run `vp run evals:skills -- <skill>`. For a trigger task, also run it with
   `--hide <skill>` and confirm it fails.
4. Once the fix to the skill makes it pass reliably, change `set` to
   `regression` and keep `source: incident`.

## Regression thresholds

[`regression.config.json`](./regression.config.json) holds every threshold
the statistics in [`@repo/eval-history`](../packages/eval-history) apply, so
changing one is a change to this file and never to code. The package rejects
the file at load when a field is missing, unknown or out of range.

| Field                    | Meaning                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `minTrialsForRate`       | Below this many counted trials a pass rate is reported as insufficient data                                |
| `z`                      | The normal quantile for the Wilson interval; 1.96 is 95%                                                   |
| `binary.flip`            | The failure share that flags a task, and the fewest counted trials it is judged on (below)                 |
| `scored.sigma`           | A scored suite is flagged when the PR mean falls more than this many baseline standard deviations below it |
| `flaky.window`           | How many of a task's most recent runs flaky detection reads                                                |
| `flaky.disagreeFraction` | A task is flaky when more than this share of those runs had trials that disagree                           |
| `baseline.defaultRuns`   | How many runs an A/A baseline takes when none is given; at least 2                                         |

`binary.flip` compares shares, not counts. A regression-set task that passed
every trial on main is flagged when the share of its counted PR trials that
failed is at least `failAtLeast / ofTrials`. At the default 2 and 3, 2 failures
of 3 flag, 3 of 6 do not, and 4 of 6 do. `ofTrials` is also the fewest counted
trials the share is judged on. When `error`, `timeout` or `skipped` leaves a
task short of it, the task is flagged if its counted failures already reach
`failAtLeast`, because it flips however the missing trials would have gone. It
makes the verdict insufficient, naming the task, if the missing trials would
decide it. It adds nothing if even failing every missing trial would not reach
`failAtLeast`.

`error`, `timeout` and `skipped` trials count toward none of these. A flaky
task, and any task tagged `set: capability`, is left out of both binary rules.

## Rules consistency

Fails when:

- a file under `.claude/rules/` is missing from the table in AGENTS.md
  §2 "Path-Specific Rules", or a row there names a rule that does not exist;
- a rule's `paths:` globs match no tracked file, so the rule never loads.

It prints, without failing, every pair of rules that loads on the same file.
Whether two such rules contradict each other is a judgement: no rule declares
which one wins, so there is nothing a script could compare. That is a gap in
the rules' metadata, not in this check. If the rules gain a precedence field,
this is where to enforce it.

It does not compare the index's "Applies to" column with the frontmatter. That
column summarises (`config/entries`) rather than copying the globs, so a
mismatch there is not necessarily drift.
