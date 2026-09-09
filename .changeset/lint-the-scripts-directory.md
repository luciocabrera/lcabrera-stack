---
'@lcabrera/vite-config': minor
---

The ESLint config no longer ignores a workspace's `scripts/` directory. That
entry sat in `GLOBAL_IGNORES` in both factories, and it meant a package whose
source lives under `scripts/` was reported clean without being read — a pass
indistinguishable from a correct one. A consumer upgrading will see findings in
files this config has been skipping.

Six settings come with it, in a new block scoped to a `scripts/` path or a
config file a tool loads (`**/scripts/**/*.{js,mjs,cjs}`,
`**/*.config.{js,mjs,cjs}`). The reason for five of them is a fact about that
position, not about the language: a file there is a command a developer ran,
rather than anything serving a request. Plain JavaScript elsewhere in your tree
— an `.mjs` request handler included — keeps every one of these on their
defaults:

- `security/detect-non-literal-fs-filename`, `security/detect-unsafe-regex` and
  `security/detect-non-literal-regexp` are off in that block. Each guards
  against untrusted input reaching a dangerous construct, and a command a
  developer ran has none: the paths and subjects are the repository's own.
- `unicorn/max-nested-calls` allows four rather than three there, which is what
  `JSON.parse(readFileSync(join(root, name), 'utf8'))` costs. Everywhere else
  keeps three.
- `unicorn/no-null` is off there. In a tooling script `null` is usually another
  API's value — `RegExp#exec`, `child_process` `status`, the second argument to
  `JSON.stringify` — or a JSON absence a reader can see, where `undefined` is a
  key that vanishes.

The sixth is about a shape rather than a position. `perfectionist/sort-objects`
leaves an object alone when every key it has is `types` or `default`: those two
are export conditions, a resolver reads them in written order, and sorting them
alphabetically puts `default` first and changes which file a consumer resolves.
Every other object in that block is still sorted.

Three apply everywhere:

- `@typescript-eslint/no-require-imports` is off for `**/*.cjs`. `require()` is
  the module system that extension selects, not a lapse. A `.mjs` file that
  calls it is still reported.
- `unicorn/no-useless-undefined` no longer checks arguments or arrow-function
  bodies. In an argument the rule cannot tell a redundant `undefined` from a
  load-bearing one and its fixer deletes both: dropping the initial value from
  `reduce(fn, undefined)` turns an empty array from `undefined` into a thrown
  `TypeError`. In an arrow body it rewrites `() => undefined` to `() => {}`,
  which is the same value and a worse callback. A useless `undefined` in a
  return or a variable is still reported.
- `unicorn/import-style` accepts both spellings of a `node:path` import. The
  default asks for `import path from 'node:path'`, which is a fair reading of
  the call site — and not free where `path` is also the obvious name for the
  value, as it is throughout tooling code.
