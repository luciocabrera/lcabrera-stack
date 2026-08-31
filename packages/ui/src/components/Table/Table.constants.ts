import { OLAP_GROUP_ROW_FIELD } from '@lcabrera/api/olap/olap.constants';

import type {
  TableAggregateFn,
  TableColumnLayoutLock,
  TableGroupFold,
  TableGroupingMode,
  TableGroupKeyRefusalReason,
  TableGroupPeriod,
  TableGroupRow,
  TableTotalsPlacement,
} from './Table.types';

export const DEFAULT_MIN_COLUMN_WIDTH = 60;

export const DEFAULT_MAX_COLUMN_WIDTH = 600;

export const COLUMN_RESIZE_KEYBOARD_STEP = 8;

/** Shift+arrow: cross a wide column without dozens of keystrokes. */
export const COLUMN_RESIZE_KEYBOARD_COARSE_STEP = 40;

export const DEFAULT_PLACEHOLDER_ROW_COUNT = 50;

export const DEFAULT_ROW_HEIGHT = 32;

export const INITIAL_PAGE_SIZE = 50;
export const LOAD_MORE_PAGE_SIZE = 150;
export const DEFAULT_FILTER_PAGE_SIZE = 50;
export const INFINITE_SCROLL_THRESHOLD = 200;

/**
 * Recovery bound, not a latency target. Filter fetchers only clear
 * `isLoading`/`isLoadingMore` when the request settles — silence wedges the
 * dropdown until remount.
 */
export const FILTER_OPTIONS_TIMEOUT_MS = 30_000;

export const DEFAULT_OVERSCAN = 20;

export const IS_PREFETCH_ENABLED = true;

/** Each value is URL-encoded before joining, so a single-column PK is unchanged. */
export const PRIMARY_KEY_ID_DELIMITER = '_';

export const ACTIONS_COLUMN_KEY = 'actions';

/**
 * The literal is `@lcabrera/api`'s wire name (ADR-082); `keyof TableGroupRow` is the guard
 * that they cannot disagree.
 */
export const TABLE_GROUP_ROW_FIELD: keyof TableGroupRow = OLAP_GROUP_ROW_FIELD;

/**
 * Duplicate of server `MAX_GROUP_KEYS` (ADR-038, ADR-039). Change both, never
 * only this one — the UI would offer a depth the query then refuses.
 */
export const MAX_TABLE_GROUP_KEYS = 4;

/**
 * Whole-request budget, not a prohibition: a second `countDistinct` repeats
 * the most expensive part of the query. Duplicate of server
 * `MAX_COUNT_DISTINCT_AGGREGATES`.
 */
export const MAX_TABLE_COUNT_DISTINCT_AGGREGATES = 1;

/** Closed over the union; "raw" is absence, not a member. */
export const TABLE_GROUP_PERIOD_LABELS: Record<TableGroupPeriod, string> = {
  day: 'Day',
  month: 'Month',
  quarter: 'Quarter',
  year: 'Year',
};

/** Closed over the union so a new `TableAggregateFn` is a compile error here. */
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

/** Menu order — a `Record` cannot express it. Agreement with the labels map is asserted in `Table.constants.test.ts`. */
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
 * Dash, not blank and not zero (ADR-065): blank already means "this row has no
 * value here", and zero states a number nobody computed.
 */
export const TABLE_GROUP_NO_AGGREGATE_GLYPH = '—';

/** Spoken equivalent: a standalone em dash may not be announced (ADR-065). */
export const TABLE_GROUP_NO_AGGREGATE_LABEL = 'No aggregate';

/** The rollup row that totals every group — the empty path. */
export const TABLE_GROUP_GRAND_TOTAL_LABEL = 'Grand total';

/**
 * A `WHERE` filter runs before aggregation, so the total covers only the rows
 * that survived it.
 */
export const TABLE_GROUP_FILTERED_AGGREGATE_LABEL =
  'Filtered — this total covers the filtered rows only';

/** Separates a structural NULL from a real one, together with shallower indentation. */
export const TABLE_GROUP_SUBTOTAL_SUFFIX = 'total';

export const TABLE_GROUPING_MODES: readonly TableGroupingMode[] = [
  'flat',
  'rollup',
];

export const TABLE_GROUPING_MODE_LABELS: Record<TableGroupingMode, string> = {
  flat: 'Groups only',
  rollup: 'Groups with subtotals',
};

/** Closed over the union. Completes "cannot be grouped because …". */
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

export const TABLE_COLUMN_LAYOUT_LOCK_LABELS: Record<
  TableColumnLayoutLock,
  string
> = {
  'group-key': 'a grouped column is always shown and always pinned to the left',
  measure: 'a measure shares the pinning of the column it measures',
};

export const TABLE_TOTALS_PLACEMENTS: readonly TableTotalsPlacement[] = [
  'last',
  'first',
];

export const TABLE_TOTALS_PLACEMENT_LABELS: Record<
  TableTotalsPlacement,
  string
> = {
  first: 'Above their rows',
  last: 'Below their rows',
};

export const TABLE_GROUP_FOLDS: readonly TableGroupFold[] = [
  'expanded',
  'collapsed',
];

export const TABLE_GROUP_FOLD_LABELS: Record<TableGroupFold, string> = {
  collapsed: 'Start collapsed',
  expanded: 'Start expanded',
};

export const TABLE_TOTALS_PLACEMENT_PARAM = 'totals';

export const TABLE_NESTED_URL_STATE_PREFIX = 'nested.';

/**
 * Additive measures only (#648, ADR-086): summing group avgs or distinct counts
 * yields shares that still sum to 100% while being wrong.
 */
export const TABLE_SHAREABLE_AGGREGATE_FNS: readonly TableAggregateFn[] = [
  'count',
  'sum',
];

export const TABLE_SHARE_OF_TOTAL_LABEL = 'of the grand total';

export const TABLE_SHARE_OF_TOTAL_TOGGLE_LABEL = 'Show share of grand total';

/** Dash rather than `0.0%` or `NaN`, paired with spoken text like the no-aggregate glyph. */
export const TABLE_SHARE_UNAVAILABLE_GLYPH = '—';

export const TABLE_SHARE_UNAVAILABLE_LABEL = 'No share available';
