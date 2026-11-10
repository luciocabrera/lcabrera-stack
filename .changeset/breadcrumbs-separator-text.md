---
'@lcabrera/ui': minor
---

`Breadcrumbs` writes its separator as `/`, with a space on each side, so the trail's `textContent` reads as it is drawn: `Home / Projects / Reports` rather than `Home/Projects/Reports`. Code or snapshots that read the trail's text will see the spaces. The separator stays `aria-hidden` and unselectable, and the flex gap still sets the spacing on screen.
