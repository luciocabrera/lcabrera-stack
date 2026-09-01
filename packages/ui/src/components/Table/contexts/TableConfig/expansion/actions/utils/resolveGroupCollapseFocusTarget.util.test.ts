import { describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableGroupKeyValue,
} from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';
import { resolveRowKey } from '#ui/components/Table/TableBodyRows/utils/resolveRowKey.util';

import { resolveGroupCollapseFocusTarget } from './resolveGroupCollapseFocusTarget.util';

type Row = Record<string, unknown>;

const columns: TableColumn<Row>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
];

const groupRow = (path: readonly TableGroupKeyValue[]): Row => ({
  [TABLE_GROUP_ROW_FIELD]: {
    aggregates: [],
    count: 2,
    isSubtotal: false,
    path,
  },
});

const paris = [{ columnKey: 'city', label: 'Paris', value: 'Paris' }];
const berlin = [{ columnKey: 'city', label: 'Berlin', value: 'Berlin' }];

const survivingRows: readonly Row[] = [
  groupRow(paris),
  groupRow(berlin),
  { id: 3 },
  { id: 4 },
];

type RowKeyOfArgs = {
  readonly index: number;
  readonly row: Row;
};

const rowKeyOf = ({ index, row }: RowKeyOfArgs) =>
  resolveRowKey({ columns, index, row });

describe('resolveGroupCollapseFocusTarget', () => {
  it('moves focus to the collapsed group when the focused row went with it', () => {
    const target = resolveGroupCollapseFocusTarget({
      columns,
      focusedRowKey: rowKeyOf({ index: 1, row: { id: 1 } }),
      groupPathKey: resolveGroupPathKey(paris),
      rows: survivingRows,
    });

    expect(target).toStrictEqual({
      rowIndex: 0,
      rowKey: rowKeyOf({ index: 0, row: groupRow(paris) }),
    });
  });

  it('is the ancestor and not the row that shifted into the vacated index', () => {
    const target = resolveGroupCollapseFocusTarget({
      columns,
      focusedRowKey: rowKeyOf({ index: 2, row: { id: 2 } }),
      groupPathKey: resolveGroupPathKey(paris),
      rows: survivingRows,
    });

    expect(target?.rowIndex).toBe(0);
    expect(target?.rowKey).not.toBe(rowKeyOf({ index: 3, row: { id: 4 } }));
  });

  it('leaves focus where it is when the focused row survived the collapse', () => {
    expect(
      resolveGroupCollapseFocusTarget({
        columns,
        focusedRowKey: rowKeyOf({ index: 2, row: { id: 3 } }),
        groupPathKey: resolveGroupPathKey(paris),
        rows: survivingRows,
      }),
    ).toBeUndefined();
  });

  it('does nothing while the grid holds no focus target at all', () => {
    expect(
      resolveGroupCollapseFocusTarget({
        columns,
        focusedRowKey: undefined,
        groupPathKey: resolveGroupPathKey(paris),
        rows: survivingRows,
      }),
    ).toBeUndefined();
  });

  it('answers nothing when the collapsed group is not among the surviving rows', () => {
    expect(
      resolveGroupCollapseFocusTarget({
        columns,
        focusedRowKey: rowKeyOf({ index: 1, row: { id: 1 } }),
        groupPathKey: resolveGroupPathKey(berlin),
        rows: [{ id: 9 }],
      }),
    ).toBeUndefined();
  });
});
