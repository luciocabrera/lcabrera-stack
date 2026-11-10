---
'@lcabrera/eslint-plugin': minor
---

Add `no-raw-ui-primitives`. It reports the raw intrinsic JSX forms of `table`, `select`, `button`, `input`, `textarea`, `h1`, `h2` and `h3`, so an application renders them through its component library. A component is never reported, whatever it renders. An `<input>` whose `type` is the string literal `"hidden"` is not reported either, because it draws no control. The rule is opt-in like every rule in the plugin: enable it for application code, not for the component library that renders these elements.
