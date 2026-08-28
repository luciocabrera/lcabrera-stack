// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useAcceptColumnGroupingPrompt } from './useAcceptColumnGroupingPrompt.hook';

const {
  addColumnAggregate,
  getCapabilities,
  getColumns,
  modalsStore,
  setCapabilities,
  setColumns,
  setPrompt,
  toggleGroupKey,
} = vi.hoisted(() => {
  let capabilities: Record<string, unknown> = {};
  let columns: readonly unknown[] = [];
  let prompt: unknown = { columnKey: '', isOpen: false };

  return {
    addColumnAggregate: vi.fn(),
    getCapabilities: () => capabilities,
    getColumns: () => columns,
    modalsStore: {
      get: vi.fn(() => ({ columnGroupingPrompt: prompt })),
      set: vi.fn(),
    },
    setCapabilities: (next: Record<string, unknown>) => {
      capabilities = next;
    },
    setColumns: (next: readonly unknown[]) => {
      columns = next;
    },
    setPrompt: (next: unknown) => {
      prompt = next;
    },
    toggleGroupKey: vi.fn(),
  };
});

vi.mock('../useColumnOrderSectionContextValue.hook', () => ({
  useColumnOrderSectionContextValue: () => ({ modalsStore }),
}));

vi.mock(
  '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook',
  () => ({ useGetColumns: () => getColumns() }),
);

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableGroupingCapabilities: () => getCapabilities(),
}));

vi.mock(
  '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/actions',
  () => ({
    useAddColumnAggregate: () => addColumnAggregate,
    useToggleGroupKey: () => toggleGroupKey,
  }),
);

const accept = (choice: 'avg' | 'group-key' | 'sum') => {
  const { result } = renderHook(() => useAcceptColumnGroupingPrompt());

  act(() => {
    result.current(choice);
  });
};

describe('useAcceptColumnGroupingPrompt', () => {
  beforeEach(() => {
    setCapabilities({});
    setColumns([{ key: 'ordered_at', label: 'Ordered At' }]);
    setPrompt({ columnKey: 'ordered_at', isOpen: true });
    addColumnAggregate.mockClear();
    modalsStore.set.mockClear();
    toggleGroupKey.mockClear();
  });

  it('adds the column to the grouping as a key', () => {
    accept('group-key');

    expect(toggleGroupKey).toHaveBeenCalledWith({
      columnKey: 'ordered_at',
      period: undefined,
    });
    expect(addColumnAggregate).not.toHaveBeenCalled();
  });

  it('carries the granularity a column is only offered at', () => {
    setCapabilities({
      ordered_at: {
        aggregates: [],
        canGroup: false,
        column: 'ordered_at',
        periods: ['month', 'year'],
        refusal: 'unique-ish',
        role: 'dimension',
        typeName: 'timestamptz',
      },
    });

    accept('group-key');

    expect(toggleGroupKey).toHaveBeenCalledWith({
      columnKey: 'ordered_at',
      period: 'month',
    });
  });

  it('adds the column to the grouping as a measure', () => {
    accept('sum');

    expect(addColumnAggregate).toHaveBeenCalledWith({
      columnKey: 'ordered_at',
      fn: 'sum',
    });
    expect(toggleGroupKey).not.toHaveBeenCalled();
  });

  it('closes the prompt and applies nothing when it was not open', () => {
    setPrompt({ columnKey: 'ordered_at', isOpen: false });

    accept('sum');

    expect(modalsStore.set).toHaveBeenCalledWith({
      columnGroupingPrompt: { columnKey: '', isOpen: false },
    });
    expect(addColumnAggregate).not.toHaveBeenCalled();
    expect(toggleGroupKey).not.toHaveBeenCalled();
  });

  it('closes the prompt on every accepted choice', () => {
    accept('avg');

    expect(modalsStore.set).toHaveBeenCalledWith({
      columnGroupingPrompt: { columnKey: '', isOpen: false },
    });
  });
});
