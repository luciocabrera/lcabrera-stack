# ADR-072 — An explicitly configured API base URL outranks the one derived from the SSR request

**Status:** Accepted

- **Date:** 2026-08-14
- **Scope:** `@lcabrera/api` — `getApiBaseUrl`; `apps/react-router/src/services/`
- **Issue:** #705 (found on PR #701 / #687)
- **Relates to:** [ADR-038](./ADR-038-public-package-topology-by-runtime.md)
  (`@lcabrera/api` is the browser-safe package),
  and the showcase's self-hosting decision, which rejected this change as the
  wrong home and is amended by it (that ADR has since been deleted — its live
  content is
  [`apps/showcase/docs/data-sources.md`](../../apps/showcase/docs/data-sources.md))

## Context

`getApiBaseUrl` answers one question — where is the API — across four situations
an SSR app moves between: the browser, a loader on the server, a dev proxy, and a
LAN address. It has always had a priority list. Through `@lcabrera/api@0.2.0`
that list put the SSR `requestUrl` first and **returned inside that branch**, so
`VITE_API_URL` was unreachable for any caller that supplied one.

Nothing about that was visible from a running app. A loader handed the request
URL and got the request's own origin; the browser, which has no request URL, got
the variable. Both halves rendered. The page worked. It simply talked to two
different hosts.

Two things kept it hidden for a long time.

The first is the probe. `vp run dev:external-api` sets
`VITE_API_URL=http://localhost:3001/api`, which is byte-identical to
`CONFIG.localhost.apiHost` — the value the request-URL branch returns for a local
hostname. Requests reached the API server, so the override "worked"; the
observation could not distinguish the override from the fallback, because both
produced the same string. That probe survived a review, a verification and a
round of fixes.

The second is that the failure is asymmetric by construction. Only a loader can
supply a `requestUrl`. So the defect could never affect both halves of a render
at once, and the half that was wrong was the half nobody was watching.

## Decision

**`VITE_API_URL` is priority 1. The SSR `requestUrl` is priority 2.**

| Priority | Source                         | Answer                                        |
| -------- | ------------------------------ | --------------------------------------------- |
| 1        | `VITE_API_URL`                 | the value, verbatim                           |
| 2        | `requestUrl` (loader/action)   | localhost API host, or `<request origin>/api` |
| 3        | neither, and no `window` (SSR) | localhost API host                            |
| 4        | neither, in the browser        | dev proxy, `<host>:3001/api`, or same origin  |

The argument is **not** that explicit configuration ought to beat inference on
principle, though it does. It is narrower and it is what makes this a defect
rather than a preference: because only half a render can supply a `requestUrl`,
ranking it first does not choose one host over another — it chooses _different
hosts for the two halves of one page_. An override that applies to one half of a
render is worse than one that does not apply at all, because it looks like it
applied.

`requestUrl` keeps the job it actually had. Under SSR there is no `location` to
read, so it is the only way a deployed app can learn the origin it is being
served from. It remains ahead of both fallbacks and is unchanged whenever no
override was built in.

**There is no per-call escape hatch, and that is deliberate.**
`import.meta.env.VITE_API_URL` is substituted by Vite at build time, so the
variable is a build input, not a runtime switch: present at build it wins for
every caller in that bundle, absent at build it cannot be supplied later. An
argument that could overrule it would be an argument that reintroduces exactly
the split this ADR removes — one caller opting out, silently, for half a render.
An app that genuinely needs both behaviours from one bundle decides between them
itself and passes an explicit base URL.

**The app-side inversion comes out.** `apps/react-router` carried
`resolveExternalApiBaseUrl` (`readExternalApiUrl() ?? getApiBaseUrl(requestUrl)`)
and its `readExternalApiUrl` helper precisely to invert the package order for
itself. Both are deleted and the two external fetchers pass `getApiBaseUrl` as
their `resolveBaseUrl`. `isExternalApiEnabled` stays: **whether** the external
path is taken is a different question from **where** it goes, and the package has
no query for the first — `getApiBaseUrl` always returns a string.

## Consequences

- **This is a breaking change to a published package**, shipped as a `minor` on a
  pre-`1.0` version (the breaking slot under SemVer §4; a `major` would assert a
  `1.0.0` commitment this change is not entitled to make on its own). It breaks
  one combination: setting `VITE_API_URL` for the browser half while relying on
  same-origin resolution in loaders. The changeset names that combination and its
  fix rather than leaving the number to carry the warning.
- **One agreement now spans the package boundary.** `isExternalApiEnabled` treats
  an empty `VITE_API_URL` as unset; `getApiBaseUrl` checks truthiness, which does
  the same. They must keep agreeing, or a bare `export VITE_API_URL=` selects the
  external branch and then resolves it against a host that is not external.
- **The order is pinned in both directions by tests**, using an override host no
  other branch of the function can produce. A test whose expected value is also
  what the losing branch returns is not a test of precedence, and this defect is
  the proof.
- **`vp run dev:external-api` is still not a check.** Its value remains
  byte-identical to the fallback, so it exercises the branch without
  discriminating it. It is kept for convenience and `docs/data-sources.md` says
  plainly what it cannot show.
- **The showcase's self-hosting decision is amended, not superseded.** What it
  decided — the showcase self-hosts, `VITE_API_URL` is an opt-in build-time
  override — is untouched; only its rejected alternative and the two utils it
  named have moved. That ADR was later deleted as app-only, and what still
  governs lives in
  [`apps/showcase/docs/data-sources.md`](../../apps/showcase/docs/data-sources.md),
  which carries the build-time trap in more detail than the ADR did.

## Alternatives considered

**Leave the order and document it.** A legitimate outcome, and the one #705 was
written to allow: state in the docblock that the request URL wins and name what a
consumer must do to force an override under SSR. Rejected because the only honest
answer to "what must a consumer do" was "write `resolveExternalApiBaseUrl`
yourself" — the four lines this app already carried. A published package whose
documented workaround is "reimplement the priority list on top of me" has the
priority list wrong. #672 and #686 both create repositories that consume
`@lcabrera/api` from the registry, so the alternative was to hand that workaround
to every one of them.

**Add a parameter, e.g. `getApiBaseUrl(requestUrl, { preferRequestUrl: true })`.**
Rejected: it preserves the split rather than resolving it. The browser half of a
render cannot pass the flag any more than it can pass a `requestUrl`, so the two
halves would disagree again whenever a loader set it — the same failure with a
longer signature. The build-time nature of the variable makes a runtime knob
misleading on its own terms.

**Keep the inversion in the app only.** What PR #701 did, correctly for its scope.
Rejected here because the workaround's own docblock said why it was temporary: the
package is wrong for every consumer, and the app is not the place to fix it. That
reasoning does not improve with age, and the blast radius only grows.

## References

- Issue #705 — the decision; PR #701 / issue #687 — where it was found, and the
  app-side workaround now removed
- The paired stub-server probe that establishes the behaviour in a real build
  (which host each build reaches, with a live server at both addresses) is in the
  PR for #705
- [`apps/showcase/docs/data-sources.md`](../../apps/showcase/docs/data-sources.md)
  — the live doc for what this decision amends
