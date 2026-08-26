import { describe, expect, it } from 'vite-plus/test';

import { COLUMNS } from '@/routes/enterprise-orders/EnterpriseOrders.constants';

import {
  ENTERPRISE_ORDER_COLUMNS,
  ENTERPRISE_ORDER_DISTINCT_FILTER_COLUMNS,
  ENTERPRISE_ORDER_LIST_COLUMNS,
} from './enterpriseOrders.constants';

/**
 * The list query projects `ENTERPRISE_ORDER_LIST_COLUMNS` rather than the whole
 * row (#405). Nothing in the type system ties that projection to what the table
 * renders, so a column added to one and not the other renders blank — or is
 * fetched for nobody. These are that tie.
 */
describe('ENTERPRISE_ORDER_LIST_COLUMNS', () => {
  it('projects exactly the columns the table renders', () => {
    const renderedKeys = COLUMNS.map((column) => column.key).toSorted(
      (left, right) => left.localeCompare(right),
    );

    expect(
      [...ENTERPRISE_ORDER_LIST_COLUMNS].toSorted((left, right) =>
        left.localeCompare(right),
      ),
    ).toStrictEqual(renderedKeys);
  });

  it('is a subset of the table’s real columns', () => {
    const everyColumn = new Set<string>(ENTERPRISE_ORDER_COLUMNS);

    expect(
      ENTERPRISE_ORDER_LIST_COLUMNS.filter(
        (column) => !everyColumn.has(column),
      ),
    ).toStrictEqual([]);
  });

  it('is narrower than the full row, or it is not a read model', () => {
    expect(ENTERPRISE_ORDER_LIST_COLUMNS.length).toBeLessThan(
      ENTERPRISE_ORDER_COLUMNS.length,
    );
  });

  it('covers every column offering a distinct-value filter dropdown', () => {
    const projected = new Set<string>(ENTERPRISE_ORDER_LIST_COLUMNS);

    expect(
      Object.keys(ENTERPRISE_ORDER_DISTINCT_FILTER_COLUMNS).filter(
        (column) => !projected.has(column),
      ),
    ).toStrictEqual([]);
  });
});
