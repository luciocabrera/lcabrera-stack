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
  mockSetColumnAggregate,
  mockToggleGroupShare,
  sharesRef,
} = vi.hoisted(() => ({
  aggregatesRef: { current: {} as TableGroupingState['aggregates'] },
  columnsRef: { current: [] as readonly Record<string, unknown>[] },
  mockSetColumnAggregate: vi.fn(),
  mockToggleGroupShare: vi.fn(),
  sharesRef: { current: [] as readonly string[] },
}));

vi.mock(
  '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook',
  () => ({
    useGetColumns: () => columnsRef.current,
  }),
);

vi.mock('../../TableDrawerContext/actions', () => ({
  useSetColumnAggregate: () => mockSetColumnAggregate,
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
  aggregatesRef.current = {};
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
    aggregatesRef.current = { total_amount: 'sum' };

    render(<ActiveAggregateList />);

    expect(screen.getByText('Sum of Total')).not.toBeNull();
  });

  it('lists them in column order rather than in map order', () => {
    // Written most-recently-added first, so insertion order and column order
    // disagree — which is what makes this assertion discriminating.
    aggregatesRef.current = { quantity: 'max', total_amount: 'sum' };

    render(<ActiveAggregateList />);

    expect(screen.getByText('Aggregates (2)')).not.toBeNull();
    expect(
      screen.getAllByText(/^\w+ of /).map((node) => node.textContent),
    ).toEqual(['Maximum of Quantity', 'Sum of Total']);
  });

  it('clears one aggregate without touching the others', () => {
    aggregatesRef.current = { quantity: 'max', total_amount: 'sum' };

    render(<ActiveAggregateList />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Sum of Total' }),
    );

    expect(mockSetColumnAggregate).toHaveBeenCalledWith({
      columnKey: 'total_amount',
      fn: undefined,
    });
    expect(mockSetColumnAggregate).toHaveBeenCalledTimes(1);
  });
});
