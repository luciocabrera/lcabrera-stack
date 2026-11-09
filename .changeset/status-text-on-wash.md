---
'@lcabrera/ui': minor
---

Status text now uses the wash foreground. `StatusBadge`, `InfoBox`, `Text` with
an `error`, `info`, `success` or `warning` tone, `FormFieldChrome`'s error
message and required marker, the status dismiss buttons in `NotificationItem`
and the yes/no badges in the Table's column details drew their text with
`errorText`, `infoText`, `successText` or `warningText`. Those tokens are white,
the foreground for a solid status fill, so on the pale `*Background` wash or the
page they measured about 1.1:1 in the light theme. They now use the matching
`*CardText` token and reach WCAG AA (4.5:1) in both themes.

A new `infoCardText` token completes the set: `oklch(40% 0.07 230)` in the light
theme and `oklch(91% 0.05 230)` in the dark one.

The dark theme's `*CardText` tokens are lighter. A translucent wash laid over
one of the lighter dark surfaces, such as `surfaceElevated`, comes out lighter
than over the page, and there the old values fell below 4.5:1: `errorCardText`
measured 4.09:1 and `warningCardText` 4.26:1, and `successCardText` was lower
still. The new dark values are `errorCardText` `oklch(91% 0.04 25)` (was
`oklch(87.1% 0.068 25.8)`), `warningCardText` `oklch(91% 0.075 80)` (was
`oklch(88% 0.09 80)`) and `successCardText` `oklch(91% 0.06 160)` (was
`oklch(85% 0.07 160)`). Over `surfaceElevated` the four dark tokens now measure
between 4.67:1 and 4.79:1 on their washes, and every other surface measures
higher. `Card`'s error, success and warning variants use these tokens, so they
are lighter in the dark theme too.

Components that draw on a solid status fill keep the white `*Text` tokens: the
`error`, `success` and `warning` button variants, the `danger-ghost` hover, and
the Table cell badge tones.

This is a minor release for two reasons. `infoCardText` is a new key on the
exported `colors` var group. And a theme override changes what it reaches. A
theme that sets `errorText`, `infoText`, `successText` or `warningText` no
longer colours the status text of `StatusBadge`, `InfoBox`, `Text`,
`FormFieldChrome`, the `NotificationItem` dismiss buttons or the column-details
badges; to restyle that text, set the matching `*CardText` token instead. An
override of a `*Text` token still reaches the solid-fill components above.
