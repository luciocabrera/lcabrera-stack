---
'@lcabrera/eslint-plugin': minor
'@lcabrera/vite-config': minor
---

Report a comment written above a declaration, or inside a function, component or
type declaration.

Three positions, not two. A note between a type's members is covered on the same
terms as prose in a function body, and "above a declaration" is the general form
— a plain `const` is covered too.

`local-rules/no-explanatory-comments` is the new rule, and both shared flat
configs (`eslint-custom-rules` and `eslint-base-custom-rules`) now turn it on for
`.ts`, `.tsx`, `.js`, `.mjs` and `.cjs` sources. A name, a signature and a type already say what the code
is; prose repeating them is a second copy of a fact kept where nothing checks it,
which is how a helper came to advertise a storage reader that had never existed
and two later designs came to offer that reader as a free fallback, and how a
command descriptor went on naming the derivation it had stopped using.

Four positions are exempt, each decidable from the source. The file-level
header — the file's first comment block, adjacent `//` lines counting as one —
describes the module rather than a declaration. A tool directive is not prose, and the list of
recognised prefixes is the `directives` option, and it earns its place in two
ordinary positions the rule reports: a disable comment directly above the
declaration it covers, and a coverage or type-checker directive inside a body. A note on a member of an exported type is exempt
while it is a single line within `memberNoteMaxLength` naming no ADR by
number, because that member is a published surface and a precondition, a default
or an encoding is not derivable from its type; a longer or record-citing note, a
comment above the type, and one inside a type the module does not export are all
still reported. An annotated JSDoc
block is exempt in a JavaScript file and only there, because a published `.mjs` package's `.d.mts` is derived from it
while a TypeScript declaration carries its own types; the recognised tags are the
`annotationTags` option. Setting either option replaces its default list.

The rule is deliberately not fixable. Deleting the comment is right for most
findings and wrong for the few carrying a trap nothing else records, and the rule
cannot tell those apart — an autofix would erase the difference exactly where it
matters, silently wherever `--fix` is chained.

Turning it on will report existing comments. Each finding is a decision about
where the explanation belongs — the record that owns it, the file-level header
when it is genuinely about the module, or nowhere when the code already says it.
