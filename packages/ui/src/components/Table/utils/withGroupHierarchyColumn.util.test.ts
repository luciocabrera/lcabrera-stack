import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '../Table.types';

import { TABLE_GROUP_HIERARCHY_COLUMN_KEY } from '../Table.constants';
import { withGroupHierarchyColumn } from './withGroupHierarchyColumn.util';

type Row = {
  readonly amount: number;
  readonly id: string;
  readonly status: string;
};

const columns: TableColumn<Row>[] = [
  { key: 'id', label: 'ID' },
  { key: 'status', label: 'Status' },
  { key: 'amount', label: 'Amount' },
];

const augment = (groupingKeys: readonly string[]) =>
  withGroupHierarchyColumn<Row>({
    columnOrder: ['amount', 'id', 'status'],
    columnPinning: { left: ['id'], right: ['amount'] },
    columns,
    groupingKeys,
  });

describe('withGroupHierarchyColumn', () => {
  it('changes nothing while no grouping is applied', () => {
    const result = augment([]);

    expect(result.columns).toBe(columns);
    expect(result.columnOrder).toStrictEqual(['amount', 'id', 'status']);
    expect(result.columnPinning).toStrictEqual({
      left: ['id'],
      right: ['amount'],
    });
  });

  it('puts the hierarchy column first in the columns', () => {
    expect(augment(['status']).columns[0]?.key).toBe(
      TABLE_GROUP_HIERARCHY_COLUMN_KEY,
    );
  });

  it('pins it left, ahead of any column the consumer pinned', () => {
    // Sticky offsets are a running sum over the left-pinned columns in
    // effective order, so a hierarchy column outside that list leaves every
    // consumer-pinned left column short by its width (ADR-065).
    expect(augment(['status']).columnPinning.left).toStrictEqual([
      TABLE_GROUP_HIERARCHY_COLUMN_KEY,
      'id',
    ]);
  });

  it('leaves the right-pinned side alone', () => {
    expect(augment(['status']).columnPinning.right).toStrictEqual(['amount']);
  });

  it('puts it first in the column order too', () => {
    // `orderColumnsByKeys` appends a column the order does not mention, which
    // would otherwise put the grid's own column last among the user's pinned
    // ones.
    expect(augment(['status']).columnOrder[0]).toBe(
      TABLE_GROUP_HIERARCHY_COLUMN_KEY,
    );
  });

  it('never touches the consumer arrays it was handed', () => {
    const columnOrder = ['amount', 'id', 'status'] as const;
    const columnPinning = { left: ['id'], right: ['amount'] } as const;

    withGroupHierarchyColumn<Row>({
      columnOrder: [...columnOrder],
      columnPinning: {
        left: [...columnPinning.left],
        right: [...columnPinning.right],
      },
      columns,
      groupingKeys: ['status'],
    });

    expect(columns).toHaveLength(3);
    expect(columnOrder).toStrictEqual(['amount', 'id', 'status']);
  });
});
