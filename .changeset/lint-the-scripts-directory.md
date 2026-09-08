---
'@lcabrera/vite-config': minor
---

The ESLint config no longer ignores a workspace's `scripts/` directory. That
entry sat in `GLOBAL_IGNORES` in both factories, and it meant a package whose
source lives under `scripts/` was reported clean without being read — a pass
indistinguishable from a correct one. A consumer upgrading will see findings in
files this config has been skipping.

Five settings come with it, all scoped to the plain-JavaScript block
(`**/*.js`, `**/*.mjs`, `**/*.cjs`) except where noted, because that block is
tooling a developer runs rather than anything serving a request:

- `security/detect-non-literal-fs-filename`, `security/detect-unsafe-regex` and
  `security/detect-non-literal-regexp` are off there. Each guards against
  untrusted input reaching a dangerous construct, and these files have none:
  the paths and subjects are the repository's own. They stay on everywhere else.
- `unicorn/max-nested-calls` allows four rather than three, which is what
  `JSON.parse(readFileSync(join(root, name), 'utf8'))` costs. TypeScript source
  keeps three.
- `unicorn/no-null` is off there. In a tooling script `null` is usually another
  API's value — `RegExp#exec`, `child_process` `status`, the second argument to
  `JSON.stringify` — or a JSON absence a reader can see, where `undefined` is a
  key that vanishes.

Two apply everywhere:

- `@typescript-eslint/no-require-imports` is off for `**/*.cjs`. `require()` is
  the module system that extension selects, not a lapse. A `.mjs` file that
  calls it is still reported.
- `unicorn/no-useless-undefined` no longer checks arguments. In that position
  the rule cannot tell a redundant `undefined` from a load-bearing one and its
  fixer deletes both: dropping the initial value from `reduce(fn, undefined)`
  turns an empty array from `undefined` into a thrown `TypeError`.
- `unicorn/import-style` accepts both spellings of a `node:path` import. The
  default asks for `import path from 'node:path'`, which is a fair reading of
  the call site — and not free where `path` is also the obvious name for the
  value, as it is throughout tooling code.
