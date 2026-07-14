# ADR-030: Bounded column types via in-place migration re-baseline

**Status:** Accepted
**Amends:** ADR-028 (which chose to **stack** migrations "not re-baseline" and keep provenance in the numbered sequence — this ADR re-baselines _in place_ for a type-hygiene sweep, under the pre-merge/dev-only conditions ADR-028 itself relied on).

## Context

The CQMS schema had defaulted the vast majority of string columns to `text` — 363 `text` columns across 36 base tables. The owner directed (2026-07-14) that columns should not default to `text`: a column's type should express its domain constraint, and `text` be reserved for genuinely-unbounded content. (In Postgres `text` and `varchar(N)` are storage/perf-identical; the value is the length constraint + intent.)

Two mechanism options were weighed (the open §7.5 question from the alignment review): an additive `ALTER TABLE ... ALTER COLUMN` migration (preserves history, leaves the `CREATE TABLE`s reading `text` + ALTER cruft) vs. **re-baseline in place** (edit the original `CREATE TABLE`/`ADD COLUMN` statements so each table is defined correctly at creation, then re-provision the dev DB). The owner chose re-baseline — viable precisely because `feat_cqm` is **pre-merge** and the DB is **re-provisionable** with no production data, the same clean-break footing ADR-028 stands on.

## Decision

- **Bound by category** (`packages/scan-ingestion/src/db/migrations/0001`–`0028`): enum-like / short codes → `varchar(16–32)` (`severity`, `status`, `confidence`, `effort`, `outcome`, `scope_type`, `resource_type`, `action`, `trend`, `health_grade`, …); ids/codes/categories → `varchar(64)`; handles → `varchar(100)` (`username`, `role_name`, `triggered_by`, `owner`); hashes → `varchar(128–255)`; names + **externally-ingested identifiers** → `varchar(255)` (generous headroom so real scan data — `function_name`, `symbol_name`, `rule_id`, `finding_id` from arbitrary codebases — never overflows).
- **Keep `text`** for genuinely-unbounded content: free text (`why`, `fix`, `evidence_excerpt`, `description`, `message`, `report_markdown`, `steps_markdown`, `recommendation`, `reason`, `command`, `fragment`, `top_risk`) and filesystem paths (`file_path`, `storage_path`, `skill_path`, `workspace_path`, `location_path`).
- Result: **103 columns bounded, 52 kept `text`.**
- **Re-baseline mechanism:** the `CREATE TABLE`/`ADD COLUMN` type tokens were edited in place; the dev DB was dropped and re-provisioned from the full migration sequence. `api_tokens` (0028, ADR-029) is the exemplar the rest now follow.

## Consequences

- **Zero application churn:** node-postgres reads `varchar` as a JS `string` exactly like `text`, so no TypeScript row types, query utils, or tests changed — this is a SQL-only sweep.
- **plpgsql gotcha:** a `LANGUAGE sql` function implicit-casts varchar→text in its result, but a `LANGUAGE plpgsql` function using `RETURN QUERY` is **strict** — a varchar column returned into a `RETURNS TABLE(col text)` throws `structure of query does not match function result type`. Fixed by casting `col::text` in the `RETURN QUERY SELECT` (`fn_get_api_token_secret`). Audited: the only two plpgsql `RETURN QUERY` paths are `fn_set_project_snapshot` (returns kept-`text` `storage_path`) and `fn_get_api_token_secret` (cast); the three `RETURNS TABLE` functions are otherwise `LANGUAGE sql` or return uuid/void.
- **Departure from ADR-028's stacked stance** is bounded to this dev-only, pre-merge re-provision — once the branch merges, migrations return to stack-only (edits to shipped migrations would then break already-provisioned environments).
- **Verified:** fresh re-provision applies all 28 migrations + seeds; scan-ingestion 221 + scan-orchestrator 10 + admin_system 42 tests green.
