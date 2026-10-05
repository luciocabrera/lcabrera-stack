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
broken. The cost below is the sum each runner prints at the end, from the cost
its sessions reported. It was measured on 2026-10-05, on `claude-opus-5-5` with
a Claude subscription, at the defaults, when `evals/skills/` held 132 tasks and
the verifier 5 fixtures:

| Command                 | Sessions | Reported cost | Wall time |
| ----------------------- | -------- | ------------- | --------- |
| `vp run evals:skills`   | 396      | $28.22        | 24 min    |
| `vp run evals:verifier` | 15       | $1.80         | 2 min     |

It moves with the task count, the model and the prompts, so rerun the command
for a current figure rather than trusting the table. The skills suite came to
about $0.07 a session, which scales it to the current task count. `--runs 1` on
the skills runner costs about a third as much; the verifier refuses fewer than
2 runs.

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
