---
'@lcabrera/ui': minor
---

A grouped measure can now be shown as a share of the grand total, with a proportional bar.

Turn it on per aggregate in the settings drawer. Each group row then shows its measure as a percentage beside the number, at every level of a multi-key grouping — leaves, subtotals, and the grand total reading 100%.

The share is offered on `sum` and `count` and on no other aggregate. The denominator is derived from the rows the read already returned rather than asked of the server, and that is only correct where adding the parts gives the whole: summing each group's `avg` is not the set's average, and summing each group's `count(DISTINCT …)` counts a value once per group it appears in — which would produce shares that still add to 100% while being wrong several times over. ADR-086 carries the measurements.

Nothing about a share changes the SQL the route emits, so turning one on costs no round trip. It travels in the `grouping` search param with the rest of the configuration, so a shared link opens showing what its author saw; a link naming a share on an aggregate that cannot carry one is refused whole, as every other illegal member of that param already is.

An absent or zero denominator renders an explicit absence rather than `0.0%` or `NaN`, and the bar is hidden from the accessibility tree because the value it depicts is already text beside it.
