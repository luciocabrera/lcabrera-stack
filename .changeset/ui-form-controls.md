---
'@lcabrera/ui': minor
---

Add `Select`, `TextInput` and `DescriptionList`, and export `Card`, `InfoBox`,
`Tag` and `Tooltip`. Each is exported from the package root and from its own
`@lcabrera/ui/components/<Name>` subpath; `TrendSparkline` already was.

`Select` and `TextInput` each render one native element and take its
attributes and `ref`. Give them a `name` and a `defaultValue` and a router
`<Form method="get">` submits them before hydration as well as after, with no
value held in state. `Select` takes `options` of `{ value, label }`. Both take
an optional visible `label`, tied to the control by a `useId` id unless you
pass `id`, a `size` on the `Button` scale, and `customStylex`, which is applied
last.

`VirtualSelect` takes `name` and `label`. With `name` it renders one hidden
input per selected value, so a form submits its selection once the page is
hydrated. `label` draws a visible label that names the trigger.

`DescriptionList` renders `items` of `{ term, value }` as `dt` and `dd` pairs in
a `dl`. `layout` is `grid` (the default) or `inline`, and a value can be any
React node.

`InfoBox` takes `tone` (`neutral`, the default, or `info`, `success`, `warning`
or `error`) and passes `role` and the other `div` attributes through. `Tag`'s
`onRemove` is optional, and without it the chip has no remove button.
