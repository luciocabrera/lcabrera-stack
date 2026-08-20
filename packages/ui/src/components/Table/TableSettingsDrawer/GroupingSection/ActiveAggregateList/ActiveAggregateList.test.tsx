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
  mockToggleGroupShare,
  sharesRef,
} = vi.hoisted(() => ({
  aggregatesRef: { current: [] as TableGroupingState['aggregates'] },
  columnsRef: { current: [] as readonly Record<string, unknown>[] },
  mockRemoveColumnAggregate: vi.fn(),
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
  useToggleGroupShare: () => mockToggleGroupShare,
}));

vi.mock('../../TableDrawerContext/selectors', () => ({
  useGetGroupingAggregates: () => aggregatesRef.current,
  useGetGroupingShares: () => sharesRef.current,
}));

import { ActiveAggregateList } from './ActiveAggregateList.component';

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

    expect(screen.getByText(/No aggregates selected/)).not.toBeNull();
  });

  it('names each selected aggregate by its function and column', () => {
    aggregatesRef.current = [{ columnKey: 'total_amount', fn: 'sum' }];

    render(<ActiveAggregateList />);

    expect(screen.getByText('Sum of Total')).not.toBeNull();
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
    // Written against the table's column order, so the two disagree — which is
    // what makes this assertion discriminating. The staged order is state
    // (#831), and re-sorting here would discard it.
    aggregatesRef.current = [
      { columnKey: 'total_amount', fn: 'sum' },
      { columnKey: 'quantity', fn: 'max' },
    ];

    render(<ActiveAggregateList />);

    expect(
      screen.getAllByText(/^\w+ of /).map((node) => node.textContent),
    ).toEqual(['Sum of Total', 'Maximum of Quantity']);
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
