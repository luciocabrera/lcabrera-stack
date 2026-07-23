import type { SortRule } from '../../types/api.types.js';

const wideColumnNumbers = Array.from(
  { length: 149 },
  (_value, index) => `c_${String(index + 1).padStart(3, '0')}`,
);

const UNSORTABLE_WIDE_ALLTYPES_COLUMNS = new Set(['c_018']);

const sortableWideColumnNumbers = wideColumnNumbers.filter(
  (columnKey) => !UNSORTABLE_WIDE_ALLTYPES_COLUMNS.has(columnKey),
);

export const WIDE_ALLTYPES_SCHEMA = 'public';
export const WIDE_ALLTYPES_TABLE = 'wide_alltypes_150';
export const WIDE_ALLTYPES_PRIMARY_KEY = 'id';

/** Every column of `wide_alltypes_150`: the `id` key plus `c_001`…`c_149`. */
export const WIDE_ALLTYPES_COLUMNS: readonly string[] = [
  'id',
  ...wideColumnNumbers,
];

export const MAX_WIDE_ALLTYPES_SORT_RULES = 5;

export const WIDE_ALLTYPES_SORTABLE_COLUMNS = new Set([
  'id',
  ...sortableWideColumnNumbers,
]);

export const DEFAULT_WIDE_ALLTYPES_SORTING = [
  { columnKey: 'id', direction: 'asc' },
] as const satisfies readonly SortRule[];
