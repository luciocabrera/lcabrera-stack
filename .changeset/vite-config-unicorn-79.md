---
'@lcabrera/vite-config': minor
---

The `eslint-plugin-unicorn` peer moves to `^79.0.0`, and the shared configs turn `unicorn/prefer-smaller-scope` off in TypeScript files (`.ts`, `.mts`, `.cts`, `.tsx`).

79 extends that rule to type aliases: it asks for a type used by one function to move inside that function's body. These configs keep argument and props types as named module-level types, so in TypeScript the rule reports the shape they ask for. The rule takes no options, so the entry is scoped by file instead. JavaScript files keep the rule's variable check.

**This is the breaking part:** a consumer on `eslint-plugin-unicorn` 78 gets an unmet peer until it moves to 79, and 79's new recommended rule `prefer-includes-over-repeated-comparisons` may report on its code. `consistent-boolean-name` was already on in these configs, so its move into the recommended set changes nothing.
