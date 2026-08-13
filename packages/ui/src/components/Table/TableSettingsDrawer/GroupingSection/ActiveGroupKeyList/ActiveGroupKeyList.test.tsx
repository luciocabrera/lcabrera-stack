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

const { columnsRef, groupingKeysRef, mockSetGroupKeys } = vi.hoisted(() => ({
  columnsRef: { current: [] as readonly Record<string, unknown>[] },
  groupingKeysRef: { current: [] as readonly string[] },
  mockSetGroupKeys: vi.fn(),
}));

vi.mock(
  '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook',
  () => ({
    useGetColumns: () => columnsRef.current,
  }),
);

vi.mock('#ui/components/Table/contexts/TableConfig/grouping/actions', () => ({
  useClearTableGrouping: () => vi.fn(),
  useSetTableGroupKeys: () => mockSetGroupKeys,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/grouping/selectors', () => ({
  useGetTableGroupingKeys: () => groupingKeysRef.current,
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

    // Nesting order, not column order: these two are declared the other way
    // round above, which is what makes the assertion discriminate.
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
});
