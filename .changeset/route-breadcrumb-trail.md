---
'@lcabrera/ui': minor
---

A route's `handle.breadcrumb` may return a list of `BreadcrumbItem`s as well as
one. `useRouteBreadcrumbs()`, and a `PageHeader` given no `breadcrumbs`, spread
the list in place, in order, between the items of the routes around it, and an
empty list adds nothing. A route declared as a sibling of the page its trail
starts from, rather than as its child, has no parent route to supply that step;
it can now name the whole trail from its own handle. A handle that returns one
item behaves as before, so `BreadcrumbHandle` only widens.
