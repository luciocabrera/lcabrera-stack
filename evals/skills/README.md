# Skill trigger evals

Every skill under `.github/skills/` has two tasks here:

- `tasks/trigger.yaml`: a prompt the skill exists for. Passes only if the
  session invokes the skill.
- `tasks/near-miss.yaml`: a prompt close to the skill's subject that it should
  not handle. Passes only if the session does not invoke it.

The task files are [Waza](https://github.com/microsoft/waza)'s format, so two
harnesses run the same tasks.

## Claude Code (the default)

```bash
vp run evals:skills                        # every skill
vp run evals:skills -- commit-and-pr epic  # some skills
vp run evals:skills -- epic --hide epic    # prove epic's trigger task can fail
```

A skill name with no eval here, or a `--hide` name that is no skill, stops the
run before any session starts, so a typo cannot pass as an empty green run.

It needs a Claude login, or `CLAUDE_CODE_OAUTH_TOKEN`. Each task runs in a fresh
temporary directory whose `.claude/skills` links to `.github/skills`, so the
session sees the whole catalog, plus the skills Claude Code ships with, and
nothing else. It loads no CLAUDE.md, hooks or MCP servers, and has one tool:
`Skill`, plus `Read` when the task copies in a fixture. A task passes on the
session's `Skill` tool calls, not on its reply. Transcripts go to
`.tmp/skill-evals/`.

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
Waza v0.38.7: v0.38.8 passes `--model` to a bundled runtime that rejects it
([microsoft/waza#630](https://github.com/microsoft/waza/issues/630)). Install it
from the release page with its `checksums.txt`, and name the tag.

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
- Write the trigger prompt in the words a user would use, not the
  description's.
- A near-miss shares the subject but needs nothing from the skill: a
  definition, a one-line edit, a general question. A near-miss only forbids its
  own skill, so another skill loading there is not a failure.

## Adding coverage for a new skill

1. Copy an existing skill's directory, and rename every mention of that skill.
2. If the new skill has a `paths:` list, add a fixture that matches it and
   point both tasks at it.
3. Run `vp run evals:skills -- <skill>`, then
   `vp run evals:skills -- <skill> --hide <skill>` and confirm the trigger task
   fails.

## What CI runs

The **Agent Evals (deterministic)** job in
[`agent-evals.yml`](../../.github/workflows/agent-evals.yml) runs `waza check` on
every skill, on every pull request. It installs Waza v0.38.7 and checks the
binary against a SHA-256 pinned in the workflow. The step fails only when a
`SKILL.md`'s frontmatter does not parse. Its token budget, unknown fields and
link-scope reports are advisory, because they are this repository's
conventions, not defects.

The **Skill triggers (Claude)** job runs `vp run evals:skills` on
`workflow_dispatch` only, on `CLAUDE_CODE_OAUTH_TOKEN`, and uploads the
transcripts. It is not a required check, so a spent usage limit cannot stall a
merge.
