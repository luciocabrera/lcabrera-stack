// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useToggleColumnVisibility } from './useToggleColumnVisibility.hook';

type TestColumn = {
  readonly isStatic?: boolean;
  readonly key: string;
};

const {
  drawerColumnsStore,
  setDrawerState,
  setTableColumnsState,
  tableColumnsStore,
} = vi.hoisted(() => {
  let drawerState: undefined | { readonly columnVisibility?: Set<string> };
  let tableState:
    | undefined
    | {
        readonly normalizedColumns: Record<
          string,
          undefined | { readonly isStatic?: boolean; readonly key: string }
        >;
      };

  return {
    drawerColumnsStore: {
      get: vi.fn(() => drawerState),
      set: vi.fn(),
    },
    setDrawerState: (next: typeof drawerState) => {
      drawerState = next;
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
  '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({ columnsStore: tableColumnsStore }),
  }),
);

vi.mock(
  '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook',
  () => ({
    useTableDrawerContextValue: () => ({ columnsStore: drawerColumnsStore }),
  }),
);

const normalize = (columns: readonly TestColumn[]) =>
  Object.fromEntries(columns.map((column) => [column.key, column]));

const toggleColumnVisibility = ({
  columnKey,
  columns,
  hiddenKeys,
  isVisible,
}: {
  readonly columnKey: string;
  readonly columns?: readonly TestColumn[];
  readonly hiddenKeys?: readonly string[];
  readonly isVisible: boolean;
}) => {
  setTableColumnsState(
    columns ? { normalizedColumns: normalize(columns) } : undefined,
  );
  setDrawerState(
    hiddenKeys ? { columnVisibility: new Set(hiddenKeys) } : undefined,
  );

  const { result } = renderHook(() => useToggleColumnVisibility());

  act(() => {
    result.current({ columnKey, isVisible });
  });
};

const readVisibilityPayload = () => {
  const [payload] = drawerColumnsStore.set.mock.calls.at(-1) ?? [];

  return payload as undefined | { readonly columnVisibility: Set<string> };
};

describe('useToggleColumnVisibility', () => {
  beforeEach(() => {
    setTableColumnsState(undefined);
    setDrawerState(undefined);
    drawerColumnsStore.set.mockClear();
  });

  it('hides a column by adding its key to the hidden set', () => {
    toggleColumnVisibility({
      columnKey: 'status',
      columns: [{ key: 'id' }, { key: 'status' }],
      hiddenKeys: [],
      isVisible: false,
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnVisibility: new Set(['status']),
    });
  });

  it('shows a column by removing its key from the hidden set', () => {
    toggleColumnVisibility({
      columnKey: 'status',
      columns: [{ key: 'id' }, { key: 'status' }],
      hiddenKeys: ['id', 'status'],
      isVisible: true,
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnVisibility: new Set(['id']),
    });
  });

  it('does nothing for a static column', () => {
    toggleColumnVisibility({
      columnKey: 'id',
      columns: [{ isStatic: true, key: 'id' }],
      hiddenKeys: [],
      isVisible: false,
    });

    expect(drawerColumnsStore.set).not.toHaveBeenCalled();
  });

  it('toggles a column that is absent from the normalized columns map', () => {
    toggleColumnVisibility({
      columnKey: 'gone',
      columns: [{ key: 'id' }],
      hiddenKeys: [],
      isVisible: false,
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnVisibility: new Set(['gone']),
    });
  });

  it('starts from an empty hidden set when the drawer store is still empty', () => {
    toggleColumnVisibility({
      columnKey: 'status',
      columns: [{ key: 'status' }],
      isVisible: false,
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnVisibility: new Set(['status']),
    });
  });

  it('toggles when the table config store is still empty', () => {
    toggleColumnVisibility({
      columnKey: 'status',
      hiddenKeys: ['status'],
      isVisible: true,
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnVisibility: new Set(),
    });
  });

  it('is a no-op on the set when hiding an already hidden column', () => {
    toggleColumnVisibility({
      columnKey: 'status',
      columns: [{ key: 'status' }],
      hiddenKeys: ['status'],
      isVisible: false,
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnVisibility: new Set(['status']),
    });
  });

  it('is a no-op on the set when showing an already visible column', () => {
    toggleColumnVisibility({
      columnKey: 'status',
      columns: [{ key: 'status' }],
      hiddenKeys: ['id'],
      isVisible: true,
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnVisibility: new Set(['id']),
    });
  });

  it('never mutates the hidden set held in the drawer store', () => {
    const hidden = new Set(['id']);
    setTableColumnsState({ normalizedColumns: normalize([{ key: 'status' }]) });
    setDrawerState({ columnVisibility: hidden });

    const { result } = renderHook(() => useToggleColumnVisibility());

    act(() => {
      result.current({ columnKey: 'status', isVisible: false });
    });

    expect(hidden).toEqual(new Set(['id']));
    expect(readVisibilityPayload()?.columnVisibility).not.toBe(hidden);
  });
});
