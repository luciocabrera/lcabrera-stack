---
'@lcabrera/server': minor
---

`mapDbError` now returns a `QueryRefusedError`, or any subclass such as `GroupingRefusedError`, unchanged. Before, it wrapped a refusal in a `PersistenceError`, so a refusal that reached a `catch` calling `mapDbError` serialised as `{ kind: 'unexpected' }` instead of `query-refused` or `grouping-refused`.

Breaking for callers:

- The return type of `mapDbError` is now `PersistenceError | QueryRefusedError`. Code that reads `fields` on the result directly must narrow with `instanceof PersistenceError` first.
- A refusal passed to `mapDbError` is no longer `instanceof PersistenceError`. Code that relied on the wrapping now receives the refusal itself.
