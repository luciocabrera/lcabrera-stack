---
'@lcabrera/server': patch
---

`getPool` now attaches an `error` listener to the pool it creates, so a connection that fails while idle in the pool no longer stops the process with an unhandled `error` event. The pool drops the connection and the next query opens a new one.

While no other listener is attached, the failure is reported through `process.emitWarning` with code `LCABRERA_SERVER_POOL_IDLE_ERROR`. A listener added with `getPool().on('error', …)` still receives the error, and the warning is skipped.
