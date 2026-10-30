// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { getInitialGroupingState } from '#ui/components/Table/contexts/TableConfig/utils';

import { useBatchSetTableDrawerSettings } from './useBatchSetTableDrawerSettings.hook';

const EMPTY_GROUPING = getInitialGroupingState({});
const STATUS_SUM_GROUPING = getInitialGroupingState({
  aggregates: [{ columnKey: 'total', fn: 'sum' }],
  keys: ['status'],
});

const {
  batchSetTableSettings,
  drawerColumnsStore,
  drawerDensityStore,
  drawerGroupingStore,
  drawerTotalsPlacementStore,
  setDrawerDensity,
  setDrawerGrouping,
  setDrawerState,
  setDrawerTotalsPlacement,
} = vi.hoisted(() => {
  let drawerDensity = 'compact';
  let drawerState: Record<string, unknown> | undefined;
  let drawerGrouping: Record<string, unknown> = {
    aggregates: [],
    keys: [],
    mode: 'flat',
    periods: {},
    shares: [],
    totalsPlacement: 'last',
  };
  let drawerTotalsPlacement = 'last';

  return {
    batchSetTableSettings: vi.fn(),
    drawerColumnsStore: { get: vi.fn(() => drawerState) },
    drawerDensityStore: { get: vi.fn(() => ({ density: drawerDensity })) },
    drawerGroupingStore: { get: vi.fn(() => drawerGrouping) },
    drawerTotalsPlacementStore: {
      get: vi.fn(() => ({ totalsPlacement: drawerTotalsPlacement })),
    },
    setDrawerDensity: (next: string) => {
      drawerDensity = next;
    },
    setDrawerGrouping: (next: Record<string, unknown>) => {
      drawerGrouping = next;
    },
    setDrawerState: (next: Record<string, unknown> | undefined) => {
      drawerState = next;
    },
    setDrawerTotalsPlacement: (next: string) => {
      drawerTotalsPlacement = next;
    },
  };
});

vi.mock('../useTableDrawerContextValue.hook', () => ({
  useTableDrawerContextValue: () => ({
    columnsStore: drawerColumnsStore,
    densityStore: drawerDensityStore,
    groupingStore: drawerGroupingStore,
    totalsPlacementStore: drawerTotalsPlacementStore,
  }),
}));

const { readDensityMock } = vi.hoisted(() => ({
  readDensityMock: () => ({ density: 'compact' }),
}));

vi.mock(
  '#ui/components/Table/contexts/TableConfig/meta/useReadTableDensity.hook',
  () => ({
    useReadTableDensity: () => readDensityMock,
  }),
);

vi.mock('#ui/components/Table/contexts/TableConfig/columns/actions', () => ({
  useBatchSetTableSettings: () => batchSetTableSettings,
}));

beforeEach(() => {
  setDrawerState(undefined);
  setDrawerGrouping({
    aggregates: [],
    keys: [],
    mode: 'flat',
    periods: {},
    shares: [],
    totalsPlacement: 'last',
  });
  setDrawerTotalsPlacement('last');
  setDrawerDensity('compact');
  batchSetTableSettings.mockClear();
});

type ExpectedBatchArgs = {
  readonly columnOrder?: readonly string[];
  readonly grouping?: typeof EMPTY_GROUPING;
  readonly sorting?: readonly unknown[];
};

const expectedBatch = ({
  columnOrder = [],
  grouping = EMPTY_GROUPING,
  sorting = [],
}: ExpectedBatchArgs = {}) => ({
  density: undefined,
  grouping,
  settings: {
    columnFilters: {},
    columnOrder,
    columnPinning: { left: [], right: [] },
    columnSizing: {},
    columnVisibility: new Set(),
    sorting,
  },
  totalsPlacement: 'last',
});

const commitDrawer = () => {
  const { result } = renderHook(() => useBatchSetTableDrawerSettings());

  act(() => {
    result.current();
  });
};

describe('useBatchSetTableDrawerSettings', () => {
  it('forwards the current drawer state as a fully-defaulted batch update', () => {
    setDrawerState({
      columnOrder: ['id', 'name'],
      sorting: [{ columnKey: 'name', direction: 'asc' }],
    });

    commitDrawer();

    expect(batchSetTableSettings).toHaveBeenCalledExactlyOnceWith(
      expectedBatch({
        columnOrder: ['id', 'name'],
        sorting: [{ columnKey: 'name', direction: 'asc' }],
      }),
    );
  });

  it('produces safe empty defaults when the drawer has no state yet', () => {
    commitDrawer();

    expect(batchSetTableSettings).toHaveBeenCalledExactlyOnceWith(
      expectedBatch(),
    );
  });

  it('sends the staged grouping and the column draft in one commit call', () => {
    setDrawerState({ columnOrder: ['id', 'name'] });
    setDrawerGrouping(STATUS_SUM_GROUPING);

    commitDrawer();

    expect(batchSetTableSettings).toHaveBeenCalledExactlyOnceWith(
      expectedBatch({
        columnOrder: ['id', 'name'],
        grouping: STATUS_SUM_GROUPING,
      }),
    );
  });

  it('sends a staged density only when it differs from the level the table renders', () => {
    setDrawerDensity('spacious');

    commitDrawer();

    expect(batchSetTableSettings).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ density: 'spacious' }),
    );
  });
});
