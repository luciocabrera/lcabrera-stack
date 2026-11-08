---
'@lcabrera/ui': patch
---

Every icon now renders through the shared `IconBase` svg wrapper. Icons drawn
on a 16×16, 12×12 or 10×10 grid pass their own `viewBox` and default `size`,
and clear the wrapper's stroke defaults so their markup is unchanged. Each
icon's rendered attributes and children are the same as before.
