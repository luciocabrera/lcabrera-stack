// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { createMockStore } from '@lcabrera/ui/utils/tests/createMockStore.util';
import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import type { TableDrawerContextValue } from './TableDrawerContext.types';

import { useSetColumnsOrder } from './actions/useSetColumnsOrder.hook';
import { useGetColumnFilters } from './selectors/useGetColumnFilters.hook';
import { useGetColumnOrder } from './selectors/useGetColumnOrder.hook';
import { useGetColumnPinning } from './selectors/useGetColumnPinning.hook';
import { useGetColumnsSorting } from './selectors/useGetColumnsSorting.hook';
import { useGetColumnVisibility } from './selectors/useGetColumnVisibility.hook';
import { TableDrawerContext } from './TableDrawerContext.context';
import { useColumnsStore } from './useColumnsStore.hook';
import { useTableDrawerContextValue } from './useTableDrawerContextValue.hook';

type WrapperProps = {
  readonly children: ReactNode;
};

const columnsStore = createMockStore({
  columnFilters: {
    status: {
      operator: 'equals',
      type: 'select',
      value: 'paid',
    },
  },
  columnOrder: ['id', 'status'],
  columnPinning: { left: ['id'], right: [] },
  columnVisibility: new Set(['status']),
  sorting: [{ columnKey: 'status', direction: 'asc' }],
});

const contextValue: TableDrawerContextValue = {
  columnsStore: columnsStore as never,
};

const Wrapper = ({ children }: WrapperProps) =>
  createElement(TableDrawerContext, { value: contextValue }, children);

describe('TableDrawerContext hooks', () => {
  it('returns the drawer context value', () => {
    expect(
      renderHook(() => useTableDrawerContextValue(), { wrapper: Wrapper })
        .result.current,
    ).toBe(contextValue);
  });

  it('subscribes to the drawer store and exposes selector hooks', () => {
    expect(
      renderHook(() => useColumnsStore((state) => state.columnOrder), {
        wrapper: Wrapper,
      }).result.current,
    ).toEqual(['id', 'status']);
    expect(
      renderHook(() => useGetColumnFilters(), { wrapper: Wrapper }).result
        .current,
    ).toEqual({
      status: {
        operator: 'equals',
        type: 'select',
        value: 'paid',
      },
    });
    expect(
      renderHook(() => useGetColumnOrder(), { wrapper: Wrapper }).result
        .current,
    ).toEqual(['id', 'status']);
    expect(
      renderHook(() => useGetColumnPinning(), { wrapper: Wrapper }).result
        .current,
    ).toEqual({
      left: ['id'],
      right: [],
    });
    expect(
      renderHook(() => useGetColumnVisibility(), { wrapper: Wrapper }).result
        .current,
    ).toEqual(new Set(['status']));
    expect(
      renderHook(() => useGetColumnsSorting(), { wrapper: Wrapper }).result
        .current,
    ).toEqual([{ columnKey: 'status', direction: 'asc' }]);
  });

  it('updates the column order through the set action', () => {
    const { result } = renderHook(
      () =>
        useSetColumnsOrder<{ readonly id: number; readonly status: string }>(),
      {
        wrapper: Wrapper,
      },
    );

    act(() => {
      result.current(['status', 'id']);
    });

    expect(columnsStore.get().columnOrder).toEqual(['status', 'id']);
  });
});
