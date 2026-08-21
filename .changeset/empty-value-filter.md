---
'@lcabrera/server': minor
'@lcabrera/ui': minor
---

Adds a column filter that selects the rows where a column **holds no value**.

Until now every member of `ColumnFilter` carried a value and mapped to a
comparison, and SQL equality against NULL is never true — so there was no
filter a user could build, or a URL could carry, that selected null rows. The
gap was load-bearing: `resolveDrillHandoffSearch` refuses to offer its link at
all when a group's key is NULL, because "the filter vocabulary has no 'is null'
member", and the NULL group is the one a reader is most likely to click into.

**The query layer already emitted `IS NULL`.** `QueryFilter` has a unary arm and
`appendFilterClause` gives it a branch that binds no parameter. What was missing
was a vocabulary that could reach it, so this adds the span between: an
`EmptyFilter` in both packages' `ColumnFilter` unions, a `toQueryFilters` arm
producing the unary filter, a URL codec, and the operators in the filter editor.

**It is its own `type`, not an operator on the value-carrying filters.**
Emptiness is not a comparison: adding `isEmpty` to `TextFilter` and its siblings
would put a `value` on every one of them that must then be ignored, and force
each editor to hide its own input. One value-less member keeps "carries a value"
true of every other member of the union.

**Empty means SQL NULL and deliberately not the empty string.** A text column
can hold both and they are different facts — `''` is a value someone stored.
A column where `''` is meaningful wants a text `equals ''`.

The operators are offered for **every** column type, because any column can hold
nothing; the data type decides which comparisons make sense, not whether
emptiness does.

For consumers: `ColumnFilter` gains a variant, so an exhaustive `switch` over
`filter.type` that previously compiled may now need an arm. Three such
dispatches inside these packages did — the URL serializer, the drawer's
validity check, and the URL-restore compatibility check — and each would have
dropped the filter silently rather than failing.
