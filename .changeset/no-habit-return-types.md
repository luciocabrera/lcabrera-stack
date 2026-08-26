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
where every return carries a comparison or a boolean literal, and `JSX.Element`
where every return carries JSX — both under the same reachability condition,
because a body that can fall off its end returns `undefined` on that path and
inference gives `T | undefined`. Everywhere else it is silent — so a
deliberate widening is never flagged, and the rule has no options and nothing to
disable.

The `void` arms ask whether the body can reach its bottom, because that is the
question that separates `void` from `never`: TypeScript infers `never` for a
function that neither returns nor reaches its bottom, so an annotation there is
widening `never` to `void` and must not be removed. An `if`/`else` where both
arms throw, a `switch` whose `default` throws, `for (;;)` and a throwing
`finally` all make the bottom unreachable, while a guard clause — `if (bad)
{ throw … }` — does not, and is reported.

**One case is out of reach and stays wrong.** A call to a function declared
`(): never` also makes the bottom unreachable, so `(): void => { process.exit(1); }`
infers `never` and this rule removes the annotation anyway. Deciding it means
resolving the callee's signature, which needs a type checker this plugin does not
have. The rule is auto-fixable and has nothing to disable, so if you meet this the
annotation has to be restored by hand. Closing it properly needs a type-aware
rule; it is stated here rather than left to be found.

**Consumers of `@lcabrera/vite-config` get this as an error on their next
upgrade.** It is auto-fixable, so `eslint --fix` clears it; the findings it
raises are annotations their own compiler already reproduces.

The trade is deliberate: `(): string` over a body returning a `string` is a habit
this rule will not catch, because the same annotation over a body returning
`'a' | 'b'` is a widening.
