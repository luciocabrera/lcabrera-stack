---
'@lcabrera/devkit': minor
---

The workspace rung now emits a running application, not an empty directory
where one should be.

`create --profile monorepo` places a React Router application in framework mode
— root, a page route, an action route, error boundaries, entry files and route
config — whose page renders a table from rows the module holds. There is nothing
behind that page to ask for a second one, so the set is sized to the one page
the loader reads and the row count the table reports is the row count it can
show. It has no server, no database and no fetch, so the rung it belongs to is
falsifiable on its own: the tree it produces builds, serves a page, and passes
its own typecheck, test, lint and format tasks.

The action route answers the fixed path the component library submits a grid's
persisted state to — a sort, a column width, a pin, a global preference, the
theme — and the page route exports the library's revalidation predicate beside
its loader. Without that route the application still builds and serves, and the
first sort then submits to a path the router cannot match: the not-found lands
on the page and its error boundary takes the place of the table.

Every stack package the application names is declared as a semver range resolved
from the registry, and the packed tarball gate now fails any produced file
carrying a `workspace:` specifier — one of those resolves a directory of the
workspace it was written in, so it installs where it was authored and nowhere
else. The ranges are written as a floor bounded at the next major rather than as
a caret, because below 1.0.0 a caret admits no minor above the one it names: a
release would fall outside the range on the day it shipped, with every gate
still green.

Three settings in the emitted Vite config follow from the component library
publishing TypeScript source rather than a build, and none of them is optional.
StyleX is given an alias resolved from the installed package so it can see the
library's own files, the client bundler is told not to pre-bundle them past that
plugin, and the server build is told not to externalise them — Node refuses to
strip types under `node_modules`, so that last one fails when the server starts
rather than when it builds.
