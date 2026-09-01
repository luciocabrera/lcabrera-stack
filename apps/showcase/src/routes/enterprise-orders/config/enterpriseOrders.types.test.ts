import { TABLE_GROUP_ROW_FIELD } from '@lcabrera/ui/components/Table/Table.constants';
import { getTableGroupRowSummary } from '@lcabrera/ui/components/Table/utils';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import type {
  EnterpriseOrderListRow,
  EnterpriseOrderTableRow,
} from './enterpriseOrders.types';

const groupRow: EnterpriseOrderTableRow = {
  [TABLE_GROUP_ROW_FIELD]: {
    aggregates: [],
    count: 12,
    isSubtotal: false,
    path: [{ columnKey: 'order_status', label: 'Shipped', value: 'Shipped' }],
  },
};

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
    expectTypeOf<EnterpriseOrderListRow['order_id']>().toEqualTypeOf<number>();
    expectTypeOf<
      EnterpriseOrderListRow['order_status']
    >().toEqualTypeOf<string>();
  });

  it('admits a full list row as the data arm, with no group summary', () => {
    expectTypeOf<EnterpriseOrderListRow>().toExtend<EnterpriseOrderTableRow>();
  });

  it('agrees with the runtime discriminant the renderer branches on', () => {
    expect(getTableGroupRowSummary(groupRow)).toStrictEqual({
      aggregates: [],
      count: 12,
      isSubtotal: false,
      path: [{ columnKey: 'order_status', label: 'Shipped', value: 'Shipped' }],
    });
    expect(groupRow[TABLE_GROUP_ROW_FIELD]).toBeDefined();
  });
});
