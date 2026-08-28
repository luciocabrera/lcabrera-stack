---
name: unslop
description: Cut AI tells from English a person will read: typography, vocabulary, structure, and this repo's engineering prose. Use when asked to unslop, humanize, de-AI, make this sound human, or remove the AI style. Also apply from the first draft of chat replies, PR/issue prose, docs, and review comments. Invoke as /unslop.
user-invocable: true
argument-hint: "[text | calibrate]"
---

# Unslop

Text that reads like a person who knows the subject wrote it, not like a model
assembled it. The target is this author writing well, not the median human.

Word-swapping does not do that. Vocabulary tells decay ("delve" collapsed;
models now suppress em dashes). What survives is structure: chewed conclusions,
symmetric paragraphs, invented specifics, uniform punch. Surface cleanup in
the 2026 UMD / Google DeepMind StoryScope study barely moved a structure
classifier. So this skill works cheapest-first:

1. Typography and mechanics.
2. Vocabulary and rhetoric. Lists live in [`references/patterns.md`](references/patterns.md).
3. Structure and epistemics. This level is the one that matters.

Cursor's catalog adds the engineering overlay this repo actually needs: name
the mechanism, keep real terms, cut metaphor-jargon. asavvin-pixel's skill
adds the durable layer and the cleanup residue ("clean slop") that fooled a
first launch post.

## When it applies

Apply from the first draft, not as a polish pass, whenever a person will read
the English: chat replies, PR/issue **prose**, docs, ADRs, review comments.

**Do not apply** (or apply only Level 1 debris cleanup) to:

- Source code, snapshots, generated files, JSON/YAML, lockfiles
- Commit **subjects** (the Conventional Commit format in `commit-and-pr`)
- Required template headings — every one the PR and issue templates carry, not
  a chosen two. The [`commit-and-pr`](../commit-and-pr/SKILL.md) skill owns
  their spellings, and the two templates are not held to the same bar. A **PR**
  heading the gate requires must be plain: numbering, emoji or bold in one fails
  `pr:verify`. An **issue** heading is matched on its text with the number
  optional, which is why the shipped template numbers all of its own; emoji or
  bold still fail, under `issue:verify`. `REQUIRED_PR_SECTIONS` and
  `REQUIRED_ISSUE_SECTIONS` in
  `packages/repo-standards/scripts/commit-convention.mjs` are the two lists —
  read them rather than recalling one
- Machine-readable verdicts (`agent-review-verdict/v1`)
- Binary acceptance criteria, runbooks, merge checklists, `ARCHITECTURE.md`
  constraint lists: keep the genre. Do not "add soul" to a spec

Comments on code follow [`AGENTS.md`](../../../AGENTS.md) §7 and
[ADR-094](../../../docs/decisions/ADR-094-move-explanations-out-of-functions-and-into-the-record-that-owns-them.md):
no comment above a function or component and none inside its body, so there is
usually no comment prose to unslop. What moved out of the code — into an ADR or
a pull request — is prose a person reads, and this skill applies to it.

## How to work

1. **Voice.** Always read [`references/repo-voice.md`](references/repo-voice.md).
   For chat, PR prose, issue prose, and review comments, if
   `references/style-profile.md` exists, also read it; it wins on
   conventions for those genres. Everything else (docs, essays, emails,
   skills, ADRs, runbooks) stays on repo-voice. Epistemics cannot be
   switched off by any profile.
2. **Mode.** Rewriting: keep meaning, facts, genre. Writing: apply from draft
   one. Genre survives: a PR stays a PR, an email stays an email.
