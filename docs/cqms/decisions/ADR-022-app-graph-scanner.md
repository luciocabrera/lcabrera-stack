# ADR-022: App-graph scanner (structure inventory via ts-morph)

**Status:** Accepted

## Context

Phase-3 requirement (interview decision 9): the app graph — a nested
folder/file tree with per-file symbol counts — is its own deterministic
scanner (`app-graph`), not a UI-side computation. It reuses the whole
pipeline every other scanner already has (queue, scoping, master/detail,
RBAC'd ingestion) and lays the groundwork for the Phase-2 symbol
dependency graph. It is an INVENTORY, not an audit: a scan of it emits
**0 findings by design** and its value is the structural dataset.

## Decision

### 1. Runner — plain-Node script, ts-morph resolved from this repo

`.github/skills/app-graph/scripts/generate-app-graph-report.mjs` follows
the shared deterministic-runner contract (`--target/--scope/--output-dir/
--skip-ingest`, machinery imported from
`code-smell-shared/scripts/deterministic-scan-shared.mjs`). ts-morph
(new `ts-morph` catalog entry + root devDependency, the `fallow`
precedent) is resolved via `createRequire(...).resolve` with
`paths: [repoRoot]` — an arbitrary registered target needs no install.
Files are parsed one at a time and `forget()`-ten immediately so memory
stays flat; a per-file parse failure zeroes that file's counts and the
scan continues (ADR-015's graceful degradation; a whole-walk failure
degrades to an empty inventory in target mode, hard-exits in legacy
mode).

The directory skip list deliberately mirrors
`buildFileInventory.util.ts`'s `IGNORED_DIRECTORIES`, so the node tree
and the generic `run_files` inventory describe the same file set — the
live E2E's strongest cross-check (see below). Node paths are
git-root-relative like every other detail table (`'.'` for a repo-scope
root), names/extensions follow `buildFileInventory`'s conventions
(dotfiles keep their full name as the extension).

**Counting semantics** (deterministic, documented here so a future
reader doesn't re-derive them):

- `export_count`: top-level export statements — named exports count
  individually, `export * from` counts once, an exported variable
  statement counts one per declaration.
- `function_count`: function/method declarations anywhere, plus
  arrow/function expressions bound to a name (variable declaration or
  object property). Inline callbacks deliberately don't count.
- `type_count`: top-level interfaces + type aliases + enums.
- `line_count`: `text.split('\n').length`, the `run_files` convention.
- Only the TS/JS family (`.ts/.tsx/.mts/.cts/.js/.jsx/.mjs/.cjs`) is
  parsed; other files carry zeroed symbol counts and
  `is_analyzed: false` in the raw artifact.

### 2. Schema — integer node ids scoped to the scan (migration 0014)

`app_graph_runs` (1:1 master: node/folder/file counts, max_depth,
analyzed_file_count, export/function/type/line totals) +
`app_graph_nodes` (one row per node). Parent linkage is a
**runner-assigned sequential integer `node_id`** with
`UNIQUE (scan_id, node_id)` and a plain `parent_node_id` integer (NULL
only on the root) — no uuid remapping pass, no two-pass WITH ORDINALITY
(the clone-groups pattern isn't needed when the producer controls the
ids). `sp_ingest_app_graph(p_user_id, p_scan_id, p_master, p_nodes)`
follows the ADR-018/019 conventions exactly (assert-permission first,
DELETE-then-INSERT idempotency, every NOT NULL field emitted explicitly
because `jsonb_to_record(set)` never applies column DEFAULTs).
`file_type_category` is applied at extraction time by the existing
`classifyFileTypeCategory.util.ts` (files only — folders keep NULL);
the raw artifact stays classification-free.

### 3. Extraction — master derived from nodes, never copied from stats

`ingestion/appGraph/`: loose Zod raw schema (every field
defaulted/nullish; `node_id` nullish so ONE drifted node is dropped by
the extractor instead of failing the scan), `extractAppGraphNodes`
(coerces unknown `node_type`s onto the CHECK constraint's folder|file,
omits nullable keys — the lintViolation.types.ts convention), and
`extractAppGraphRunSummary`, which derives every aggregate **from the
nodes array**, ignoring the runner's own `stats` block — master and
detail can never disagree (the code-smell-masters precedent: the
verifiable rollup beats the tool's claimed counts).

### 4. Registration

`DETERMINISTIC_SCANNER_CONFIGS` gains `app-graph` (raw artifact
`app-graph.raw.json`); the scanners table seed row is
`deterministic=true, is_active=true`; `scannerIdSchema` gains
`'app-graph'`. The orchestrator needed zero changes. The trigger-scan UI
lists it automatically (scanner options are DB-driven). The skills
validator classifies `.github/skills/app-graph/` as a non-skill script
directory (the `code-smell-shared` precedent) — no SKILL.md, because
there is no interactive flavor of an inventory walk.

## Verification performed

- Suites green: scan-ingestion **156/156** (8 new: both extractor tests
  and a real-DB `getScanAppGraphSummary` test proving master↔detail
  agreement, parent linkage through `(scan_id, node_id)`, DELETE-then-
  INSERT idempotency, and the no-master `undefined` case);
  scan-orchestrator green; lint + typecheck clean; migration 0014
  applied to live `cqms_db` by the idempotent runner.
- **Live UI E2E** (real login as admin, repo-root CQMS project,
  orchestrator running — after killing a leftover second orchestrator
  process whose duplicate `LISTEN cqms_scan_queued` session would have
  raced the queue): repo-wide app-graph scan **succeeded** in ~35 s with
  3012 nodes (489 folders, 2523 files, max depth 11, 2074 ts-morph-
  analyzed files, 2601 exports / 1820 functions / 1066 types / 241 081
  lines). Probes: exactly 1 root, 0 orphaned parents, 0 per-folder
  child-count mismatches, detail sums = master totals, and
  `file_count` (2523) **exactly equals the independently-built
  `run_files` inventory** for the same run — two separate walk
  implementations agreeing on the file set. Spot check:
  `triggerScan.util.ts`'s row reads 2 exports / 1 function / 2 types /
  66 lines / category `util` — all correct against the source.
- Folder-scoped run (`packages/ui`, the ADR-021 fan-out path) succeeded
  with a correctly-scoped root node (`path='packages/ui'`, 1671 files);
  deleting that verification run cascaded its master + all node rows
  away cleanly. The repo-wide inventory run was kept as real data.
