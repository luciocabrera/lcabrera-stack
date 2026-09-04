---
id: one-command-leaves-a-working-repository
lines:
  - application
  - toolchain
persona: project-starter
state: unmet
packages:
  - devkit
  - repo-standards
  - tsconfig
  - ui
  - vite-configs
requires:
  - the-shipped-setup-installs-and-works
issues:
  - 1064
  - 1074
  - 1075
  - 1076
evidence:
  - type: doc
    ref: docs/decisions/ADR-107-the-stack-is-a-precondition-of-the-packages.md
  - type: code
    ref: packages/devkit/scripts/command-init.mjs
---

# One command leaves me a repository I can work in

## Statement

I am starting a new project and I have nothing — no repository, no toolchain, no
conventions. I want to run one command and be left with a repository that
installs, builds, tests, lints and checks itself, with an application already
rendering something, and with the standards and agent setup already in place. I
should not have to read anything first, copy files out of somebody else's
repository, or find out two days later that a piece never arrived.

What I get should be a repository I can start committing to, not a starting point
I have to finish assembling.

## Acceptance

- From an empty directory, one command produces a git repository that installs
  with no manual step, and in which the workspace's own build, test, lint,
  format-check and typecheck tasks all pass.
- The repository it produces contains the agent harness — the skills, the path
  rules and the subagent definitions — and every path any of them references
  resolves inside that repository: `devkit closure`.
- It contains an ADR register and a coordination register, each with its template
  and **no records**, so the first record written is the project's own.
- No file in the produced repository names this repository: not a package name,
  not a secret, not a task only this repository defines. The decider is a check
  run against the **produced** tree, and it does not exist yet.
  `vp run seeds:verify` is not it: that gate reads the seeds devkit ships from
  this checkout, so it reports the same clean pass whatever the produced
  repository contains. #1075 and #1076 build the one that can settle this.
- Every `@lcabrera/*` dependency it declares is a semver range resolved from the
  registry. No `workspace:` specifier appears anywhere in the produced tree.
- **The check is run outside this repository.** The gate builds the repository in
  a scratch directory holding none of this tree's files and exercises it there —
  no in-repo run can observe a missing piece, because this repository supplies
  every one of them.
- **The gate fails when the produced repository is broken.** Removing one
  emitted config, or one harness file another file references, makes it fail.
  A gate that reports the same pass either way settles nothing.

## Notes

The persona this is written for exists because of the last two criteria. Every
other requirement in this register can be checked from inside this repository;
this one cannot be checked here at all, because the environment that would reveal
the failure is precisely the one this repository is not.

Which rung of the profile ladder is being produced changes what "working" means —
`monorepo` has no database and its route renders from static rows, `full` adds
the database lane and a data-backed route. This requirement is written against
`monorepo` and is not satisfied by a rung below it: `agent` and `repo` install
into a repository that already exists, so neither answers this persona's
question.
