// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useResetColumnSorting } from './useResetColumnSorting.hook';

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
    | {
        readonly sorting: readonly {
          readonly columnKey: string;
          readonly direction?: string;
        }[];
      };

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

beforeEach(() => {
  setColumnState(undefined);
  setTableColumnsState(undefined);
  columnStore.set.mockClear();
  loggerWarn.mockClear();
});

describe('useResetColumnSorting', () => {
  it('restores the sort direction the table currently holds for the column', () => {
    setColumnState({ columnKey: 'name' });
    setTableColumnsState({
      sorting: [
        { columnKey: 'createdAt', direction: 'asc' },
        { columnKey: 'name', direction: 'desc' },
      ],
    });

    const { result } = renderHook(() => useResetColumnSorting());

    act(() => {
      result.current();
    });

    expect(columnStore.set).toHaveBeenCalledExactlyOnceWith({
      sorting: 'desc',
    });
  });

  it('clears the sort when the table has no sort for the column', () => {
    setColumnState({ columnKey: 'name' });
    setTableColumnsState({ sorting: [{ columnKey: 'createdAt' }] });

    const { result } = renderHook(() => useResetColumnSorting());

    act(() => {
      result.current();
    });

    expect(columnStore.set).toHaveBeenCalledExactlyOnceWith({
      sorting: undefined,
    });
  });

  it('warns and writes nothing when the drawer holds no column key', () => {
    setTableColumnsState({
      sorting: [{ columnKey: 'name', direction: 'asc' }],
    });

    const { result } = renderHook(() => useResetColumnSorting());

    act(() => {
      result.current();
    });

    expect(columnStore.set).not.toHaveBeenCalled();
    expect(loggerWarn).toHaveBeenCalledWith(
      '[useResetColumnSorting] No columnKey found in column drawer store.',
    );
  });
});
