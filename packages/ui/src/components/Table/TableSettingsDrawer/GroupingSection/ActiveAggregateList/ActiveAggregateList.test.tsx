// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import type { TableGroupingState } from '#ui/components/Table/Table.types';

const {
  aggregatesRef,
  columnsRef,
  mockRemoveColumnAggregate,
  mockReorderColumnAggregates,
  mockToggleGroupShare,
  sharesRef,
} = vi.hoisted(() => ({
  aggregatesRef: { current: [] as TableGroupingState['aggregates'] },
  columnsRef: { current: [] as readonly Record<string, unknown>[] },
  mockRemoveColumnAggregate: vi.fn(),
  mockReorderColumnAggregates: vi.fn(),
  mockToggleGroupShare: vi.fn(),
  sharesRef: { current: [] as TableGroupingState['shares'] },
}));

vi.mock(
  '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook',
  () => ({
    useGetColumns: () => columnsRef.current,
  }),
);

vi.mock('../../TableDrawerContext/actions', () => ({
  useRemoveColumnAggregate: () => mockRemoveColumnAggregate,
  useReorderColumnAggregates: () => mockReorderColumnAggregates,
  useToggleGroupShare: () => mockToggleGroupShare,
}));

vi.mock('../../TableDrawerContext/selectors', () => ({
  useGetGroupingAggregates: () => aggregatesRef.current,
  useGetGroupingShares: () => sharesRef.current,
}));

import { ActiveAggregateList } from './ActiveAggregateList.component';

const dragRowOnto = ({ from, onto }: { from: number; onto: number }) => {
  const rows = screen.getAllByRole('listitem');
  const source = rows[from] as HTMLElement;

  fireEvent.dragStart(source);
  fireEvent.dragEnter(rows[onto] as HTMLElement);
  fireEvent.dragEnd(source);
};

beforeEach(() => {
  columnsRef.current = [
    { key: 'quantity', label: 'Quantity' },
    { key: 'total_amount', label: 'Total' },
  ];
  aggregatesRef.current = [];
  sharesRef.current = [];
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ActiveAggregateList', () => {
  it('says so when nothing is selected', () => {
    render(<ActiveAggregateList />);

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.getByText(/No aggregates selected/)).not.toBeNull();
  });

  it('names each selected aggregate by its function and column', () => {
    aggregatesRef.current = [{ columnKey: 'total_amount', fn: 'sum' }];

    render(<ActiveAggregateList />);

    expect(screen.getByText('Sum of Total')).not.toBeNull();
  });

  it('gives every row a drag handle, like the group key and sort rows', () => {
    aggregatesRef.current = [
      { columnKey: 'total_amount', fn: 'sum' },
      { columnKey: 'quantity', fn: 'max' },
    ];

    render(<ActiveAggregateList />);

    expect(screen.getAllByTestId('drag-handle')).toHaveLength(2);
    expect(
      screen
        .getAllByRole('listitem')
        .map((row) => row.getAttribute('draggable')),
    ).toEqual(['true', 'true']);
  });

  it('lists two aggregates on ONE column as two rows', () => {
    aggregatesRef.current = [
      { columnKey: 'total_amount', fn: 'avg' },
      { columnKey: 'total_amount', fn: 'min' },
    ];

    render(<ActiveAggregateList />);

    expect(screen.getByText('Aggregates (2)')).not.toBeNull();
    expect(
      screen.getAllByText(/^\w+ of /).map((node) => node.textContent),
    ).toEqual(['Average of Total', 'Minimum of Total']);
  });

  it('lists them in staged order rather than in column order', () => {
    aggregatesRef.current = [
      { columnKey: 'total_amount', fn: 'sum' },
      { columnKey: 'quantity', fn: 'max' },
    ];

    render(<ActiveAggregateList />);

    expect(
      screen.getAllByText(/^\w+ of /).map((node) => node.textContent),
    ).toEqual(['Sum of Total', 'Maximum of Quantity']);
  });

  it('writes a drag ACROSS columns through the grouping action, in row ids', () => {
    aggregatesRef.current = [
      { columnKey: 'total_amount', fn: 'sum' },
      { columnKey: 'quantity', fn: 'max' },
    ];

    render(<ActiveAggregateList />);
    dragRowOnto({ from: 1, onto: 0 });

    expect(mockReorderColumnAggregates).toHaveBeenCalledWith([
      'quantity:max',
      'total_amount:sum',
    ]);
  });

  it('reorders two measures of ONE column relative to each other', () => {
    aggregatesRef.current = [
      { columnKey: 'total_amount', fn: 'avg' },
      { columnKey: 'total_amount', fn: 'min' },
    ];

    render(<ActiveAggregateList />);
    dragRowOnto({ from: 1, onto: 0 });

    expect(mockReorderColumnAggregates).toHaveBeenCalledWith([
      'total_amount:min',
      'total_amount:avg',
    ]);
  });

  it('removes one aggregate without touching the column others', () => {
    aggregatesRef.current = [
      { columnKey: 'total_amount', fn: 'avg' },
      { columnKey: 'total_amount', fn: 'min' },
    ];

    render(<ActiveAggregateList />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Minimum of Total' }),
    );

    expect(mockRemoveColumnAggregate).toHaveBeenCalledWith({
      columnKey: 'total_amount',
      fn: 'min',
    });
    expect(mockRemoveColumnAggregate).toHaveBeenCalledTimes(1);
  });

  it('gives each shareable measure on one column its own toggle', () => {
    aggregatesRef.current = [
      { columnKey: 'total_amount', fn: 'sum' },
      { columnKey: 'total_amount', fn: 'count' },
    ];

    render(<ActiveAggregateList />);
    fireEvent.click(
      screen.getByRole('button', {
        name: /Show share of grand total for Count of Total/,
      }),
    );

    expect(mockToggleGroupShare).toHaveBeenCalledWith({
      columnKey: 'total_amount',
      fn: 'count',
    });
  });
});
