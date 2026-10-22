---
'@lcabrera/repo-standards': minor
---

`repo-verify-lint-plugins` now parses each workspace `vite.config.ts` to find a `fmt`, `lint` or `staged` key, instead of matching one at the start of a line. It reads every object the default export resolves to, and every object passed to `defineConfig`, including an aliased or namespace-qualified one. To find them it follows:

- a call's callee and arguments, so `makeConfig({ fmt })`, `defineConfig(merge({ fmt }))` and an immediately invoked function are checked
- every `return` of a function it reaches, sync or async, including one inside an `if`
- both branches of a conditional, and both sides of `??` and `||`
- `satisfies`, `as`, `!` and `await` wrappers
- spreads

Identifiers are resolved with the TypeScript checker in whatever scope declares them, module or function body. The gate reads the initializer, every later `=` assignment and a function declaration's body. A shorthand property (`{ fmt }`), an inline object (`defineConfig({ fmt: f })`) and a quoted key all fail the gate, where before the shorthand and inline forms passed.

These are still not flagged:

- a key on a nested object, such as `test.fmt`
- a binding destructured from another object, traced back to its source
- a key added by mutating an object after it is built (`config.fmt = x`)
- anything reached only through an imported binding

**Action needed:** a repository whose workspace config declared one of these keys in a form the line match missed now fails the gate. Move the block to the root config, then run `repo-verify-lint-plugins` again.
