---
name: releasing
description: Release the four public @lcabrera/* packages with Changesets, regenerate CHANGELOG.md, and maintain the PR label taxonomy. Use when cutting a release, adding a changeset, tagging a repo-level `v*` milestone, editing release.yml/changelog.yml/sync-labels.yml/labeler.yml, or when a publish or changelog automation misbehaves.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash(vp:*), Bash(gh:*)
---

# Releasing, changelog, and labels

Everything here is downstream of the enforced commit convention
(`scripts/lib/commit-convention.mjs`) — the changelog groups by Conventional
Commit type and the labeler reads the PR title with the same parser, so they
never diverge from what the gate accepts. **Do not restate the type list**; link
to the spec.

## Releasing

The four `@lcabrera/*` packages are versioned with **Changesets**, independently
— each moves only when it changes, and a dependent gets a patch bump
automatically (`updateInternalDependencies: "patch"`). A change that affects
consumers carries a changeset in the same PR; `vp run release:version` consumes
them.

Four things here are deliberate, and each cost something to learn:

- **The version PR is opened by a human, not a bot.** Changesets' usual flow has
  its action open the "Version Packages" PR, and that PR **can never merge
  here**: a pull request opened with `GITHUB_TOKEN` does not trigger
  `pull_request` workflows, so its required checks never run. Same wall
  `update-changelog.yml` hit while reporting success. A GitHub App token would
  fix it and is not worth the moving parts for what is one command.
- **The first publish of each package is manual.** npm's trusted publishing binds
  a workflow to an **existing** package, so a brand-new scoped package has
  nothing to attach the trust to — scoped first publishes fail with E404 under
  OIDC (npm/cli#8976). Publish once by hand, configure the trusted publisher on
  npmjs.com, and every release after that is automatic. `release.yml` carries no
  `NPM_TOKEN` and passes no `--provenance`: under trusted publishing npm attaches
  provenance itself and the flag is unnecessary.
- **`private: true` is what keeps a workspace out of the registry.**
  `changeset publish` skips private packages. The four public ones no longer
  carry it, so nothing but the version number decides whether a merge publishes.
  Every workspace not meant to publish MUST carry the flag: `api-server` and
  `api-server-fast` had none at all and were one `npm publish` from going out.
- **The job asks the registry, per package, what to publish.**
  `vp run release:plan` is that gate and runs locally: for each non-private
  workspace it compares the manifest version against npm and reports
  `will publish` / `already on npm` / `first publish`. A package with its own
  pending changeset needs no special case — it has not been versioned, so its
  version is the one already published.

  It replaced a repo-wide "is any changeset pending?" count, which suppressed
  publishing for **every** package whenever any one of them had an unconsumed
  changeset. In a repo several agents merge into, that count is essentially
  never zero, so the job reported success through every push while publishing
  nothing, and independent per-package releases were impossible (#620).

  That count existed to keep `changesets/action` away from its version path,
  which has no publish-only mode and dies on the commit-msg hook, since
  `Version Packages` is not a Conventional Commit. `release.yml` now calls
  `pnpm exec changeset publish` directly, so there is no version path to avoid —
  and `pnpm exec` rather than `npx`, which would install on demand and run the
  fetched package's lifecycle scripts in the one job holding a publish token.
  The action's one irreplaceable contribution — the GitHub Release body — is
  rebuilt from the same `CHANGELOG.md` by `scripts/release-notes.mjs`.

  One thing the CLI does **not** do is take a package filter: it publishes every
  non-private workspace whose version is missing, and `config.ignore` does not
  apply. So a package that has never been published would fail the whole run
  after the ones before it had already reached npm. `release:plan` refuses to
  open the gate in that case, naming the manual publish that unblocks it.

**Package releases and the repository release are separate tracks.** Changesets
tags `@lcabrera/utils@0.1.0` and `release.yml` opens a GitHub Release per
package. `changelog.yml` handles `v*` tags — the repo-level milestone — and
nothing creates those automatically, so it fires only when someone tags by hand.
That is also the only thing that gives CHANGELOG.md more than one section.

Publishing invariants for the four packages (the `exports`/`publishConfig` split,
`files`, peer dependencies, the StyleX rename trap) are in
[`packages/CLAUDE.md`](../../../packages/CLAUDE.md).

## Changelog

[`CHANGELOG.md`](../../../CHANGELOG.md) is **generated** (`vp run
changelog:generate`, `scripts/generate-changelog.mjs`): Conventional-Commit
history grouped by version (git tags) then by type, each entry scope-labelled and
linked, with breaking changes called out. **Never hand-edit it** — regenerate and
commit it through an ordinary PR (the bot's own changelog commits are excluded
from the changelog via the `':!CHANGELOG.md'` pathspec).

It is a **release artifact**: with no tags every entry falls into one
`Unreleased` section, and the file only becomes useful once `v*` tags split it
per release. On a `v*` tag,
[`changelog.yml`](../../../.github/workflows/changelog.yml) publishes that
release's section as the GitHub Release notes — reading `git log` directly, never
`CHANGELOG.md`, so release notes are unaffected by the file's freshness.

**A bot pushing this file to `main` after each merge was tried and removed.**
`update-changelog.yml` did exactly that and never once succeeded: the push is
rejected by the `main` ruleset's `required_status_checks` rule (`GH013 … N of N
required status checks are expected`), and the failure was converted to a
`::warning::`, so the job reported success across many commits while the file
stood still. Making it work needs either the GitHub Actions app added to the
ruleset's `bypass_actors` — which exempts **every** workflow with
`contents: write` from the whole ruleset — or a long-lived PAT any workflow on a
branch can read. Neither is worth it for a file that is only meaningful per
release.

Generating it inside a PR instead does not work either: entries link
`/commit/<sha>` and this repo squash-merges, so PR-branch SHAs never exist on
`main`. If this is ever automated again, note that a PR opened with
`GITHUB_TOKEN` does not trigger `pull_request` workflows, so it can never satisfy
the required checks and can never be merged.

## Labels

A canonical `app:`/`pkg:`/`type:` + `breaking-change` taxonomy
(`scripts/lib/labels.mjs`; the `app:`/`pkg:` set is derived from the workspaces,
so it self-updates).

[`sync-labels.yml`](../../../.github/workflows/sync-labels.yml) creates/updates
them on GitHub whenever `labels.mjs` or the workspace list changes on `main` (or
on demand via `vp run labels:sync`), and
[`labeler.yml`](../../../.github/workflows/labeler.yml) applies them to every PR
— scope from the changed workspaces (`scripts/pr-labels.mjs`), type from the PR
title.

Adding a workspace needs no manual step: the labeler **syncs the taxonomy from
the PR's merged tree before applying**, so the new label exists on the PR that
introduces it, not only after the merge. **Do not remove that step** — labels are
created via the Issues API, which is also why that job needs `issues: write`.

Note the sync workflow watches `apps/*/package.json` and
`packages/*/package.json`, **not** just `pnpm-workspace.yaml`: that file holds
only the globs, which a new workspace never edits, so watching it alone meant the
workflow never fired for one.
