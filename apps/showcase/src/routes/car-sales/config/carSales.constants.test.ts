import { describe, expect, it } from 'vite-plus/test';

import { COLUMNS } from '../CarSales.constants';
import {
  CAR_SALES_ALLOWED_COLUMNS,
  CAR_SALES_COLUMNS,
  CAR_SALES_DISTINCT_FILTER_COLUMNS,
  CAR_SALES_FALLBACK_SORT,
  CAR_SALES_PRIMARY_KEY,
} from './carSales.constants';

describe('car_sales entity configuration', () => {
  it('projects every column the table renders', () => {
    const projected = new Set<string>(CAR_SALES_COLUMNS);
    const missing = COLUMNS.map((column) => String(column.key)).filter(
      (key) => !projected.has(key),
    );

    expect(missing).toEqual([]);
  });

  it('allows every distinct-filter column to reach a query builder', () => {
    const allowed = new Set(CAR_SALES_ALLOWED_COLUMNS);
    const rejected = Object.keys(CAR_SALES_DISTINCT_FILTER_COLUMNS).filter(
      (column) => !allowed.has(column),
    );

    expect(rejected).toEqual([]);
  });

  it('falls back to the primary key, which is the column the table pins the sort on', () => {
    expect(CAR_SALES_FALLBACK_SORT).toStrictEqual([
      { columnKey: CAR_SALES_PRIMARY_KEY, direction: 'asc' },
    ]);
    expect(
      COLUMNS.find((column) => column.isPrimaryKey === true)?.key,
    ).toStrictEqual(CAR_SALES_PRIMARY_KEY);
  });

  it('lists the primary key among the projected columns', () => {
    expect(CAR_SALES_COLUMNS).toContain(CAR_SALES_PRIMARY_KEY);
  });
});
