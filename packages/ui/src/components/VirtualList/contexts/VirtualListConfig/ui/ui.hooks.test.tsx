// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { createMockStore } from '@repo/ui/utils/tests/createMockStore.util';
import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type {
  VirtualListConfigState,
  VirtualListDataStoreState,
  VirtualListUiState,
} from '../../../VirtualList.types';
import type { VirtualListDataContextValue } from '../../VirtualListData/VirtualListDataContext.types';
import type { VirtualListConfigContextValue } from '../VirtualListConfigContext.types';

import { VirtualListDataContext } from '../../VirtualListData/VirtualListDataContext.context';
import { INITIAL_LIST_UI_STATE } from '../VirtualListConfigContext.constants';
import { VirtualListConfigContext } from '../VirtualListConfigContext.context';
import { useClearSearch } from './actions/useClearSearch.hook';
import { useSetListFilterMode } from './actions/useSetListFilterMode.hook';
import { useSetSearchTerm } from './actions/useSetSearchTerm.hook';
import { useGetListFilterMode } from './selectors/useGetListFilterMode.hook';
import { useGetSearchTerm } from './selectors/useGetSearchTerm.hook';
import { useListUiStore } from './useListUiStore.hook';

type WrapperProps = {
  readonly children: ReactNode;
};

const setup = (uiState: Partial<VirtualListUiState> = {}) => {
  const configStore = createMockStore<VirtualListConfigState>({
    hasCheckboxes: true,
    hasFetchInitial: false,
    hasFetchMore: false,
    hasSelectAll: true,
    listMaxHeight: '18.75rem',
    shouldFillHeight: false,
  });
  const uiStore = createMockStore<VirtualListUiState>({
    listFilterMode: 'all',
    searchTerm: '',
    ...uiState,
  });
  const dataStore = createMockStore<VirtualListDataStoreState>({
    contentMode: 'list',
    data: ['apple', 'banana', 'cherry'],
    filteredOptions: ['apple', 'banana', 'cherry'],
    hasMore: false,
    isAllSelected: false,
    isLoading: false,
    isLoadingMore: false,
    selectedValues: ['banana'],
    shouldShowSelectAll: true,
    totalItems: 4,
  });
  const configValue: VirtualListConfigContextValue = {
    configStore: configStore as never,
    onChange: vi.fn(),
    uiStore: uiStore as never,
  };
  const dataValue: VirtualListDataContextValue = {
    dataStore: dataStore as never,
  };
  const wrapper = ({ children }: WrapperProps) =>
    createElement(
      VirtualListConfigContext,
      { value: configValue },
      createElement(VirtualListDataContext, { value: dataValue }, children),
    );

  return { dataStore, uiStore, wrapper };
};

describe('VirtualListConfig ui hooks', () => {
  it('exposes the UI-store slices and reacts to store updates', () => {
    const { uiStore, wrapper } = setup();
    const { result } = renderHook(
      () => ({
        listFilterMode: useGetListFilterMode(),
        searchTerm: useGetSearchTerm(),
      }),
      { wrapper },
    );

    expect(result.current).toEqual({ listFilterMode: 'all', searchTerm: '' });

    act(() => {
      uiStore.set({ searchTerm: 'ban' });
    });

    expect(result.current.searchTerm).toBe('ban');
  });

  it('falls back to the initial UI state when the snapshot is undefined', () => {
    const { wrapper } = setup();
    const fallback = setup();
    fallback.uiStore.reset(undefined as never);

    expect(
      renderHook(() => useListUiStore((state) => state), {
        wrapper: fallback.wrapper,
      }).result.current,
    ).toEqual(INITIAL_LIST_UI_STATE);
    expect(
      renderHook(() => useListUiStore((state) => state), { wrapper }).result
        .current,
    ).not.toBeUndefined();
  });

  it('updates the search term and recomputes the derived list state', () => {
    const { dataStore, uiStore, wrapper } = setup();
    const setSearchTerm = renderHook(() => useSetSearchTerm(), { wrapper })
      .result.current;

    act(() => {
      setSearchTerm('an');
    });

    expect(uiStore.get().searchTerm).toBe('an');
    expect(dataStore.get().filteredOptions).toEqual(['banana']);
    expect(dataStore.get().isAllSelected).toBe(true);
    expect(dataStore.get().shouldShowSelectAll).toBe(false);
    expect(dataStore.get().totalItems).toBe(1);
  });

  it('clears the search term and restores the derived list state', () => {
    const { dataStore, uiStore, wrapper } = setup({ searchTerm: 'an' });
    const clearSearch = renderHook(() => useClearSearch(), { wrapper }).result
      .current;

    act(() => {
      clearSearch();
    });

    expect(uiStore.get().searchTerm).toBe('');
    expect(dataStore.get().filteredOptions).toEqual([
      'apple',
      'banana',
      'cherry',
    ]);
    expect(dataStore.get().totalItems).toBe(4);
  });

  it('switches the filter mode and recomputes the derived list state', () => {
    const { dataStore, uiStore, wrapper } = setup();
    const setListFilterMode = renderHook(() => useSetListFilterMode(), {
      wrapper,
    }).result.current;

    act(() => {
      setListFilterMode('selected');
    });

    expect(uiStore.get().listFilterMode).toBe('selected');
    expect(dataStore.get().filteredOptions).toEqual(['banana']);
    expect(dataStore.get().contentMode).toBe('list');
  });
});
