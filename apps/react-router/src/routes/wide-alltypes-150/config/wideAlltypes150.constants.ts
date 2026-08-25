/**
 * The column list and the sort limits are copied (not imported) from the api layer on
 * purpose — that layer must never become a runtime dependency of this app
 * ([ADR-039](../../../../../../docs/decisions/ADR-039-duplicate-over-undeclared-edges.md)),
 * and this route is meant to keep rendering when it is not reachable at all.
 */

// Type-only (erased at build) — carries no `pg`/SQL runtime into this file.
import type { ColumnSort } from '@lcabrera/server/sort/sort.types';

export const WIDE_ALLTYPES_SCHEMA = 'public';
export const WIDE_ALLTYPES_TABLE = 'wide_alltypes_150';

export const WIDE_ALLTYPES_PRIMARY_KEY = 'id';

/**
 * Every sort term past the first is a tiebreaker over 1M rows on an unindexed column, and
 * this table's UI can hand over one term per visible column.
 */
export const MAX_WIDE_ALLTYPES_SORT_RULES = 5;

export const MAX_WIDE_ALLTYPES_LIMIT = 200;

/** The row ceiling a grouped read of this table is bounded by (ADR-066). */
export const WIDE_ALLTYPES_GROUP_MAX_ROWS = 2000;

const GENERATED_COLUMNS = Array.from(
  { length: 149 },
  (_value, index) => `c_${String(index + 1).padStart(3, '0')}`,
);

export const WIDE_ALLTYPES_COLUMNS: readonly string[] = [
  WIDE_ALLTYPES_PRIMARY_KEY,
  ...GENERATED_COLUMNS,
];

/**
 * Passed as `allowedColumns`, so a column never listed here is rejected before it can
 * reach SQL.
 */
export const WIDE_ALLTYPES_ALLOWED_COLUMNS: readonly string[] =
  WIDE_ALLTYPES_COLUMNS;

export const WIDE_ALLTYPES_SORTABLE_COLUMNS: ReadonlySet<string> = new Set(
  WIDE_ALLTYPES_COLUMNS.filter((column) => column !== 'c_018'),
);

export const WIDE_ALLTYPES_FALLBACK_SORT = [
  { columnKey: WIDE_ALLTYPES_PRIMARY_KEY, direction: 'asc' },
] as const satisfies readonly ColumnSort[];
