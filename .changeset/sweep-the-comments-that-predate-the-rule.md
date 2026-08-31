---
'@lcabrera/repo-standards': patch
'@lcabrera/vite-config': patch
'@lcabrera/devkit': patch
'@lcabrera/server': patch
'@lcabrera/node': patch
'@lcabrera/api': patch
'@lcabrera/ui': patch
'@lcabrera/utils': patch
---

Remove the comments that predate `no-explanatory-comments` from every package
source the rule reaches.

Nothing about behaviour changes, but the removal is visible in an editor: a
declaration's JSDoc is carried into the published `.d.mts`, so a tooltip that
used to show a paragraph now shows the signature. What the paragraph said lives
where it is dated — the ADR that owns the decision, or the pull request that
made it — and the annotations a build reads (`@param`, `@returns` and the rest,
in the JavaScript sources that ship them) are untouched.

Four declarations changed shape rather than only losing prose, because their
only body was a comment and removing it left an empty block: `getApiBaseUrl`
resolves a request URL through a helper instead of swallowing the parse in an
empty `catch`, `parseVersionedPayload` and `collectPersistedStateSlices` return
and `continue` explicitly, and the logger's no-op is an expression. Each behaves
as it did.

Two union member orders moved with them — `TableResponseError`'s arms and
`AggregateItem`'s intersection — because the sort those rules apply reads the
member's source text, and the text no longer carries a comment. A union is
unordered to a consumer.
