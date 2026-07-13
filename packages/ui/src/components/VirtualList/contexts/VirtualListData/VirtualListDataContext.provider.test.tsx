// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { VirtualListDataState } from '../../VirtualList.types';

import { VirtualListConfigProvider } from '../VirtualListConfig/VirtualListConfigContext.provider';
import { useGetFilteredOptions } from './data/selectors/useGetFilteredOptions.hook';
import { useGetSelectedValues } from './data/selectors/useGetSelectedValues.hook';
import { useGetShouldShowSelectAll } from './data/selectors/useGetShouldShowSelectAll.hook';
import { useGetTotalItems } from './data/selectors/useGetTotalItems.hook';
import { VirtualListDataProvider } from './VirtualListDataContext.provider';

type WrapperProps = {
  readonly children: ReactNode;
};

const INITIAL_DATA_STATE: VirtualListDataState = {
  data: ['apple', 'banana'],
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  totalCount: 4,
};

const seededWrapper = ({ children }: WrapperProps) => (
  <VirtualListConfigProvider hasCheckboxes hasSelectAll onChange={vi.fn()}>
    <VirtualListDataProvider
      dataState={INITIAL_DATA_STATE}
      filter={{ type: 'select', values: ['banana'] }}
    >
      {children}
    </VirtualListDataProvider>
  </VirtualListConfigProvider>
);

const withoutSelectAllWrapper = ({ children }: WrapperProps) => (
  <VirtualListConfigProvider
    hasCheckboxes
    hasSelectAll={false}
    onChange={vi.fn()}
  >
    <VirtualListDataProvider dataState={INITIAL_DATA_STATE}>
      {children}
    </VirtualListDataProvider>
  </VirtualListConfigProvider>
);

describe('VirtualListDataProvider', () => {
  it('seeds the mirror and the pre-computed derived state from the props', () => {
    const { result } = renderHook(
      () => ({
        filteredOptions: useGetFilteredOptions(),
        selectedValues: useGetSelectedValues(),
        shouldShowSelectAll: useGetShouldShowSelectAll(),
        totalItems: useGetTotalItems(),
      }),
      { wrapper: seededWrapper },
    );

    expect(result.current).toEqual({
      filteredOptions: ['apple', 'banana'],
      selectedValues: ['banana'],
      shouldShowSelectAll: true,
      totalItems: 3,
    });
  });

  it('derives without the select-all row when it is disabled', () => {
    const { result } = renderHook(
      () => ({
        shouldShowSelectAll: useGetShouldShowSelectAll(),
        totalItems: useGetTotalItems(),
      }),
      { wrapper: withoutSelectAllWrapper },
    );

    expect(result.current).toEqual({
      shouldShowSelectAll: false,
      totalItems: 2,
    });
  });

  it('syncs the data store when the controlled props change', async () => {
    let currentDataState = INITIAL_DATA_STATE;
    let currentValues: readonly string[] = [];
    const wrapper = ({ children }: WrapperProps) => (
      <VirtualListConfigProvider hasCheckboxes hasSelectAll onChange={vi.fn()}>
        <VirtualListDataProvider
          dataState={currentDataState}
          filter={{ type: 'select', values: currentValues }}
        >
          {children}
        </VirtualListDataProvider>
      </VirtualListConfigProvider>
    );

    const { rerender, result } = renderHook(
      () => ({
        filteredOptions: useGetFilteredOptions(),
        selectedValues: useGetSelectedValues(),
      }),
      { wrapper },
    );

    currentDataState = {
      ...INITIAL_DATA_STATE,
      data: ['apple', 'banana', 'cherry'],
    };
    currentValues = ['cherry'];
    rerender();

    await waitFor(() => {
      expect(result.current).toEqual({
        filteredOptions: ['apple', 'banana', 'cherry'],
        selectedValues: ['cherry'],
      });
    });
  });

  it('runs the initial fetch once on mount', async () => {
    const onFetchInitial = vi.fn();
    const wrapper = ({ children }: WrapperProps) => (
      <VirtualListConfigProvider
        hasCheckboxes
        hasSelectAll
        onChange={vi.fn()}
        onFetchInitial={onFetchInitial}
      >
        <VirtualListDataProvider dataState={INITIAL_DATA_STATE}>
          {children}
        </VirtualListDataProvider>
      </VirtualListConfigProvider>
    );

    const { rerender } = renderHook(() => useGetFilteredOptions(), {
      wrapper,
    });

    rerender();

    await waitFor(() => {
      expect(onFetchInitial).toHaveBeenCalledTimes(1);
    });
  });
});
