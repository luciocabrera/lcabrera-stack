---
name: false-positive
description: The only way to get an analyzer finding suppressed. Use when you believe a lint, fallow, Biome, Oxlint, ESLint or React Doctor finding is wrong, when someone asks whether a finding is a false positive or whether they can suppress, ignore, disable or baseline it, or before writing any suppression marker. It makes you try a fix first, opens a blind case, seats a three-model panel and applies its verdict. Not for fixing a finding you agree with, explaining what a rule means, or configuring a linter. Invoke as /false-positive <analyzer> <finding>.
user-invocable: true
argument-hint: '<analyzer> <file>:<line>[-<end line>]:<rule> — analyzer is biome, eslint, fallow, oxlint or react-doctor'
---

# /false-positive &lt;analyzer&gt; &lt;finding&gt;

You think a finding is wrong. The panel decides whether it is, not you.
A blind panel of three models rules from a case file that holds nothing you
wrote. Its verdict either sends you back to fix the code, puts the finding in
front of the repository owner, or lets you suppress it.

> The rules are owned by
> [`docs/agents/false-positive-panel.md`](../../../docs/agents/false-positive-panel.md):
> what is eligible, what a case may hold, the panel, the verdict format, the
> decision rule, the list entry, the marker and the expiry. **Read it now.**
> This file is the procedure, and where the two seem to disagree the contract
> wins.

The argument is the analyzer and the finding id the commands take, such as
`fallow <file>:12:similar-code` or
`biome <file>:40:lint/a11y/useSemanticElements`, with `<file>` relative to the
repository root. If either is missing, ask for it and stop.

## 1. Try a fix first

Read the flagged code and the rule's documentation. Look for a restructure
that clears the finding without making the code worse, as the contract's §1
defines worse. If you find one, apply it, re-run the analyzer, and stop here.
That is the normal outcome of this skill.

If none works, write down what you tried and why you rejected each attempt.
Keep that note in your own report or the pull request. It never goes into the
case, and you never pass it to the panel.

## 2. Open the case

```bash
vp run adjudicate -- <analyzer> <file>:<line>[-<end line>]:<rule>
```

It re-runs the analyzer, refuses a finding no longer reported, and prints the
case id, `FP-nnnn`. Add `--trace <target>` for a fallow `dead-code` or `dupes`
finding when the default trace is the wrong one, and `--pr <n>` when a pull
request is open. It takes no other input.

If the flagged lines are only in your working tree, it snapshots the tree
with `git stash create`. A new file must be staged first. Do not commit a
note, a comment or a commit message that argues the finding, because the panel
reads the case's commit.

## 3. Seat the panel

Pick three distinct models: two judges and one adversary, with at least one
of them not your own model. Then run:

```bash
vp run adjudicate:panel -- FP-nnnn --builder-model <your model id> \
  --judge <model> --judge <model> --adversary <model>
```

The command starts `fp-judge` twice and `fp-adversary` once, in parallel, each
in a `git archive` export of the case's commit with only Read, Glob and Grep.
**Do not start those agents yourself through the Agent tool**: a subagent
started that way runs in your working tree and can read your branch, your
notes and the pull request, which is the one thing the panel must not see.

Leave the working tree alone while the command runs. It voids the panel when
the tree changes underneath it. Expect a few minutes and a cost of roughly one
to three dollars on the subscription.

## 4. Read the verdicts and apply the rule

The command writes each verdict beside the case and prints the outcome. Read
the three verdict files, then follow the contract's §5 for that outcome. Do not
recount the votes yourself: the outcome the command prints is the one the
gate checks.

- **`dismissed`**: go to step 5.
- **`fixed`**: do what §5 says, re-run the analyzer and the gate, and go to
  step 6. If you cannot, go to step 7.
- **`split`** or **`escalated`**: go to step 7.

If the command exits 1 on a malformed verdict, it recorded nothing and all
three verdicts are lost (#1599). Report that to the owner before you seat the
panel again, because a second run is a second paid vote.

## 5. Write the marker

The command has already written the list entry in
`docs/agents/false-positives.json` and the upstream draft. Never write or edit
an entry yourself. Add the marker it printed above the flagged line, and
replace `<one-line reason>` with one line that names why the rule does not
apply here. The gate accepts the placeholder today (#1599), so this step is on
you.

Then run `vp run suppressions:verify`, and for a fallow marker
`vp run fallow:suppressions`. Both must pass.

## 6. Save the case

Commit the case directory, the `FP-nnnn.json` envelope beside it, the list
entry and the marker together, whatever the outcome. Every verdict is kept for
the verdict history, and a committed number is never reused. `vp run
evals:ingest` reads the envelope from there.

In the pull request, list each case under **Verification**, as the contract's
§9 says. Never post `upstream.md` anywhere without the repository owner's
explicit yes to its text and its destination.

## 7. Stop and report to the owner

On a `split`, an `escalated` case, or a fix that cannot be applied, stop work
on that finding and report to Lucio what the contract's §7 lists: the case,
the three verdicts with seat and model, and the fix you rejected. Do not mark
the finding, dismiss it, or sit the panel again.

When the owner has ruled on a `split` or `fixed` case, record it with
`vp run adjudicate:rule`, as the contract's §7 shows, then continue at step 5
for a `FALSE_POSITIVE` ruling or step 1 for a `REAL` one.

## Known gaps

The contract's §10 lists them: #1599 (the placeholder reason, no retry for a
malformed seat, `builder_model` not in the schema) and #1574 (`similar-code`
partial runs, and no `similar-code` marker fallow honours).
