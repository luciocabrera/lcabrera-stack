---
'@lcabrera/ui': minor
---

`TableQueryRefusalReason` and the reason record that `readRefusedError` checks against now carry the reasons a `query-refused` response can name for a join or a filter on a grouped result: `join-allowlist-missing`, `join-relations-missing`, `join-not-declared`, `join-ambiguous`, `join-kind-unsupported`, `join-alias-taken`, `join-source-unknown`, `keyset-unique-column-joined`, `projected-alias-too-long`, `group-filter-grouping-unsupported`, `group-filter-column-axis`, `group-filter-alias-unknown` and `group-filter-operator-unsupported`. Before this, such a response was not recognised as a refusal. A `dataErrorSelector` or other code that switches over `TableQueryRefusalReason` exhaustively has new cases to handle.
