// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useGetHasCheckboxes } from './config/selectors/useGetHasCheckboxes.hook';
import { useGetHasFetchMore } from './config/selectors/useGetHasFetchMore.hook';
import { useGetSearchInputName } from './config/selectors/useGetSearchInputName.hook';
import { useGetListFilterMode } from './ui/selectors/useGetListFilterMode.hook';
import { useGetSearchTerm } from './ui/selectors/useGetSearchTerm.hook';
import { VirtualListConfigProvider } from './VirtualListConfigContext.provider';

type WrapperProps = {
  readonly children: ReactNode;
};

const seededWrapper = ({ children }: WrapperProps) => (
  <VirtualListConfigProvider
    hasCheckboxes={false}
    hasSelectAll
    name='country-filter'
    onChange={vi.fn()}
    onFetchMore={vi.fn()}
  >
    {children}
  </VirtualListConfigProvider>
);

describe('VirtualListConfigProvider', () => {
  it('seeds the config store from the props and the UI store with defaults', () => {
    const { result } = renderHook(
      () => ({
        hasCheckboxes: useGetHasCheckboxes(),
        hasFetchMore: useGetHasFetchMore(),
        listFilterMode: useGetListFilterMode(),
        name: useGetSearchInputName(),
        searchTerm: useGetSearchTerm(),
      }),
      { wrapper: seededWrapper },
    );

    expect(result.current).toEqual({
      hasCheckboxes: false,
      hasFetchMore: true,
      listFilterMode: 'all',
      name: 'country-filter',
      searchTerm: '',
    });
  });

  it('syncs the config store when the props change', async () => {
    let currentName = 'first-name';
    const wrapper = ({ children }: WrapperProps) => (
      <VirtualListConfigProvider
        hasCheckboxes
        hasSelectAll
        name={currentName}
        onChange={vi.fn()}
      >
        {children}
      </VirtualListConfigProvider>
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
});
