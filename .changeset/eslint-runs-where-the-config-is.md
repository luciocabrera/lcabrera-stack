---
'@lcabrera/repo-standards': minor
---

`repo-eslint-staged` lints a list of files with the ESLint config that governs
each one, and fixes what ESLint can fix. A monorepo keeps one flat config per
workspace and none at the root, so a single `eslint` invocation has nothing to
point at, and the ESLint pass ends up running only after a commit exists — in a
pre-push gate or in CI, where a finding that would have fixed itself costs a
round trip instead.

Each path resolves to the nearest directory above it holding an
`eslint.config.mjs`, and each group runs from that directory with that config.
A path with no config above it is skipped rather than assigned to a config that
is some other workspace's: a repository's root scripts and its docs sit outside
every workspace. Paths ESLint does not lint are dropped too, so a staged-files
runner can hand it a whole changeset without filtering first.

A path the governing config itself ignores is left alone rather than failed.
Naming an ignored file is a warning, and at `--max-warnings 0` a staged `dist/`
or `build/` path would otherwise block a commit for being ignored — while a
whole-tree `eslint .` never visits it at all.

`--check` reports without writing. It exits 1 while findings remain, so it
gates as well as fixes.
