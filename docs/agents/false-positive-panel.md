# The false-positive panel

A finding is fixed, never suppressed (AGENTS.md §5, Rule 11). This page owns
the one exception: a finding a blind panel ruled a false positive. It says
which findings can go to the panel, what the panel sees, how it answers, what
its answers decide, and what lands in the tree afterwards. Every skill and
agent that meets a finding links here instead of restating it.

The decision and the alternatives it rejected are
[ADR-147](../decisions/ADR-147-suppress-a-finding-only-after-a-blind-panel-confirms-a-false-positive.md),
amended 2026-11-08. The way in is the
[`false-positive`](../../.github/skills/false-positive/SKILL.md) skill,
`/false-positive <analyzer> <finding>`. The commands it drives are in
[COMMANDS.md](../../COMMANDS.md): `vp run adjudicate`,
`vp run adjudicate:panel` and `vp run adjudicate:rule`.

## 1. What can go to the panel

A finding is eligible when all of these hold:

- Its analyzer is one `vp run adjudicate` accepts: `biome`, `eslint`,
  `fallow`, `oxlint` or `react-doctor`. TypeScript's escape hatches
  (`@ts-expect-error` and the rest) and `NOSONAR` have no panel. In the public
  packages they stay under the
  [public-package register](public-package-suppressions.md), and nowhere else
  are they accepted through this route.
- The analyzer still reports it. The command re-runs the analyzer and refuses
  a finding it no longer prints.
- A fix was tried first. If a small restructure clears the finding without
  making the code worse, that restructure is the answer and no case is opened.
  "Worse" means harder to read, slower, less safe, or bent around the tool:
  code a reviewer would reject if the analyzer did not exist. Write down the
  fix you tried and why you rejected it. That note goes in your report or the
  pull request, never in the case.

The builder never rules on its own finding, and never argues it to the panel.
The builder is the one party that wants the finding gone.

## 2. The case file

`vp run adjudicate -- <analyzer> <file>:<line>[-<end line>]:<rule>` writes
`FP-nnnn/case.json` under [`docs/agents/adjudications/`](adjudications/). The number is the next one
after every case in the working tree and on the default branch.

It holds:

- the finding as the analyzer prints it;
- the analyzer's own explanation of the rule, and its trace where it has one;
- the flagged code with its surrounding lines;
- the sha256 of the flagged lines;
- the commits the case was opened against. When HEAD does not hold the flagged
  lines, `head_sha` is a `git stash create` snapshot of the working tree, which
  runs no hook and moves no ref. Stage a new file first: the snapshot leaves
  out untracked files.

It must not hold anything the builder wrote: no reason the finding is wrong, no
summary, no hint. The command takes no free text, so there is nowhere to put
one. Do not route the argument in some other way, either through a file the
case's commit holds, a comment above the flagged lines or a commit message.
The case's commit should be the finding's code, not the case for dismissing it.

## 3. The panel

Three seats, three distinct models:

- `fp-judge` twice, on two models
  ([`.claude/agents/fp-judge.md`](../../.claude/agents/fp-judge.md));
- `fp-adversary` once, on the third
  ([`.claude/agents/fp-adversary.md`](../../.claude/agents/fp-adversary.md)).
  Its only job is to prove the finding real.

`vp run adjudicate:panel -- FP-nnnn --builder-model <id>` starts all three in
parallel through the Claude subscription. The skill chooses the models and
passes them as `--judge <model> --judge <model> --adversary <model>`; without
those flags the command's defaults sit. The agent definitions pin no model, so
the choice is always made at dispatch.

The builder's model may sit, because there are only three model families and
the panel needs three distinct seats. With three distinct models, at least two
of them differ from the builder's. `--builder-model` is recorded in the
envelope, so the history shows when the builder's model sat.

What keeps the panel blind is mechanical, not a request in a prompt. Each seat
runs in a `git archive` export of the case's commit, so it has no history,
branch name or pull request. The coordination claims are deleted from it. A
seat gets Read, Glob and Grep, and a hook refuses any path outside the export.
ADR-147's "What the blindness rests on" is the full list, and what it does not
cover.

Do not dispatch the seats yourself through the Agent tool. A subagent started
that way runs in your working tree, with its history, your branch and your
notes, which is exactly what the panel must not see. The command is the only
way to seat a panel.

## 4. The verdict

Each seat's final message is its verdict. Line one is exactly `REAL` or
`FALSE_POSITIVE`, alone on the line. Then:

- `Evidence:` what it read and what that showed.
- For `FALSE_POSITIVE`, a `Check:` line that could have shown the finding real
  (Rule 14): the caller, input or configuration under which the rule would
  fire, the files searched for it, by path, and that it is not there. The
  command refuses a `Check:` that names no path.
- For `REAL`, a `Fix:` line with the concrete change. An empty `Fix:` says
  there is no fix to apply.

The command writes each verdict beside the case as
`<role>-<model>.verdict.md`, and refuses a malformed one.

## 5. The decision rule

