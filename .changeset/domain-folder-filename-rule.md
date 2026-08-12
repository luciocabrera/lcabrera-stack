---
'@lcabrera/eslint-plugin': minor
---

New rule `domain-folder-filename` — enforces **where** a shared `*.types.ts` /
`*.constants.ts` may live and what it must be called, so a codebase's folder
convention is asserted rather than remembered.

Three folder shapes exist and only one takes the rule: a **domain** folder,
whose name _is_ the subject, names the file after the folder
(`filters/filters.types.ts`); an **artifact** folder, holding one component,
context or route module, names it after the artifact
(`TableConfig/TableConfigContext.types.ts`); a **catch-all** folder names a
_kind_, not a subject, so the file is named after its own subject
(`types/theme.types.ts`). "Exactly one `*.constants.ts` per domain folder" then
follows from the naming rather than being counted, because two files in one
folder cannot both be `<folder>.constants.ts`.

Telling the shapes apart from the path is the whole difficulty, and the obvious
discriminator is not enough: PascalCase separates a component folder from a
domain folder but not a route one — `trigger-scan/` and `group-query-builder/`
are both kebab-case, and only the first may name a file after its contents. So
the rule treats a PascalCase folder as an artifact folder and exempts an
`artifactFolders` subtree (default `routes`) outright. It deliberately does not
stat the filesystem for a marker file: that is neither hermetic nor cheap in a
lint rule, and on the codebase this was measured against, path-only
classification matched the directory-reading version exactly.

Three options, each replacing its default wholesale rather than extending it:
`artifactFolders`, `catchAllFolders`, and `pairedSuffixes` (default
`['constants', 'types']`).

This ships as a **separate rule** rather than an option on
`filename-convention`, so upgrading does not change what an existing consumer's
build reports: a new rule is opt-in, a widened one is not.
