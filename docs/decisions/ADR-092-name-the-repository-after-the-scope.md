# ADR-092 — Name the repository after the npm scope, not after a tool

**Status:** Accepted · **Date:** 2026-08-26 · **Issue:** #955

## Context

The repository was `vite-react-compiler`, and the identity it presented was
three strings that disagreed with each other: the GitHub repository was
`vite-react-compiler`, the root manifest was `vite-monorepo`, and the showcase
app's manifest was `vite-react-compiler` as well — so `vp run --filter
vite-react-compiler seed` read like a repository-level command while it was a
workspace script.

Both halves of the name point at something replaceable. `vite` is a bundler this
repository could stop using without changing what it ships. `react-compiler` is a
flag that is on by default in React 19 tooling and was the subject of exactly one
app-home ADR out of roughly seventy-five. Neither names a product:
[ADR-081](./ADR-081-ship-the-repo-setup-as-two-packages.md) and the README's
"What this repo ships" describe two — an application stack installed by another
application, and a repo toolchain installed by another repository.

This repository already knows what a name pointing at a dependency costs.
`vp run departed:verify` fails the build on a departed product's name, and it
exists because names outlived their subjects here before
([ADR-069](./ADR-069-publish-the-shared-toolchain.md) is that history).

A repository rename is not free, and the cost is asymmetric. Nothing about
installing a package depends on it — resolution is by package name — but the
`homepage`, `bugs` and `repository.url` fields in ten published manifests point
at the old location, and **npm metadata for an already-published version can
never be corrected**. Every version published before this change keeps the old
URL permanently. GitHub's redirect covers those links only while the old name
stays unregistered.

## Decision

The repository is **`lcabrera-stack`**, and the root manifest takes the same
name.

The name anchors to `@lcabrera/*`, the npm scope, which is the one part of this
repository's identity that is already permanent — it is on every published
package, it is what a consumer types, and it cannot be made stale by a change of
framework, bundler or product. That is the whole argument: a name that describes
the tooling can rot, and this one cannot.

The showcase app's manifest keeps the distinct name `showcase` it took in #951.
The three strings now agree in the sense that mattered — the repository and its
root manifest are the same, and no workspace shadows the repository's name.

Three consequences are decided with it:

1. **The old name is never re-registered.** GitHub's redirect from
   `luciocabrera/vite-react-compiler` is what keeps every already-published
   package's metadata reachable, and creating a repository under the old name
   silently breaks it.
2. **The Sonar project key is not a repository name and is not touched.** It is
   `luciocabrera_vite-react-compiler` (an underscore, not a slash), stable across
   a GitHub rename, and re-keying it would discard the project's history for a
   cosmetic gain.
3. **No changelog is swept, and there are two kinds.** The root `CHANGELOG.md`
   is regenerated wholesale from git history by `vp run changelog:generate`, so
   a hand edit there does not survive. Each `packages/*/CHANGELOG.md` is written
   by Changesets, which only ever prepends — a hand edit there _would_ survive,
   and it ships inside the tarball. Both are left alone for the same reason:
   every entry is a dated record of what a released version said, and its links
   resolved when they were written and still resolve through the redirect.
   Repointing a shipped historical entry is a decision about all ten packages,
   not something a rename sweep should reach by accident.

## Consequences

The ten published manifests point at the new location, and this is the first
release whose links are right without relying on a redirect.

`@lcabrera/eslint-plugin` changes what it prints into a consumer's terminal. The
rename surfaced that none of its ten rules had a `meta.docs.url` that resolved —
eight emitted `https://example.com/rule/<name>`, the placeholder the first rule
was scaffolded from, and two pointed at a `/rules/<name>` path this repository
never had. All ten now build that link from one shared factory, and a test
asserts each anchor matches a heading the package README really carries.

Three ADRs and `.env.example` keep the old string, deliberately: they are dated
records or they name the Sonar key. `renames:verify` cannot help here — its first
filter treats a basename that still belongs to a tracked file as current, and no
file's basename changed.

## Alternatives considered

- **`keel`** — the structural spine a vessel is built on, which is what both
  products are to their consumers. Short, memorable, names no technology.
  Rejected because it is opaque without the README's first line doing the work,
  and a repository name is read far more often than the README.
- **`bedrock`** — the same idea, legible immediately. Rejected because it is
  heavily taken, AWS Bedrock included, so it loses every search that would
  otherwise find this repository.
- **`workbench`** — fits the repo toolchain product well, and undersells
  `@lcabrera/ui`, which is the larger half. A name that describes one of two
  products is a name that will be wrong half the time.
- **Keep `vite-react-compiler` and fix only the manifests.** Rejected: the
  manifests would then agree on a name that describes neither product, and the
  cost of renaming only grows with each published version.
