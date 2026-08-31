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

type MockVirtualSelectProps = {
  readonly onChange: (values: readonly string[]) => void;
  readonly options: readonly {
    readonly label: string;
    readonly value: string;
  }[];
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

vi.mock('#ui/components/VirtualSelect', () => ({
  VirtualSelect: ({ onChange, options }: MockVirtualSelectProps) => (
    <ul>
      {options.map((option) => (
        <li key={option.value}>
          <button
            onClick={() => {
              onChange([option.value]);
            }}
            type='button'
          >
            {option.label}
          </button>
        </li>
      ))}
    </ul>
  ),
}));

import { TableDrawerProvider } from '../TableDrawerContext/TableDrawerContext.provider';
import { TableSettingsDrawerFooter } from '../TableSettingsDrawerFooter/TableSettingsDrawerFooter.component';
import { GroupingSection } from './GroupingSection.component';

const renderDrawer = () =>
  render(
    <TableDrawerProvider>
      <GroupingSection />
      <TableSettingsDrawerFooter />
    </TableDrawerProvider>,
  );

const getAddButtons = () => {
  const addButtons = screen.getAllByRole('button', { name: 'Add' });

  expect(addButtons).toHaveLength(2);

  return { addAggregate: addButtons[1], addGroupKey: addButtons[0] };
};

const stageGroupKey = (label: string) => {
  fireEvent.click(screen.getByRole('button', { name: label }));
  fireEvent.click(getAddButtons().addGroupKey as HTMLElement);
};

const stageAggregate = ({
  columnLabel,
  fnLabel,
}: {
  readonly columnLabel: string;
  readonly fnLabel: string;
}) => {
  fireEvent.click(screen.getByRole('button', { name: columnLabel }));
  fireEvent.click(screen.getByRole('button', { name: fnLabel }));
  fireEvent.click(getAddButtons().addAggregate as HTMLElement);
};

const getReverseButtons = () => {
  const reverseButtons = screen.getAllByRole('button', { name: 'Reverse' });

  expect(reverseButtons).toHaveLength(2);

  return {
    reverseAggregates: reverseButtons[1],
    reverseGroupKeys: reverseButtons[0],
  };
};

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
    renderDrawer();

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

  it('stages a clear from either toolbar placement', () => {
    stores.groupingStore.reset({
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
      keys: ['order_status'],
      mode: 'flat',
      periods: {},
      shares: [],
    });

    renderDrawer();

    const clearButtons = screen.getAllByRole('button', {
      name: 'Clear Grouping',
    });

    expect(clearButtons).toHaveLength(2);

    fireEvent.click(clearButtons[0] as HTMLElement);

    expect(persistTableState).not.toHaveBeenCalled();
    expect(stores.groupingStore.get().keys).toStrictEqual(['order_status']);
    expect(screen.getByText(/No grouping applied/)).not.toBeNull();
  });

  it('stages a clear from the footer placement too', () => {
    stores.groupingStore.reset({
      aggregates: [],
      keys: ['order_status'],
      mode: 'flat',
      periods: {},
      shares: [],
    });

    renderDrawer();
    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'Clear Grouping',
      })[1] as HTMLElement,
    );

    expect(persistTableState).not.toHaveBeenCalled();
    expect(screen.getByText(/No grouping applied/)).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(persistTableState).toHaveBeenCalledTimes(1);
    expect(stores.groupingStore.get()).toStrictEqual(NO_GROUPING);
  });
});
