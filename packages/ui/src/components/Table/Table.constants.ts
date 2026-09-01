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

export const DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH = 200;

export const COLUMN_RESIZE_KEYBOARD_STEP = 8;

export const COLUMN_RESIZE_KEYBOARD_COARSE_STEP = 40;

export const DEFAULT_PLACEHOLDER_ROW_COUNT = 50;

export const DEFAULT_ROW_HEIGHT = 32;

export const INITIAL_PAGE_SIZE = 50;
export const LOAD_MORE_PAGE_SIZE = 150;
export const DEFAULT_FILTER_PAGE_SIZE = 50;
export const INFINITE_SCROLL_THRESHOLD = 200;

export const FILTER_OPTIONS_TIMEOUT_MS = 30_000;

export const DEFAULT_OVERSCAN = 20;

export const IS_PREFETCH_ENABLED = true;

export const PRIMARY_KEY_ID_DELIMITER = '_';

export const ACTIONS_COLUMN_KEY = 'actions';

export const TABLE_GROUP_ROW_FIELD: keyof TableGroupRow = OLAP_GROUP_ROW_FIELD;

export const MAX_TABLE_GROUP_KEYS = 4;

export const MAX_TABLE_COUNT_DISTINCT_AGGREGATES = 1;

export const TABLE_GROUP_PERIOD_LABELS: Record<TableGroupPeriod, string> = {
  day: 'Day',
  month: 'Month',
  quarter: 'Quarter',
  year: 'Year',
};

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

export const TABLE_GROUP_NO_AGGREGATE_GLYPH = '—';

export const TABLE_GROUP_NO_AGGREGATE_LABEL = 'No aggregate';

export const TABLE_GROUP_GRAND_TOTAL_LABEL = 'Grand total';

export const TABLE_GROUP_FILTERED_AGGREGATE_LABEL =
  'Filtered — this total covers the filtered rows only';

export const TABLE_GROUP_SUBTOTAL_SUFFIX = 'total';

export const TABLE_GROUPING_MODES: readonly TableGroupingMode[] = [
  'flat',
  'rollup',
];

export const TABLE_GROUPING_MODE_LABELS: Record<TableGroupingMode, string> = {
  flat: 'Groups only',
  rollup: 'Groups with subtotals',
};

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

export const TABLE_GROUP_KEY_APPLIED_LABEL =
  'Already grouped by this column — use Remove This Group to drop it.';

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

export const TABLE_SHAREABLE_AGGREGATE_FNS: readonly TableAggregateFn[] = [
  'count',
  'sum',
];

export const TABLE_SHARE_OF_TOTAL_LABEL = 'of the grand total';

export const TABLE_SHARE_OF_TOTAL_TOGGLE_LABEL = 'Show share of grand total';

export const TABLE_SHARE_UNAVAILABLE_GLYPH = '—';

export const TABLE_SHARE_UNAVAILABLE_LABEL = 'No share available';
