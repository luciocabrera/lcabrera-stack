// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';
import { COLUMN_GROUPING_REFUSAL_MESSAGES } from '#ui/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.constants';

import { useToggleColumnVisibility } from './useToggleColumnVisibility.hook';

type TestColumn = {
  readonly isGroupable?: boolean;
  readonly key: string;
  readonly label: string;
};

const {
  drawerColumnsStore,
  getAggregates,
  getCapabilities,
  getColumns,
  getGroupingKeys,
  modalsStore,
  notify,
  setAggregates,
  setCapabilities,
  setColumns,
  setDrawerState,
  setGroupingKeys,
  setStaticKeys,
  tableColumnsStore,
} = vi.hoisted(() => {
  let aggregates: readonly unknown[] = [];
  let capabilities: Record<string, unknown> = {};
  let columns: readonly unknown[] = [];
  let drawerState: undefined | { readonly columnVisibility?: Set<string> };
  let groupingKeys: readonly string[] = [];
  let staticKeys: Set<string> | undefined;

  return {
    drawerColumnsStore: {
      get: vi.fn(() => drawerState),
      set: vi.fn(),
    },
    getAggregates: () => aggregates,
    getCapabilities: () => capabilities,
    getColumns: () => columns,
    getGroupingKeys: () => groupingKeys,
    modalsStore: { get: vi.fn(), set: vi.fn() },
    notify: vi.fn(),
    setAggregates: (next: readonly unknown[]) => {
      aggregates = next;
    },
    setCapabilities: (next: Record<string, unknown>) => {
      capabilities = next;
    },
    setColumns: (next: readonly unknown[]) => {
      columns = next;
    },
    setDrawerState: (next: typeof drawerState) => {
      drawerState = next;
    },
    setGroupingKeys: (next: readonly string[]) => {
      groupingKeys = next;
    },
    setStaticKeys: (next: Set<string> | undefined) => {
      staticKeys = next;
    },
    tableColumnsStore: {
      get: vi.fn(() => (staticKeys === undefined ? undefined : { staticKeys })),
    },
  };
});

vi.mock(
  '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({ columnsStore: tableColumnsStore }),
  }),
);

vi.mock(
  '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook',
  () => ({
    useTableDrawerContextValue: () => ({ columnsStore: drawerColumnsStore }),
  }),
);

vi.mock('../useColumnOrderSectionContextValue.hook', () => ({
  useColumnOrderSectionContextValue: () => ({ modalsStore }),
}));

vi.mock('#ui/contexts/NotificationContext/actions', () => ({
  useNotifyAction: () => notify,
}));

vi.mock(
  '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook',
  () => ({ useGetColumns: () => getColumns() }),
);

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableGroupingCapabilities: () => getCapabilities(),
}));

vi.mock(
  '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/selectors',
  () => ({
    useGetGroupingAggregates: () => getAggregates(),
    useGetGroupingKeys: () => getGroupingKeys(),
  }),
);

type ToggleArgs = {
  readonly columnKey: string;
  readonly columns?: readonly TestColumn[];
  readonly groupingKeys?: readonly string[];
  readonly hiddenKeys?: readonly string[];
  readonly isVisible: boolean;
  readonly staticKeys?: readonly string[];
};

const toggleColumnVisibility = ({
  columnKey,
  columns,
  groupingKeys = [],
  hiddenKeys,
  isVisible,
  staticKeys,
}: ToggleArgs) => {
  setColumns(columns ?? []);
  setGroupingKeys(groupingKeys);
  setStaticKeys(staticKeys === undefined ? new Set() : new Set(staticKeys));
  setDrawerState(
    hiddenKeys ? { columnVisibility: new Set(hiddenKeys) } : undefined,
  );

  const { result } = renderHook(() => useToggleColumnVisibility());

  act(() => {
    result.current({ columnKey, isVisible });
  });
};

