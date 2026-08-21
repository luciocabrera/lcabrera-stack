import { describe, expect, it } from 'vite-plus/test';

import type {
  ColumnSizingState,
  DataKey,
  PinnedColumnInfo,
  TableColumn,
} from '#ui/components/Table/Table.types';

import { DEFAULT_MIN_COLUMN_WIDTH } from '#ui/components/Table/Table.constants';

import { buildTableBodyCellDescriptor } from './buildTableBodyCellDescriptor.util';
import { EMPTY_CELL } from './resolveGroupCellChildren.util';

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

describe('buildTableBodyCellDescriptor — drill chrome rows', () => {
  const DRILL_MARKER = {
    kind: 'loading',
    path: [{ columnKey: 'name', label: 'Ana', value: 'Ana' }],
    pathKey: 'name:Ana',
    shortfall: 0,
  } as const;

  const build = (key: RowKey) =>
    buildTableBodyCellDescriptor({
      carriedGroupKeys: new Set<string>(),
      col: { key, label: String(key) } as TableColumn<Row>,
      columnSizing: {} as ColumnSizingState<Row>,
      drillRow: DRILL_MARKER,
      groupingKeys: ['name'],
      hasStructuralMarker: false,
      isLoadingState: false,
      pinnedOffsets: {} as Record<RowKey, PinnedColumnInfo>,
      row: {},
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
    });

  it('renders chrome in the first group-key column rather than blanking it', () => {
    // The branch has to precede the detail-row blanking below it: a drill row
    // carries neither a summary nor data, so the blanking rule would empty the
    // one column its chrome goes in — and the row would occupy full height
    // saying nothing.
    const descriptor = build('name');

    // Compared against `EMPTY_CELL` rather than against `undefined`: the
    // blanking branch also returns a `custom` descriptor with defined
    // `children`, so an `undefined` check would pass either way.
    expect(descriptor.kind).toBe('custom');
    expect(
      'children' in descriptor ? descriptor.children : undefined,
    ).not.toEqual(EMPTY_CELL);
  });

  it('keeps every cell of the row, so the gridcell count never varies', () => {
    // One filled cell and a row of empty ones — not a colSpan (ADR-062).
    const descriptor = build('amount');

    expect(descriptor.kind).toBe('custom');
    expect(descriptor.columnKey).toBe('amount');
    expect('children' in descriptor ? descriptor.children : undefined).toEqual(
      EMPTY_CELL,
    );
  });
});
