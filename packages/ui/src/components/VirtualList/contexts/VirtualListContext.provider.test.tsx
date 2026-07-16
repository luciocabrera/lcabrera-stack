// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { VirtualListDataState } from '../VirtualList.types';
import type { VirtualListStateProps } from './VirtualListContext.types';

import { useGetFilteredOptions } from './data/selectors/useGetFilteredOptions.hook';
import { useGetSelectedValues } from './data/selectors/useGetSelectedValues.hook';
import { useGetShouldShowSelectAll } from './data/selectors/useGetShouldShowSelectAll.hook';
import { useGetTotalItems } from './data/selectors/useGetTotalItems.hook';
import { useSetSearchTerm } from './list/actions/useSetSearchTerm.hook';
import { useGetHasCheckboxes } from './list/selectors/useGetHasCheckboxes.hook';
import { useGetHasFetchMore } from './list/selectors/useGetHasFetchMore.hook';
import { useGetSearchInputName } from './list/selectors/useGetSearchInputName.hook';
import { useGetSearchTerm } from './list/selectors/useGetSearchTerm.hook';
import { VirtualListProvider } from './VirtualListContext.provider';

type WrapperArgs = {
  readonly dataState?: VirtualListDataState;
  readonly filter?: readonly string[];
  readonly listState: VirtualListStateProps;
};

type WrapperProps = {
  readonly children: ReactNode;
};

const DATA_STATE: VirtualListDataState = {
  data: ['apple', 'banana'],
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  totalCount: 4,
};

const createWrapper =
  ({ dataState = DATA_STATE, filter, listState }: WrapperArgs) =>
  ({ children }: WrapperProps) => (
    <VirtualListProvider
      dataState={dataState}
      filter={filter ? { type: 'select', values: filter } : undefined}
      listState={listState}
    >
      {children}
    </VirtualListProvider>
  );

describe('VirtualListProvider', () => {
  it('seeds the list store from the props with the UI defaults', () => {
    const wrapper = createWrapper({
      listState: {
        hasCheckboxes: false,
        name: 'country-filter',
        onChange: vi.fn(),
        onFetchMore: vi.fn(),
      },
    });

    const { result } = renderHook(
      () => ({
        hasCheckboxes: useGetHasCheckboxes(),
        hasFetchMore: useGetHasFetchMore(),
        name: useGetSearchInputName(),
        searchTerm: useGetSearchTerm(),
      }),
      { wrapper },
    );

    expect(result.current).toEqual({
      hasCheckboxes: false,
      hasFetchMore: true,
      name: 'country-filter',
      searchTerm: '',
    });
  });

  it('syncs the list store when the config props change', async () => {
    let currentName = 'first-name';
    const wrapper = ({ children }: WrapperProps) => (
      <VirtualListProvider
        dataState={DATA_STATE}
        listState={{ name: currentName, onChange: vi.fn() }}
      >
        {children}
      </VirtualListProvider>
    );

    const { rerender, result } = renderHook(() => useGetSearchInputName(), {
      wrapper,
    });

    currentName = 'second-name';
    rerender();

    await waitFor(() => {
      expect(result.current).toBe('second-name');
    });
  });

  it('seeds the mirror and the pre-computed derived state from the props', () => {
    const wrapper = createWrapper({
      filter: ['banana'],
      listState: { onChange: vi.fn() },
    });

    const { result } = renderHook(
      () => ({
        filteredOptions: useGetFilteredOptions(),
        selectedValues: useGetSelectedValues(),
        shouldShowSelectAll: useGetShouldShowSelectAll(),
        totalItems: useGetTotalItems(),
      }),
      { wrapper },
    );

    expect(result.current).toEqual({
      filteredOptions: ['apple', 'banana'],
      selectedValues: ['banana'],
      shouldShowSelectAll: true,
      totalItems: 3,
    });
  });

  it('derives without the select-all row when it is disabled', () => {
    const wrapper = createWrapper({
      listState: { hasSelectAll: false, onChange: vi.fn() },
    });

    const { result } = renderHook(
      () => ({
        shouldShowSelectAll: useGetShouldShowSelectAll(),
        totalItems: useGetTotalItems(),
      }),
      { wrapper },
    );

    expect(result.current).toEqual({
      shouldShowSelectAll: false,
      totalItems: 2,
    });
  });

  it('syncs the data store when the controlled props change', async () => {
    let currentDataState = DATA_STATE;
    let currentValues: readonly string[] = [];
    const wrapper = ({ children }: WrapperProps) => (
      <VirtualListProvider
        dataState={currentDataState}
        filter={{ type: 'select', values: currentValues }}
        listState={{ onChange: vi.fn() }}
      >
        {children}
      </VirtualListProvider>
    );

    const { rerender, result } = renderHook(
      () => ({
        filteredOptions: useGetFilteredOptions(),
        selectedValues: useGetSelectedValues(),
      }),
      { wrapper },
    );

    currentDataState = { ...DATA_STATE, data: ['apple', 'banana', 'cherry'] };
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
    const wrapper = createWrapper({
      listState: { onChange: vi.fn(), onFetchInitial },
    });

    const { rerender } = renderHook(() => useGetFilteredOptions(), { wrapper });

    rerender();

    await waitFor(() => {
      expect(onFetchInitial).toHaveBeenCalledTimes(1);
    });
  });

  it('preserves the in-flight UI state across a config re-sync', async () => {
    let hasCheckboxes = true;
    const wrapper = ({ children }: WrapperProps) => (
      <VirtualListProvider
        dataState={DATA_STATE}
        listState={{ hasCheckboxes, onChange: vi.fn() }}
      >
        {children}
      </VirtualListProvider>
    );

    const { rerender, result } = renderHook(
      () => ({
        hasCheckboxes: useGetHasCheckboxes(),
        searchTerm: useGetSearchTerm(),
        setSearchTerm: useSetSearchTerm(),
      }),
      { wrapper },
    );

    act(() => {
      result.current.setSearchTerm('ban');
    });

    await waitFor(() => {
      expect(result.current.searchTerm).toBe('ban');
    });

    hasCheckboxes = false;
    rerender();

    await waitFor(() => {
      expect(result.current.hasCheckboxes).toBe(false);
    });
    expect(result.current.searchTerm).toBe('ban');
  });
});
