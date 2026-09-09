---
'@lcabrera/devkit': patch
---

The workspace the monorepo profile places now catalogs `@lcabrera/vite-config`
and `@lcabrera/tsconfig` as `>=<current> <1.0.0` rather than a caret. Below
1.0.0 a caret range ends at the next minor, so a repository created after either
package released one resolved the version before it — an install that succeeded
and quietly left the release behind. A repository created now resolves what is
current on the day it is created, and keeps doing so as those packages release.
