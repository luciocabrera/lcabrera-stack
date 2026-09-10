// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import type {
  TableColumn,
  TableGroupingState,
  TablePersistenceEntry,
} from '#ui/components/Table/Table.types';

import { createMockStore } from '#ui/utils/tests/createMockStore.util';
import { deserializeGroupingFromURL } from '#ui/utils/urlState';

type MockDraggableListProps = {
  readonly items: readonly {
    readonly content: ReactNode;
    readonly id: string;
  }[];
  readonly onOrderChange?: (items: readonly { readonly id: string }[]) => void;
};

type Row = Record<string, unknown>;

const COLUMNS = [
  { key: 'order_status', label: 'Status' },
  { key: 'shipping_country', label: 'Country' },
  { isGroupable: false, key: 'total_amount', label: 'Total' },
  { isGroupable: false, key: 'quantity', label: 'Quantity' },
] as unknown as TableColumn<Row>[];

const CAPABILITIES = {
  quantity: { aggregates: ['sum'], canGroup: false },
  total_amount: { aggregates: ['sum', 'avg'], canGroup: false },
};

const NO_GROUPING: TableGroupingState = {
  aggregates: [],
  keys: [],
  mode: 'flat',
  periods: {},
  shares: [],
  totalsPlacement: 'last',
};

const stores = {
  columnsStore: createMockStore<Record<string, unknown>>({}),
  dataStore: createMockStore<Record<string, unknown>>({}),
  groupingStore: createMockStore<TableGroupingState>(NO_GROUPING),
  metaStore: createMockStore<Record<string, unknown>>({}),
};

const getTableConfigContextValue = vi.hoisted(() => {
  return function getTableConfigContextValue() {
    return {
      columnsStore: stores.columnsStore,
      groupingStore: stores.groupingStore,
      metaStore: stores.metaStore,
    };
  };
});

const getTableDataContextValue = vi.hoisted(() => {
  return function getTableDataContextValue() {
    return { dataStore: stores.dataStore };
  };
});

const persistTableState = vi.hoisted(() =>
  vi.fn<(entries: readonly TablePersistenceEntry[]) => boolean>(() => true),
);
const persistUiFlags = vi.hoisted(() => vi.fn());
const notify = vi.hoisted(() => vi.fn());

vi.mock(
  '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({ useTableConfigContextValue: getTableConfigContextValue }),
);

vi.mock(
  '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook',
  () => ({ useTableDataContextValue: getTableDataContextValue }),
);

vi.mock(
  '#ui/components/Table/contexts/TableConfig/columns/actions/hooks/usePersistTableStateAction.hook',
  () => ({ usePersistTableStateAction: () => persistTableState }),
);

vi.mock(
  '#ui/components/Table/contexts/TableConfig/meta/actions/usePersistTableUiFlagsAction.hook',
  () => ({ usePersistTableUiFlagsAction: () => persistUiFlags }),
);

vi.mock('#ui/contexts/NotificationContext/actions', () => ({
  useNotifyAction: () => notify,
}));

vi.mock('#ui/components/DraggableList', () => ({
  DraggableList: ({ items, onOrderChange }: MockDraggableListProps) => (
    <div>
      <button
        onClick={() => {
          onOrderChange?.([...items].toReversed());
        }}
        type='button'
      >
        Reverse
      </button>
      {items.map((item) => (
        <div key={item.id}>{item.content}</div>
      ))}
    </div>
  ),
}));

vi.mock('#ui/components/VirtualSelect', async () => {
  const { createMockVirtualSelect } =
    await import('#ui/utils/tests/createMockVirtualSelect.util');

  return { VirtualSelect: createMockVirtualSelect() };
});

import { TableDrawerProvider } from '../TableDrawerContext/TableDrawerContext.provider';
import { TableSettingsDrawerFooter } from '../TableSettingsDrawerFooter/TableSettingsDrawerFooter.component';
import { GroupingModeSection } from './AdvancedSettingsSection/GroupingModeSection';
import { GroupingSection } from './GroupingSection.component';

