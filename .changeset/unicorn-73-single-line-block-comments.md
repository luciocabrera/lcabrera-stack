---
'@lcabrera/vite-config': minor
---

The `eslint-plugin-unicorn` peer range moves to `^73.0.0`, and the shared config
takes a side on the rule that major adds.

**This is the breaking half:** the peer range no longer admits unicorn 72, so a
consumer staying on 72 gets an unmet peer and must move with it.

unicorn 73's recommended set adds `unicorn/single-line-block-comment-style`,
whose default option is `multiline`. Applied to a codebase that writes one-line
doc comments, its fixer rewrites

```ts
/** One page of distinct values for a column. */
```

into

```ts
/*
One page of distinct values for a column.
*/
```

— a block comment with no `*` prefix on its content line, which is no longer
JSDoc and which no formatter in this toolchain will maintain. The shared config
therefore sets the rule's option rather than its severity:

```js
'unicorn/single-line-block-comment-style': ['error', 'single-line'],
```

The rule still enforces consistency, and still fixes an inconsistent comment —
it now collapses a stray asterisk-less block comment down to one line instead of
expanding a conforming one-liner. A comment already written in canonical JSDoc
form (`/**`, then `* `-prefixed lines) is exempt under either option, so this
choice only governs the asterisk-less shape.

A consumer that prefers the upstream default can override the entry; the option
is set in the shared block, not enforced through a separate mechanism.
