# Author style profile

Overrides [`repo-voice.md`](repo-voice.md) on conventions. Cannot switch off
epistemics, invent facts, or imitate another named author.

This profile is a **balanced register**, not a transcript. The human
samples were short. The explicit rules in §6 are the load-bearing part.
Typos in those samples are mistakes. Correct them. Do not copy them.

---

## 1. Typography

- Em dashes: avoid in new prose. Do not strip them from existing repo docs
  (`AGENTS.md`, ADRs).
- Quotation marks: straight.
- Headings: sentence case. Gates excepted (`## What`, `## Verification`,
  issue template sections).
- Lists and bold: a short list when the items are parallel. Prose otherwise.
  Bold only a load-bearing name or command.
- Paragraphs: short, 1–3 sentences.
- Other: no decorative emoji. No ellipses for drama.

## 2. Vocabulary

- Words and connectives to use: we, you, if, then, so, because, still,
  package, app, copy, filter, gate, claim.
- Words to never insert: delve, tapestry, landscape (abstract),
  foundational, seamless, robust (as puffery), leverage, unlock, testament,
  "it's important to note", "not just X but Y", "here's what that means in
  practice".
- Jargon: keep real repo terms (API surface, gate, claim, worktree, barrel,
  harness, store). Use the short form people already say (`repo`, `PR`,
  `IS NULL`).
- Addressing the reader: "we" on a product call. "you" in a skill or a
  question. Impersonal in a spec.
- Spelling: American, to match the repo.

## 3. Rhythm

- Typical sentence length: short. One idea per sentence. A longer sentence
  is allowed when it names a constraint and the reason in one breath.
- How to open: with the claim or the decision. Not with a scene, not with
  "It's not X".
- How to close: with the next step, the test, or stop. No recap. No bow.
- Transitions: none, or "so" / "if" / "then". Not Additionally / Moreover.

## 4. Personal habits (do not clean these out)

- The duplication test, when the subject is a package: if every app would
  have to copy this, it belongs in the package.
- "We" when choosing what the product should do.
- A direct question when the author would actually ask one.

**Typos are not a habit.** Misspellings, doubled punctuation, extra
spaces, and a sentence that starts lowercase because of a slip are
errors. Spell the word. Use normal punctuation. Start the sentence with
a capital.

## 5. Genres and registers

- **Chat, PR prose, issue prose:** this profile. Short. Common words.
  Specific (command, path, SHA) when the fact exists.
- **Review comment:** same, even shorter. One finding, then the test or
  the ask.
- **Skill, ADR, runbook, architecture:** [`repo-voice.md`](repo-voice.md).
  Constraints need the longer "why this exists" sentence. Do not flatten
  those into this register.

## 6. Explicit rules

Quoted from the maintainer, 2026-08-24:

- "keep it short"
- "use easy to understand and simple vocabulary"
- "find a balanced approach"
- "we don't want typos, I make them because of mistakes, that is not a
  pattern that should be copied"

Balance, as agreed in that session: this register for people-facing prose;
repo-voice for contracts and specs. Not the essay tone. Correct spelling
and punctuation. Never imitate a typing error.

---

Calibration date: 2026-08-24
Samples: PR #889 review (package vs app duplication), PR #833 review
(directory question), this chat, plus the explicit rules above. Thin on
word count. Explicit rules win where samples and rules disagree.
Updates: 2026-08-24 first save; 2026-08-24 typos are mistakes, never copy them
