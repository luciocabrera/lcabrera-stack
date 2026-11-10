# False-positive panel fixtures

Regression fixtures for the `fp-judge` and `fp-adversary` prompts. They exist
for one failure: someone edits `.claude/agents/fp-judge.md` or
`.claude/agents/fp-adversary.md` and the panel quietly stops reaching the right
verdict, so a real finding gets dismissed or a false positive gets fixed.

```bash
vp run evals:fp-panel                        # every fixture, both roles, twice
vp run evals:fp-panel -- used-export --runs 1
vp run evals:fp-panel -- --model claude-sonnet-5-5
```

It needs a Claude login, or `CLAUDE_CODE_OAUTH_TOKEN` set. Each seat's verdict
goes to `.tmp/fp-panel-evals/`, and the run ends with the cost its sessions
reported, summed.

## What a run does

Each fixture is a finding whose true answer is known, stated in
[`expected.json`](./expected.json). The runner seats each role on it the way
`vp run adjudicate:panel` seats a real panel
([`docs/agents/false-positive-panel.md`](../../docs/agents/false-positive-panel.md)):

- the system prompt is the agent definition's body, unchanged;
- the session runs in a scratch tree holding only the fixture's files and the
  case file where `vp run adjudicate` would write it, under
  `docs/agents/adjudications/`, numbered from FP-9001, with no history;
- it gets Read, Glob and Grep, and the panel's own hook refuses any path
  outside that tree;
- the dispatch is the panel's, naming only the case file's path.

The case file is built from the fixture's `finding.json` by the same code
`vp run adjudicate` uses, so it holds the finding, the analyzer's explanation
and the flagged code, and nothing anyone argued.

A seat passes when its verdict is well formed by the panel's own rules and is
the true answer. A session error or a malformed verdict fails it. Every
fixture is one task per role, so the eval history shows each prompt's pass rate
on its own, and a new prompt hash marks every edit to either definition.

## The fixtures

| Fixture          | Analyzer and rule                                  | True answer      |
| ---------------- | -------------------------------------------------- | ---------------- |
| `used-export`    | fallow `unused-export` on an export `view.ts` uses | `FALSE_POSITIVE` |
| `unused-export`  | the same finding, with the importer removed        | `REAL`           |
| `nested-ternary` | oxlint `unicorn/no-nested-ternary`                 | `REAL`           |
| `grid-table`     | biome `noNoninteractiveElementToInteractiveRole`   | `FALSE_POSITIVE` |

`used-export` and `unused-export` hold the same finding and differ in one file,
so a prompt that answers from the finding alone fails one of them.

A fixture's files live under `cases/<fixture>/tree/` with a `.fixture` suffix,
which the runner drops. The suffix keeps the repository's own analyzers from
reading a planted finding.

## Adding a fixture

1. Add `cases/<name>/tree/` with the files a seat needs, each ending in
   `.fixture`, and `cases/<name>/finding.json` with the analyzer's own record
   and explanation, as `vp run adjudicate` would capture them.
2. Add the fixture and its true answer to `expected.json`.
3. Run `vp run evals:fp-panel -- <name>`. Then prove it can fail: add a
   sentence to the role's prompt that pushes it towards the wrong answer, run
   again, and confirm the fixture fails. Revert the prompt.

## What CI runs

The **False-positive panel fixtures (Claude, advisory)** job in
[`agent-evals.yml`](../../.github/workflows/agent-evals.yml) runs the suite on
`workflow_dispatch`, and on a same-repository pull request that touches either
prompt, on `CLAUDE_CODE_OAUTH_TOKEN`. A change to the fixtures or the runner
alone does not start it, so run the suite yourself on the fixture you changed. It uploads the
verdicts and the envelopes, and ingests them when `EVALS_DATABASE_URL` is set,
so the runs show on `/evals`. It is not a required check.
