---
'@lcabrera/vite-config': minor
---

The `eslint-plugin-unicorn` peer moves to `^79.0.0`, and the shared rules turn `unicorn/prefer-smaller-scope` off.

79 extends that rule to type aliases: it asks for an `Args` or `Props` type used by one function to move inside it, which would take a named type out of an exported signature. The rule takes no options, and its variable check found nothing on the code this package lints, so the shared config turns it off rather than keep half of it.

**This is the breaking part:** a consumer on `eslint-plugin-unicorn` 78 gets an unmet peer until it moves to 79, and 79's other new recommended rules (`consistent-boolean-name`, `prefer-includes-over-repeated-comparisons`) may report on its code.
