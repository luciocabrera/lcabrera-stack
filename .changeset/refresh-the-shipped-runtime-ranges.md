---
'@lcabrera/server': patch
'@lcabrera/devkit': patch
---

`@lcabrera/server` now declares `zod` at `^4.6.1`; a consumer installing it
resolves that release or later. `@lcabrera/devkit` pins Node 26.8.2 in the
`.node-version` it writes into a new repository, and derives the install band
from that pin.
