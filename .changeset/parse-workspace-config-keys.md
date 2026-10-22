---
'@lcabrera/repo-standards': minor
---

`repo-verify-lint-plugins` now parses each workspace `vite.config.ts` to find a `fmt`, `lint` or `staged` key, instead of matching one at the start of a line. It reads every object the default export resolves to and every object passed to `defineConfig`, including an aliased or namespace-qualified `defineConfig`. It follows the arguments of any call, so a config built by another helper (`makeConfig({ fmt })`, `defineConfig(merge({ fmt }))`) is checked too. It also follows every `return` of a config function, including one inside an `if`, both branches of a conditional, both sides of `??` and `||`, a local constant, a local function declaration and a spread of a local object. A shorthand property (`{ fmt }`), an inline object (`defineConfig({ fmt: f })`) and a quoted key all fail the gate, where before the shorthand and inline forms passed. A key on a nested object, such as `test.fmt`, is still not flagged, and neither is a `return` inside a function nested in the config function. Nothing reached only through an imported binding is followed, so a key that only an imported object carries still passes.

**Action needed:** a repository whose workspace config declared one of these keys in a form the line match missed now fails the gate. Move the block to the root config, then run `repo-verify-lint-plugins` again.
