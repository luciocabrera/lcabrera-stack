# `@repo/scan-report` — architecture

The scanners behind the `app-graph`, `linter-checker`, `code-smell-checker`,
`code-smell-zen` and `fallow-code-checker` skills. They used to live under
`.github/skills/*/scripts/`, where they could only ever be copied into another
repository; [ADR-069](../../docs/decisions/ADR-069-publish-the-shared-toolchain.md)
made them a package instead, and the skills kept their `SKILL.md` — prompt text
is per-repository, code is not.

**Private on purpose, and the reason has changed.** ADR-069 first had this
package publishing as `@lcabrera/scan-report`; its
[amendment](../../docs/decisions/ADR-069-publish-the-shared-toolchain.md#amendment-2026-08-14--scan-report-does-not-publish)
withdrew that on the grounds that every consumer was CQMS, so the package would
leave with the extraction. CQMS left in #683 and this package stayed — the
consumers listed at the top of this file are all in this repository, and
`app-graph` imports `deterministic-scan` as a module rather than shelling out.

What still holds is the packaging answer, for a different reason: the versioned
contract below is a **report shape**, and a report shape is per-repository the
same way prompt text is. The decoupling that got it here — a configured
ingestion command, no workspace-named default scope, an install-derived host
root — was never contingent on the extraction either: a runner that hardcodes a
path into another product's workspace breaks when that product moves, registry
or no registry.

## Layout

| File                            | Role                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `deterministic-scan-shared.mjs` | scanner-agnostic run context, artifact writing, finding ids, the ingest step |
| `lint-report-shared.mjs`        | lint-specific report building/rendering; re-exports the above                |
| `finding-templates.mjs`         | per-rule why/fix wording, shared with any consumer that re-derives findings  |
| `generate-oxlint-report.mjs`    | oxlint scanner (`scan-report-oxlint`)                                        |
| `generate-eslint-report.mjs`    | eslint scanner (`scan-report-eslint`)                                        |
| `generate-fallow-report.mjs`    | fallow scanner (`scan-report-fallow`)                                        |
| `ingest-report.mjs`             | `scan-report-ingest` — persists a run an agent produced by hand              |
| `run-ingestion.mjs`             | the one place that decides how each ingestion outcome is reported            |
| `ingest-configuration.mjs`      | resolves the configured ingestion command; knows no product                  |
| `resolve-host-root.mjs`         | where "here" is                                                              |
| `run-fallow.sh`                 | the interactive fallow skill's two-pass capture helper                       |

## Three decisions worth knowing before editing

**There is no build step, and none is missing.** These are `.mjs` — plain ESM
that node runs unmodified, unlike the `.ts` a consumer cannot load out of
`node_modules` (`packages/CLAUDE.md`). So there is no `dist` and no
`exports`/`publishConfig.exports` swap to keep in step. It is in no publishing
gate either: `publish:verify` scopes itself to packages that build AND declare
`publishConfig.access`, and `api-surface:verify`/`attw:verify` read an explicit
list this package is not on. All three by construction, not by exemption.

**Its contract is the report shape, not a TypeScript surface.** What a consumer
depends on is the CLI flag set and `SCHEMA_V1.md`/`REPORT_JSON_CONTRACT.md` —
change either document and you have changed the contract, with or without a type
diff. That is what settled the packaging question: a report schema is agreed
between a scanner and whatever ingests it in the same repository, so versioning
it on a registry would pin the wrong half.

**The host root is derived from the install location, never from `cwd`.** An
orchestrator spawns these runners from wherever it happens to be, so a
`cwd`-derived root would silently point at the scanned project — putting scratch
files inside someone else's working tree and resolving the fallow binary from a
repository that never installed it. `resolveHostRoot` walks left of the first
`node_modules` segment for an installed copy (pnpm nests a second one under
`.pnpm`, so the first is the one that lands on the consumer) and falls back to
the nearest `.git` ancestor when the code is being run from a checkout.

## The ingestion seam

`ingest-configuration.mjs` resolves a command; `run-ingestion.mjs` runs it and
reports one of three outcomes. Nothing in the package knows what the command
does, which is the whole point — the scanners are useful without one.

The outcomes are deliberately not interchangeable:

| Outcome    | Exit | Because                                                            |
| ---------- | ---- | ------------------------------------------------------------------ |
| `skipped`  | 0    | no command configured (or `--skip-ingest`) — a normal state        |
| `ingested` | 0    | the command completed                                              |
| `failed`   | 1    | a command that IS configured did not complete — not a normal state |

Collapsing `failed` back into a warning is what let a permanent breakage read as
a transient blip, and is the specific regression this split exists to prevent.

## Asking git where it is

`run-git.mjs` is the only place that spawns git, and it does three things a
bare `execFileSync('git', …)` would not.

It **scrubs the seven repository-selecting `GIT_*` variables** before spawning.
Probed on git 2.53 with two throwaway repositories: standing in repo A,
`GIT_WORK_TREE=<B>` makes `rev-parse --show-toplevel` answer `B`, an unrelated
project, and `GIT_DIR=<B>/.git` alone answers with the current directory rather
than A's real top level. Both are wrong in different ways, which is the argument
for scrubbing all seven rather than the one that looks dangerous — the answer
becomes every finding's `location_path`, and these runners are spawned by a
parent process whose environment they inherit wholesale.

It **names the binary by absolute path** from a fixed directory list, so no
writable directory earlier in an inherited PATH can shadow git (Sonar S4036).
Tooling cannot assume the `/usr/bin` of the machine it was written
on, so there are two lists — Homebrew on both architectures, Nix system and
per-user profiles, MacPorts and Xcode's command line tools on POSIX; Git for
Windows on `win32` — and which one applies is chosen by platform.

That split is not tidiness. The same list is what the child's PATH is pinned
to, and a Windows path joined into a POSIX PATH with `:` splits at its drive
colon into `C` and `\Program Files\Git\cmd`. A bare `C` is a **relative**
PATH entry, and these runners work with `cwd` inside the project being scanned
— so a scanned repository containing a `C/` directory would get a say in what
git executes for a hook, pager or credential helper, which is precisely the
hazard the pinning removes. The filename follows the platform too: `git.exe` on
Windows, since `execFileSync` needs the real name rather than a PATH-style stem.

`SCAN_REPORT_GIT_BINARY` overrides the search, and is required to be absolute
(by that platform's rules) and to exist, because accepting a bare name would
reintroduce the lookup.

It **says so when git is missing**. "Not a repository" and "no git installed"
are both an absent answer, and only the first is a fact about the scanned
directory; conflating them makes every path in the report subtly wrong with
nothing to indicate it.

## An absent tool is not a failure

Each scanner answers "nothing to report, and here is why" rather than throwing
when the tool it drives is not there: oxlint checks for a config first, eslint
checks for a flat config, and fallow's bin resolution returns `undefined` rather
than propagating `MODULE_NOT_FOUND`. That last one was a latent crash while
these were private scripts in a repo that always has fallow installed; as a
`bin` run from a repository that has no fallow, the first such run would have
hit it.

The line is drawn at _installed but broken_. A fallow that exists and exits
non-zero against the host's own repository still hard-exits, because that is the
host's tooling failing and it should hear about it immediately; the same failure
against a `--target` project only degrades, since an arbitrary project can break
a tool in ways the host never does.

`fallow` is deliberately not a dependency of this package at all: the runner
resolves it from the repository being scanned rather than from its own
`node_modules`, so declaring it would describe the wrong graph and force it on
anyone using only the lint scanners. The requirement is carried by the README
and by the runtime message instead. `ts-morph` is absent for a different reason —
only `app-graph`'s generator uses it, and ADR-069 keeps that script out of this
package.

## Adding a scanner

Add `generate-<tool>-report.mjs` beside the others, import the shared context
from `deterministic-scan-shared.mjs`, and add a `bin` entry plus an `exports`
subpath. Nothing else needs to change: the flag contract, the artifact writer
and the ingest step are all inherited.
