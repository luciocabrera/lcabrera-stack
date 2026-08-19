/**
 * Entity configuration for the `wide_alltypes_150` table.
 *
 * App-local plain data only — NO SQL and NO `pg` here. The generic
 * `@lcabrera/server` query builders receive this configuration (`schema`,
 * `table`, column lists, `allowedColumns`) as plain data.
 *
 * The column list and the sort limits are copied (not imported) from the api
 * layer on purpose — `apps/shared`/`api-shared` must never become a runtime
 * dependency of this app
 * ([ADR-039](../../../../../../docs/decisions/ADR-039-duplicate-over-undeclared-edges.md)),
 * and this route is meant to keep rendering after that package is no longer
 * reachable at all (#686).
 */

// Type-only (erased at build) — carries no `pg`/SQL runtime into this file.
import type { ColumnSort } from '@lcabrera/server/sort/sort.types';

export const WIDE_ALLTYPES_SCHEMA = 'public';
export const WIDE_ALLTYPES_TABLE = 'wide_alltypes_150';

/** The primary key, and the only column not named `c_NNN`. */
export const WIDE_ALLTYPES_PRIMARY_KEY = 'id';

/**
 * How many columns a single read may order by.
 *
 * Every sort term past the first is a tiebreaker over 1M rows on an unindexed
 * column, and this table's UI can hand over one term per visible column. The
 * cap bounds what a hand-edited request can ask the planner for; the terms past
 * it are dropped rather than refused, because the leading terms already answer
 * the question the user asked.
 */
export const MAX_WIDE_ALLTYPES_SORT_RULES = 5;

/**
 * The largest page this endpoint will serve. The table asks for
 * `INITIAL_PAGE_SIZE`; the cap exists because the URL is public and a row here
 * is 150 columns wide.
 */
export const MAX_WIDE_ALLTYPES_LIMIT = 200;

/**
 * The row ceiling a grouped read of this table is bounded by (ADR-066).
 *
 * Lower than the enterprise-orders ceiling, and for a reason specific to this
 * table: it exists to be **wide**, so a group row here carries far more columns
 * than one there and the same row count costs more to ship and to paint.
 */
export const WIDE_ALLTYPES_GROUP_MAX_ROWS = 2000;

/** Every generated column of the table: `c_001` … `c_149`. */
const GENERATED_COLUMNS = Array.from(
  { length: 149 },
  (_value, index) => `c_${String(index + 1).padStart(3, '0')}`,
);

/** Every column of `wide_alltypes_150`: the key plus `c_001` … `c_149`. */
export const WIDE_ALLTYPES_COLUMNS: readonly string[] = [
  WIDE_ALLTYPES_PRIMARY_KEY,
  ...GENERATED_COLUMNS,
];

/**
 * Allow-list guarding every request-derived column that reaches a generic query
 * builder. Passed as `allowedColumns`, so a column never listed here is
 * rejected before it can reach SQL.
 */
export const WIDE_ALLTYPES_ALLOWED_COLUMNS: readonly string[] =
  WIDE_ALLTYPES_COLUMNS;

/**
 * Columns a read may ORDER BY.
 *
 * `c_018` is `point`, which has no btree ordering — Postgres rejects the whole
 * query rather than that one term, so a sort naming it is dropped before it
 * reaches the builder. It stays perfectly selectable; only ordering is refused.
 */
export const WIDE_ALLTYPES_SORTABLE_COLUMNS: ReadonlySet<string> = new Set(
  WIDE_ALLTYPES_COLUMNS.filter((column) => column !== 'c_018'),
);

/**
 * The ordering a paginated read falls back to when the request carries no
 * usable sort — the primary key ascending, the one column guaranteed unique.
 * Without it a paginated read has no ORDER BY, which repeats and skips rows as
 * the planner changes plans between requests.
 */
export const WIDE_ALLTYPES_FALLBACK_SORT = [
  { columnKey: WIDE_ALLTYPES_PRIMARY_KEY, direction: 'asc' },
] as const satisfies readonly ColumnSort[];