const renderDrawer = (extras?: ReactNode) =>
  render(
    <TableDrawerProvider>
      <GroupingSection />
      {extras}
      <TableSettingsDrawerFooter />
    </TableDrawerProvider>,
  );

const applyOneKeyAndOneAggregate = () => {
  stores.groupingStore.reset({
    aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
    keys: ['order_status'],
    mode: 'flat',
    periods: {},
    shares: [],
    totalsPlacement: 'last',
  });
};

const openSubtab = (name: 'Advanced' | 'Aggregates' | 'Group Keys') => {
  fireEvent.click(screen.getByRole('tab', { name }));
};

const stageGroupKey = (label: string) => {
  openSubtab('Group Keys');
  fireEvent.click(screen.getByRole('button', { name: label }));
  fireEvent.click(screen.getByRole('button', { name: 'Add' }));
};

const stageAggregate = ({
  columnLabel,
  fnLabel,
}: {
  readonly columnLabel: string;
  readonly fnLabel: string;
}) => {
  openSubtab('Aggregates');
  fireEvent.click(screen.getByRole('button', { name: columnLabel }));
  fireEvent.click(screen.getByRole('button', { name: fnLabel }));
  fireEvent.click(screen.getByRole('button', { name: 'Add' }));
};

const getReverseButtons = () => ({
  get reverseAggregates() {
    openSubtab('Aggregates');

    return screen.getByRole('button', { name: 'Reverse' });
  },
  get reverseGroupKeys() {
    openSubtab('Group Keys');

    return screen.getByRole('button', { name: 'Reverse' });
  },
});

const getCommittedGroupingParam = () =>
  (persistTableState.mock.calls[0]?.[0] ?? []).find(
    (entry) => entry.searchParamKey === 'grouping',
  )?.searchParamValue;

const getAggregateLabels = () =>
  screen.getAllByText(/^\w+ of /).map((node) => node.textContent);

