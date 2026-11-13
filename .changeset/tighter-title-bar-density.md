---
'@lcabrera/ui': patch
---

The `toolbar` variant of `Title` uses less block padding at each `size`, so a sized title bar stays close to the table's row heights. Each step now adds 4px, 8px, 12px or 16px above and below its content (it was 12px, 24px, 32px and 48px). A `Title` without a `size` keeps the 24px block padding it had before. A table's title bar sets its size from the title bar density, so it gets shorter at every level.
