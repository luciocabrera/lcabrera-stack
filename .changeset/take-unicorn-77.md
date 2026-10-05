---
'@lcabrera/vite-config': minor
---

The `eslint-plugin-unicorn` peer range moves to `^77.0.0`.

**This is the breaking part:** the range no longer admits unicorn 73 to 76, so a consumer on any of them gets an unmet peer and must move up.

Three rules that unicorn 77's recommended set brings in are switched **off** in both shared configs:

- `unicorn/no-asterisk-prefix-in-documentation-comments` rejects the `*` line prefix of a JSDoc block. It is a style preference that changes no behaviour and catches no bug.
- `unicorn/no-top-level-side-effects` reports `export default defineConfig(...)`, `export default createRule(...)` and a default-exported config array, which are pure factory calls. Its only fix binds the same call to a variable first.
- `unicorn/prefer-default-parameters` rewrites `x ?? literal` and `x || literal` into a default, and a default applies only to `undefined`. Each rewrite changes what `null` does, and for `||` what every other falsy value does.