beforeEach(() => {
  stores.columnsStore = createMockStore<Record<string, unknown>>({
    columnFilters: {},
    columnOrder: [],
    columnPinning: { left: [], right: [] },
    columns: COLUMNS,
    columnSizing: {},
    columnVisibility: new Set<string>(),
    sorting: [],
  });
  stores.dataStore = createMockStore<Record<string, unknown>>({});
  stores.groupingStore = createMockStore<TableGroupingState>(NO_GROUPING);
  stores.metaStore = createMockStore<Record<string, unknown>>({
    groupingCapabilities: CAPABILITIES,
    isTableSettingsPinned: true,
    persistenceKey: 'orders-table',
  });
  persistTableState.mockClear();
  persistTableState.mockReturnValue(true);
  persistUiFlags.mockClear();
  notify.mockClear();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('GroupingSection staging', () => {
  it('stages a multi-edit sequence without a single navigation, then commits it in exactly one', () => {
    renderDrawer();

    stageGroupKey('Status');
    stageGroupKey('Country');
    stageAggregate({ columnLabel: 'Total', fnLabel: 'Sum' });
    fireEvent.click(getReverseButtons().reverseGroupKeys as HTMLElement);
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Country group key' }),
    );

    expect(persistTableState).not.toHaveBeenCalled();
    expect(stores.groupingStore.get()).toStrictEqual(NO_GROUPING);

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(persistTableState).toHaveBeenCalledTimes(1);
    expect(persistTableState.mock.calls[0]?.[0]).toContainEqual({
      searchParamKey: 'grouping',
      searchParamValue: '{"agg":["total_amount:sum"],"keys":["order_status"]}',
    });
    expect(stores.groupingStore.get()).toStrictEqual({
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
      keys: ['order_status'],
      mode: 'flat',
      periods: {},
      shares: [],
      totalsPlacement: 'last',
    });
  });

  it('stages TWO aggregates on one column and commits both', () => {
    renderDrawer();

    stageGroupKey('Status');
    stageAggregate({ columnLabel: 'Total', fnLabel: 'Average' });
    stageAggregate({ columnLabel: 'Total', fnLabel: 'Sum' });

    expect(screen.getByText('Aggregates (2)')).not.toBeNull();
    expect(screen.getByText('Average of Total')).not.toBeNull();
    expect(screen.getByText('Sum of Total')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(persistTableState.mock.calls[0]?.[0]).toContainEqual({
      searchParamKey: 'grouping',
      searchParamValue:
        '{"agg":["total_amount:avg","total_amount:sum"],"keys":["order_status"]}',
    });
    expect(stores.groupingStore.get().aggregates).toStrictEqual([
      { columnKey: 'total_amount', fn: 'avg' },
      { columnKey: 'total_amount', fn: 'sum' },
    ]);
  });

  it('removes one staged aggregate and leaves the column the other', () => {
    renderDrawer();

    stageGroupKey('Status');
    stageAggregate({ columnLabel: 'Total', fnLabel: 'Average' });
    stageAggregate({ columnLabel: 'Total', fnLabel: 'Sum' });
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Average of Total' }),
    );

    expect(screen.getByText('Aggregates (1)')).not.toBeNull();
    expect(screen.getByText('Sum of Total')).not.toBeNull();
    expect(screen.queryByText('Average of Total')).toBeNull();
  });

  it('stages a drag ACROSS columns and commits the dragged order in one navigation', () => {
    renderDrawer();

    stageGroupKey('Status');
    stageAggregate({ columnLabel: 'Total', fnLabel: 'Average' });
    stageAggregate({ columnLabel: 'Quantity', fnLabel: 'Sum' });

    expect(getAggregateLabels()).toEqual([
      'Average of Total',
      'Sum of Quantity',
    ]);

    fireEvent.click(getReverseButtons().reverseAggregates as HTMLElement);

    expect(getAggregateLabels()).toEqual([
      'Sum of Quantity',
      'Average of Total',
    ]);
    expect(persistTableState).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(persistTableState).toHaveBeenCalledTimes(1);
    expect(getCommittedGroupingParam()).toBe(
      '{"agg":["quantity:sum","total_amount:avg"],"keys":["order_status"]}',
    );
    expect(stores.groupingStore.get().aggregates).toStrictEqual([
      { columnKey: 'quantity', fn: 'sum' },
      { columnKey: 'total_amount', fn: 'avg' },
    ]);
  });

  it('reads the dragged order back out of the committed URL param', () => {
    const firstOpen = renderDrawer();

    stageGroupKey('Status');
    stageAggregate({ columnLabel: 'Total', fnLabel: 'Average' });
    stageAggregate({ columnLabel: 'Quantity', fnLabel: 'Sum' });
    fireEvent.click(getReverseButtons().reverseAggregates as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    const committedParam = getCommittedGroupingParam();

    expect(committedParam).not.toBeUndefined();

    firstOpen.unmount();
    stores.groupingStore.reset(
      deserializeGroupingFromURL(committedParam as string),
    );
    renderDrawer();

    expect(getAggregateLabels()).toEqual([
      'Sum of Quantity',
      'Average of Total',
    ]);
  });

  it('discards a reorder on Cancel, like every other staged edit', () => {
    stores.groupingStore.reset({
      aggregates: [
        { columnKey: 'total_amount', fn: 'avg' },
        { columnKey: 'quantity', fn: 'sum' },
      ],
      keys: ['order_status'],
      mode: 'flat',
      periods: {},
      shares: [],
      totalsPlacement: 'last',
    });

    renderDrawer();
    fireEvent.click(getReverseButtons().reverseAggregates as HTMLElement);

    expect(getAggregateLabels()).toEqual([
      'Sum of Quantity',
      'Average of Total',
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(persistTableState).not.toHaveBeenCalled();
    expect(stores.groupingStore.get().aggregates).toStrictEqual([
      { columnKey: 'total_amount', fn: 'avg' },
      { columnKey: 'quantity', fn: 'sum' },
    ]);
    expect(getAggregateLabels()).toEqual([
      'Average of Total',
      'Sum of Quantity',
    ]);
  });

  it('keeps the share toggle on a row that is now a draggable item', () => {
    renderDrawer();

    stageGroupKey('Status');
    stageAggregate({ columnLabel: 'Total', fnLabel: 'Sum' });
    fireEvent.click(
      screen.getByRole('button', {
        name: /Show share of grand total for Sum of Total/,
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(getCommittedGroupingParam()).toBe(
      '{"agg":["total_amount:sum"],"keys":["order_status"],"share":["total_amount:sum"]}',
    );
  });

  it('stages the totals mode and carries it in the same commit', () => {
    renderDrawer(<GroupingModeSection />);

    stageGroupKey('Status');
    fireEvent.click(
      screen.getByRole('radio', { name: /Groups with subtotals/ }),
    );

    expect(persistTableState).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(persistTableState.mock.calls[0]?.[0]).toContainEqual({
      searchParamKey: 'grouping',
      searchParamValue: '{"keys":["order_status"],"mode":"rollup"}',
    });
    expect(stores.groupingStore.get().mode).toBe('rollup');
  });

  it('leaves the mode out of the param while it is the default', () => {
    renderDrawer();

    stageGroupKey('Status');
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(persistTableState.mock.calls[0]?.[0]).toContainEqual({
      searchParamKey: 'grouping',
      searchParamValue: '{"keys":["order_status"]}',
    });
  });

  it('carries the whole configuration in one param write, not one write per key', () => {
    renderDrawer();

    stageGroupKey('Status');
    stageGroupKey('Country');

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    const groupingEntries = (persistTableState.mock.calls[0]?.[0] ?? []).filter(
      (entry) => entry.searchParamKey === 'grouping',
    );

    expect(groupingEntries).toStrictEqual([
      {
        searchParamKey: 'grouping',
        searchParamValue: '{"keys":["order_status","shipping_country"]}',
      },
    ]);
  });

  it('restores the applied grouping on Cancel, with no navigation', () => {
    stores.groupingStore.reset({
      aggregates: [],
      keys: ['shipping_country'],
      mode: 'flat',
      periods: {},
      shares: [],
      totalsPlacement: 'last',
    });

    renderDrawer();
    stageGroupKey('Status');
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Country group key' }),
    );

    expect(screen.getByText('1. Status')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(persistTableState).not.toHaveBeenCalled();
    expect(stores.groupingStore.get()).toStrictEqual({
      aggregates: [],
      keys: ['shipping_country'],
      mode: 'flat',
      periods: {},
      shares: [],
      totalsPlacement: 'last',
    });
    expect(screen.getByText('1. Country')).not.toBeNull();
  });

  it('shows the live grouping when the drawer is re-opened after a Cancel', () => {
    stores.groupingStore.reset({
      aggregates: [],
      keys: ['shipping_country'],
      mode: 'flat',
      periods: {},
      shares: [],
      totalsPlacement: 'last',
    });

    const firstOpen = renderDrawer();

    stageGroupKey('Status');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    firstOpen.unmount();

    renderDrawer();

    expect(screen.getByText('1. Country')).not.toBeNull();
    expect(screen.queryByText('2. Status')).toBeNull();
    expect(persistTableState).not.toHaveBeenCalled();
  });

  it('takes the aggregates with the last group key, because the state holds no measure without one', () => {
    applyOneKeyAndOneAggregate();

    renderDrawer();
    fireEvent.click(screen.getByRole('button', { name: 'Clear Group Keys' }));

    expect(persistTableState).not.toHaveBeenCalled();
    expect(stores.groupingStore.get().keys).toStrictEqual(['order_status']);
    expect(screen.getByText(/No grouping applied/)).not.toBeNull();

    openSubtab('Aggregates');

    expect(screen.getByText(/No aggregates selected/)).not.toBeNull();
  });

  it('clears the aggregates without touching the staged group keys', () => {
    applyOneKeyAndOneAggregate();

    renderDrawer();
    openSubtab('Aggregates');
    fireEvent.click(screen.getByRole('button', { name: 'Clear Aggregates' }));

    expect(persistTableState).not.toHaveBeenCalled();
    expect(screen.getByText(/No aggregates selected/)).not.toBeNull();

    openSubtab('Group Keys');

    expect(screen.getByText('1. Status')).not.toBeNull();
  });

  it('disables a scoped clear while its own subject is empty', () => {
    renderDrawer();

    expect(
      screen
        .getByRole('button', { name: 'Clear Group Keys' })
        .hasAttribute('disabled'),
    ).toBe(true);
  });

  it('stages a clear from the footer placement too', () => {
    stores.groupingStore.reset({
      aggregates: [],
      keys: ['order_status'],
      mode: 'flat',
      periods: {},
      shares: [],
      totalsPlacement: 'last',
    });

    renderDrawer();
    fireEvent.click(screen.getByRole('button', { name: 'Clear Grouping' }));

    expect(persistTableState).not.toHaveBeenCalled();
    expect(screen.getByText(/No grouping applied/)).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(persistTableState).toHaveBeenCalledTimes(1);
    expect(stores.groupingStore.get()).toStrictEqual(NO_GROUPING);
  });

  it('offers a reset beside every clear, as other sections do', () => {
    renderDrawer();

    expect(
      screen.getByRole('button', { name: 'Reset Grouping' }),
    ).not.toBeNull();
    expect(
      screen.getByRole('button', { name: 'Reset Group Keys' }),
    ).not.toBeNull();

    openSubtab('Aggregates');

    expect(
      screen.getByRole('button', { name: 'Reset Aggregates' }),
    ).not.toBeNull();
  });

  it('puts back only the subject its reset names', () => {
    applyOneKeyAndOneAggregate();

    renderDrawer();
    fireEvent.click(screen.getByRole('button', { name: 'Clear Group Keys' }));
    openSubtab('Aggregates');
    fireEvent.click(screen.getByRole('button', { name: 'Clear Aggregates' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset Aggregates' }));

    expect(screen.getByText('Sum of Total')).not.toBeNull();

    openSubtab('Group Keys');

    expect(screen.getByText(/No grouping applied/)).not.toBeNull();
  });

  it('puts a staged edit back from the applied grouping', () => {
    applyOneKeyAndOneAggregate();

    renderDrawer();

    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'Clear Grouping',
      })[0] as HTMLElement,
    );

    expect(screen.getByText(/No grouping applied/)).not.toBeNull();

    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'Reset Grouping',
      })[0] as HTMLElement,
    );

    expect(screen.getByText('1. Status')).not.toBeNull();
    expect(persistTableState).not.toHaveBeenCalled();
  });
});

describe('GroupingSection sub-tabs', () => {
  it('names its own tab strip, so it is not the drawer strip a reader hears', () => {
    renderDrawer();

    expect(
      screen.getByRole('tablist', { name: 'Grouping settings tabs' }),
    ).not.toBeNull();
  });

  it('separates the keys, the measures and the totals into three tabs', () => {
    stores.metaStore.set({ isGroupingEnabled: true });

    renderDrawer();

    expect(
      screen.getAllByRole('tab').map((tab) => tab.textContent),
    ).toStrictEqual(['Group Keys', 'Aggregates', 'Advanced']);
  });

  it('opens on the group keys, since a grouping starts with a dimension', () => {
    renderDrawer();

    expect(
      screen
        .getByRole('tab', { name: 'Group Keys' })
        .getAttribute('aria-selected'),
    ).toBe('true');
    expect(screen.getByRole('button', { name: 'Add' })).not.toBeNull();
  });

  it('keeps the clear and reset pair outside the tabs, where it governs all three', () => {
    renderDrawer();

    openSubtab('Aggregates');

    expect(
      screen.getAllByRole('button', { name: 'Clear Grouping' }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('button', { name: 'Reset Grouping' }).length,
    ).toBeGreaterThan(0);
  });

  it('drops the Advanced tab where neither totals control can render', () => {
    stores.metaStore.set({ isGroupingEnabled: true, isGroupingLocked: true });

    renderDrawer();

    expect(
      screen.getAllByRole('tab').map((tab) => tab.textContent),
    ).toStrictEqual(['Group Keys', 'Aggregates']);
  });
});
