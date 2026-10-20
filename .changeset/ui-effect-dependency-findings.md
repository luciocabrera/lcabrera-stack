---
'@lcabrera/ui': patch
---

`useNotifyOnError` no longer raises a notification while the error it is given is `undefined`; it notifies when an error arrives and again when the error's identity changes. Effects across the package now depend only on the values they read: the table actions menu, the tab strip, the notification corners, the table's group-expansion pruning and the table config provider's column re-derivation keep their behaviour, except that the tab strip re-scrolls to the active tab when that tab's index changes rather than whenever the tab count changes, and its overflow follows the resize observer alone.
