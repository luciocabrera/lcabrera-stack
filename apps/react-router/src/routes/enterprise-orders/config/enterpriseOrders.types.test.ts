import { TABLE_GROUP_ROW_FIELD } from '@lcabrera/ui/components/Table/Table.constants';
import { getTableGroupRowSummary } from '@lcabrera/ui/components/Table/utils';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import type {
  EnterpriseOrderListRow,
  EnterpriseOrderTableRow,
} from './enterpriseOrders.types';

/**
 * The row type is a **discriminated** union, and these hold it there.
 *
 * The distinction is not cosmetic. Under the `Partial<listRow> & Partial<group>`
 * shape this replaced, every column read was `T | undefined` on every row and no
 * check could recover the type — the encoding said "any field may be missing
 * from any row" where the data says "one row kind has all of them, the other has
 * none". The assertions below are the difference, and the compile is the
 * assertion: `vp run typecheck` fails if narrowing stops working, whatever the
 * runtime expectations say.
 */
const groupRow: EnterpriseOrderTableRow = {
  [TABLE_GROUP_ROW_FIELD]: {
    aggregates: [],
    count: 12,
    path: [{ columnKey: 'order_status', label: 'Shipped' }],
  },
};

/**
 * The narrowing itself, as a function so the compiler has to check it: the
 * `else` branch reads `order_id` with no guard and no optional chaining, which
 * only type-checks while the union discriminates.
 */
const readOrderId = (row: EnterpriseOrderTableRow) => {
  if (row[TABLE_GROUP_ROW_FIELD] !== undefined) {
    return row[TABLE_GROUP_ROW_FIELD].path[0]?.label ?? '';
  }

  return row.order_id.toFixed(0);
};

describe('EnterpriseOrderTableRow', () => {
  it('narrows to the data arm on the absence of a group summary', () => {
    expect(readOrderId(groupRow)).toBe('Shipped');
  });

  it('keeps the list row exactly as the ungrouped query returns it', () => {
    // The read model is untouched by grouping: every projected column is still
    // required, so a cell reading one needs no guard.
    expectTypeOf<EnterpriseOrderListRow['order_id']>().toEqualTypeOf<number>();
    expectTypeOf<
      EnterpriseOrderListRow['order_status']
    >().toEqualTypeOf<string>();
  });

  it('admits a full list row as the data arm, with no group summary', () => {
    expectTypeOf<EnterpriseOrderListRow>().toExtend<EnterpriseOrderTableRow>();
  });

  it('agrees with the runtime discriminant the renderer branches on', () => {
    // The type-level discriminant and `getTableGroupRowSummary` must answer the
    // same question, or a row could narrow one way and render the other.
    expect(getTableGroupRowSummary(groupRow)).toStrictEqual({
      aggregates: [],
      count: 12,
      path: [{ columnKey: 'order_status', label: 'Shipped' }],
    });
    expect(groupRow[TABLE_GROUP_ROW_FIELD]).toBeDefined();
  });
});
