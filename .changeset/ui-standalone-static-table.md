---
'@lcabrera/ui': minor
---

`StaticTable` is now public: import it from the root barrel or from
`@lcabrera/ui/components/StaticTable`. It renders an array of rows you already
hold, and `columns` is now optional — leave it out and one column per key is
inferred with `inferTableColumnsFromJson`. The table still has to render inside
a React Router data router.
