---
'@lcabrera/ui': patch
---

`Breadcrumbs` writes its separator as `/`, with a space on each side, so the trail's text content reads as it is drawn: `Home / Projects / Reports` rather than `Home/Projects/Reports`. Copying the trail, or reading `textContent`, now gives the spaced form. The separator stays `aria-hidden`, and the flex gap still sets the spacing on screen.
