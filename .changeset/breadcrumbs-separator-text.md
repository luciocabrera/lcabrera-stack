---
'@lcabrera/ui': patch
---

`Breadcrumbs` writes its separator as `/`, with a space on each side, so the trail's `textContent` reads as it is drawn: `Home / Projects / Reports` rather than `Home/Projects/Reports`. The separator stays `aria-hidden` and unselectable, and the flex gap still sets the spacing on screen.
