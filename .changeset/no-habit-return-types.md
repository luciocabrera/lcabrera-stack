---
'@lcabrera/eslint-plugin': minor
'@lcabrera/vite-config': minor
---

New rule `no-habit-return-types`, enabled in both shared ESLint configs.

It removes a return-type annotation TypeScript would have written itself, and it
is auto-fixable. An explicit return type is sometimes deliberate — it can promise
callers **less** than the function really returns — and that is indistinguishable
in the source text from a redundant one. Telling them apart needs a type checker,
which this plugin does not have.

So the rule reports only annotations that cannot be hiding anything, because the
body shape fixes the inferred type exactly: `void` and `Promise<void>` on a block
body that returns no value and whose end point is plainly reachable, `boolean`
where every returned expression is a comparison or a boolean literal, and
`JSX.Element` where every return is JSX. Everywhere else it is silent — so a
deliberate widening is never flagged, and the rule has no options and nothing to
disable.

Reachability is why the `void` arms walk the whole body rather than its `return`
statements. A function that cannot reach its end point infers `never`, so `void`
there is a widening — and an `if`/`else` where both arms throw, a `switch` whose
`default` throws, `for (;;)` and a throwing `finally` all reach that state
without writing a `throw` anywhere a scan of the body's top level would see it.
With no type checker the test is lexical and deliberately blunt: any `throw`
outside a nested function, or any endless loop, silences the rule for that
function. It therefore also stays quiet on a guard clause, which really does
infer `void` — over-caution in the direction that cannot corrupt a signature.

**Consumers of `@lcabrera/vite-config` get this as an error on their next
upgrade.** It is auto-fixable, so `eslint --fix` clears it; the findings it
raises are annotations their own compiler already reproduces.

The trade is deliberate: `(): string` over a body returning a `string` is a habit
this rule will not catch, because the same annotation over a body returning
`'a' | 'b'` is a widening.
