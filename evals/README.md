# Evals

Checks for the agent-facing surface: the skills under `.github/skills/`, the
subagents under `.claude/agents/` and the path rules under `.claude/rules/`.
`vp run harness:verify` already checks each one's frontmatter and that every
path it names resolves; nothing here repeats that. CI runs this directory in
[`agent-evals.yml`](../.github/workflows/agent-evals.yml). Locally, `check:push`
and `check:safe` run the rules check, and `test:all` and `test:ci` run the
suites' own tests.

| Suite                                    | Run locally                 | Calls a model |
| ---------------------------------------- | --------------------------- | ------------- |
| [Rules consistency](./rules-consistency) | `vp run evals:rules:verify` | no            |
| The suites' own tests                    | `vp run test:evals`         | no            |

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
