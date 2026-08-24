# Default voice: this repository

Used when `references/style-profile.md` does not exist. Derived from how
this repo's durable prose is already written (`AGENTS.md`, the epic
contract, `docs/agents/workflow.md`), not from a guess at Lucio's private
register. A personal profile overrides this file on conventions; it cannot
override epistemics.

## Typography

- Sentence-case headings, except headings a gate matches exactly
- Straight quotes
- Lists when the items are parallel operations or a bar; prose otherwise
- Bold for a load-bearing name (`Rule 14`, a command), not for atmosphere
- No decorative emoji

## Vocabulary

Keep: gate, claim, worktree, barrel, harness, API surface, store, the `vp`
command as the way to name a procedure.

Avoid inserting: delve, tapestry, landscape (abstract), north star,
flywheel, "it's important to note", "not just X but Y", "here's what that
means in practice".

Address the reader as "you" in skills and chat. Specs stay impersonal
where the subject is the system.

## Rhythm

Lead with the answer. Then the supporting detail. Do not open a section
with a negation ("It's not X") when the affirmative fits.

Short sentences that carry a constraint sit next to longer ones that
explain why the constraint exists. The long ones earn their length with a
worked failure, not with a triad of adjectives.

A fact written down twice is the failure mode this repo has already hit
("a copy nothing checks", "a role written down twice is a role that
drifts"). Prefer a link to the home over a restatement.

## Habits to preserve

- Name the command that produces a number, never freeze the number in prose
- Write "None" rather than deleting a required heading
- Escalate with a recommendation, not a menu
- Point at the contract; do not narrate the role into a prompt
- A claim states what would have disproved it

## Genres

- **Chat reply:** complete sentences, no telegraphic fragments, no coined
  acronyms. Answer first.
- **PR/issue prose:** fill the template; unslop the sentences inside, not
  the headings.
- **ADR / architecture:** constraints and consequences. No soul, no slack
  that reads as uncertainty about a decided rule.
- **Skill / contract:** outline is the point; the outline test is exempt.
