---
'@lcabrera/api': minor
---

**Breaking: `getApiBaseUrl` now ranks `VITE_API_URL` above the SSR request URL.**

Through `0.2.0` the request URL came first and returned inside its own branch, so
`VITE_API_URL` was unreachable whenever a loader supplied one:

```ts
// before — the variable is never read on this path
getApiBaseUrl('https://app.example.com/orders'); // → 'https://app.example.com/api'

// after
getApiBaseUrl('https://app.example.com/orders'); // → the VITE_API_URL value
```

The argument is not that explicit configuration ought to beat inference on
principle. It is that only _half_ a render can supply a request URL: a loader has
one and the browser does not. Ranking it first therefore made a single page
resolve two different API hosts depending on which half asked — silently, because
the SSR half rendered fine against the request's own origin. An override that
applies to one half of a render is worse than one that does not apply at all.

`requestUrl` keeps the job it actually had. Under SSR there is no `location` to
read, so it remains the only way a deployed app can learn the origin it is being
served from — it is still priority 2, ahead of both fallbacks, and unchanged when
no override was built in.

**Who this breaks.** You, if you set `VITE_API_URL` for the browser half of an app
while relying on same-origin resolution for its loaders. That combination now
sends both halves to the variable's host. **Fix:** do not set `VITE_API_URL` for
that build. It is substituted by Vite at build time, so it is a build input rather
than a runtime switch, and no argument to this function overrules it — an app
needing both behaviours from one bundle has to choose between them itself and pass
an explicit base URL. If you only ever set the variable for a fully external API,
or never set it at all, nothing changes for you.

`minor` rather than `major` because this package is pre-`1.0`, where the minor
slot is the breaking one (SemVer §4) and a `major` would assert a `1.0.0` API
commitment this change is not entitled to make on its own. The change is breaking
regardless of the slot it lands in; `@lcabrera/ui@0.2.0`'s `retire-dead-table-seams`
release is the precedent for saying so in the changelog rather than in the number.

The order is pinned in both directions by tests, using an override host no other
branch of the function can produce — the probe that let this survive a review, a
verification and a round of fixes used `http://localhost:3001/api`, which is
byte-identical to what the function answers for a local request URL.
