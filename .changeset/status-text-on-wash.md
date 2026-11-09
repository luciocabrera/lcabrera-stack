---
'@lcabrera/ui': patch
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
theme and `oklch(88% 0.06 230)` in the dark one. The dark `successCardText`
moves from `oklch(85% 0.07 160)` to `oklch(88% 0.07 160)`, because the old value
measured 4.39:1 on `successBackground`.

Components that draw on a solid status fill keep the white `*Text` tokens: the
`error`, `success` and `warning` button variants, the `danger-ghost` hover, and
the Table cell badge tones. A theme that overrides a `*CardText` token now
colours these components with it.
