import { describe, expect, it } from 'vite-plus/test';

import { COLUMNS } from '../WideAlltypes150.constants';
import {
  MAX_WIDE_ALLTYPES_SORT_RULES,
  WIDE_ALLTYPES_ALLOWED_COLUMNS,
  WIDE_ALLTYPES_COLUMNS,
  WIDE_ALLTYPES_FALLBACK_SORT,
  WIDE_ALLTYPES_PRIMARY_KEY,
  WIDE_ALLTYPES_SORTABLE_COLUMNS,
} from './wideAlltypes150.constants';

describe('wide_alltypes_150 entity configuration', () => {
  it('projects every column the table renders', () => {
    const projected = new Set(WIDE_ALLTYPES_COLUMNS);
    const missing = COLUMNS.map((column) => String(column.key)).filter(
      (key) => !projected.has(key),
    );

    expect(missing).toEqual([]);
  });

  it('names the key plus c_001 … c_149, in that order', () => {
    expect(WIDE_ALLTYPES_COLUMNS.at(0)).toBe(WIDE_ALLTYPES_PRIMARY_KEY);
    expect(WIDE_ALLTYPES_COLUMNS.at(1)).toBe('c_001');
    expect(WIDE_ALLTYPES_COLUMNS.at(-1)).toBe('c_149');
    expect(WIDE_ALLTYPES_COLUMNS).toContain('c_018');
    expect(WIDE_ALLTYPES_COLUMNS).toContain('c_100');
  });

  it('refuses to order by the point column, and only that one', () => {
    const unsortable = WIDE_ALLTYPES_COLUMNS.filter(
      (column) => !WIDE_ALLTYPES_SORTABLE_COLUMNS.has(column),
    );

    expect(unsortable).toStrictEqual(['c_018']);
  });

  it('still allows the point column to be selected and allow-listed', () => {
    expect(WIDE_ALLTYPES_ALLOWED_COLUMNS).toContain('c_018');
  });

  it('falls back to the primary key, which is the column the table pins the sort on', () => {
    expect(WIDE_ALLTYPES_FALLBACK_SORT).toStrictEqual([
      { columnKey: WIDE_ALLTYPES_PRIMARY_KEY, direction: 'asc' },
    ]);
    expect(
      COLUMNS.find((column) => column.isPrimaryKey === true)?.key,
    ).toStrictEqual(WIDE_ALLTYPES_PRIMARY_KEY);
  });

  it('caps the sort well below the number of columns it could be handed', () => {
    expect(MAX_WIDE_ALLTYPES_SORT_RULES).toBeLessThan(
      WIDE_ALLTYPES_COLUMNS.length,
    );
    expect(MAX_WIDE_ALLTYPES_SORT_RULES).toBeGreaterThan(0);
  });
});
