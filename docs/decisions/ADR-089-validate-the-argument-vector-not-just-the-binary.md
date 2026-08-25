# ADR-089 — Validate the argument vector, not just the binary

**Status:** Accepted

**Date:** 2026-08-24
**Issue:** [#915](https://github.com/luciocabrera/vite-react-compiler/issues/915)
**Relates to:** [ADR-036](./ADR-036-github-planning-layer.md)

## Context

The root tooling scripts spawn two external programs: `gh`, through
`scripts/lib/gh-exec.mjs`, and the `claude` CLI, through
`scripts/lib/pr-queue-claude.mjs` and `pr-queue-execute.mjs`. Both spawners were
already hardened against a class of attack: they name the binary as an absolute
path from a fixed directory and pin `PATH` for the child, so a writable
directory earlier in the inherited `PATH` cannot shadow the real program. The
same discipline is in `packages/repo-standards/scripts/git-exec.mjs`, which also
scrubs the `GIT_*` variables that select a repository.

That work settles **which program runs**. It says nothing about **what that
program is asked to do**, and both spawners took their argument vector from the
caller unchecked.

## Problem

`execFileSync` invokes no shell, so the usual metacharacter injection is not
available. Argument injection still is: the child parses its own argv, and a
value that begins with `-` stops being data and becomes a flag.

Whether that is reachable depends on **how the value is placed in the vector**,
and the two flows SonarCloud flagged as `jssecurity:S8705` differ on exactly
that point. Both took a value from `process.argv` with no validation between;
only one of them was injectable.

- `vp run pr:queue -- --model <model>` — **injectable.**
  `flagValue('--model') ?? 'sonnet'` reached the `claude` child's argv through
  `decideArgs` and `executeArgs` as **its own element**, so a leading `-` puts
  it in flag position and shifts the element after it into the model slot. The
  vector already carries `--allowedTools` and, on the apply pass,
  `--permission-mode acceptEdits`, so this is a value that can widen the very
  sandbox those entries exist to draw.
- `vp run pr:threads -- --resolve <thread-id>` — **not injectable.** The id is
  concatenated, not passed separately: `runGh(['api', 'graphql', …, '-f',
'thread=' + threadId])` produces an element that begins with `thread=`
  whatever the id is. `--resolve --paginate` sends `thread=--paginate`, which
  `gh` reads as the value of `-f` and binds as a GraphQL variable string. There
  is no vector in which it reaches flag position.

The probe that separates them is "does the child's argv ever contain an element
that begins with `-` and came from the operator?" — and it answers no for
`--resolve`. What was true of that flow is weaker and still worth fixing: it was
the one `pr-threads.mjs` argument with no shape check at all, while its siblings
`--pr` and `--repo` went through `parsePullNumber` and `parseRepository`, so a
mistyped id reached the GraphQL API and failed as an error about a variable the
operator never typed.

### Correction (2026-08-25, [#917](https://github.com/luciocabrera/vite-react-compiler/issues/917) / [#918](https://github.com/luciocabrera/vite-react-compiler/pull/918))

Two things in this ADR as first written were wrong. The second was found only
because the first was being fixed.

**1. It named the wrong caller.** `--resolve` was never the flow SonarCloud
reports on `gh-exec.mjs`. The finding was created 2026-07-25, the day
`gh-exec.mjs` shipped in #384; `--resolve` did not exist until 2026-08-18
(#783); and on 2026-07-25 the only file importing `gh-exec.mjs` was
`scripts/lib/plan-issues-github.mjs`, from that same PR. Nothing else could have
produced it.

**2. It described a `gh` exploit that does not exist, by assuming `gh` parses
argv the way the `claude` CLI does.** It does not. `gh` is cobra/pflag, and
pflag takes a value flag's value as the **next argv element verbatim** — no
leading-dash check. Probed against this repository:

```
$ gh issue list --label '--nonexistent'     # exit 0, empty result — taken verbatim
$ gh issue list --label '--limit'           # exit 0 — verbatim even when it is a real gh flag
$ gh api '--nonexistent'                    # unknown flag: --nonexistent, exit 1
$ gh api 'repos/luciocabrera/vite-react-compiler' --jq .name   # control: works
```

So the real property is narrower than this ADR claimed, and it is about
**position, not content**:

- A value **after a flag** is never reparsed. `--title '--label chore'` sets the
  title to the literal string `--label chore`. There is no shift and no extra
  label.
- A **positional** element beginning with `-` _is_ parsed as a flag.

Every untrusted value in `createIssue` — title, body path, labels, milestone —
is a flag _value_, so none of them was injectable. And every interpolated
positional across all `runGh` callers carries a literal `repos/` prefix, so none
can begin with `-` either. **Nothing currently reachable through `runGh` is
argument-injectable.**

What #918 keeps, on the honest justification: a shape check that refuses a
dash-leading title or milestone, because such a value silently produces a
useless issue and the offline audit is the right place to say so. It is not
closing an injection hole in `gh`, and the helper is named `startsWithDash`
rather than anything implying flag position.

**The failure mode both errors share** is the one Rule 14 exists for. Each time,
a mechanism was carried over from somewhere else — a different caller, a
different CLI's parser — and written down as fact without a probe that could
have refuted it. Both were caught in review rather than by the author. The
probes above take seconds and discriminate; the dating check in (1) is one
`git log`. Neither was run until someone asked.

## Decision

Validate the argument vector, at two places, for two different reasons.

**At the choke point**, so the guarantee does not depend on each caller
remembering. `assertGhArguments` in `gh-exec.mjs` refuses a vector that is not a
non-empty array of strings, and refuses a first element outside the set of
subcommands this tooling spawns (`api`, `issue`, `pr`, `repo`). `decideArgs` and
`executeArgs` run the `--model` value through `parseModelName` as they build the
vector, so no caller of either can skip it.

**At the flag**, so the operator gets a message naming their typo rather than a
downstream error about something else. `pr-threads.mjs` runs `--resolve` through
`parseThreadId`; `pr-queue-operator.mjs` runs `--model` through
`parseModelName` when it reads its options. For `--resolve` this is the whole
justification, not a secondary one — the `-f key=value` framing already denies
that value flag position.

The second placement is not redundant with the first. `runDecision` reports a
failed spawn as an `ESCALATE` verdict rather than an error, so a typo caught
only at the choke point would escalate every pull request in the queue instead
of saying "that is not a model name".

`parseThreadId` joins `parsePullNumber` and `parseRepository` in
`packages/repo-standards/scripts/cli-input.mjs`, which is where this repository
already keeps CLI-input validation. `parseModelName` stays in
`pr-queue-claude.mjs` because a model name is queue-specific, not a GitHub
input.

Each validator returns the value it accepted, so it wraps a call site rather
than sitting beside one.

## Consequences

- `gh-exec.mjs` now carries a list that has to be maintained: a caller needing a
  fifth `gh` subcommand must add it to `ALLOWED_SUBCOMMANDS`. The thrown message
  names the file and the constant, so the fix is mechanical, but it is a step
  that did not exist before. An allowlist was chosen over a denylist because the
  failure being guarded is a caller forwarding a vector it did not fully build,
  and there is no enumerating what `gh` could be asked to do.
- The string check refuses a vector with a non-string entry rather than letting
  it stringify. This catches a caller's absent flag arriving at `gh` as the
  literal text `undefined` and being acted on as a real value, but it will also
  fail a call site that was passing a number and working by accident.
- `parseModelName` accepts a shape, not a list of known model names. A fixed
  list would be wrong within weeks and would break the operator on the first new
  model rather than protect it. The cost is that a well-formed but non-existent
  model name still reaches the API, where it fails with the API's own message.
- Both regexes give the first character its own class. `-` is legal _inside_ a
  node id and inside a model id, so a single class spanning the whole value
  admits exactly the argument being refused. The first version of `parseThreadId`
  had this bug and its own test caught it.

## Alternatives considered

**Mark the two findings accepted in SonarCloud.** Rejected on the repository's
own rule (AGENTS.md §5, Rule 11): a finding is verified and then fixed, never
suppressed. The `--model` flow was a real injection path, so accepting that one
would have been recording a known hole as reviewed. The `--resolve` flow was
not, and accepting it would have been defensible — it was fixed anyway because
the shape check is cheap and pays for itself in the error message. (See the
Correction above: neither of those was the flow behind the `gh-exec.mjs`
finding, and the `gh` exploit this ADR originally described does not exist.)

**Validate only at the flag.** Rejected because it holds for the flow Sonar
happened to trace and nothing else. `runGh` has about ten callers; a guarantee
that each one has to re-implement is not a guarantee.

**Validate only at the choke point.** Rejected on the escalation behaviour
described under Decision — correct, but it turns a typo into a queue-wide
escalation.

**Quote or escape the values instead.** Rejected as the wrong mechanism.
`execFileSync` already passes each element as one argument with no shell
involved; there is nothing to quote. The exposure is the child's own argv
parsing, which only validation addresses.

## References

- [#915](https://github.com/luciocabrera/vite-react-compiler/issues/915) — the
  two findings, their taint sources, and the reproduction.
- `packages/repo-standards/scripts/git-exec.mjs` — the binary-and-environment
  half of this discipline (Sonar S4036), the layer below this one.
- SonarCloud rule `jssecurity:S8705`.
