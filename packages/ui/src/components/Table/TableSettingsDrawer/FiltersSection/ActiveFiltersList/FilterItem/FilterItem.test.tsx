// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  columnFiltersRef,
  expandedFiltersRef,
  mockSetColumnFilters,
  mockSetExpandedFilters,
} = vi.hoisted(() => ({
  columnFiltersRef: { current: {} as Record<string, unknown> },
  expandedFiltersRef: { current: [] as readonly string[] },
  mockSetColumnFilters: vi.fn(),
  mockSetExpandedFilters: vi.fn(),
}));

vi.mock('@repo/ui/components/Button', () => ({
  Button: ({
    onClick,
    ...props
  }: {
    readonly 'aria-label'?: string;
    readonly onClick?: () => void;
  }) => (
    <button aria-label={props['aria-label']} onClick={onClick} type='button' />
  ),
}));

vi.mock('@repo/ui/components/Table/filters/FilterInputs', () => ({
  FilterInputs: ({
    onChange,
  }: {
    readonly onChange: (filter?: unknown) => void;
  }) => (
    <div data-testid='filter-inputs'>
      <button
        onClick={() => {
          onChange({ operator: 'equals', type: 'text', value: 'updated' });
        }}
        type='button'
      >
        Change Filter
      </button>
      <button
        onClick={() => {
          onChange(undefined);
        }}
        type='button'
      >
        Clear Filter
      </button>
    </div>
  ),
}));

vi.mock('../../../TableDrawerContext/actions', () => ({
  useSetColumnFilters: () => mockSetColumnFilters,
}));

vi.mock('../../../TableDrawerContext/selectors', () => ({
  useGetColumnFilters: () => columnFiltersRef.current,
}));

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/columns/selectors',
  () => ({
    useGetNormalizedColumns: () => ({
      price: { key: 'price', label: 'Price' },
      status: { key: 'status', label: 'Status' },
    }),
  }),
);

vi.mock('@repo/ui/components/Table/contexts/TableConfig/meta/actions', () => ({
  useSetTableSettingsExpandedFilters: () => mockSetExpandedFilters,
}));

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/meta/selectors',
  () => ({
    useGetTableSettingsExpandedFilters: () => expandedFiltersRef.current,
  }),
);

import { FilterItem } from './FilterItem.component';

const statusFilter = { operator: 'equals', type: 'text', value: 'cancelled' };

const renderItem = () =>
  render(<FilterItem columnKey='status' isBusy={false} />);

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  columnFiltersRef.current = {
    price: { operator: 'equals', type: 'number', value: 1 },
    status: statusFilter,
  };
  expandedFiltersRef.current = ['status'];
  mockSetColumnFilters.mockReset();
  mockSetExpandedFilters.mockReset();
});

describe('FilterItem', () => {
  it('collapses an expanded row on toggle', () => {
    renderItem();

    fireEvent.click(screen.getByRole('button', { name: /^▼Status$/ }));

    expect(mockSetExpandedFilters).toHaveBeenCalledWith([]);
  });

  it('expands a collapsed row on toggle and hides its inputs until then', () => {
    expandedFiltersRef.current = [];

    renderItem();

    expect(screen.queryByTestId('filter-inputs')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /^▶Status$/ }));

    expect(mockSetExpandedFilters).toHaveBeenCalledWith(['status']);
  });

  it('removes the filter and its expansion on remove', () => {
    renderItem();

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Status filter' }),
    );

    expect(mockSetColumnFilters).toHaveBeenCalledWith({
      price: { operator: 'equals', type: 'number', value: 1 },
    });
    expect(mockSetExpandedFilters).toHaveBeenCalledWith([]);
  });

  it('upserts the filter on input change', () => {
    renderItem();

    fireEvent.click(screen.getByRole('button', { name: 'Change Filter' }));

    expect(mockSetColumnFilters).toHaveBeenCalledWith({
      price: { operator: 'equals', type: 'number', value: 1 },
      status: { operator: 'equals', type: 'text', value: 'updated' },
    });
  });

  it('removes the filter when inputs clear it', () => {
    renderItem();

    fireEvent.click(screen.getByRole('button', { name: 'Clear Filter' }));

    expect(mockSetColumnFilters).toHaveBeenCalledWith({
      price: { operator: 'equals', type: 'number', value: 1 },
    });
    expect(mockSetExpandedFilters).toHaveBeenCalledWith([]);
  });
});
