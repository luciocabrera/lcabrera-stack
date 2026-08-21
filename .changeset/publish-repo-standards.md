---
'@lcabrera/repo-standards': minor
---

The repository gates are now a published package, `@lcabrera/repo-standards`.

They keep a repository's commits, branches, pull requests, issues, coordination
register, architecture decisions and published packages to one enforced shape —
and they ship as commands, so a repository runs them from its own hooks and CI
without vendoring a script.

```bash
npm install --save-dev @lcabrera/repo-standards
npx repo-verify-commit .git/COMMIT_EDITMSG
```

**Every repository fact these gates need is configuration, not a constant.**
`devkit.config.json` supplies the default branch, the shared-branches directory,
the ADR homes and the public-package roster; the package hardcodes none of them.
A gate that told a repository to "retarget to `main`" when its default branch is
named something else would be reporting a failure that is not one, so it reads
the name instead. The file is shared with `@lcabrera/devkit` — it is the
consumer's data, and two files invite drift between them — but each package
reads only the block it owns.

Like `@lcabrera/devkit`, this package ships `.mjs` and does not build: the
`exports` map and the `bin` entries name the source files directly.
