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

Records written before the block are grandfathered in a baseline the gate reads
rather than edited into shape. The gate guarantees one thing about it: the list
may hold at most `maxEntries` entries, and every exemption beyond that count
fails. A count rather than a number window, because a sequence has gaps and a
record taking a retired number falls inside any window. `--write` only prunes,
lowers the bound to what it kept, and refuses to rewrite a baseline that has
already grown.

It is not proof against an editor, and a swap that holds the count constant
trades one exemption for another without the bound moving. What makes the exempt
set reviewable is that it changes only by editing that one file — so read its
diff, not the count. The path is `registers.adrContentBaseline`.

`@lcabrera/devkit` ships the template carrying the block with generic
placeholders, so a scaffolded record fails the gate until its author says what
the decision governs.
