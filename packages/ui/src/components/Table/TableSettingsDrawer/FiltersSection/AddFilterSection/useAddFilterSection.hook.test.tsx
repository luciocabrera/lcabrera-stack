// @vitest-environment jsdom

import type {
  ColumnFiltersState,
  TableColumn,
} from '@repo/ui/components/Table/Table.types';

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Row = Record<string, unknown>;

const {
  columnFiltersRef,
  columnsRef,
  expandedFiltersRef,
  mockSetColumnFilters,
  mockSetExpandedFilters,
  normalizedColumnsRef,
} = vi.hoisted(() => ({
  columnFiltersRef: { current: {} as Record<string, unknown> },
  columnsRef: { current: [] as readonly Record<string, unknown>[] },
  expandedFiltersRef: { current: [] as readonly string[] },
  mockSetColumnFilters: vi.fn(),
  mockSetExpandedFilters: vi.fn(),
  normalizedColumnsRef: { current: {} as Record<string, unknown> },
}));

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/columns/selectors',
  () => ({
    useGetColumns: () => columnsRef.current,
    useGetNormalizedColumns: () => normalizedColumnsRef.current,
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

vi.mock('../../TableDrawerContext/actions', () => ({
  useSetColumnFilters: () => mockSetColumnFilters,
}));

vi.mock('../../TableDrawerContext/selectors', () => ({
  useGetColumnFilters: () => columnFiltersRef.current,
}));

import { useAddFilterSection } from './useAddFilterSection.hook';

const columns: TableColumn<Row>[] = [
  { dataType: 'string', key: 'name', label: 'Name' },
  { dataType: 'number', key: 'age', label: 'Age' },
  { isFilterable: false, key: 'internal', label: 'Internal' },
];

const activeFilters: ColumnFiltersState = {
  name: { operator: 'contains', type: 'text', value: 'x' },
};

beforeEach(() => {
  columnsRef.current = columns;
  normalizedColumnsRef.current = {
    age: { dataType: 'number', key: 'age', label: 'Age' },
    name: { dataType: 'string', key: 'name', label: 'Name' },
  };
  columnFiltersRef.current = { ...activeFilters };
  expandedFiltersRef.current = ['name'];
  mockSetColumnFilters.mockReset();
  mockSetExpandedFilters.mockReset();
});

describe('useAddFilterSection', () => {
  it('builds options for filterable columns and flags active filters', () => {
    const { result } = renderHook(() => useAddFilterSection({}));

    expect(result.current.filterableColumnOptions).toEqual([
      { label: 'Name ⚠️ (filtered)', value: 'name' },
      { label: 'Age', value: 'age' },
    ]);
  });

  it('adds an initial filter for the selected column and expands it first', () => {
    const { result } = renderHook(() => useAddFilterSection({}));

    act(() => {
      result.current.handleVirtualSelectChange(['age']);
    });
    act(() => {
      result.current.handleAddFilter();
    });

    expect(mockSetColumnFilters).toHaveBeenCalledWith({
      ...activeFilters,
      age: { operator: 'equals', type: 'number', value: 0 },
    });
    expect(mockSetExpandedFilters).toHaveBeenCalledWith(['age', 'name']);
    expect(result.current.selectedColumn).toBe('');
  });

  it('moves an already-expanded key to the front without duplicating it', () => {
    expandedFiltersRef.current = ['name', 'age'];
    const { result } = renderHook(() => useAddFilterSection({}));

    act(() => {
      result.current.handleVirtualSelectChange(['name']);
    });
    act(() => {
      result.current.handleAddFilter();
    });

    expect(mockSetExpandedFilters).toHaveBeenCalledWith(['name', 'age']);
  });

  it('does nothing when no column is selected', () => {
    const { result } = renderHook(() => useAddFilterSection({}));

    act(() => {
      result.current.handleAddFilter();
    });

    expect(mockSetColumnFilters).not.toHaveBeenCalled();
    expect(mockSetExpandedFilters).not.toHaveBeenCalled();
  });

  it('does nothing when the selected column is not in normalizedColumns', () => {
    const { result } = renderHook(() => useAddFilterSection({}));

    act(() => {
      result.current.handleVirtualSelectChange(['ghost']);
    });
    act(() => {
      result.current.handleAddFilter();
    });

    expect(mockSetColumnFilters).not.toHaveBeenCalled();
    expect(mockSetExpandedFilters).not.toHaveBeenCalled();
  });

  it('tracks dropdown state and forwards it to onDropdownOpenChange', () => {
    const onDropdownOpenChange = vi.fn();
    const { result } = renderHook(() =>
      useAddFilterSection({ onDropdownOpenChange }),
    );

    act(() => {
      result.current.handleOpenChange(true);
    });

    expect(result.current.isDropdownOpen).toBe(true);
    expect(onDropdownOpenChange).toHaveBeenCalledWith(true);
  });

  it('clears the selection when the picker reports no values', () => {
    const { result } = renderHook(() => useAddFilterSection({}));

    act(() => {
      result.current.handleVirtualSelectChange(['age']);
    });
    act(() => {
      result.current.handleVirtualSelectChange([]);
    });

    expect(result.current.selectedColumn).toBe('');
  });
});
