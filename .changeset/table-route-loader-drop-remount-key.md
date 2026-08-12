---
'@lcabrera/ui': minor
---

Drop the unconsumed `key` field from `createTableRouteLoader`'s loader data.

The factory returned `key`, a concatenation of the `sorting` and `filters` URL
params, with a comment stating that React Router remounted the Suspense boundary
from it. Nothing read it — not `useTableRoutePage`, not `TableRouteView`, not any
route component — and React Router reads no loader field by that name. The
remount it described already happens for a different reason: a navigation re-runs
the loader, so `TableDataResolver`'s `use()` receives a promise it has not seen
and suspends again.

It was also defective on its own terms: the two params were concatenated with no
delimiter, so distinct sort/filter pairs could produce the same string.

**Breaking if you read it.** `TableRouteLoaderData` is inferred from the
factory's return, so the field is gone from the type for every table route at
once. A consumer destructuring `key` from `useLoaderData` no longer compiles.
Nothing in this repo did, and there is no replacement to migrate to — the value
was never wired to anything.
