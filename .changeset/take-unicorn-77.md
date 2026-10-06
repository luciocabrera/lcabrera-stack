---
'@lcabrera/vite-config': minor
---

The `eslint-plugin-unicorn` peer range moves to `^77.0.0`, and both shared configs (`createCustomRulesLintConfig` and `createBaseCustomRulesLintConfig`) now apply unicorn 77's recommended set with the settings below.

**This is the breaking part:** the range no longer admits unicorn 73 to 76, so a consumer on any of them gets an unmet peer and must move up. Code that passed before can now fail lint under the rules listed as on.

**On, new in the recommended set:** `no-async-iterator-callback`, `no-conflicting-constraints`, `no-incomplete-accessor-override`, `no-ineffective-csp-directives`, `no-invalid-boolean-attribute-value`, `no-invalid-dom-token`, `no-invalid-integrity`, `no-invalid-intl-options`, `no-invalid-property-descriptor`, `no-invalid-response-options`, `no-invalid-style-set-property`, `no-invalid-temporal-arithmetic`, `no-invalid-url-protocol-comparison`, `no-leading-empty-lines`, `no-prevent-default-in-passive-listener`, `no-unnecessary-parameters`, `no-unsafe-json-serialization`, `no-unused-builtin-method-return` (it replaces `no-unused-array-method-return`), `no-unused-iterator-helper`, `no-url-in-search-params`, `no-useless-set-construction`, `no-using-resource-escape`, `prefer-combined-guards`, `prefer-escaped-irregular-whitespace`, `prefer-iterator-zip`, `prefer-literal-ascii`, `prefer-promise-static-methods`, `prefer-short-escape-sequences`, `prefer-temporal-conversion` and `require-text-decoder-streaming`, all with the `unicorn/` prefix.

**On, and reporting more than in 73:** `unicorn/prefer-early-return`, `unicorn/prefer-continue`, `unicorn/prefer-group-by` and `unicorn/prefer-minimal-ternary`.

**`unicorn/prefer-ternary` takes `only-single-line`.** In unicorn 77 the rule also merges an `if` that returns with the `return` after it. Under this option it still does that when the condition and both values each fit on one line, and leaves a multi-line guard clause alone.

**`unicorn/no-unnecessary-parameters` is off in tests.** A block matching `**/*.{test,spec}.*` and `**/e2e/**` (script and TypeScript extensions only) switches it off. In a test, a helper that the current cases all call the same way is still a general helper, and inlining the value makes it specific to those cases. Source files keep the rule.

**Off:**

- `unicorn/no-asterisk-prefix-in-documentation-comments` rejects the `*` line prefix of a JSDoc block. It is a style preference that changes no behaviour and catches no bug.
- `unicorn/no-top-level-side-effects` reports `export default defineConfig(...)`, `export default createRule(...)` and a default-exported config array, which are pure factory calls. Its only fix binds the same call to a variable first.
- `unicorn/no-unnecessary-array-flat-map` asks a `flatMap` callback to return a bare value instead of a one-element array. A callback that returns an array from every branch shows at a glance that it yields zero, one or many, and the bare value saves only one allocation.