const cappedKeys = Array.from(
  { length: MAX_TABLE_GROUP_KEYS },
  (_unused, index) => `key_${String(index)}`,
);

const readNotification = () => {
  const [payload] = notify.mock.calls.at(-1) ?? [];

  return payload as undefined | { readonly message: string };
};

const readVisibilityPayload = () => {
  const [payload] = drawerColumnsStore.set.mock.calls.at(-1) ?? [];

  return payload as undefined | { readonly columnVisibility: Set<string> };
};

describe('useToggleColumnVisibility', () => {
  beforeEach(() => {
    setAggregates([]);
    setCapabilities({});
    setColumns([]);
    setDrawerState(undefined);
    setGroupingKeys([]);
    setStaticKeys(new Set());
    drawerColumnsStore.set.mockClear();
    modalsStore.set.mockClear();
    notify.mockClear();
  });

  it('hides a column by adding its key to the hidden set', () => {
    toggleColumnVisibility({
      columnKey: 'status',
      columns: [
        { key: 'id', label: 'Id' },
        { key: 'status', label: 'Status' },
      ],
      hiddenKeys: [],
      isVisible: false,
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnVisibility: new Set(['status']),
    });
  });

  it('shows a column by removing its key from the hidden set', () => {
    toggleColumnVisibility({
      columnKey: 'status',
      columns: [
        { key: 'id', label: 'Id' },
        { key: 'status', label: 'Status' },
      ],
      hiddenKeys: ['id', 'status'],
      isVisible: true,
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnVisibility: new Set(['id']),
    });
  });

  it('does nothing for a static column', () => {
    toggleColumnVisibility({
      columnKey: 'id',
      columns: [{ key: 'id', label: 'Id' }],
      hiddenKeys: [],
      isVisible: false,
      staticKeys: ['id'],
    });

    expect(drawerColumnsStore.set).not.toHaveBeenCalled();
  });

  it('toggles a column that is absent from the declared columns', () => {
    toggleColumnVisibility({
      columnKey: 'gone',
      columns: [{ key: 'id', label: 'Id' }],
      hiddenKeys: [],
      isVisible: false,
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnVisibility: new Set(['gone']),
    });
  });

  it('starts from an empty hidden set when the drawer store is still empty', () => {
    toggleColumnVisibility({
      columnKey: 'status',
      columns: [{ key: 'status', label: 'Status' }],
      isVisible: false,
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnVisibility: new Set(['status']),
    });
  });

  it('toggles when the table config store is still empty', () => {
    setStaticKeys(undefined);
    setDrawerState({ columnVisibility: new Set(['status']) });

    const { result } = renderHook(() => useToggleColumnVisibility());

    act(() => {
      result.current({ columnKey: 'status', isVisible: true });
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnVisibility: new Set(),
    });
  });

  it('is a no-op on the set when hiding an already hidden column', () => {
    toggleColumnVisibility({
      columnKey: 'status',
      columns: [{ key: 'status', label: 'Status' }],
      hiddenKeys: ['status'],
      isVisible: false,
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnVisibility: new Set(['status']),
    });
  });

  it('is a no-op on the set when showing an already visible column', () => {
    toggleColumnVisibility({
      columnKey: 'status',
      columns: [{ key: 'status', label: 'Status' }],
      hiddenKeys: ['id'],
      isVisible: true,
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnVisibility: new Set(['id']),
    });
  });

  it('never mutates the hidden set held in the drawer store', () => {
    const hidden = new Set(['id']);
    setStaticKeys(new Set());
    setColumns([{ key: 'status', label: 'Status' }]);
    setDrawerState({ columnVisibility: hidden });

    const { result } = renderHook(() => useToggleColumnVisibility());

    act(() => {
      result.current({ columnKey: 'status', isVisible: false });
    });

    expect(hidden).toEqual(new Set(['id']));
    expect(readVisibilityPayload()?.columnVisibility).not.toBe(hidden);
  });

  it('hides a column while grouping is applied exactly as it does ungrouped', () => {
    toggleColumnVisibility({
      columnKey: 'amount',
      columns: [
        { key: 'region', label: 'Region' },
        { key: 'amount', label: 'Amount' },
      ],
      groupingKeys: ['region'],
      hiddenKeys: [],
      isVisible: false,
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnVisibility: new Set(['amount']),
    });
    expect(modalsStore.set).not.toHaveBeenCalled();
  });

  it('asks how a column should join the grouping instead of writing visibility', () => {
    toggleColumnVisibility({
      columnKey: 'amount',
      columns: [
        { key: 'region', label: 'Region' },
        { key: 'amount', label: 'Amount' },
      ],
      groupingKeys: ['region'],
      hiddenKeys: [],
      isVisible: true,
    });

    expect(modalsStore.set).toHaveBeenCalledWith({
      columnGroupingPrompt: { columnKey: 'amount', isOpen: true },
    });
    expect(drawerColumnsStore.set).not.toHaveBeenCalled();
  });

  it('shows a column when the applied keys name no declared column', () => {
    setCapabilities({
      amount: { aggregates: ['sum'], canGroup: true, periods: [] },
    });

    toggleColumnVisibility({
      columnKey: 'amount',
      columns: [
        { key: 'region', label: 'Region' },
        { key: 'amount', label: 'Amount' },
      ],
      groupingKeys: ['tier'],
      hiddenKeys: ['amount'],
      isVisible: true,
    });

    expect(readVisibilityPayload()?.columnVisibility).toStrictEqual(new Set());
    expect(modalsStore.set).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it('reports rather than prompting when the column can join as neither', () => {
    setCapabilities({
      amount: { aggregates: [], canGroup: false, periods: [] },
    });

    toggleColumnVisibility({
      columnKey: 'amount',
      columns: [
        { key: 'region', label: 'Region' },
        { isGroupable: false, key: 'amount', label: 'Amount' },
      ],
      groupingKeys: ['region'],
      hiddenKeys: [],
      isVisible: true,
    });

    expect(modalsStore.set).not.toHaveBeenCalled();
    expect(drawerColumnsStore.set).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledTimes(1);
    expect(readNotification()?.message).toBe(
      COLUMN_GROUPING_REFUSAL_MESSAGES['not-offered'],
    );
  });

  it('reports the key cap rather than the column when only the cap refuses', () => {
    setCapabilities({
      amount: { aggregates: [], canGroup: true, periods: [] },
    });

    toggleColumnVisibility({
      columnKey: 'amount',
      columns: [
        ...cappedKeys.map((key) => ({ key, label: key })),
        { key: 'amount', label: 'Amount' },
      ],
      groupingKeys: cappedKeys,
      hiddenKeys: [],
      isVisible: true,
    });

    expect(notify).toHaveBeenCalledTimes(1);
    expect(readNotification()?.message).toBe(
      COLUMN_GROUPING_REFUSAL_MESSAGES['key-cap-reached'],
    );
  });

  it('shows a hidden column the grouping measures, without prompting', () => {
    setAggregates([{ columnKey: 'amount', fn: 'sum' }]);

    toggleColumnVisibility({
      columnKey: 'amount',
      columns: [
        { key: 'region', label: 'Region' },
        { key: 'amount', label: 'Amount' },
      ],
      groupingKeys: ['region'],
      hiddenKeys: ['amount'],
      isVisible: true,
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnVisibility: new Set(),
    });
    expect(modalsStore.set).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it('writes visibility for a column the grouping already names', () => {
    toggleColumnVisibility({
      columnKey: 'region',
      columns: [{ key: 'region', label: 'Region' }],
      groupingKeys: ['region'],
      hiddenKeys: ['region'],
      isVisible: true,
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnVisibility: new Set(),
    });
    expect(modalsStore.set).not.toHaveBeenCalled();
  });
});
