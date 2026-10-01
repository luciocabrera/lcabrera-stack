# create-lcabrera-stack

Starts a new repository on this toolchain:

```bash
pnpm create lcabrera-stack my-project
pnpm create lcabrera-stack my-project --profile repo
```

It makes the directory, initialises a git repository in it, materialises the
profile you asked for, and leaves an initial commit. With no `--profile` it
places `full`: a pnpm workspace with an application that reads a local
Postgres. It then installs the dependencies and, when Docker is running,
starts the database, waits for it and seeds it, so what is left is:

```bash
cd my-project
vp run dev
```

A step it cannot take on your machine, such as one with no Docker, is printed
as the command to run later. `--no-db` skips the database and `--no-install`
skips the install as well.

## The day a release ships

pnpm installs no version until it has been on the registry for a day
(`minimumReleaseAge`), so for that day `pnpm create lcabrera-stack` runs the
previous release. To create a repository from the one that just shipped, lift
the delay for the create and for the install it runs in the new repository:

```bash
pnpm_config_minimum_release_age=0 pnpm create --config.minimum-release-age=0 lcabrera-stack my-project
```

A repository created by a release declares every `@lcabrera/*` package from the
version that release shipped, so once the day has passed a plain install
resolves them without the override.

## It is a shim

Every decision above belongs to [`@lcabrera/devkit`](https://www.npmjs.com/package/@lcabrera/devkit),
and this package runs `devkit create` with the arguments you gave. It exports
nothing, holds no options of its own, and has no behaviour to document — read
that package's README for the profiles, the refusals and what each rung places.

The name is unscoped because a package manager decides it: `pnpm create
lcabrera-stack` resolves `create-lcabrera-stack`, and no scoped name can answer
that spelling. It is why this package exists at all — `devkit create` is the
same command for someone who already knows the toolchain is called devkit.

## Already have a repository?

Then this is the wrong command, and it will say so. Install the kit and run
`devkit init` inside the repository you have:

```bash
npm install --save-dev @lcabrera/devkit @lcabrera/repo-standards
npx devkit init
```
