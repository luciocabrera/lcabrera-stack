---
'@lcabrera/ui': patch
---

The light theme's `textSecondary` is now `lab(44 20 -30)`, opaque, in place of the translucent `lab(45 20 -30 / 0.8)`. The old value measured 3.47:1 on `backgroundPrimary` and lower on `backgroundSecondary` and `backgroundTertiary`, below the 4.5:1 WCAG AA asks of body text. The new one clears 4.5:1 on all three.

This is a visible change: secondary text in the light theme is slightly darker, and it no longer lets the surface beneath it show through. The dark theme's `textSecondary` already passed and is unchanged. A theme that overrides `textSecondary` is not affected.
