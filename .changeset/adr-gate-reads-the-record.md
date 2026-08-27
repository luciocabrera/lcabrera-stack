---
'@lcabrera/repo-standards': minor
'@lcabrera/devkit': minor
---

Make the ADR gate read the record rather than only its name.

Every ADR now opens with a `---` block declaring `governs` — workspace directory
names, or the single value `repository` when the decision constrains no one
workspace — and `repo-verify-adrs` fails a record that omits it, names a
workspace the roster does not answer to, or is missing `## Context`,
`## Decision`, `## Consequences` or one of the two alternatives sections. A
heading whose only content is a template prompt counts as missing. The gate does
not judge what a section says, and its success line says so.

`repo-verify-adrs --list --package <workspace>` prints the decisions governing
one workspace, separated from the repository-wide ones it inherits.

**Upgrading an existing decision home takes two commands, and the gate is red
until you run them.** Every record already in the home predates the block, so on
first run each one fails on `no metadata block` and on whichever sections it
lacks. `repo-verify-adrs --adopt` writes the baseline once from exactly those
failures, grandfathering them; `repo-verify-adrs --write` then regenerates the
index. After that the gate is green, and only NEW records are held to the rules.
`--adopt` refuses to overwrite a baseline that is already there, so running it
blind either writes the first one or fails — it will not quietly replace yours.
That is not a claim that nothing can grandfather afresh: deleting the file and
adopting again is an ordinary thing to be able to do. What holds either way is
the bound above.

Records written before the block are grandfathered in that baseline rather than
edited into shape. The gate guarantees one thing about it: the list
may hold at most `maxEntries` entries, and every exemption beyond that count
fails. A count rather than a number window, because a sequence has gaps and a
record taking a retired number falls inside any window. `--write` only prunes,
lowers the bound to what it kept, and refuses to rewrite a baseline that has
already grown; it regenerates the indexes and then still fails on any record
finding it cannot fix, so the command the gate names never reports a tree clean
that a plain run rejects.

It is not proof against an editor, and it exempts filenames rather than records:
the list pins how many records escape the content rules, not which. A slot freed
by classifying one record can be spent on another, and a record can be rewritten
under a name already on the list without the list moving. Review the records'
diffs alongside the register's. The path is `registers.adrContentBaseline`.

`@lcabrera/devkit` ships the template carrying the block with generic
placeholders, so a scaffolded record fails the gate until its author says what
the decision governs.
