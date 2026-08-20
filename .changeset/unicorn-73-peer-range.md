---
'@lcabrera/vite-config': minor
---

The `eslint-plugin-unicorn` peer range moves to `^73.0.0`.

**This is the breaking part:** the range no longer admits unicorn 72, so a
consumer staying on 72 gets an unmet peer and must move with it.

unicorn 73's recommended set adds `unicorn/single-line-block-comment-style`. The
shared config turns it **off** for now, so upgrading does not silently impose a
new comment style on anyone consuming this config.

The rule's default option is `multiline`, and applied to a codebase that writes
one-line doc comments its fixer rewrites

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
JSDoc. Its other option, `single-line`, enforces the opposite direction. Picking
between the two is a house-style decision rather than a correctness one, and it
is deferred rather than settled: the entry in `SHARED_PLUGIN_RULE_SEVERITIES`
carries the reason and names the issue that decides it.

A consumer who wants the rule can enable it with either option; nothing here
prevents that, and a comment already in canonical JSDoc form (`/**` followed by
`* `-prefixed lines) is exempt under both.
