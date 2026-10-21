---
'@lcabrera/ui': patch
---

`resolveFromCacheOrFetch` and the `createPaginatedFetchActionMocks` test helper check a cached prefetch promise against `undefined` instead of testing its truthiness. Behaviour is unchanged.
