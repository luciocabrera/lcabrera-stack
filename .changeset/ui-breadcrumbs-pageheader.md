---
'@lcabrera/ui': minor
---

Add `Breadcrumbs`, `useRouteBreadcrumbs()` and `PageHeader`, and give `NavLink` an `inline` text-link variant.

`Breadcrumbs` takes `items` (`{ label, to? }`) and an optional `label` for its landmark (default `'Breadcrumb'`). It renders a `nav` holding an `ol`. An earlier item with a `to` is a router `Link`, an earlier item without one is text, and the last item is always text with `aria-current='page'`. The separator between items is `aria-hidden`. An empty trail renders nothing. It needs a mounted router.

`useRouteBreadcrumbs()` builds the same items from the matched routes. A route opts in by exporting `handle = { breadcrumb: (match) => ({ label, to }) }`, typed by `BreadcrumbHandle` (generic over the route's loader data). Routes with no `breadcrumb` are skipped. It reads `useMatches()`, so it needs a data router.

`PageHeader` takes `title`, `breadcrumbs`, `description` and `actions`, and renders the breadcrumbs, one plain level-1 `Title` with the actions beside it, and the description as secondary `Text`. With no `breadcrumbs` it uses `useRouteBreadcrumbs()`, which needs a data router; explicit `breadcrumbs` need only a router. It never sets the document title, which stays with each route's `meta` export.

`NavLink` takes `variant='inline'` for a link in running text: brand-tinted text that takes the surrounding font, underlined on hover and focus-visible, with no button padding or border, a semibold underlined active state and a dotted-underline pending state. Its text and focus colour is `brandPrimaryCardText`. `size` and `orientation` do not apply to it. It still wraps the router's `NavLink`, so `prefetch` (default `'intent'`), `viewTransition`, `reloadDocument` and `state` pass through. The other variants are unchanged.

`Breadcrumbs`, `PageHeader`, `useRouteBreadcrumbs` and the `BreadcrumbHandle`, `BreadcrumbItem`, `BreadcrumbsProps`, `NavLinkProps`, `NavLinkVariant` and `PageHeaderProps` types are exported from the package root. The new `./components/Breadcrumbs` and `./components/PageHeader` subpaths export them as well, and `./components/NavLink` now exports `NavLinkProps` and `NavLinkVariant`.
