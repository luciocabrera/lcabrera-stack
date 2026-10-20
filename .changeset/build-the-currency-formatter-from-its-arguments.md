---
'@lcabrera/ui': patch
---

`getCurrencySymbol` now builds its `Intl.NumberFormat` in a private helper that takes the locale and currency as parameters. The resolved symbol is still cached per `locale:currency` key, a rejected currency code still falls back to the code itself, and the returned values are unchanged.
