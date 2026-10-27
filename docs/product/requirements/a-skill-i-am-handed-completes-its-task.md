---
id: a-skill-i-am-handed-completes-its-task
lines:
  - toolchain
persona: repository-maintainer
state: met
packages:
  - devkit
requires:
  - agent-instructions-do-not-contradict
issues: []
evidence:
  - type: command
    ref: vp run skills:validate
  - type: command
    ref: vp run harness:verify
  - type: command
    ref: vp run devkit:closure:shipped
  - type: code
    ref: packages/repo-standards/scripts/conformance-triggers.cjs
  - type: command
    ref: vp run usage:report
  - type: test
    ref: packages/repo-standards/scripts/usage-render.test.mjs
---

# A skill that arrived with the setup does its job in my repository

## Statement

The toolchain ships instructions my agents read and act on without re-deriving
them. I need each one to actually work where it landed: to be found when the
situation it covers arises, to point only at things my repository has, and to
leave the task in the state it describes. A skill that is never triggered and a
skill that does not exist are the same thing from where I sit — and the first one
still costs me maintenance.

## Acceptance

- Every shipped skill, path rule and subagent definition is structurally
  well-formed: frontmatter parses, required fields are present, and the file
  matches the contract its kind declares — `vp run skills:validate` and
  `vp run harness:verify`, which read the copies under `packages/devkit/assets`
  as well as this repository's own.
- Every path any of them references resolves in a repository holding only the
  installed package — `vp run devkit:closure:shipped`.
- Each one's description states **when to use it**, specifically enough to
  discriminate: a description that would match any task, or none, is a defect
  reported by name.

  Owner amendment, 2026-10-27: for a description that would match any task,
  the check reports three phrasings. The first is `all`, `any` or `every`,
  optionally followed by `other` or `kind of`, before a generic noun such as
  `task`, `file` or `request`, when the word after the noun is not a scope
  word (`in`, `for`, `of`, `on`, `under`, `that`, …) and not an apostrophe or
  hyphen. The second is one of `anything else`, `everything else`,
  `no matter what`, `whatever you` and `whatever the user`. The third is
  `at all` at the end of a clause. A paraphrase that makes the same claim in
  other words is out of scope by owner decision. Known limitations, none of
  them reported: a generic noun followed by a scope word, whatever the scope
  covers ("every task in this repository"); a bare universal pronoun
  ("everything you do"); a quantifier before a noun outside the generic list
  ("every coding task", "any part of the codebase"); and `anything` followed
  by a scope that covers everything ("anything in the repo"). The check is
  `descriptionFindings` in
  `packages/repo-standards/scripts/conformance-triggers.cjs`, added for the
  universal scope by
  [#1515](https://github.com/luciocabrera/lcabrera-stack/pull/1515); the
  missed phrasings were recorded in
  [#1537](https://github.com/luciocabrera/lcabrera-stack/issues/1537), closed
  as not planned.

- **The checks fail when an artifact is broken.** A malformed frontmatter, a
  reference to a moved file, and a description too vague to trigger each produce
  a finding, proven by planting each one.
- Invocation is measurable for the artifacts where invocation is observable, and
  the report says which kinds those are — a path rule is auto-loaded by glob and
  nothing fires, so it has no invocation to count and is reported as
  unmeasurable rather than given a proxy.

## Notes

The last criterion is the honest boundary of this requirement, and it is worth
being explicit about what it concedes. Whether a skill _completes its task well_
is a judgement, and the only instrument for it is a model reading the output —
which is non-deterministic, costs money per run, and must never gate a merge. So
this requirement asserts the three things a machine can settle (well-formed,
resolvable, discriminating) and stops.

That is a narrower claim than the title promises, deliberately. The alternative
was an acceptance criterion nobody could decide, which is the specific failure
that makes a register unusable.

A zero invocation count does not settle anything either. It has three causes that
end differently: the description never triggers (fix it and re-measure), the job
moved somewhere else (delete it and leave a pointer), or it is genuinely
unneeded (delete it). The count opens that classification; it does not close it.

Usage data is per-harness and local — Copilot and Gemini leave no transcript at
all — so absence of a record is not evidence of absence of use.
