# Skill trigger evals

Every skill under `.github/skills/` has at least one task of each kind under
its `tasks/`, and may have more:

- a trigger task (`expected.should_trigger: true`): a prompt the skill exists
  for. Passes only if the session invokes the skill.
- a near-miss task (`expected.should_trigger: false`): a prompt close to the
  skill's subject that it should not handle. Passes only if the session does
  not invoke it.

The kind comes from `should_trigger`, not from the file name or the `id`, and
[`--check`](#what-ci-runs) lists what a task must carry. Each
task's `id` must be unique within its skill, because the transcript is named
after it.

Every task also carries a top-level `set`:

- `regression`: a task that passes reliably today, so a failure means
  something changed.
- `capability`: a task the skill does not pass reliably yet. Promote it to
  `regression` once it does.

A task written from a real failure also carries `source: incident`. See
[Turning a real failure into a task](../README.md#turning-a-real-failure-into-a-task).
Waza's task schema has neither key. `waza run` logs "unknown schema field
ignored" for each one, on every task, and runs the task anyway.

The task files are [Waza](https://github.com/microsoft/waza)'s format, so two
harnesses run the same tasks.

## Claude Code (the default)

```bash
vp run evals:skills                        # every skill
vp run evals:skills -- commit-and-pr epic  # some skills
vp run evals:skills -- epic --hide epic    # prove epic's trigger task can fail
vp run evals:skills -- --check             # coverage only, no model call
vp run evals:skills -- epic --runs 1       # one trial per task
```

**Every task runs three times by default**, and `--runs <n>` changes that. A
single trial cannot tell a task that fails sometimes from one that always
fails, so the runner prints one line per task with its count of passing
trials, and the failed trials under it:

- `ok`: every trial passed;
- `FLAKY`: some trials passed and some failed;
- `FAIL`: no trial passed.

The run fails unless every task is `ok`. `--runs` takes any whole number from 1
up; anything else stops the run before any session starts.

A skill name with no eval here, or a `--hide` name that is no skill, stops the
run before any session starts, so a typo cannot pass as an empty green run.

It needs a Claude login, or `CLAUDE_CODE_OAUTH_TOKEN`. Each task runs in a fresh
temporary directory whose `.claude/skills` links to `.github/skills`, so the
session sees the whole catalog, plus the skills Claude Code ships with, and
nothing else. It loads no CLAUDE.md, hooks or MCP servers, and has one tool:
`Skill`, plus `Read` when the task copies in a fixture. A task fails unless the session's
own `init` message lists exactly those tools, so an option the SDK ignored cannot
pass as a restricted session. A task passes on the
session's `Skill` tool calls, not on its reply. Transcripts go to
`.tmp/skill-evals/`, one per trial, named `<skill>-<task id>-<trial>.json`.

After the per-task lines, the runner prints a confusion matrix: one row per
expectation (`epic` for a trigger task, `not epic` for a near-miss), one column
per skill any trial loaded, and a count of trials in each cell. So a failed
trigger task shows which skill loaded in its place. A trial that loaded two
skills counts in both columns. One that loaded none counts under `(none)`, or
under `(error)` if its session failed. Every trial's expectation, its outcome,
the skills it invoked and its trial number are written to
`.tmp/skill-evals/trials.json`. The last line is the cost the sessions
reported, summed.

**A skill with a `paths:` list is offered only after the session reads a file
that matches it.** Those skills' tasks name a fixture
(`inputs.context.fixture`, under the skill's `fixtures/`) and ask the agent to
read it, in the near-miss as well as the trigger. Without that, the near-miss
would pass only because the skill was never offered. So a task that names a
fixture also fails when the session never reads it. Take the fixture out of
`react-19`'s trigger task and it fails.

Fixture files are stored with a `.fixture` suffix, so no linter or type checker
in this repository reads them. The runner strips the suffix as it copies them in.
Waza does not, so under Waza those four skills' tasks see the suffixed names.

## Copilot, through Waza

```bash
cd evals/skills
waza run commit-and-pr/eval.yaml
```

This spends premium requests on the Copilot account you are signed in with. Use
the version the **Install Waza** step in
[`agent-evals.yml`](../../.github/workflows/agent-evals.yml) pins (`WAZA_TAG`),
installed from its release page and checked against the SHA-256 that step
pins. The latest release is not always usable: one passed `--model` to a
bundled runtime that rejects it
([microsoft/waza#630](https://github.com/microsoft/waza/issues/630)).

Waza starts the agent in a temporary directory, but the agent has a shell and
your credentials, and nothing stops it from `cd`-ing into this checkout. Every
prompt asks it not to run commands or edit files. That is a request, not a
sandbox. Run Waza from a clean tree.

The configs set `inject_skill_body: false` and point `skill_directories` at the
whole catalog. Otherwise Waza puts the target skill into the system prompt, and
a trigger test passes whatever the description says.

## Writing a task

- End every prompt with "Load any skill you need, but don't run shell commands
  or edit files." Loading a skill is a tool call. A prompt that says "don't run
  anything" stops the agent from loading the skill it has already chosen: the
  trigger task fails and the near-miss passes, both for the wrong reason.
- Give the task a `set`, and an `id` no other task of the skill uses.
- Write the trigger prompt in the words a user would use, not the
  description's.
- A near-miss shares the subject but needs nothing from the skill: a
  definition, a one-line edit, a general question. A near-miss only forbids its
  own skill, so another skill loading there is not a failure.

## Adding coverage for a new skill

1. Copy an existing skill's directory, and rename every mention of that skill.
2. If the new skill has a `paths:` list, add a fixture that matches it and
   point every task at it.
3. The copied tasks carry `set: regression`, but a new task has not shown it
   passes reliably. Set each one to `set: capability`, and promote it to
   `regression` once it does.
4. Run `vp run evals:skills -- <skill>`, then
   `vp run evals:skills -- <skill> --hide <skill>` and confirm the trigger task
   fails.

## What CI runs

The **Agent Evals (deterministic)** job in
[`agent-evals.yml`](../../.github/workflows/agent-evals.yml) runs `waza check` on
every skill, on every pull request, using the version and SHA-256 its **Install
Waza** step pins. That step fails only when a `SKILL.md`'s frontmatter does not
parse; its token budget, unknown fields and link-scope reports are advisory,
because they are this repository's conventions, not defects.

The same job runs `vp run evals:skills -- --check`, which makes no model call.
It fails a skill under `.github/skills/` with no trigger or near-miss task here,
a task with no `id`, two tasks of one skill sharing an `id`, a task whose
`should_trigger` is missing or not a boolean, a task with no `set` or an
unknown `set` or `source` (each naming the task's file), an eval whose
skill is gone, an eval or grader that names a different skill than its
directory, a task whose prompt does not end with the sentence above, and a
skill with a `paths:` list whose tasks name no fixture.

The **Skill triggers (Claude)** job runs `vp run evals:skills` on
`workflow_dispatch` only, on `CLAUDE_CODE_OAUTH_TOKEN`, and uploads the
transcripts. It is not a required check, so a spent usage limit cannot stall a
merge.
