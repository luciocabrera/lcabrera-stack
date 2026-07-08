# ADR-027: App-graph symbol nodes (recursive function/class/type extraction)

**Status:** Accepted

## Context

ADR-022's app-graph scanner stores one row per folder/file in
`cqms.app_graph_nodes`, with `export_count`/`function_count`/`type_count`
as file-level aggregate _counters_. That's enough to know a file has 3
functions, but not which 3, where they start/end, whether they're
exported, or whether a helper is nested inside another function. The
Phase-2 "smart search" goal (letting a future feature reach any
artifact/piece of logic in the codebase, however deeply nested) needs
individual, addressable symbol rows — this is Step 2 of a two-step plan
(Step 1, unrelated lint/fallow/oxlint work, landed concurrently in the
same checkout and is untouched here).

## Decision

### 1. Extend the existing tree, no new tables (migration 0023)

Symbol nodes are ordinary `cqms.app_graph_nodes` rows, not a separate
`symbols`/`symbol_references` schema (an older TECH_SPEC.md sketch that
predates `app_graph_nodes` and is superseded). The `node_type` CHECK
widens from `folder|file` to add `function`, `method`, `class`,
`interface`, `type_alias`, `enum`. Six new nullable columns carry the
symbol-specific facts: `symbol_name`, `is_exported`, `is_component`,
`is_hook`, `start_line`, `end_line` — all meaningless for folder/file rows,
so no backfill and no NOT NULL. Two new indexes, `(scan_id, node_type)`
and `(scan_id, symbol_name)`, support the future search use case.
`parent_node_id` (already `NOT NULL`-less, already scoped by
`(scan_id, node_id)`) needed no schema change at all — a symbol's parent
is either the file node (top-level declaration) or the immediately-
enclosing named declaration's own node, exactly the same column folders
and files already use to chain to their parent folder.

**A `CREATE VIEW ... AS SELECT *` footgun caught during verification**:
`cqms.v_app_graph_nodes` (0014) is a plain `SELECT *` view, and Postgres
expands `SELECT *` to the underlying table's column list _at CREATE
time_ — an `ALTER TABLE ... ADD COLUMN` on `app_graph_nodes` does **not**
retroactively appear in the view. The migration's `ALTER TABLE` alone left
`v_app_graph_nodes` six columns behind the table; every query reading a
new field through the view failed with "column does not exist" until the
migration also `CREATE OR REPLACE VIEW`s it. Filed here so the next
column addition to any `v_*` view doesn't rediscover this the hard way.

### 2. `sp_ingest_app_graph` — append columns, keep the NOT NULL discipline

`CREATE OR REPLACE PROCEDURE` appends the 6 new columns to both the
`app_graph_nodes` INSERT list and the `jsonb_to_recordset(p_nodes)`
AS-clause (ADR-018/019 convention: every NOT NULL column must be emitted
explicitly by every row because `jsonb_to_recordset` never applies column
DEFAULTs). The 5 pre-existing NOT NULL aggregate columns
(`child_folder_count`/`child_file_count`/`export_count`/`function_count`/
`type_count`) are meaningless per-symbol, so symbol rows emit literal
`0`s for all five — the same convention file rows already followed, now
extended to symbol rows (`makeSymbolNode` in the runner, mirrored by the
hand-authored fixture in the new real-DB test).

### 3. Runner — recursive walker inside the existing per-file lifecycle

`generate-app-graph-report.mjs`'s `walkForSymbols` visits every immediate
child via ts-morph's `forEachChildAsArray()` (not the flattened
`forEachDescendant` `countFunctions` uses), so nesting is tracked
precisely: a candidate declaration — `FunctionDeclaration`,
`MethodDeclaration`, `ClassDeclaration`, `InterfaceDeclaration`,
`TypeAliasDeclaration`, `EnumDeclaration`, or an `ArrowFunction`/
`FunctionExpression` bound to a `VariableDeclaration`/`PropertyAssignment`
name (the exact `countFunctions` exclusion, reused verbatim so the two
counting semantics never drift apart) — becomes its own node parented to
the current container, and its own subtree is walked with itself as the
new container. Non-candidate nodes (an `if` block, a call expression, an
anonymous default export) recurse with the container unchanged, so a
helper nested arbitrarily deep inside ordinary control flow still resolves
back to the nearest enclosing named declaration, or the file if there is
none.

`analyzeSourceText` creates the file's node _first_ (so its `node_id`
exists to parent symbol nodes), then runs the walk _before_
`sourceFile.forget()` — never after, since a forgotten `SourceFile`'s
descendants are unusable. This keeps ADR-022's per-file
create/parse/forget memory discipline intact: nothing about the walk
holds more than one file's AST alive at a time.

### 4. Component/hook tagging — cheap naming heuristic, not AST-verified

A symbol gets `is_component`/`is_hook` only when **all** of: it's a
top-level declaration (immediate child of the file, not nested inside
another named declaration), it's exported, the _file's_ suffix-convention
category (a runner-local mirror of `classifyFileTypeCategory.util.ts`,
the same technique already used for `IGNORED_DIRECTORIES`) is
`component`/`hook`, and the name is PascalCase / `use`-prefixed
respectively. No JSX-return-detection, no hook-call-detection — explicitly
declined as overkill. Verified live: `Root.component.tsx`'s `Root` gets
`is_component: true`; the sibling `ErrorBoundary`/`Layout` in
`Root.errorBoundary.tsx`/`Root.layout.tsx` do not (right name shape, wrong
file suffix). Every `useX` in `packages/ui/src/hooks/*.hook.ts` gets
`is_hook: true`; private helpers in the same files (`handleMouseDown`,
`measure`, `get`/`set`/`reset`/`subscribe`) and exported functions in
sibling `*.util.ts` files do not.

