# Dependency advisories

`vp run deps:audit` fails when a known vulnerability sits in the dependency tree
with no live allowance. This page is what to do when it fires.

## Why a gate was needed at all

The repo gates a lot: command docs, ADR numbering and homes, script size,
coordination integrity, documented paths, published API surface, type
resolution, suppressions, and four linters. It gated nothing about its supply
chain.

That was found the hard way. A ReDoS advisory sat against a pinned `hono`
(#516 Finding 1) — a real production dependency edge — and **nothing declared
blocked the fix**: the package that pulled it in already allowed the patched
version. The cost of fixing it was a one-line override. It was found only
because somebody went looking.

That is the shape of the gap. Not "we knowingly carry risk", but "nobody was
looking, so an advisory whose fix costs nothing sat there anyway."

## The failure this gate is built around

**A clean audit and an audit that never ran look identical.**

`pnpm audit` needs the registry. Without it, the natural failure is an empty
report — the same shape as a healthy tree. A supply-chain check that reports
green because the network was down is worse than having none, because it is
believed.

So the gate refuses a report that did not walk the tree. A real audit always
counts the dependencies it scanned; a report claiming zero did not run, and the
gate fails rather than passing. That is also why the audit is piped in rather
than spawned from the script: a fixture can reproduce every branch, which a
live network call cannot.

## When it fires

```
Dependency advisory (or advisories) with no live allowance — fix the dependency,
or add a justified, dated entry to docs/agents/dependency-advisories.json:
  high     lodash <4.17.21 — Command Injection in lodash [production path] (GHSA-35jh-r3h4-6jhm)
      not allowed. Patched in: >=4.17.21
      https://github.com/advisories/GHSA-35jh-r3h4-6jhm
```

**Fix it first.** Check whether anything declared actually blocks the patched
version — often nothing does, and the fix is a range bump or a
`pnpm-workspace.yaml` override with a comment saying why. That is what happened
with `hono`.

**`[production path]` is the part to read.** It means the advisory reaches the
tree through a runtime dependency, not only a build-time one. `pnpm audit` marks
each finding `dev: false` for that case, and the gate surfaces it because it
changes what carrying the advisory means.

## When you cannot fix it

Add an entry to `dependency-advisories.json`:

```json
{
  "ghsa": "GHSA-xxxx-xxxx-xxxx",
  "expires": "2026-09-30",
  "reason": "Reached only through <dep>, which pins <range>; the patched version needs <blocker>. Not on a runtime path — the vulnerable API is never called (verified: <how>).",
  "ref": "#123"
}
```

Three properties, each there because of a way a list like this has failed:

- **Keyed by GHSA, never the numeric id.** The number `pnpm audit` prints is
  assigned by whichever registry answered and is not stable across them. An
  entry keyed by it stops matching quietly, and the advisory then rides along by
  accident rather than by decision.
- **`expires` is required, and there is no "forever".** Every advisory
  eventually gets a patch, so an allowance is a deferral, not a pardon. Past the
  date the gate fails again and someone re-argues it.
- **An entry matching no advisory also fails.** `minimumReleaseAgeExclude` in
  `pnpm-workspace.yaml` rotted precisely this way — 13 of 15 entries pinned to
  versions that no longer resolved, so the file recorded a posture the repo was
  not running (#516 Finding 3). A list that cannot clean itself does not stay
  true.

State the reason in terms someone can re-check: which declared range blocks the
bump, or what makes the vulnerable path unreachable and how you established it.
"Low risk" is not a reason (Non-Negotiable Rule 14).

## Severity floor

The gate blocks at `moderate` and above — the advisory that prompted it was a
moderate one. Below that, advisories are counted in the summary rather than
hidden, so "we do not gate on low" stays a visible choice.

Override for a one-off run with `--minimum`:

```bash
vp pm audit --json | repo-verify-deps-audit --minimum high
```

## Where it runs

- **Every PR and push**, in the Quality Gate job of `check-safe.yml`.
- **Daily on a schedule**, in `deps-audit.yml`, which opens or updates a tracking
  issue. The scheduled run is the one that matters most: an advisory published
  overnight against an unchanged tree is invisible to a per-PR check until
  somebody happens to open a PR.

It is deliberately **not** in the `pre-push` hook. That hook must work offline,
and a gate that fails on a plane teaches people to pass `--no-verify`, which
costs more than this gate is worth.
