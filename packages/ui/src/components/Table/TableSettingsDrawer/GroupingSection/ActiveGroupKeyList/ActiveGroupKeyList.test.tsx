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

import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';

type MockDraggableListProps = {
  readonly items: readonly {
    readonly content: ReactNode;
    readonly id: string;
  }[];
  readonly onOrderChange?: (items: readonly { readonly id: string }[]) => void;
};

const { columnsRef, groupingKeysRef, isGroupingLockedRef, mockSetGroupKeys } =
  vi.hoisted(() => ({
    columnsRef: { current: [] as readonly Record<string, unknown>[] },
    groupingKeysRef: { current: [] as readonly string[] },
    isGroupingLockedRef: { current: false },
    mockSetGroupKeys: vi.fn(),
  }));

const { NO_PERIODS } = vi.hoisted(() => ({
  NO_PERIODS: {} as Readonly<Record<string, never>>,
}));

vi.mock(
  '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook',
  () => ({
    useGetColumns: () => columnsRef.current,
  }),
);

vi.mock('../../TableDrawerContext/actions', () => ({
  useClearGrouping: () => vi.fn(),
  useResetGrouping: () => vi.fn(),
  useSetGroupKeyPeriod: () => vi.fn(),
  useSetGroupKeys: () => mockSetGroupKeys,
}));

vi.mock('../../TableDrawerContext/selectors', () => ({
  useGetGroupingKeys: () => groupingKeysRef.current,
  useGetGroupingPeriods: () => NO_PERIODS,
}));

// Each key item now carries a granularity control, which reads the route's
// per-column capability. This file asserts what the *list* does, so the
// capability is stubbed absent — the state in which the control renders nothing.
vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableColumnGroupingCapability: () => {},
  useGetTableIsGroupingLocked: () => isGroupingLockedRef.current,
}));

vi.mock('#ui/components/DraggableList', () => ({
  DraggableList: ({ items, onOrderChange }: MockDraggableListProps) => (
    <div data-testid='group-key-list'>
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

import { ActiveGroupKeyList } from './ActiveGroupKeyList.component';

beforeEach(() => {
  isGroupingLockedRef.current = false;
  columnsRef.current = [
    { key: 'order_status', label: 'Status' },
    { key: 'shipping_country', label: 'Country' },
  ];
  groupingKeysRef.current = [];
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ActiveGroupKeyList', () => {
  it('says so when nothing is grouped', () => {
    render(<ActiveGroupKeyList />);

    expect(screen.queryByTestId('group-key-list')).toBeNull();
    expect(screen.getByText(/No grouping applied/)).not.toBeNull();
  });

  it('lists the applied keys with their level and column label', () => {
    groupingKeysRef.current = ['shipping_country', 'order_status'];

    render(<ActiveGroupKeyList />);

    expect(screen.getByText('1. Country')).not.toBeNull();
    expect(screen.getByText('2. Status')).not.toBeNull();
  });

  it('shows the applied depth against the cap', () => {
    groupingKeysRef.current = ['order_status'];

    render(<ActiveGroupKeyList />);

    expect(
      screen.getByText(`Group Keys (1/${MAX_TABLE_GROUP_KEYS})`),
    ).not.toBeNull();
  });

  it('removes one key while keeping the rest in order', () => {
    groupingKeysRef.current = ['order_status', 'shipping_country'];

    render(<ActiveGroupKeyList />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Status group key' }),
    );

    expect(mockSetGroupKeys).toHaveBeenCalledWith(['shipping_country']);
  });

  it('writes a reorder through the grouping action, because order is the query', () => {
    groupingKeysRef.current = ['order_status', 'shipping_country'];

    render(<ActiveGroupKeyList />);
    fireEvent.click(screen.getByRole('button', { name: 'Reverse' }));

    expect(mockSetGroupKeys).toHaveBeenCalledWith([
      'shipping_country',
      'order_status',
    ]);
  });

  it('labels a key whose column the route no longer declares', () => {
    groupingKeysRef.current = ['not_a_column'];

    render(<ActiveGroupKeyList />);

    expect(screen.getByText('1. not_a_column')).not.toBeNull();
  });

  it('still renders the applied keys under a locked preset', () => {
    isGroupingLockedRef.current = true;
    groupingKeysRef.current = ['order_status', 'shipping_country'];

    render(<ActiveGroupKeyList />);

    expect(screen.getByText('1. Status')).toBeTruthy();
    expect(screen.getByText('2. Country')).toBeTruthy();
  });

  it('offers neither removal nor reorder under a locked preset', () => {
    isGroupingLockedRef.current = true;
    groupingKeysRef.current = ['order_status', 'shipping_country'];

    render(<ActiveGroupKeyList />);

    expect(screen.queryByRole('button', { name: /Remove/ })).toBeNull();
    expect(screen.queryByTestId('group-key-list')).toBeNull();
  });

  it('claims no grouping exists when a lock is declared over no keys', () => {
    isGroupingLockedRef.current = true;
    groupingKeysRef.current = [];

    render(<ActiveGroupKeyList />);

    expect(screen.getByText(/No grouping applied/)).toBeTruthy();
    expect(screen.queryByText(/grouped by a fixed set/)).toBeNull();
  });
});
