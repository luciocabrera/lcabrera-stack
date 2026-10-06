---
'@lcabrera/vite-config': minor
---

`unicorn/prefer-default-parameters` is now on in both shared configs (`createCustomRulesLintConfig` and `createBaseCustomRulesLintConfig`) as an error. Code that passed before can fail lint under it.

The rule reports a parameter or a destructured binding that is read as `x ?? literal` or `x || literal`, and asks for the default to sit where the value is declared. A default applies to `undefined` only. Where `null` can reach the binding, a mechanical rewrite changes what `null` does, so write that `null` path out explicitly (for example `typeof x === 'string' ? x : ''`) rather than accepting the suggested default.
