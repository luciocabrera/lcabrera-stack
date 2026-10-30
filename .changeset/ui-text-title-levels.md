---
'@lcabrera/ui': minor
---

Add `Text`, a typography primitive, and give `Title` heading levels and a plain variant.

`Text` renders a `p` by default, or a `span`, `div`, `label`, `figcaption`, `dt` or `dd` through `as`. `size` (`xs`, `sm`, `md`, `lg`; default `md`), `tone` (`primary`, `secondary`, `tertiary`, `error`, `info`, `success`, `warning`; default `primary`) and `weight` (`normal`, `medium`, `semibold`, `bold`) each map to a typography or colour token. `isMono` switches to the monospace family, `isTabular` turns on tabular figures, and `customStylex` is applied last.

`Title` takes `level` (`1`, `2` or `3`; default `2`) and `variant` (`toolbar`, the default, or `plain`). The defaults render the same `h2` toolbar heading as before. `plain` drops the padding, the bottom border and both gradients, and sizes the heading from its level: `fontSize2xl` bold at 1, `fontSizeLg` semibold at 2, `fontSizeMd` semibold at 3. `Title` now passes the `div` props it receives to its container instead of dropping them.

Both components, with their `TextProps` and `TitleProps` types, are exported from the package root and from the new `./components/Text` and `./components/Title` subpaths.
