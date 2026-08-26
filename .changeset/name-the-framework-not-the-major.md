---
'@lcabrera/devkit': patch
'@lcabrera/ui': patch
---

Shipped documentation names React Router rather than the major it is on.

`@lcabrera/devkit`'s seeded `rules/routes-data.md`, `@lcabrera/ui`'s Form
`ARCHITECTURE.md` and `INVENTORY.md`, and a `SelectField` comment all stated a
major version as a present fact — as the shorthand `RR7` in most cases — and every
one was a full major out of date, because the catalog has pinned the next one for
some time.
Nothing checks a version written into prose, which is why it went wrong quietly
and why the wording is now the framework's name and its mode ("React Router
framework mode"), which stays true across a major.

A version still belongs in prose where it is a floor a reader must clear, such as
the middleware reference's `requires v7.9.0+`; those are unchanged.
