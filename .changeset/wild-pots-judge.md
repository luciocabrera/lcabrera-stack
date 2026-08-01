---
'@lcabrera/ui': patch
---

Radio option cards now carry the same surface as the settings drawer's draggable
rows — a translucent fill that lifts on hover — instead of sitting transparent
with no pointer feedback. The keyboard focus ring that `appearance: none` had
stripped from the radio input is restored.

That surface was written out verbatim in `DraggableListItem` and `FilterItem`; it
is now the shared `surfaceStyles.interactiveCard` recipe, exported from
`@lcabrera/ui/design-system/tokens/surfaces.stylex`. The draggable row's emitted
CSS is unchanged; the filter item gains the fill/border transition it was missing.

Affects every `RadioOptionGroup` consumer: the pin-side and conflict modals, the
Settings radio sections, and `RadioField` in the Form builder.
