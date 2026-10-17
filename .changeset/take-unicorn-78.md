---
'@lcabrera/vite-config': minor
---

The `eslint-plugin-unicorn` peer range moves to `^78.0.0`. Both shared configs (`createCustomRulesLintConfig` and `createBaseCustomRulesLintConfig`) apply unicorn 78's recommended set with the same settings as before. No rule is switched on or off, and no option changes.

**This is the breaking part:** the range no longer admits unicorn 77, so a consumer on it gets an unmet peer and must move up. Some rules that were already on report more in 78, so code that passed lint before can now fail:

- `unicorn/no-negated-condition` reports a condition built from `&&` or `||` over negated operands, such as `a !== x && !b ? c : d`. Its autofix applies De Morgan's law and swaps the branches.
- `unicorn/prefer-minimal-ternary` now compares the parts the two branches share while ignoring formatting. A ternary such as `c ? f(a, x) : f(b, x)` is reported even when its branches wrap differently across lines.
- `unicorn/prefer-default-parameters` reports a destructured binding read only as `binding || earlier` or `binding ?? earlier`, where `earlier` is a binding declared before it in the same pattern. Its suggestion makes `earlier` the default, and a default applies only to `undefined`. With `||`, that changes behaviour for every other falsy value, so check the binding's type before you accept it: for a `boolean`, `a || b` is a disjunction, not a fallback.
- Many unicorn rules used to skip code that contains a comment. They now report it and only withhold a fix that would delete the comment.

The two rules unicorn 78 adds, `no-unnecessary-default-arguments` and `no-repeated-call-wrappers`, are not in its recommended set and stay off.
