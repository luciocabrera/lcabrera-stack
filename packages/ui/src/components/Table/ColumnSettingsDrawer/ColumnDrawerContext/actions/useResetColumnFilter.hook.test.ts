// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useResetColumnFilter } from './useResetColumnFilter.hook';

const {
  columnStore,
  loggerWarn,
  setColumnState,
  setTableColumnsState,
  tableColumnsStore,
} = vi.hoisted(() => {
  let columnState: undefined | { readonly columnKey?: string };
  let tableState:
    | undefined
    | { readonly columnFilters?: Record<string, unknown> };

  return {
    columnStore: {
      get: vi.fn(() => columnState),
      set: vi.fn(),
    },
    loggerWarn: vi.fn(),
    setColumnState: (next: typeof columnState) => {
      columnState = next;
    },
    setTableColumnsState: (next: typeof tableState) => {
      tableState = next;
    },
    tableColumnsStore: {
      get: vi.fn(() => tableState),
    },
  };
});

vi.mock(
  '@repo/ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook',
  () => ({
    useColumnDrawerContextValue: () => ({ columnStore }),
  }),
);

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({ columnsStore: tableColumnsStore }),
  }),
);

vi.mock('@repo/ui/utils/logger', () => ({
  logger: { warn: loggerWarn },
}));

const resetColumnFilter = ({
  columnFilters,
  columnKey,
}: {
  readonly columnFilters?: Record<string, unknown>;
  readonly columnKey?: string;
}) => {
  setColumnState(columnKey === undefined ? undefined : { columnKey });
  setTableColumnsState(columnFilters ? { columnFilters } : undefined);

  const { result } = renderHook(() => useResetColumnFilter());

  act(() => {
    result.current();
  });
};

describe('useResetColumnFilter', () => {
  beforeEach(() => {
    setColumnState(undefined);
    setTableColumnsState(undefined);
    columnStore.set.mockClear();
    loggerWarn.mockClear();
  });

  it('restores the filter the table currently holds for the column', () => {
    const statusFilter = { operator: 'equals', value: 'open' };

    resetColumnFilter({
      columnFilters: { notes: { operator: 'contains' }, status: statusFilter },
      columnKey: 'status',
    });

    expect(columnStore.set).toHaveBeenCalledWith({
      columnFilter: statusFilter,
    });
  });

  it('clears the filter when the table holds no filter for the column', () => {
    resetColumnFilter({
      columnFilters: { notes: { operator: 'contains' } },
      columnKey: 'status',
    });

    expect(columnStore.set).toHaveBeenCalledWith({ columnFilter: undefined });
  });

  it('clears the filter when the table has no filters at all', () => {
    resetColumnFilter({ columnKey: 'status' });

    expect(columnStore.set).toHaveBeenCalledWith({ columnFilter: undefined });
  });

  it('warns and does not write when the drawer holds no column key', () => {
    resetColumnFilter({ columnFilters: { status: { operator: 'equals' } } });

    expect(columnStore.set).not.toHaveBeenCalled();
    expect(loggerWarn).toHaveBeenCalledWith(
      '[useResetColumnFilter] No columnKey found in column drawer store.',
    );
  });

  it('warns and does not write when the column drawer store is empty', () => {
    setColumnState(undefined);
    setTableColumnsState({ columnFilters: {} });

    const { result } = renderHook(() => useResetColumnFilter());

    act(() => {
      result.current();
    });

    expect(columnStore.set).not.toHaveBeenCalled();
    expect(loggerWarn).toHaveBeenCalledTimes(1);
  });

  it('treats an empty column key as missing', () => {
    resetColumnFilter({
      columnFilters: { '': { operator: 'equals' } },
      columnKey: '',
    });

    expect(columnStore.set).not.toHaveBeenCalled();
    expect(loggerWarn).toHaveBeenCalledTimes(1);
  });

  it('restores an explicitly undefined filter value stored under the key', () => {
    resetColumnFilter({
      columnFilters: { status: undefined },
      columnKey: 'status',
    });

    expect(columnStore.set).toHaveBeenCalledWith({ columnFilter: undefined });
    expect(loggerWarn).not.toHaveBeenCalled();
  });

  it('ignores inherited prototype keys and only reads own filters', () => {
    const columnFilters = Object.create({
      toString: { operator: 'inherited' },
    }) as Record<string, unknown>;

    resetColumnFilter({ columnFilters, columnKey: 'toString' });

    expect(columnStore.set).toHaveBeenCalledWith({ columnFilter: undefined });
  });

  it('forwards the exact filter reference held by the table', () => {
    const statusFilter = { operator: 'equals', value: 'open' };

    resetColumnFilter({
      columnFilters: { status: statusFilter },
      columnKey: 'status',
    });

    const [payload] = columnStore.set.mock.calls.at(-1) ?? [];
    const update = payload as undefined | { readonly columnFilter: unknown };

    expect(update?.columnFilter).toBe(statusFilter);
  });
});
