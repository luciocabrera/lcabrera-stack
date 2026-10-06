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
| `binary.flip`            | A regression-set task that passed on main is flagged when it fails at least `failAtLeast` of `ofTrials`    |
| `scored.sigma`           | A scored suite is flagged when the PR mean falls more than this many baseline standard deviations below it |
| `flaky.window`           | How many of a task's most recent runs flaky detection reads                                                |
| `flaky.disagreeFraction` | A task is flaky when more than this share of those runs had trials that disagree                           |
| `baseline.defaultRuns`   | How many runs an A/A baseline takes when none is given; at least 2                                         |

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
