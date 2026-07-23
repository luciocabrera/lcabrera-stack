// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useResetColumnPinning } from './useResetColumnPinning.hook';

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
        readonly columnPinning?: {
          readonly left: readonly string[];
          readonly right: readonly string[];
        };
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
  '@lcabrera/ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook',
  () => ({
    useColumnDrawerContextValue: () => ({ columnStore }),
  }),
);

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({ columnsStore: tableColumnsStore }),
  }),
);

vi.mock('@lcabrera/ui/utils/logger', () => ({
  logger: { warn: loggerWarn },
}));

beforeEach(() => {
  setColumnState(undefined);
  setTableColumnsState(undefined);
  columnStore.set.mockClear();
  loggerWarn.mockClear();
});

describe('useResetColumnPinning', () => {
  it('restores the "left" side when the table pins the column left', () => {
    setColumnState({ columnKey: 'id' });
    setTableColumnsState({
      columnPinning: { left: ['id'], right: ['actions'] },
    });

    const { result } = renderHook(() => useResetColumnPinning());

    act(() => {
      result.current();
    });

    expect(columnStore.set).toHaveBeenCalledExactlyOnceWith({
      columnPinning: 'left',
    });
  });

  it('restores the "right" side when the table pins the column right', () => {
    setColumnState({ columnKey: 'actions' });
    setTableColumnsState({
      columnPinning: { left: ['id'], right: ['actions'] },
    });

    const { result } = renderHook(() => useResetColumnPinning());

    act(() => {
      result.current();
    });

    expect(columnStore.set).toHaveBeenCalledExactlyOnceWith({
      columnPinning: 'right',
    });
  });

  it('clears the pinning when the column is unpinned in the table', () => {
    setColumnState({ columnKey: 'name' });
    setTableColumnsState({
      columnPinning: { left: ['id'], right: ['actions'] },
    });

    const { result } = renderHook(() => useResetColumnPinning());

    act(() => {
      result.current();
    });

    expect(columnStore.set).toHaveBeenCalledExactlyOnceWith({
      columnPinning: undefined,
    });
  });

  it('warns and writes nothing when the drawer holds no column key', () => {
    setTableColumnsState({
      columnPinning: { left: ['id'], right: [] },
    });

    const { result } = renderHook(() => useResetColumnPinning());

    act(() => {
      result.current();
    });

    expect(columnStore.set).not.toHaveBeenCalled();
    expect(loggerWarn).toHaveBeenCalledWith(
      '[useResetColumnPinning] No columnKey found in column drawer store.',
    );
  });
});