| The three verdicts                              | Outcome     | What happens next                                                                                           |
| ----------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| All three `FALSE_POSITIVE`                      | `dismissed` | The list entry and the marker (§6).                                                                         |
| At least one `REAL` with a non-empty `Fix:`     | `fixed`     | Apply that fix. No marker. If the fix cannot be applied, the case goes to the repository owner (§7).        |
| `REAL` and `FALSE_POSITIVE` both, and no `Fix:` | `split`     | Stop. The case goes to the repository owner (§7).                                                           |
| All three `REAL`, and no `Fix:`                 | `escalated` | Stop. The owner decides the fix. There is nothing to dismiss, so `vp run adjudicate:rule` does not take it. |

A fix is not a suppression, so applying one needs nobody's decision. There is
no majority vote: a split means at least one model found a reason the finding
is real, and that reason goes to a person, not to arithmetic. Re-running the
panel until it agrees replaces the decision with another vote, so a case that
has a panel record is never sat again. Open a new case if the code changed.

Every outcome's envelope is written beside the case directory as
`FP-nnnn.json`, and committed with it,
so the history keeps every verdict and the number stays taken.

## 6. The list entry, the marker and the expiry

On a dismissal, the command adds an entry to
[`false-positives.json`](false-positives.json): the analyzer, the rule, the
file, the case, the envelope's path, the sha256 and line count of the flagged
lines, and an expiry. Never write or edit an entry by hand.

The builder then adds the analyzer's own next-line marker above the first
flagged line, as the command prints it:

```text
// <directive> <rule> -- false positive, case FP-nnnn: <one-line reason>
// biome-ignore <rule>: false positive, case FP-nnnn: <one-line reason>
```

The second form is Biome's. The directive is the analyzer's next-line one:
`eslint-disable-next-line`, `oxlint-disable-next-line`,
`fallow-ignore-next-line`, `react-doctor-disable-next-line` or `biome-ignore`.
The reason is one line. It is the only comment the no-comment rule requires,
and it names the case; the argument lives in the case and its verdicts.

An entry expires six months after the case opened, or, on a case the owner
ruled, six months after the ruling. A dismissal that is still right is
re-adjudicated then. Any edit to the flagged lines voids it, a reformat
included.

`vp run suppressions:verify` holds the list and the markers to each other, one
to one. It fails a marker that names no case or gives no reason, a marker with
no live entry for the same analyzer, rule and file, an entry with no marker, an
envelope that is missing or invalid, a panel that did not sit three distinct
models as two judges and one adversary, a case that was neither dismissed nor
ruled `FALSE_POSITIVE` by the owner, flagged lines whose sha256 changed, and an
expired entry. It also fails an ESLint, Oxlint, Biome or React Doctor marker
that names no case outside the public packages. A fallow marker in a changed
file passes `vp run fallow:suppressions` only when a live entry names its
case. The pre-commit hook, `check:push`, `check:safe` and CI run both.

## 7. Going to the repository owner

A `split`, an `escalated` case, and a `fixed` case whose fix cannot be applied
all stop with the repository owner, Lucio. Stop work on that finding, and
report:

- the case number and the finding;
- the three verdicts, each with its seat, its model and its `Fix:` or
  `Check:` line;
- the fix you tried before opening the case, and why you rejected it.

Then wait. Do not mark the finding, do not dismiss it, and do not re-run the
panel. Under `/epic` the split pauses that issue only; the rest of the wave
carries on.

When the owner rules on a `split` or `fixed` case, record it:

```bash
vp run adjudicate:rule -- FP-nnnn --verdict <FALSE_POSITIVE|REAL> --by <login> --reference <https url>
```

`--reference` is the comment where the owner ruled. A `FALSE_POSITIVE` ruling
writes the list entry and prints the marker, as a dismissal does. A `REAL`
ruling means fix the finding. The command never overwrites a ruling.

## 8. The upstream draft

A dismissal also writes `FP-nnnn/upstream.md`, a draft report for the
analyzer's own issue tracker. It is never posted without the owner's explicit
yes. Show the owner the text and the tracker's URL, and post only after they
say yes to that text.

## 9. In a pull request

A pull request that adds a list entry lists each case under **Verification**:
the case number, the analyzer, rule and file, and each seat's verdict with its
role and model. On a ruled case, it adds the owner's ruling and its reference.
What checks that depends on how the PR was made. Under `/refactor-verified`
or `/epic`, the blind verifier checks every new entry the diff adds: the case
file exists, the panel sat three distinct models, the votes are unanimous or
the owner ruled `FALSE_POSITIVE`, and the case holds nothing the builder
wrote. Outside those two workflows nothing reads the verdicts:
`suppressions:verify` checks the record's shape, and no gate can prove the
three sessions ran or reads the PR body's listing. A reviewer of such a PR
has to read the case and its verdicts themselves.

## 10. Known gaps

Tracked, not fixed here:

- [#1599](https://github.com/luciocabrera/lcabrera-stack/issues/1599): the
  placeholder `<one-line reason>` passes the gate as a reason, so replace it
  yourself. Nothing binds a panel record to a real session. One seat that
  breaks the verdict format fails the whole run, with no retry, so the other
  two verdicts are lost. The envelope schema does not declare
  `builder_model`, so a validated envelope drops it.
- [#1574](https://github.com/luciocabrera/lcabrera-stack/issues/1574):
  `fallow similar-code` can finish a run as `partial`, and fallow's issue
  registry has no `similar-code` marker. A dismissed `similar-code` case still
  gets its list entry and marker, and `suppressions:verify` holds the two to
  each other. Whether fallow itself then skips the candidate has not been
  checked.
