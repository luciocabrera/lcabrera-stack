import type {
  TableAggregateFn,
  TableGroupingMode,
  TableGroupKeyRefusalReason,
  TableGroupRow,
} from './Table.types';

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

/**
 * What a group row's cell shows for a column no aggregate was selected on.
 *
 * A dash, not blank and not zero (ADR-065): blank already means "this row has
 * no value here" — a claim about the data — and reads as content that has not
 * arrived, while zero states a number nobody computed. Only a dash keeps "no
 * aggregate", "the aggregate is zero" and "still loading" apart.
 */
export const TABLE_GROUP_NO_AGGREGATE_GLYPH = '—';

/**
 * The same state, spoken. A standalone em dash may or may not be announced
 * depending on the reader's punctuation verbosity, so the cell carries this
 * beside the glyph rather than depending on it (ADR-065 hands #570 exactly this
 * obligation).
 */
export const TABLE_GROUP_NO_AGGREGATE_LABEL = 'No aggregate';

/** The label of the rollup row that totals every group — the empty path. */
export const TABLE_GROUP_GRAND_TOTAL_LABEL = 'Grand total';

/**
 * What an aggregated cell says when its own column carries a filter.
 *
 * A `WHERE` filter runs before aggregation, so "all countries" over a filtered
 * column is really "all countries among the rows that survived the filter" —
 * correct SQL, and a total that lies by omission unless the cell says so.
 */
export const TABLE_GROUP_FILTERED_AGGREGATE_LABEL =
  'Filtered — this total covers the filtered rows only';

/**
 * How a subtotal states the level it totals: `EMEA total`. It is what separates
 * a structural NULL from a real one in the rendered grid, together with the
 * shallower indentation a subtotal sits at.
 */
export const TABLE_GROUP_SUBTOTAL_SUFFIX = 'total';

/**
 * The grouping modes in **menu order**, which a `Record` cannot express — the
 * same split `TABLE_AGGREGATE_FNS` and `TABLE_AGGREGATE_LABELS` keep, and
 * `Table.constants.test.ts` asserts the two agree.
 */
export const TABLE_GROUPING_MODES: readonly TableGroupingMode[] = [
  'flat',
  'rollup',
];

/**
 * Each mode's user-facing name, as a map **closed over the union**, so a member
 * added to `TableGroupingMode` is a compile error here rather than a menu entry
 * labelled with a SQL-ish token. The names describe the result rather than the
 * SQL construct: a user picking "with subtotals" is choosing what they will
 * read, not a `GROUP BY` clause.
 */
export const TABLE_GROUPING_MODE_LABELS: Record<TableGroupingMode, string> = {
  flat: 'Groups only',
  rollup: 'Groups with subtotals',
};

/**
 * Why a column cannot be a group key, said the way a user can act on it — a map
 * **closed over the union**, so a reason added to `TableGroupKeyRefusalReason`
 * is a compile error here rather than a raw catalogue token shown on screen.
 *
 * Each entry completes "cannot be grouped because …", and names what would
 * change the answer wherever anything can: a filter narrows a wide column and an
 * `ANALYZE` produces missing statistics, while a type refusal is permanent.
 */
export const TABLE_GROUP_KEY_REFUSAL_LABELS: Record<
  TableGroupKeyRefusalReason,
  string
> = {
  'no-equality-operator': 'the database cannot compare its values for equality',
  'not-a-dimension': 'its data type cannot be used as a group key',
  'stats-unavailable': 'the database has no statistics for it yet',
  'too-many-distinct':
    'it holds too many distinct values — filter the table down first',
  'unique-ish': 'nearly every row has its own value',
};
