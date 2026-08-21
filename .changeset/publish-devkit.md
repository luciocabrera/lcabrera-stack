---
'@lcabrera/devkit': minor
---

The agent-setup materialiser is now a published package, `@lcabrera/devkit`.

It copies one repository's agent setup — skills, path rules, subagent
definitions and the contracts they bind to — into another, and reports what has
diverged since. `devkit init` turns an empty repository into a working one;
`devkit sync` takes an upstream update without discarding a local edit;
`devkit doctor` reports the difference.

```bash
npm install --save-dev @lcabrera/devkit
npx devkit init --profile agent
```

Two properties are worth knowing before you install it.

**It ships `.mjs` and does not build.** The `exports` map names the source files
directly, because an `.mjs` file loads from `node_modules` as it is. There is no
`dist`, and nothing to build before you can read what you installed.

**`@lcabrera/repo-standards` is an optional peer.** A skill can declare a `peer:`
range in its frontmatter; `sync` refuses to materialise that skill when the
declared peer is absent or out of range, and reports it rather than writing a
file whose instructions would not resolve. Skills with no such declaration
materialise regardless, so the peer is only needed for the ones that name it.
