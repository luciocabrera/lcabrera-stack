import { describe, expect, it } from 'vite-plus/test';

import type {
  ColumnSizingState,
  DataKey,
  PinnedColumnInfo,
  TableColumn,
} from '#ui/components/Table/Table.types';

import { DEFAULT_MIN_COLUMN_WIDTH } from '#ui/components/Table/Table.constants';

import { buildTableBodyCellDescriptor } from './buildTableBodyCellDescriptor.util';

type Row = {
  readonly amount?: number;
  readonly name?: string;
};

type RowKey = DataKey<Row>;

const ROW_INDEX = 3;
const ROW_KEY = 'pk:[3]';

describe('buildTableBodyCellDescriptor', () => {
  it('builds a default descriptor with column value', () => {
    const col: TableColumn<Row> = {
      dataType: 'number',
      key: 'amount',
      label: 'Amount',
      minWidth: 120,
    };
    const descriptor = buildTableBodyCellDescriptor({
      carriedGroupKeys: new Set<string>(),
      col,
      columnSizing: {} as ColumnSizingState<Row>,
      groupingKeys: [],
      hasStructuralMarker: false,
      isLoadingState: false,
      pinnedOffsets: {} as Record<RowKey, PinnedColumnInfo>,
      row: { amount: 42 },
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
    });

    expect(descriptor).toEqual({
      columnKey: 'amount',
      dataType: 'number',
      format: undefined,
      isLoadingState: false,
      key: 'amount',
      kind: 'default',
      label: 'Amount',
      minWidth: 120,
      pinInfo: undefined,
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
      value: 42,
      width: 120,
    });
  });

  it('builds a custom descriptor with empty label', () => {
    const col: TableColumn<Row> = {
      key: 'name',
      label: 'Name',
      render: () => 'custom',
    };
    const descriptor = buildTableBodyCellDescriptor({
      carriedGroupKeys: new Set<string>(),
      col,
      columnSizing: { name: 180 } as ColumnSizingState<Row>,
      groupingKeys: [],
      hasStructuralMarker: false,
      isLoadingState: false,
      pinnedOffsets: {} as Record<RowKey, PinnedColumnInfo>,
      row: { name: 'A' },
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
    });

    expect(descriptor).toEqual({
      children: 'custom',
      columnKey: 'name',
      isLoadingState: false,
      key: 'name',
      kind: 'custom',
      label: '',
      minWidth: DEFAULT_MIN_COLUMN_WIDTH,
      pinInfo: undefined,
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
      width: 180,
    });
  });

  it('uses pinned offsets and empty string when row value is missing', () => {
    const col: TableColumn<Row> = {
      key: 'name',
      label: 'Name',
      minWidth: 90,
    };
    const pinInfo: PinnedColumnInfo = {
      isFirstPinnedRight: false,
      isLastPinnedLeft: true,
      offset: 24,
      side: 'left',
    };
    const descriptor = buildTableBodyCellDescriptor({
      carriedGroupKeys: new Set<string>(),
      col,
      columnSizing: {} as ColumnSizingState<Row>,
      groupingKeys: [],
      hasStructuralMarker: false,
      isLoadingState: false,
      pinnedOffsets: {
        name: pinInfo,
      } as Record<RowKey, PinnedColumnInfo>,
      row: {},
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
    });

    expect(descriptor).toEqual({
      columnKey: 'name',
      dataType: undefined,
      format: undefined,
      isLoadingState: false,
      key: 'name',
      kind: 'default',
      label: 'Name',
      minWidth: 90,
      pinInfo,
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
      value: '',
      width: 90,
    });
  });
});
