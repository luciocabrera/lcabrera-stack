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

Four exemptions, each decidable from the source. The file-level
header — the file's first comment block, adjacent `//` lines counting as one —
describes the module rather than a declaration. A tool directive is not prose, and the list of
recognised prefixes is the `directives` option, and it earns its place in two
ordinary positions the rule reports: a disable comment directly above the
declaration it covers, and a coverage or type-checker directive inside a body.
ESLint's own non-disabling inline forms are in that default list too — `global`,
`globals`, `exported` and the bare `eslint rule: "off"` config comment — because
deleting one of those makes `no-undef` fire on the name it declared. A note on a member of an exported type is exempt
while it is a single line within `memberNoteMaxLength` naming no ADR by
number, because that member is a published surface and a precondition, a default
or an encoding is not derivable from its type; a longer or record-citing note,
and a comment above the type, are still reported. Exported there means reachable
from an export within the module rather than the `export` keyword on the
declaration, because TypeScript resolves a member's doc comment from the type
that declares it however that type is reached — an unexported alias intersected
into an exported one, or a type exported through a separate `export { … }` list,
carries notes an installer still sees. An annotated JSDoc
block is exempt in a JavaScript file and only there, because a published `.mjs` package's `.d.mts` is derived from it
while a TypeScript declaration carries its own types; the recognised tags are the
`annotationTags` option. The tags TypeScript itself reads are the exception to
"only there": a block carrying `@deprecated` or `@internal` stays in every
language, since dropping it changes the emitted declarations and what
`no-deprecated` and `stripInternal` do; that list is the `retainedTags` option.
Setting a list option replaces its default.

The rule is deliberately not fixable. Deleting the comment is right for most
findings and wrong for the few carrying a trap nothing else records, and the rule
cannot tell those apart — an autofix would erase the difference exactly where it
matters, silently wherever `--fix` is chained.

Turning it on will report existing comments. Each finding is a decision about
where the explanation belongs — the record that owns it, the file-level header
when it is genuinely about the module, or nowhere when the code already says it.
