// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { createMockStore } from '@repo/ui/utils/tests/createMockStore.util';
import { renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type {
  VirtualListConfigState,
  VirtualListUiState,
} from '../../../VirtualList.types';
import type { VirtualListConfigContextValue } from '../VirtualListConfigContext.types';

import { useVirtualListConfigContextValue } from '../useVirtualListConfigContextValue.hook';
import { INITIAL_LIST_CONFIG_STATE } from '../VirtualListConfigContext.constants';
import { VirtualListConfigContext } from '../VirtualListConfigContext.context';
import { useGetHasCheckboxes } from './selectors/useGetHasCheckboxes.hook';
import { useGetHasFetchInitial } from './selectors/useGetHasFetchInitial.hook';
import { useGetHasFetchMore } from './selectors/useGetHasFetchMore.hook';
import { useGetHasSelectAll } from './selectors/useGetHasSelectAll.hook';
import { useGetListMaxHeight } from './selectors/useGetListMaxHeight.hook';
import { useGetSearchInputName } from './selectors/useGetSearchInputName.hook';
import { useGetShouldFillHeight } from './selectors/useGetShouldFillHeight.hook';
import { useListConfigStore } from './useListConfigStore.hook';

type WrapperProps = {
  readonly children: ReactNode;
};

const setup = (configState: Partial<VirtualListConfigState> = {}) => {
  const configStore = createMockStore<VirtualListConfigState>({
    hasCheckboxes: true,
    hasFetchInitial: false,
    hasFetchMore: true,
    hasSelectAll: true,
    listMaxHeight: '18.75rem',
    name: 'fruit-search',
    shouldFillHeight: false,
    ...configState,
  });
  const uiStore = createMockStore<VirtualListUiState>({
    listFilterMode: 'all',
    searchTerm: '',
  });
  const contextValue: VirtualListConfigContextValue = {
    configStore: configStore as never,
    onChange: vi.fn(),
    uiStore: uiStore as never,
  };
  const wrapper = ({ children }: WrapperProps) =>
    createElement(VirtualListConfigContext, { value: contextValue }, children);

  return { configStore, contextValue, wrapper };
};

describe('VirtualListConfig config hooks', () => {
  it('returns the config context value and throws outside the provider', () => {
    const { contextValue, wrapper } = setup();

    expect(
      renderHook(() => useVirtualListConfigContextValue(), { wrapper }).result
        .current,
    ).toBe(contextValue);
    expect(() => renderHook(() => useVirtualListConfigContextValue())).toThrow(
      'useVirtualListConfigContextValue must be used within VirtualListConfigProvider',
    );
  });

  it('exposes the config-store slices through the selectors', () => {
    const { wrapper } = setup();

    expect(
      renderHook(() => useGetHasCheckboxes(), { wrapper }).result.current,
    ).toBe(true);
    expect(
      renderHook(() => useGetHasFetchInitial(), { wrapper }).result.current,
    ).toBe(false);
    expect(
      renderHook(() => useGetHasFetchMore(), { wrapper }).result.current,
    ).toBe(true);
    expect(
      renderHook(() => useGetHasSelectAll(), { wrapper }).result.current,
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

    const withoutCheckboxes = setup({ hasCheckboxes: false });

    expect(
      renderHook(() => useGetHasCheckboxes(), {
        wrapper: withoutCheckboxes.wrapper,
      }).result.current,
    ).toBe(false);
  });

  it('falls back to the initial config state when the snapshot is undefined', () => {
    const configStore = createMockStore<undefined | VirtualListConfigState>(
      undefined,
    );
    const uiStore = createMockStore<VirtualListUiState>({
      listFilterMode: 'all',
      searchTerm: '',
    });
    const contextValue: VirtualListConfigContextValue = {
      configStore: configStore as never,
      onChange: vi.fn(),
      uiStore: uiStore as never,
    };
    const wrapper = ({ children }: WrapperProps) =>
      createElement(
        VirtualListConfigContext,
        { value: contextValue },
        children,
      );

    expect(
      renderHook(() => useListConfigStore((state) => state), { wrapper }).result
        .current,
    ).toEqual(INITIAL_LIST_CONFIG_STATE);
  });
});
