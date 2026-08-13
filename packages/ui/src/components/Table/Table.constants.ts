import type { TableAggregateFn, TableGroupRow } from './Table.types';

/**
 * Default minimum column width when not specified
 */
export const DEFAULT_MIN_COLUMN_WIDTH = 60;

/**
 * Default maximum column width when not specified
 */
export const DEFAULT_MAX_COLUMN_WIDTH = 600;

/**
 * Pixels a column grows/shrinks per arrow key on the resize handle.
 */
export const COLUMN_RESIZE_KEYBOARD_STEP = 8;

/**
 * Pixels a column grows/shrinks per shift+arrow key on the resize handle, so
 * keyboard users can cross a wide column without dozens of keystrokes.
 */
export const COLUMN_RESIZE_KEYBOARD_COARSE_STEP = 40;

export const DEFAULT_PLACEHOLDER_ROW_COUNT = 50;

export const DEFAULT_ROW_HEIGHT = 32;

export const INITIAL_PAGE_SIZE = 50;
export const LOAD_MORE_PAGE_SIZE = 150;
export const DEFAULT_FILTER_PAGE_SIZE = 50;
export const INFINITE_SCROLL_THRESHOLD = 200;

/**
 * How long a filter-options page request may hang before it is abandoned.
 *
 * This is a recovery bound, not a latency target. The filter fetchers guard
 * against concurrent requests with an `isLoading`/`isLoadingMore` flag that is
 * only cleared when the request settles — so a request that never settles
 * leaves the flag set and every later page request returns early, wedging that
 * dropdown until the table remounts. A rejection is not the problem; the
 * existing catch clears the flag and reports. Silence is.
 *
 * Generous on purpose: it must not fire for a merely slow endpoint, only for
 * one that has stopped answering.
 */
export const FILTER_OPTIONS_TIMEOUT_MS = 30_000;

export const DEFAULT_OVERSCAN = 20;

export const IS_PREFETCH_ENABLED = true;

/**
 * Delimiter joining multiple primary-key column values into a single row id
 * segment for CRUD links/actions. Each value is URL-encoded before joining, so
 * a single-column primary key yields the raw (encoded) value unchanged.
 */
export const PRIMARY_KEY_ID_DELIMITER = '_';

export const ACTIONS_COLUMN_KEY = 'actions';

/**
 * The row field a grouped read attaches its `TableGroupRowSummary` to.
 *
 * Deliberately not a column key and not derived from one: a grouped row carries
 * its summary beside the group key's own value, so the renderer asks the row
 * what it is instead of asking the grouping configuration what every row must
 * be. It is exported because the route's server-side read is what writes it.
 *
 * Typed `keyof TableGroupRow` rather than left to infer, so renaming the field
 * in one place and not the other is a compile error rather than a group header
 * that silently stops rendering.
 */
export const TABLE_GROUP_ROW_FIELD: keyof TableGroupRow = 'tableGroup';

/**
 * How many group keys may be applied at once. A **duplicate** of
 * `MAX_GROUP_KEYS` in `@lcabrera/server`, which is Node-only and so unreachable
 * from this client-safe package (ADR-038, ADR-039).
 *
 * The two are pinned together by `groupingContract.test.ts` in
 * `apps/react-router`, the one workspace that legitimately depends on both. If
 * that test is failing, change the server's value and this one — never only
 * this one, which would let the UI offer a depth the query then refuses.
 */
export const MAX_TABLE_GROUP_KEYS = 4;

/**
 * Every aggregate's user-facing name, as a map **closed over the union** — so a
 * member added to `TableAggregateFn` is a compile error here rather than a menu
 * entry labelled with a SQL-ish token.
 *
 * This is also the vocabulary the URL guard tests against, which is why it is a
 * map rather than a list: `Object.hasOwn` over it is total by construction,
 * where a hand-maintained list can silently miss a member.
 */
export const TABLE_AGGREGATE_LABELS: Record<TableAggregateFn, string> = {
  avg: 'Average',
  boolAnd: 'All True',
  boolOr: 'Any True',
  count: 'Count',
  countDistinct: 'Distinct Count',
  max: 'Maximum',
  min: 'Minimum',
  sum: 'Sum',
};

/**
 * The aggregate vocabulary in **menu order**, which a `Record` cannot express.
 * Its agreement with `TABLE_AGGREGATE_LABELS` is asserted in
 * `Table.constants.test.ts` — a new member forces a label entry, and that test
 * is what forces it in here too.
 */
export const TABLE_AGGREGATE_FNS: readonly TableAggregateFn[] = [
  'count',
  'countDistinct',
  'sum',
  'avg',
  'min',
  'max',
  'boolAnd',
  'boolOr',
];
