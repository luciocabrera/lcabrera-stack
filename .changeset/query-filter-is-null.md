---
'@lcabrera/server': minor
---

`QueryFilter` gains an `isNull` operator.

`UnaryOperator` was `'isNotNull'` alone, which left "this column is null"
inexpressible — and it cannot be spelled as an equality, because SQL's
three-valued logic makes `col = NULL` never match, not even a null row. The
vocabulary is now closed under negation:

```ts
filters: [{ column: 'shipping_country', operator: 'isNull' }];
// → WHERE "shipping_country" IS NULL
```

Like `isNotNull` it carries no value and consumes no parameter slot, so filters
after it keep their placeholders.

**Widening the union is breaking for a consumer that exhaustively switches on
`UnaryOperator`** with no default arm. That is the intended shape: the operator
maps in this package are closed records, which is what makes a new operator a
type error rather than a silent gap.
