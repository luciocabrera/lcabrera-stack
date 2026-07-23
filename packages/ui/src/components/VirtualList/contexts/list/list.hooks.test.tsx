// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { createMockStore } from '@lcabrera/ui/utils/tests/createMockStore.util';
import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import type {
  VirtualListDataStoreState,
  VirtualListState,
} from '../../VirtualList.types';
import type { VirtualListContextValue } from '../VirtualListContext.types';

import { useVirtualListContextValue } from '../useVirtualListContextValue.hook';
import { VirtualListContext } from '../VirtualListContext.context';
import { useClearSearch } from './actions/useClearSearch.hook';
import { useSetListFilterMode } from './actions/useSetListFilterMode.hook';
import { useSetSearchTerm } from './actions/useSetSearchTerm.hook';
import { useGetHasCheckboxes } from './selectors/useGetHasCheckboxes.hook';
import { useGetHasFetchMore } from './selectors/useGetHasFetchMore.hook';
import { useGetListFilterMode } from './selectors/useGetListFilterMode.hook';
import { useGetListMaxHeight } from './selectors/useGetListMaxHeight.hook';
import { useGetSearchInputName } from './selectors/useGetSearchInputName.hook';
import { useGetSearchTerm } from './selectors/useGetSearchTerm.hook';
import { useGetShouldFillHeight } from './selectors/useGetShouldFillHeight.hook';

type SetupArgs = {
  readonly listState?: Partial<VirtualListState>;
};

type WrapperProps = {
  readonly children: ReactNode;
};

const setup = ({ listState = {} }: SetupArgs = {}) => {
  const listStore = createMockStore<VirtualListState>({
    hasCheckboxes: true,
    hasFetchInitial: false,
    hasFetchMore: true,
    hasSelectAll: true,
    listFilterMode: 'all',
    listMaxHeight: '18.75rem',
    name: 'fruit-search',
    searchTerm: '',
    shouldFillHeight: false,
    ...listState,
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
  const contextValue: VirtualListContextValue = {
    dataStore: dataStore as never,
    listStore: listStore as never,
    onChange: vi.fn(),
  };
  const wrapper = ({ children }: WrapperProps) =>
    createElement(VirtualListContext, { value: contextValue }, children);

  return { contextValue, dataStore, listStore, wrapper };
};

describe('VirtualList list hooks', () => {
  it('returns the list context value and throws outside the provider', () => {
    const { contextValue, wrapper } = setup();

    expect(
      renderHook(() => useVirtualListContextValue(), { wrapper }).result
        .current,
    ).toBe(contextValue);
    expect(() => renderHook(() => useVirtualListContextValue())).toThrow(
      'useVirtualListContextValue must be used within VirtualListProvider',
    );
  });

  it('exposes the config slices through the selectors', () => {
    const { wrapper } = setup();

    expect(
      renderHook(() => useGetHasCheckboxes(), { wrapper }).result.current,
    ).toBe(true);
    expect(
      renderHook(() => useGetHasFetchMore(), { wrapper }).result.current,
    ).toBe(true);
    expect(
      renderHook(() => useGetListMaxHeight(), { wrapper }).result.current,
    ).toBe('18.75rem');
    expect(
      renderHook(() => useGetSearchInputName(), { wrapper }).result.current,
    ).toBe('fruit-search');
    expect(
      renderHook(() => useGetShouldFillHeight(), { wrapper }).result.current,
    ).toBe(false);

    const withoutCheckboxes = setup({ listState: { hasCheckboxes: false } });

    expect(
      renderHook(() => useGetHasCheckboxes(), {
        wrapper: withoutCheckboxes.wrapper,
      }).result.current,
    ).toBe(false);
  });

  it('exposes the UI slices and reacts to store updates', () => {
    const { listStore, wrapper } = setup();
    const { result } = renderHook(
      () => ({
        listFilterMode: useGetListFilterMode(),
        searchTerm: useGetSearchTerm(),
      }),
      { wrapper },
    );

    expect(result.current).toEqual({ listFilterMode: 'all', searchTerm: '' });

    act(() => {
      listStore.set({ searchTerm: 'ban' });
    });

    expect(result.current.searchTerm).toBe('ban');
  });

  it('updates the search term and recomputes the derived list state', () => {
    const { dataStore, listStore, wrapper } = setup();
    const setSearchTerm = renderHook(() => useSetSearchTerm(), { wrapper })
      .result.current;

    act(() => {
      setSearchTerm('an');
    });

    expect(listStore.get().searchTerm).toBe('an');
    expect(dataStore.get().filteredOptions).toEqual(['banana']);
    expect(dataStore.get().isAllSelected).toBe(true);
    expect(dataStore.get().shouldShowSelectAll).toBe(false);
    expect(dataStore.get().totalItems).toBe(1);
  });

  it('clears the search term and restores the derived list state', () => {
    const { dataStore, listStore, wrapper } = setup({
      listState: { searchTerm: 'an' },
    });
    const clearSearch = renderHook(() => useClearSearch(), { wrapper }).result
      .current;

    act(() => {
      clearSearch();
    });

    expect(listStore.get().searchTerm).toBe('');
    expect(dataStore.get().filteredOptions).toEqual([
      'apple',
      'banana',
      'cherry',
    ]);
    expect(dataStore.get().totalItems).toBe(4);
  });

  it('switches the filter mode and recomputes the derived list state', () => {
    const { dataStore, listStore, wrapper } = setup();
    const setListFilterMode = renderHook(() => useSetListFilterMode(), {
      wrapper,
    }).result.current;

    act(() => {
      setListFilterMode('selected');
    });

    expect(listStore.get().listFilterMode).toBe('selected');
    expect(dataStore.get().filteredOptions).toEqual(['banana']);
    expect(dataStore.get().contentMode).toBe('list');
  });
});
