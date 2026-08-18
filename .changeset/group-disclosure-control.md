---
'@lcabrera/ui': minor
---

A grouped row can now be expanded and collapsed with a pointer.

Group expansion has worked since the treegrid slice, but the only thing wired to
it was the arrow-key handler — so to anyone using a mouse the feature did not
exist. The hierarchy column now leads with a disclosure chevron that toggles the
group it sits on, and reserves the same space on rows with nothing to open so
sibling labels stay aligned. The chevron replaces the decorative group icon that
used to occupy that spot.

**The chevron is deliberately not a button.** The grid has a single roving tab
stop addressed by row key plus column key; a button here would add a second one
inside a cell that already owns one. Expansion state stays on the row, where
`aria-expanded` already carries it, and the keyboard path is unchanged —
`ArrowRight` expands, `ArrowLeft` collapses, exactly as before.

Adds `DisclosureIcon` to the icon set.