### 5. Two aggregate-counting bugs the new node types exposed

With only `folder`/`file` node types, `!== 'folder'` and `=== 'file'`
were equivalent, so both the runner's `buildStats()` and
`extractAppGraphRunSummary.util.ts` used whichever shorthand was
convenient (`folder_count: nodes.length - fileNodes.length`,
`fileNodes = raw.nodes.filter(n => n.node_type !== 'folder')`). Symbol
node types break that equivalence — every one of those shortcuts would
have silently folded function/class/interface/type_alias/enum/method rows
into "file", inflating `file_count` and every export/function/type/line
total. Both places now filter explicitly (`=== 'file'`, `=== 'folder'`).
`total_node_count` and `max_depth` deliberately stay whole-tree (every
node type) — they describe the full row count and the deepest nesting in
the scan, which now legitimately includes symbol nesting beneath a file.

`extractAppGraphNodes.util.ts`'s node*type handling had the same class of
bug: it used to coerce \_any* non-`'folder'` value onto `'file'` (a
graceful-degradation choice that was fine when `file` was the only other
option). With 8 valid values, that coercion would have misfiled a
drifted/unrecognized `node_type` as a `file` row instead of dropping it.
It's now an explicit allowlist of the 8 CHECK-accepted values; anything
else is dropped, the same treatment already given to a node missing its
`node_id`.

### 6. No edges/references, no UI

Import/usage edges are out of scope this round — nodes only. No
app-graph browsing UI exists anywhere in `apps/admin_system` (confirmed
absent), so there is nothing to wire up.

## Verification performed

- Suites green: scan-ingestion **198/198** (64 files) — new/updated:
  `extractAppGraphNodes.util.test.ts` (symbol fields pass through nested
  under a file; unrecognized `node_type` now drops instead of coercing to
  `file`), `extractAppGraphRunSummary.util.test.ts` (a `function` row no
  longer inflates `file_count`/the export-function-type-line totals, but
  does count toward `total_node_count`/`max_depth`), and a new
  `describe('app-graph symbol nodes (ADR-027)')` block in
  `getScanAppGraphSummary.util.test.ts`: a hand-built folder → file →
  function('outer', exported) → function('inner') → function('innerInner')
  chain plus one sibling of every remaining new `node_type`
  (class/method/interface/type_alias/enum), ingested through the real
  `sp_ingest_app_graph` call, proving (a) the widened CHECK accepts all 8
  `node_type` values, (b) a recursive `WITH RECURSIVE` walk of
  `parent_node_id` from the 3-levels-deep `innerInner` resolves through
  `inner → outer → deep.ts → repo` exactly, and (c) `is_exported`/
  `start_line`/`end_line`/`symbol_name` round-trip correctly.
- Lint + typecheck clean for `packages/scan-ingestion`; migration 0023
  applied to the live `cqms_db` (including the `v_app_graph_nodes`
  view-recreation fix, applied directly since 0023 was already recorded
  in `cqms.schema_migrations` by the time the bug was found).
- **Live standalone run** (`generate-app-graph-report.mjs
packages/scan-ingestion --skip-ingest`): 548 nodes (16 folders, 211
  files, 130 `function`, 191 `type_alias`, 0 class/interface/enum/method —
  this package has none) in the raw JSON. Spot check against source:
  `countBy`, a private helper nested inside the exported
  `extractCodeSmellRunSummary` in
  `packages/scan-ingestion/src/ingestion/codeSmell/extractCodeSmellRunSummary.util.ts`,
  resolves via `parent_node_id` through
  `countBy(6) → extractCodeSmellRunSummary(5) →
extractCodeSmellRunSummary.util.ts(4) → codeSmell(3) → ingestion(2) →
src(1) → scan-ingestion(0)` — `start_line`/`end_line` (21/22 and 18/43
  respectively) and `is_exported` (`false`/`true`) match the file exactly.
- **Live ingestion through the real CLI path** (no `--skip-ingest`, the
  same artifact re-run): `ingest.cli.ts` → `sp_ingest_app_graph` succeeded;
  querying Postgres directly reproduced the identical `countBy` parent
  chain from the DB (not just the raw JSON), and
  `total_function_count`/`total_type_count` on the master row (130/191)
  matched the `function`/`type_alias` row counts exactly. The verification
  scan's `run`/`scan`/`app_graph_runs`/`app_graph_nodes` rows were deleted
  afterward (`DELETE FROM cqms.runs WHERE id = ...`, cascading through
  `scans` → `app_graph_runs`/`app_graph_nodes`) — the shared
  `vite-react-compiler` self-scan project (113 other real scans) was left
  untouched.

## Deferred

- Migration numbering: this landed as `0023_app_graph_symbol_nodes.sql`
  in an isolated worktree while unrelated Step-1 work (lint/fallow/oxlint)
  proceeds concurrently in the same checkout under files this ADR
  deliberately did not touch. If that work also adds a `0023`, one side
  needs a rename when the branches merge — the migration runner keys off
  filename in `cqms.schema_migrations`, so a rename is safe as long as it
  happens before either migration reaches an environment where the other
  is already applied.
- Import/usage edges between symbols (Phase-2 territory) remain
  out of scope, as does any browsing UI.
