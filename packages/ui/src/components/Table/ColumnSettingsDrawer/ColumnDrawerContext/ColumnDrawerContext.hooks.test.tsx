// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { createMockStore } from '@repo/ui/utils/tests/createMockStore.util';
import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import type { ColumnDrawerContextValue } from './ColumnDrawerContext.types';

import { useSetColumnFilter } from './actions/useSetColumnFilter.hook';
import { useSetColumnPinning } from './actions/useSetColumnPinning.hook';
import { useSetColumnSorting } from './actions/useSetColumnSorting.hook';
import { useSetDraftColumnSizing } from './actions/useSetDraftColumnSizing.hook';
import { ColumnDrawerContext } from './ColumnDrawerContext.context';
import { useGetColumnFilter } from './selectors/useGetColumnFilter.hook';
import { useGetColumnPinning } from './selectors/useGetColumnPinning.hook';
import { useGetColumnSorting } from './selectors/useGetColumnSorting.hook';
import { useColumnDrawerContextValue } from './useColumnDrawerContextValue.hook';
import { useColumnsStore } from './useColumnsStore.hook';

type WrapperProps = {
  readonly children: ReactNode;
};

const columnStore = createMockStore({
  columnFilter: {
    operator: 'equals',
    type: 'select',
    value: 'paid',
  },
  columnKey: 'status',
  columnPinning: 'left' as const,
  columnSizing: 180,
  sorting: 'asc' as const,
});

const contextValue: ColumnDrawerContextValue = {
  columnStore: columnStore as never,
};

const Wrapper = ({ children }: WrapperProps) =>
  createElement(ColumnDrawerContext, { value: contextValue }, children);

describe('ColumnDrawerContext hooks', () => {
  it('returns the column drawer context value', () => {
    expect(
      renderHook(() => useColumnDrawerContextValue(), { wrapper: Wrapper })
        .result.current,
    ).toBe(contextValue);
  });

  it('subscribes to the drawer store and exposes selector hooks', () => {
    expect(
      renderHook(() => useColumnsStore((state) => state.columnSizing), {
        wrapper: Wrapper,
      }).result.current,
    ).toBe(180);
    expect(
      renderHook(() => useGetColumnFilter(), { wrapper: Wrapper }).result
        .current,
    ).toEqual({
      operator: 'equals',
      type: 'select',
      value: 'paid',
    });
    expect(
      renderHook(() => useGetColumnPinning(), { wrapper: Wrapper }).result
        .current,
    ).toBe('left');
    expect(
      renderHook(() => useGetColumnSorting(), { wrapper: Wrapper }).result
        .current,
    ).toBe('asc');
  });

  it('updates drawer state through the setter hooks', () => {
    const setColumnFilter = renderHook(() => useSetColumnFilter(), {
      wrapper: Wrapper,
    });
    const setColumnPinning = renderHook(() => useSetColumnPinning(), {
      wrapper: Wrapper,
    });
    const setColumnSizing = renderHook(() => useSetDraftColumnSizing(), {
      wrapper: Wrapper,
    });
    const setColumnSorting = renderHook(() => useSetColumnSorting(), {
      wrapper: Wrapper,
    });

    act(() => {
      setColumnFilter.result.current({
        operator: 'contains',
        type: 'text',
        value: 'pen',
      });
      setColumnPinning.result.current('right');
      setColumnSizing.result.current(240);
      setColumnSorting.result.current('desc');
    });

    expect(columnStore.get()).toMatchObject({
      columnFilter: {
        operator: 'contains',
        type: 'text',
        value: 'pen',
      },
      columnPinning: 'right',
      columnSizing: 240,
      sorting: 'desc',
    });
  });
});
