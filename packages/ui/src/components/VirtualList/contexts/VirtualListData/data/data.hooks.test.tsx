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
import type { VirtualListConfigContextValue } from '../../VirtualListConfig/VirtualListConfigContext.types';
import type { VirtualListDataContextValue } from '../VirtualListDataContext.types';

import { VirtualListConfigContext } from '../../VirtualListConfig/VirtualListConfigContext.context';
import { useVirtualListDataContextValue } from '../useVirtualListDataContextValue.hook';
import { INITIAL_LIST_DATA_STATE } from '../VirtualListDataContext.constants';
import { VirtualListDataContext } from '../VirtualListDataContext.context';
import { useFetchMore } from './actions/useFetchMore.hook';
import { useToggleOption } from './actions/useToggleOption.hook';
import { useToggleSelectAll } from './actions/useToggleSelectAll.hook';
import { useGetContentMode } from './selectors/useGetContentMode.hook';
import { useGetFilteredOptions } from './selectors/useGetFilteredOptions.hook';
import { useGetHasMore } from './selectors/useGetHasMore.hook';
import { useGetIsAllSelected } from './selectors/useGetIsAllSelected.hook';
import { useGetIsLoadingOptions } from './selectors/useGetIsLoadingOptions.hook';
import { useGetLoadedCount } from './selectors/useGetLoadedCount.hook';
import { useGetSelectedCount } from './selectors/useGetSelectedCount.hook';
import { useGetSelectedValues } from './selectors/useGetSelectedValues.hook';
import { useGetShouldShowSelectAll } from './selectors/useGetShouldShowSelectAll.hook';
import { useGetTotalCount } from './selectors/useGetTotalCount.hook';
import { useGetTotalItems } from './selectors/useGetTotalItems.hook';
import { useListDataStore } from './useListDataStore.hook';

type SetupArgs = {
  readonly config?: Partial<VirtualListConfigContextValue>;
  readonly dataState?: Partial<VirtualListDataStoreState>;
};

type WrapperProps = {
  readonly children: ReactNode;
};

const setup = ({ config = {}, dataState = {} }: SetupArgs = {}) => {
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
  });
  const dataStore = createMockStore<VirtualListDataStoreState>({
    contentMode: 'list',
    data: ['apple', 'banana', 'cherry'],
    filteredOptions: ['apple', 'banana', 'cherry'],
    hasMore: true,
    isAllSelected: false,
    isLoading: false,
    isLoadingMore: false,
    selectedValues: ['banana'],
    shouldShowSelectAll: true,
    totalCount: 10,
    totalItems: 4,
    ...dataState,
  });
  const onChange = vi.fn();
  const configValue: VirtualListConfigContextValue = {
    configStore: configStore as never,
    onChange,
    uiStore: uiStore as never,
    ...config,
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

  return { dataStore, dataValue, onChange, wrapper };
};

describe('VirtualListData data hooks', () => {
  it('returns the data context value and throws outside the provider', () => {
    const { dataValue, wrapper } = setup();

    expect(
      renderHook(() => useVirtualListDataContextValue(), { wrapper }).result
        .current,
    ).toBe(dataValue);
    expect(() => renderHook(() => useVirtualListDataContextValue())).toThrow(
      'useVirtualListDataContextValue must be used within VirtualListDataProvider',
    );
  });

  it('exposes the mirror slices through the selectors', () => {
    const { wrapper } = setup();

    expect(renderHook(() => useGetHasMore(), { wrapper }).result.current).toBe(
      true,
    );
    expect(
      renderHook(() => useGetIsLoadingOptions(), { wrapper }).result.current,
    ).toBe(false);
    expect(
      renderHook(() => useGetLoadedCount(), { wrapper }).result.current,
    ).toBe(3);
    expect(
      renderHook(() => useGetSelectedCount(), { wrapper }).result.current,
    ).toBe(1);
    expect(
      renderHook(() => useGetSelectedValues(), { wrapper }).result.current,
    ).toEqual(['banana']);
    expect(
      renderHook(() => useGetTotalCount(), { wrapper }).result.current,
    ).toBe(10);
  });

  it('exposes the pre-computed derived slices through the selectors', () => {
    const { wrapper } = setup();

    expect(
      renderHook(() => useGetContentMode(), { wrapper }).result.current,
    ).toBe('list');
    expect(
      renderHook(() => useGetFilteredOptions(), { wrapper }).result.current,
    ).toEqual(['apple', 'banana', 'cherry']);
    expect(
      renderHook(() => useGetIsAllSelected(), { wrapper }).result.current,
    ).toBe(false);
    expect(
      renderHook(() => useGetShouldShowSelectAll(), { wrapper }).result.current,
    ).toBe(true);
    expect(
      renderHook(() => useGetTotalItems(), { wrapper }).result.current,
    ).toBe(4);
  });

  it('reports loading options while a page fetch is in flight', () => {
    const { wrapper } = setup({ dataState: { isLoadingMore: true } });

    expect(
      renderHook(() => useGetIsLoadingOptions(), { wrapper }).result.current,
    ).toBe(true);
  });

  it('falls back to the initial data state when the snapshot is undefined', () => {
    const fallback = setup();
    fallback.dataStore.reset(undefined as never);

    expect(
      renderHook(() => useListDataStore((state) => state), {
        wrapper: fallback.wrapper,
      }).result.current,
    ).toEqual(INITIAL_LIST_DATA_STATE);
  });

  it('emits the toggled selection through onChange', () => {
    const { onChange, wrapper } = setup();
    const toggleOption = renderHook(() => useToggleOption(), { wrapper }).result
      .current;

    act(() => {
      toggleOption('apple');
    });

    expect(onChange).toHaveBeenCalledWith({
      type: 'select',
      values: ['banana', 'apple'],
    });

    act(() => {
      toggleOption('banana');
    });

    expect(onChange).toHaveBeenLastCalledWith({ type: 'select', values: [] });
  });

  it('emits select-all and deselect-all filters from the stored derived state', () => {
    const { onChange, wrapper } = setup({
      dataState: { filteredOptions: ['banana'], selectedValues: [] },
    });
    const toggleSelectAll = renderHook(() => useToggleSelectAll(), { wrapper })
      .result.current;

    act(() => {
      toggleSelectAll();
    });

    expect(onChange).toHaveBeenCalledWith({
      type: 'select',
      values: ['banana'],
    });

    const allSelected = setup({
      dataState: {
        filteredOptions: ['banana'],
        isAllSelected: true,
        selectedValues: ['banana', 'cherry'],
      },
    });
    const deselectAll = renderHook(() => useToggleSelectAll(), {
      wrapper: allSelected.wrapper,
    }).result.current;

    act(() => {
      deselectAll();
    });

    expect(allSelected.onChange).toHaveBeenCalledWith({
      type: 'select',
      values: ['cherry'],
    });
  });

  it('invokes the fetch-more callback only when provided', () => {
    const onFetchMore = vi.fn();
    const { wrapper } = setup({ config: { onFetchMore } });
    const fetchMore = renderHook(() => useFetchMore(), { wrapper }).result
      .current;

    act(() => {
      fetchMore();
    });

    expect(onFetchMore).toHaveBeenCalledTimes(1);

    const withoutCallback = setup();
    const noopFetchMore = renderHook(() => useFetchMore(), {
      wrapper: withoutCallback.wrapper,
    }).result.current;

    expect(() => {
      noopFetchMore();
    }).not.toThrow();
  });
});
