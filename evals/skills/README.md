# Skill trigger evals

One [Waza](https://github.com/microsoft/waza) eval per skill under
`.github/skills/`, each with two tasks:

- `tasks/trigger.yaml`: a prompt the skill exists for. Passes only if the agent
  invokes the skill.
- `tasks/near-miss.yaml`: a prompt next to the skill's subject that it should
  not handle. Passes only if the agent does not invoke it.

Both are graded with `skill_invocation`, which reads the session's skill calls,
not the reply text.

## Running them

Waza drives the GitHub Copilot CLI, so a run spends premium requests on the
Copilot account you are signed in with.

```bash
cd evals/skills
waza run commit-and-pr/eval.yaml        # one skill
waza run commit-and-pr/eval.yaml --task near-miss
```

Use Waza v0.38.7. v0.38.8 passes `--model` to a bundled runtime that rejects it
([microsoft/waza#630](https://github.com/microsoft/waza/issues/630)); move the
pin once a release carries the fix. Install it from the release page with its
`checksums.txt`, the way the upstream `install.sh` does, but name the tag.

**The agent runs with your shell and your credentials.** Waza starts it in a
temporary directory, but nothing stops it from `cd`-ing into this checkout or
calling `gh`. Every prompt asks it not to run commands or edit files; that is a
request, not a sandbox. Run from a clean tree.

## Why the configs look the way they do

- `inject_skill_body: false`. Waza otherwise puts the target skill into the
  system prompt, and a trigger test then passes whatever the description says.
- `skill_directories` is the whole catalog, so the agent picks among every
  skill, as it does in real use, rather than seeing one.
- Every prompt ends with "Load any skill you need, but don't run shell commands
  or edit files." Loading a skill is a tool call: a prompt that says "don't run
  anything" stops the agent from loading the skill it has already chosen, which
  fails a trigger task and passes a near-miss for the wrong reason.

## Adding coverage for a new skill

1. Copy an existing skill's directory and rename every `commit-and-pr` in it.
2. Write a trigger prompt in the words a user would use, not the description's.
3. Write a near-miss that shares the subject but needs nothing from the skill:
   a definition, a one-line edit, a general question.
4. Run both. Then prove the trigger task can fail: rerun it with `--no-skills`
   and confirm it does.

## What CI runs

`waza check` on every skill, on every pull request. It fails only when a
`SKILL.md`'s frontmatter does not parse; its token budget, unknown fields and
link-scope reports are advisory, because those are this repository's
conventions rather than defects.

The trigger evals are not in CI yet. They need a Copilot token secret, which
does not exist; the plan is a `workflow_dispatch` job once it does.
