---
'@lcabrera/ui': minor
---

`ThemeProvider` now applies `defaultTheme` only when `initialTheme` is `undefined`. Before, it also fell back to `defaultTheme` when `initialTheme` was `null`.

**This is the breaking part:** a caller that passes `initialTheme={null}`, which the `ThemeMode | undefined` type does not admit but plain JavaScript can, now starts with a `null` theme instead of `defaultTheme`. Pass `undefined`, or leave the prop out, to get `defaultTheme`. Every value the type admits behaves as before.
