---
'@lcabrera/ui': patch
---

A Table column that is currently a **group key** no longer offers aggregation
functions in its header actions menu.

A grouped column renders its key's value rather than a measure
([ADR-080](https://github.com/luciocabrera/vite-react-compiler/blob/main/docs/decisions/ADR-080-a-group-key-renders-in-its-own-column.md)),
so the aggregate a user picked there was written to the grouping state and then
dropped by the rendering — the menu item looked broken. The settings drawer's
"Add Aggregate" picker already left those columns out, so the two surfaces
disagreed in the same session.

Both now resolve "may this column be aggregated, and with what" through one
predicate, `resolveOfferableAggregates`, which composes the loader-shipped
catalogue's type legality with group-key membership. Each surface still feeds it
from its own state — the header menu from the applied grouping, the drawer from
its staged draft — so the picker keeps reflecting an edit that has not been
accepted yet.

Suppression follows the menu's existing shape for an illegal command: the
functions **and** the "No Aggregate" clear item are absent while the column is a
key, exactly as they already were for a column the catalogue can aggregate in no
way. Everything else in that column's menu — sorting, grouping, pinning, hiding
and Manage Column — is unchanged, and removing the column from the grouping
brings its aggregation items back.

This constrains what is _offered_ and nothing else. The grouping configuration
travels in the URL, so a request can still name one column as both key and
measure; there the key wins, as it already did.
