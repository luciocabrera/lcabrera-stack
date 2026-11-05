---
'@lcabrera/ui': patch
---

Bring `textTertiary` to WCAG AA in both themes, at 4.5:1 on the background tokens
and on `surfaceSecondary`, because it colours `Text` with `tone='tertiary'` and
table header band labels. The light value was also far outside the sRGB gamut and
is now a neutral. Every other literal `oklch()` or `lab()` theme token outside
sRGB moves to the colour an sRGB display already painted for it, within three
8-bit levels per channel: `info` in both themes, light `successCardText` and
`warningCardText`, dark `brandPrimaryCardText`, `brandPrimaryTextActive` and
`errorCardText`. A wide-gamut display loses the extra saturation those tokens
had there.