3. **Volume** (pick if the user didn't; say which if it matters):
   - _Free_ (default for "unslop this"): delete empty phrases, length may drop
   - _Careful_ (fixed slot: PR body, issue template): structure survives,
     length stays roughly 80–110%
   - _Minimal_ (on request): only unambiguous AI constructions
4. Read [`references/patterns.md`](references/patterns.md) and
   [`references/prose-benchmarks.md`](references/prose-benchmarks.md).
5. Run the three levels. Then the final check.

## Level 1. Typography and mechanics

- **Em dashes.** Avoid the spaced, formulaic kind used to punch up
  parallelisms. Prefer a period or a comma. Hyphens stay in compound words.
  Do not strip em dashes from existing repo docs whose voice already uses
  them (`AGENTS.md`, ADRs); do not introduce new ones in chat or new prose.
  Parentheses as a dash-substitute are themselves a tell. If the thought
  needs separation, end the sentence.
- **Quotes.** One style, held. Default: straight.
- **Headings.** Sentence case. Exception: the headings a gate matches, which are
  `REQUIRED_PR_SECTIONS` and `REQUIRED_ISSUE_SECTIONS` in
  `packages/repo-standards/scripts/commit-convention.mjs` — two lists, each
  longer than the two headings people remember, and matched on different terms
  (see above).
- **Bold.** Only where the reader would get lost without it. Never every
  "key term".
- **Lists.** Connected prose of fewer than four items stays a paragraph.
  The tell is a bold label and colon that restates the line
  (`**Performance:** Performance improved...`). A bold lead-in that ends in
  a period and adds new detail is fine (`**Schema in TypeScript.** Tables
live in one file.`).
- **No decorative emoji** in headings or bullets. `pr:verify` already fails
  emoji in required PR headings.
- **No "Conclusion" / "In summary" / "Overall"** that restates. An ending
  that survives has a decision, a next step, or a consequence.
- **Debris.** `utm_source=chatgpt.com`, `turn0search0`, `oaicite`,
  `referrer=grok.com`, `[Your Name]`, fences around prose, `---` before
  headings. Delete silently when rewriting.

## Level 2. Vocabulary and rhetoric

The catalog is [`references/patterns.md`](references/patterns.md). Treat
listed words as hints; the habit is the target. A synonym of an AI word is
not itself suspect.

Do not "plain-speech" away terms this repo actually uses: _API surface_,
_gate_, _claim_, _worktree_, _barrel_, _harness_ (the apps are the harness),
_store_, _primitive_ (the TypeScript kind). Metaphorical cousins (_north
star_, _flywheel_, _substrate_, _gold-plating_, _endgame_) still go.

## Level 3. Structure and epistemics

**Don't chew the conclusion.** If the point has been shown, do not name the
moral. Delete the last sentence of a paragraph and see if the text got
better; it usually did.

**Break symmetry.** Claim, support, takeaway, stamped down the page, is the
machine shape. Vary paragraph length. Rigid formats (specs, runbooks, this
skill's own outline) are exempt.

**Name the mechanism, not the feeling.** "the database stays close at hand"
is a mood. "`.toSQL()` returns the exact string sent to the database" is a
fact. If you cannot restate a sentence as an instruction, a fact, or a
number that exists, cut it. If the sentence could appear unchanged in
another project's docs, it says nothing about this one. Cut it.

**Real specifics only.** Titles, commands, paths, SHAs, dates that exist in
the source or that the user supplied. What you don't have, you don't have:
name the gap. Invented examples for liveliness are worse than a cliché.

**Leave slack.** One or two sentences per text written at half pressure. Uniform
maximum punch is its own tell (see clean slop in the catalog). Slack is not
a fake typo or an inserted "um".

**Soul, only where the genre allows** (chat, essays, narrative docs; not
specs): have an opinion, vary rhythm, acknowledge mixed feelings, use "I"
when you are the one judging, let a little mess in. Specifics do the work
that folksiness pretends to.

### Epistemics (no profile can override)

Same demand as Non-Negotiable Rule 14 in [`AGENTS.md`](../../../AGENTS.md):
a claim needs evidence that could have disproved it. Every substantive
claim is one of four types:

1. _From the data._ In the source or supplied by the user. State it.
2. _Computed on an assumption._ Name the assumption in the same breath.
3. _Judgment._ Mark it and give the basis, or cut it.
4. _A gap._ Needed but missing. Name it once.

Never invent norms or thresholds ("healthy", "well within range") without a
named baseline. Hedge the fragile point once, not every sentence. Editing
is not fact-checking: soften wording to what the text can carry, or flag
that the public version needs receipts.

Changing numbers still do not belong in durable docs; name the command that
produces the number ([`AGENTS.md`](../../../AGENTS.md) §7).

## Calibrating a voice

On "calibrate to my style" / "learn my voice":

1. Ask for 3–5 texts the user wrote without AI, 2,000+ words total.
2. Fill [`references/style-profile-template.md`](references/style-profile-template.md)
   from observations only. Empty stays default.
3. Write `references/style-profile.md`. Show it. The user can edit it.
4. A profile cannot enable invented facts, switch off epistemics, or request
   imitation of another named author.

On "learn from this text too": append, don't rewrite; date the note.

## Final check

If you have a file and bash, grep the draft (skip em-dash if the profile or
the existing repo doc allows it):

```bash
grep -nE 'not just|not only|important to note|worth noting|Additionally,|Moreover|Furthermore|delve|tapestry|testament|serves as|stands as|boasts|In summary|Overall,|game-chang|north star|flywheel|gold-plat|That.?s not [a-z].* That.?s|The real question|Here.?s the thing|Here.?s what that|Let me know if|I hope this helps' "$FILE"
```

Then reread:

1. Every concrete detail traces to the source or the user.
2. Every threshold has a named baseline, or is gone.
3. No paragraph ends by restating itself.
4. Outline test: first sentences of every paragraph, in order. If they form
   a tidy summary, the document is machine-shaped; reorder or start one
   section in the middle. Exempt: specs, runbooks, templates, this skill.
5. Aphorism budget: at most one punchy one-liner close.
6. At least one slack sentence; confidence is uneven.
7. Genre survived. Required headings are untouched.
8. Repo terms that are real were not "simplified" into mush.
9. No replacement tic you used on the last three texts
   ("here's what that means in practice").
10. Self-audit: "What makes this obviously generated?" Fix that. Sterile
    voiceless prose is also a tell.

## How to report

One or two sentences if a judgment call is worth flagging. No numbered
category audit, no reciting this file. If the user didn't ask and nothing
was contentious, no report.

## Sources

- [cursor/plugins pstack unslop](https://github.com/cursor/plugins/blob/main/pstack/skills/unslop/SKILL.md).
  Compact catalog, engineering "say what it does", metaphor-jargon.
- [asavvin-pixel/unslop](https://github.com/asavvin-pixel/unslop). Three
  levels, clean slop, epistemics, calibration, StoryScope.
- [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
- Russell J. et al., StoryScope, UMD / Google DeepMind, 2026.
  [arXiv:2604.03136](https://arxiv.org/abs/2604.03136)
