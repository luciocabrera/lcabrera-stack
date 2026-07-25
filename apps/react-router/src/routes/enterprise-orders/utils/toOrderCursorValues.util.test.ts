import type { SortingState } from '@lcabrera/ui/components/Table';

import { describe, expect, it } from 'vite-plus/test';

import type { EnterpriseOrderListRow } from '../config';

import { toOrderCursorValues } from './toOrderCursorValues.util';

/**
 * A row arrives as JSON in the page response, where a NULL column is `null` —
 * parsing it is how it really reaches us, and keeps the literal out of our own
 * source (`unicorn/no-null`).
 */
const lastRow = JSON.parse(
  '{"customer_name":"Acme","delivery_date":null,"order_id":4821}',
) as EnterpriseOrderListRow;

const NULL_LEADING_CURSOR = JSON.parse('[null, 4821]') as readonly unknown[];

describe('toOrderCursorValues', () => {
  it('reads one value per sort column, in sort order', () => {
    const sorting: SortingState<EnterpriseOrderListRow> = [
      { columnKey: 'customer_name', direction: 'desc' },
      { columnKey: 'order_id', direction: 'asc' },
    ];

    expect(toOrderCursorValues({ lastRow, sorting })).toStrictEqual([
      'Acme',
      4821,
    ]);
  });

  it('carries a null through rather than dropping the position', () => {
    const sorting: SortingState<EnterpriseOrderListRow> = [
      { columnKey: 'delivery_date', direction: 'asc' },
      { columnKey: 'order_id', direction: 'asc' },
    ];

    expect(toOrderCursorValues({ lastRow, sorting })).toStrictEqual(
      NULL_LEADING_CURSOR,
    );
  });

  it('drops the synthetic actions column, as the server-side sort does', () => {
    const sorting: SortingState<EnterpriseOrderListRow> = [
      { columnKey: 'actions', direction: 'asc' },
      { columnKey: 'order_id', direction: 'asc' },
    ];

    expect(toOrderCursorValues({ lastRow, sorting })).toStrictEqual([4821]);
  });

  it('has no cursor before a first row has loaded', () => {
    expect(
      toOrderCursorValues({
        sorting: [{ columnKey: 'order_id', direction: 'asc' }],
      }),
    ).toBeUndefined();
  });
});
