---
'@lcabrera/devkit': minor
---

The shipped CI workflows can now install on every runner, not just two of five.

A shipped workflow starts on an empty runner, and the install step named
whatever `init` inferred — which is right in your terminal and wrong there. On
GitHub's `ubuntu24` image, after `actions/setup-node`, only `npm` and `yarn` are
on PATH. `pnpm` and `bun` are not, and neither is `vp`, which is the sharper
case: it is a project dependency, so installing it is the step that was about to
run. Every workflow failed at that step with `exit 127`.

Two changes fix it:

- **Every workflow now enables corepack** before installing, which supplies the
  package manager `packageManager` pins, at that exact version. This is
  unconditional and harmless where Node already ships the manager.
- **A new optional `ci.setup`** in `devkit.config.json` carries the extra steps a
  runner needs that corepack cannot supply. `init` fills it in for vite-plus and
  bun — pinned to a commit sha — and leaves it out for everyone else, so most
  repositories never see the key.

The value is YAML lines, indented into place wherever a workflow carries
`{{ci.setup}}`. An absent value resolves to no steps rather than to a missing
key, so no file is ever held back for it.

**If you already ran `init`,** the upgrade path is now one command:

```bash
devkit init --upgrade && devkit sync
```

`--upgrade` gets past the already-initialised refusal and adds only what is
missing — here, the `ci` block your runner needs — while keeping every command
you corrected and every block another package owns. It reports which of your
values it left alone.

Use `--upgrade`, not `--force`. `--force` also gets past the refusal, but it
rewrites the config from the current inference: it would re-guess the commands
this same command told you to check and correct.
