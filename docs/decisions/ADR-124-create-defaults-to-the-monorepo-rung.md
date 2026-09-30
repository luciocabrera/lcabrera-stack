---
governs:
  - devkit
  - create-lcabrera-stack
---

# ADR-124 — `create` defaults to the monorepo rung; `init` and `sync` keep `agent`

**Status:** Accepted

**Issue:** [#1191](https://github.com/luciocabrera/lcabrera-stack/issues/1191)

## Context

`devkit create`, `devkit init` and `devkit sync` all take `--profile <name>`,
and until now all three fell back to the same value when it was absent:
`profile: 'agent'` in `DEFAULT_CONFIG`. For `init` and `sync` that is the
cautious choice. They run inside a repository someone already has, and the
`agent` rung adds prose and templates without placing a workspace, an
application or a root config into a project that has its own.

`create` has no such project. Its target is an empty directory or one that does
not exist, and it refuses anything else. Run with no flag, it placed the
`agent` rung into that empty tree: skills, a path rule, two register templates
and a manifest, with no workspace, no application and nothing to install. The
first command a new user types left a repository that looked empty.

The requirement `create` exists to meet,
`one-command-leaves-a-working-repository`, is written against the `monorepo`
rung and says `agent` and `repo` do not answer it.

## Decision

`create` resolves a missing `--profile` to `monorepo`. The value is
`CREATE_DEFAULT_PROFILE` in `packages/devkit/scripts/create.mjs`, and
`resolvedProfile` in `command-create.mjs` is the one place that reads it. A
flag still wins, so `--profile agent` gives the old tree.

`init` and `sync` keep `agent`. `DEFAULT_CONFIG.profile` stays `'agent'`, and it
is the fallback for every command that reads a `devkit.config.json` without a
`profile` key.

`create` writes the rung it used into the `profile` key of the
`devkit.config.json` it creates, so that file names `monorepo` after a flagless
run. A later `sync` or `doctor` with no flag reads that key and plans against
the same rung, rather than dropping back to `DEFAULT_CONFIG` and reporting the
workspace files as outside the profile.

`create-lcabrera-stack` forwards its arguments to `devkit create` unchanged, so
it takes the same default without a change of its own.

## Consequences

- `devkit create <dir>` now writes a workspace, an application and a root task
  block that expect an install. A user who wanted only the agent harness in a
  new directory has to say `--profile agent`, where before that was what they
  got without asking.
- The same flag has two defaults depending on the command. The usage line
  cannot show that, so the README states each default where it describes the
  command.
- A created repository's config is the only thing keeping later commands on
  `monorepo`. Delete the `profile` key and `sync` falls back to `agent`, and
  `doctor` no longer counts the workspace files. That is the same behaviour any
  repository gets when the key is missing, and the README already tells users to
  set the profile in the config rather than by flag.

## Alternatives considered

1. **Change `DEFAULT_CONFIG.profile` to `monorepo`.** One default for every
   command. Rejected: `init` would then place a workspace and an application
   into an existing project by default, and `sync` in a repository whose config
   has no `profile` key would start planning files it never placed.
2. **Keep `agent` and tell users to pass `--profile monorepo`.** Rejected: the
   command with no flag is the one people run first, and it would keep
   producing a repository with nothing to install or run.
3. **Default `create` to `full`.** Rejected for now: `full` places what
   `monorepo` places and prints a notice saying so. Defaulting to it would print
   that notice on every flagless run and would change what `create` produces
   the day `full` gains files of its own, without anyone having chosen that.

## References

- [#1191](https://github.com/luciocabrera/lcabrera-stack/issues/1191), under
  epic [#1064](https://github.com/luciocabrera/lcabrera-stack/issues/1064)
- [ADR-110](ADR-110-publish-the-unscoped-initializer-as-a-shim.md): the
  initializer that forwards to `devkit create`
- `docs/product/requirements/one-command-leaves-a-working-repository.md`
