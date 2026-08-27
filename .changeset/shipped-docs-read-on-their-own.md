---
'@lcabrera/repo-standards': minor
'@lcabrera/eslint-plugin': patch
'@lcabrera/node': patch
'@lcabrera/api': patch
'@lcabrera/server': patch
'@lcabrera/utils': patch
'@lcabrera/ui': patch
---

Stop shipping documents a consumer cannot read, and gate the recurrence.

`@lcabrera/ui`, `@lcabrera/server` and `@lcabrera/utils` shipped the whole
markdown set beside their source — every `ARCHITECTURE.md`, the artifact
inventory, the pattern guide. Those are written for a reader who has the
repository cloned: in an install they are pages of relative links to a decisions
directory that is not in the tarball, plus decision citations by bare number.
`files` now carries `"!src/**/*.md"`, so the source arrives without them and the
README states what a consumer needs, linking the rest by absolute URL.

`@lcabrera/repo-standards` adds `repo-verify-shipped-docs`, which packs each
package named in `publishing.publicPackageDirs` and reads the markdown back out
of the tarball — `files` decides its corpus, not the working tree, which is the
only way to see a negated pattern at all. It reports a relative link that leaves
the package, a link to a file the package does not ship, a path anchored at one
of the author repository's own directories (`gates.shippedDocs.repoOnlyDirs`,
defaulting to the conventional monorepo layout), and a decision cited with no
absolute URL on the line. An empty package roster and a corpus of no documents
are refused rather than passed.

The remaining published READMEs stop naming the repository's own tree in
passing: the source directory each package lives in is now a link a reader can
open.
