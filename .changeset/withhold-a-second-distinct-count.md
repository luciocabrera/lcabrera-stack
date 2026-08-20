---
'@lcabrera/ui': patch
---

The aggregation surfaces stop offering a second Distinct Count, which a grouped
read cannot carry.

`@lcabrera/server` budgets a grouped query at one `countDistinct` — it costs a
per-group tuplesort redone for every grouping set, so a second one repeats the
most expensive part of the query — and refuses a read carrying more. Nothing on
this side knew that, so both surfaces let a user apply `Distinct Count` on one
column and then on another, and answered the second choice with a refused read
instead of rows. The refusal rendering was working (ADR-068); the offer should
never have been made.

**Withheld rather than offered-and-disabled**, the rule the aggregation commands
already keep — with one deliberate exception. The column that **carries** the
distinct count goes on being offered it in its own header menu, because that menu
toggles and the item is the only way to remove it; a rule applied everywhere
would strand a user with a measure they could apply from the menu and not clear
from it. The drawer's picker never sees that exception, since it subtracts what
the column already carries anyway.

**Where withholding empties the drawer's function control, the control says
why** — and says something different from the message a fully-measured column
gets. "This column has them all" sends the user to this column's measures; "only
one Distinct Count fits in a grouped read" sends them to whichever other column
holds one, and names a **cost** rather than a prohibition, which is what the cap
actually is.

The rule is a property of the whole request rather than of any column, so it does
not go into the shared per-column predicate: `resolveOfferableAggregates` is
unchanged, and `resolveAffordableAggregates` composes on top of it, counting
every column's aggregates together. A `grouping` URL naming two distinct counts
is now refused by this package's own sanitizer, whole, rather than travelling to
the server to be refused there — and the store's seed guard refuses the same list,
which is the boundary a consumer's own loader reaches directly.

The published surface gains one constant and loses nothing:
`MAX_TABLE_COUNT_DISTINCT_AGGREGATES`, beside `MAX_TABLE_GROUP_KEYS` on
`./components/Table/Table.constants`, so a consumer can read the budget its own
surfaces have to respect. Both new utils behind it are internal to the Table and
are not exported.
