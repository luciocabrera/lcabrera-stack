---
'@lcabrera/ui': patch
---

The column header menu's Pin Left, Pin Right and Clear Pinning items are now rendered by one internal component instead of three copies that took the same props. The items look and behave as before: Pin Left and Pin Right still toggle and report `aria-pressed`, and Clear Pinning stays disabled until the column is pinned. No export changed.
