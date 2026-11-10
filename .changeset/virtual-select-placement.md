---
'@lcabrera/ui': minor
---

`VirtualSelect` takes a `placement` prop, `'auto' | 'bottom' | 'top'`, for the
side its floating list opens on. `'bottom'` and `'top'` fix the side; with
little room on it, the list keeps a few rows' height rather than shrinking to
nothing. `'auto'`,
the default, opens below and flips above only when the list does not fit below
and the room there cannot show a few rows.

On either side the list now shrinks to the room left in the viewport and
scrolls, where before it kept its full height and flipped above whenever it did
not fit below. A select in the lower half of a drawer or form now opens below
it, as long as there is room for a few rows.

`VirtualList` sizes its scroll area to its loaded options up to
`listMaxHeight`, where before it always took the full `listMaxHeight`. A short
list no longer leaves an empty band under its last option. The height counts
every loaded option rather than the ones a search or filter mode leaves, so
filtering never changes it. No call site needs to change.

`VirtualList` draws its search box and option list as one bordered group with
no gap between them. `VirtualSelect` joins its trigger to the top of that
group whenever the list sits below it, always-open or floating, so trigger,
search box and list read as a single box with rounded outer corners. A floating
list that opens above keeps a gap, since the list footer sits next to the
trigger on that side. The trigger's corner radius matches the list's.

`VirtualList` option rows are now exactly the row height its virtualization
assumes, 36px. They used to take their height from padding and content and
came out taller, so a short list showed a scrollbar it did not need.

An empty multi `VirtualSelect` trigger now lines up exactly like a single one.
With a selection, it keeps its tags on one row at the trigger's
usual height, collapsing the rest into the `+N more` badge, so selecting and
clearing options no longer changes the trigger's height. The number of tags
shown no longer drops by one each time the trigger is measured again.

`VirtualSelect` takes an `attachedEdge` prop, `'top' | 'bottom'`, for a select
stacked flush against another control: the trigger squares that edge, and on
`bottom` drops its border so the control below draws the dividing line. A
table filter whose value is picked from an option list now draws its operator
select and that list as one box, with no gap between them.
