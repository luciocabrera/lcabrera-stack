# create-lcabrera-stack

Starts a new repository on this toolchain:

```bash
pnpm create lcabrera-stack my-project
pnpm create lcabrera-stack my-project --profile repo
```

It makes the directory, initialises a git repository in it, materialises the
profile you asked for, and leaves an initial commit.

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
