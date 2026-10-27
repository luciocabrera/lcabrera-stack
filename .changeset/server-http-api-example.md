---
'@lcabrera/server': patch
---

The README now shows how to serve an HTTP API with this package and `@lcabrera/utils` alone: a pool, a paginated read and an insert behind one `Request` to `Response` handler, a `node:http` server for it, and the error contract that keeps driver text out of every response. It also lists the `table-page` subpaths and the `query-canceled`, `grouping-refused` and `to-serializable-db-error` error exports, which the export tables were missing.
