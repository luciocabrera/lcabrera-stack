---
governs:
  - devkit
  - create-lcabrera-stack
---

# ADR-124 — `create` defaults to the monorepo rung; `init` and `sync` keep their fallback

**Status:** Superseded by [ADR-129](./ADR-129-create-defaults-to-the-full-rung-and-runs-the-setup.md)

**Issue:** [#1191](https://github.com/luciocabrera/lcabrera-stack/issues/1191)

## Context

`devkit create`, `devkit init` and `devkit sync` take `--profile <name>`, and
until now each of them ended at the same value when it was absent:
`profile: 'agent'` in `DEFAULT_CONFIG`. `create` went to it directly. `init`
and `sync` first read the `profile` key of an existing `devkit.config.json` and
reach `agent` only when the config names no rung. For `init` and `sync` that
fallback is the cautious choice. They run inside a repository someone already has, and the
`agent` rung adds prose and templates without placing a workspace, an
application or a root config into a project that has its own.

`create` has no such project. Its target is an empty directory or one that does
not exist, and it refuses anything else. Run with no flag, it placed the
`agent` rung into that empty tree: skills, path rules, the register templates
and a manifest, with no workspace, no application and nothing to install. The
first command a new user types left a repository that looked empty.

The requirement `create` exists to meet,
`one-command-leaves-a-working-repository`, is written against the `monorepo`
rung and says `agent` and `repo` do not answer it.

## Decision

`create` resolves a missing `--profile` to `monorepo`. The value is
`CREATE_DEFAULT_PROFILE` in `packages/devkit/scripts/create.mjs`, and
`resolvedProfile` in `command-create.mjs` reads it. A
flag still wins, so `--profile agent` gives the old tree.

`init` and `sync` are unchanged. With no flag they use the configured
`profile`, and `DEFAULT_CONFIG.profile`, which stays `'agent'`, applies only
when neither the flag nor `devkit.config.json` names a rung.

`create` writes the rung it used into the `profile` key of the
`devkit.config.json` it creates, so that file names `monorepo` after a flagless
run. A later `sync` or `doctor` with no flag reads that key and plans against
the same rung. Without it they would drop back to `DEFAULT_CONFIG` and plan
against `agent`, which leaves the workspace files out of the plan: an edited
workspace file is not reported, and `doctor --check` does not fail on it.

`create-lcabrera-stack` forwards its arguments to `devkit create` unchanged, so
it takes the same default without a change of its own.

## Consequences

- `devkit create <dir>` now writes a workspace, an application and a root task
  block that expect an install. A user who wanted only the agent harness in a
  new directory has to say `--profile agent`, where before that was what they
  got without asking.
- The same flag defaults differently depending on the command. The usage line
  cannot show that, so the README states each default where it describes the
  command.
- A created repository's config is the only thing keeping later commands on
  `monorepo`. Delete the `profile` key, or set it to a lower rung, and `sync`
  and `doctor` plan against that rung. They then say nothing about the
  workspace files, drifted or not, and `doctor --check` does not fail on them.
  The failure is silent. Any repository whose key is missing behaves the same
  way, and the README already tells users to set the profile in the config
  rather than by flag.

## Alternatives considered

1. **Change `DEFAULT_CONFIG.profile` to `monorepo`.** A shared default for every
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
