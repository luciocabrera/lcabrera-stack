---
'@lcabrera/ui': minor
---

**Breaking:** the application navigation sidebar is now permanent. `AppNavigation`
always renders as a pinned `<aside>`, so the pin/unpin toggle, the close button
and the floating launcher rail are gone, along with the `defaultIsPinned` prop
and the `navigation.pinned` global preference (its Settings → Navigation section
included).

Primary navigation is the one control that must never be more than a click away,
and unpinning could leave a route with no visible way back — the launcher was a
second affordance existing only to undo the first. Collapsing still works and is
the supported way to reclaim horizontal space: the panel narrows to an icon rail
instead of disappearing.

Removed from the public surface: `GlobalNavigationPinnedPreference`,
`NAVIGATION_PINNED_PREFERENCE_OPTIONS`, `useGetGlobalNavigationPinnedPreference`,
and the `pinned` field of `GlobalNavigationPreferences`. A stored settings cookie
that still carries `navigation.pinned` is not an error — the field is ignored on
read, so existing users keep their collapsed/size preferences and simply get the
docked sidebar.

`SidePanel`'s own `isPinned` prop is untouched; the Table settings drawer still
pins and unpins as before.
