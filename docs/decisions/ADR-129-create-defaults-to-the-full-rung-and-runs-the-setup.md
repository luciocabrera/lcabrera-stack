---
governs:
  - devkit
  - create-lcabrera-stack
---

# ADR-129 — `create` defaults to the full rung and runs the install and the database setup itself

**Status:** Accepted

**Issue:** [#1222](https://github.com/luciocabrera/lcabrera-stack/issues/1222)

**Supersedes:** [ADR-124](./ADR-124-create-defaults-to-the-monorepo-rung.md)

## Context

[ADR-124](./ADR-124-create-defaults-to-the-monorepo-rung.md) made `monorepo`
the rung `devkit create` places when no `--profile` is given. It rejected
`full` because that rung then placed nothing of its own. That is no longer
true. `full` now places a local Postgres behind compose, an environment
template, the `db:*` tasks, a seed, smoke tests, and an orders route that sorts,
filters and pages in SQL.

The `monorepo` route reads static rows
([ADR-121](./ADR-121-the-blueprint-offers-only-what-its-rung-delivers.md)).
Turn sorting on in a tree created at that rung and the URL changes while the
rows stay in their original order. A new user meets that before anything else.

`create` also stopped short of a working tree. It printed "Nothing is installed
yet" and a list of commands. At `full` that list grows: copy the environment
file, install, start the database, wait for it, seed it. Each step depends on
the one before, and the person typing them has not read anything yet.

## Decision

**With no flag, `create` places `full`.** `CREATE_DEFAULT_PROFILE` in
`packages/devkit/scripts/create.mjs` is `'full'`. `init` and `sync` keep the
fallback ADR-124 left them.

**After the commit, `create` finishes the setup** in
`command-create-setup.mjs`. The decisions live in `create-setup.mjs`:

1. It copies `docker/local/.env.example` to `docker/local/.env`, which the
   tree's `.gitignore` covers. `COMPOSE_PROJECT_NAME` becomes the repository's
   name, so two created trees on one machine do not share a container or a
   volume. Every other value stays as the template has it, and those
   placeholders are the credentials the local database is created with.
2. It installs with `vp install` when `vp` is on PATH. Otherwise it uses the
   package manager named by `npm_config_user_agent`, if that one is on PATH.
3. When the tree wires `db:seed`, it runs `<run> db:up`, waits for the server,
   then runs `<run> db:seed`. These are the tree's own tasks, so a command the
   summary prints later is the one `create` would have run. The wait sends a
   Postgres startup message to `DB_HOST:DB_PORT` and stops at the first answer
   that is not "starting up", with a 90-second limit. The target is read the
   way the tasks read it: a variable already in the environment wins over the
   file. The probe lives in `create-readiness.mjs`, and `create` runs it in a
   child `node` process because the rest of `create` is synchronous.

**A step that cannot run is reported, and the run still exits 0.** That covers
no `vp` and no launching package manager, no `docker` on PATH, and a `docker
info` that fails. The summary names the command to run later.

**A step that ran and failed exits 1.** That covers the install, `db:up`, the
wait and the seed. The message says the repository is in place and committed,
and the summary still lists what is left.

**The summary lists only the steps not done.** After a full run it is
`cd <dir>` and `<run> dev`.

**`--no-install` skips the install and the database; `--no-db` skips the
database.** `create-lcabrera-stack` forwards both unchanged.

**The `full` rung's application reads the compose environment file.** Nothing
put the `DB_*` settings into the server's environment, so `dev` and `start`
answered 500 in a created tree. The rung now ships its own
`apps/web/vite.config.ts`
([ADR-127](./ADR-127-a-higher-rung-supersedes-a-lower-rungs-file.md)). The
development server loads the file when the config is read, without overriding
a variable the shell set. `start` sources it before the application's own
`.env`.

**Both created-tree gates build `full`.** `workspace:verify` creates the tree
with `--no-install`, because its scratch-registry config can only be written
into a directory that exists. It then seeds the tree's database through the
tree's own task, runs `test:smoke`, and serves `start`. A sorted request and a
filtered request must render the rows SQL gives over the same table. Before
comparing, each probe confirms that the SQL answer differs from the unsorted,
unfiltered rows. Without that, a route that ignored the parameter would pass.
`registry-tree:verify` runs the published initializer at its default rung with
`--no-db`, so the initializer's own install is the one exercised. That install
runs with pnpm's release-age delay lifted and without `CI`, as it would on a
user's machine. Both gates use
the Postgres named by `DEVKIT_TREE_DB_HOST` and its siblings, which is a
service in CI. Without them they use the tree's own `db:up` on a free port and
remove its volume afterwards.

## Consequences

- `create` now needs the network and takes as long as an install. On a machine
  with Docker it also pulls an image and starts a container the user did not
  ask for by name. `--no-db` and `--no-install` are the ways out, and the usage
  line names both.
- The placeholder values in `docker/local/.env` become the live credentials of
  a local database the first time it starts. Postgres reads them only when it
  initialises a volume, so changing them later also means removing that volume.
  The summary says the values are the ones the database starts with. It does
  not explain the volume.
- A port another server already holds makes `db:up` fail, which exits 1 rather
  than 0. Only an absent or stopped Docker counts as a step that cannot run.
- `registry-tree:verify` fails until a version that knows `--no-db` is
  published, because it runs what npm serves. This is the same window
  ADR-125 accepted for any change that moves the initializer and its gate
  together.
- `check:safe` now needs Docker locally, or the `DEVKIT_TREE_DB_*` variables
  pointing at a Postgres, because `workspace:verify` is chained into it.

## Alternatives considered

1. **Keep `monorepo` and print the database steps.** Rejected: the first tree a
   user creates would still render static rows, and the steps would still be
   theirs to type in order.
2. **Start the development server too.** Rejected: it does not exit, so
   `create` could not report and return, and the issue scopes it out.
3. **Wait on a TCP connect, or on the container's health status.** Rejected. A
   published port can accept a connection no server answers. The compose
   healthcheck runs `pg_isready` inside the container, so it answers about the
   server there and not about the published port the seed connects to. Only an
   answer in the protocol on that port is the thing the seed needs.
4. **Make `runCreate` asynchronous to wait in-process.** Rejected: every
   caller and test of `create` is synchronous, and a child process keeps them
   so for one step.

## References

- [#1222](https://github.com/luciocabrera/lcabrera-stack/issues/1222), under
  epic [#1064](https://github.com/luciocabrera/lcabrera-stack/issues/1064)
- [ADR-124](./ADR-124-create-defaults-to-the-monorepo-rung.md), superseded
- [ADR-125](./ADR-125-the-created-tree-gate-installs-the-checkout.md): the
  created-tree gate installs the checkout
- [ADR-127](./ADR-127-a-higher-rung-supersedes-a-lower-rungs-file.md): a
  higher rung supersedes a lower rung's file
- `docs/product/requirements/one-command-leaves-a-working-repository.md`
