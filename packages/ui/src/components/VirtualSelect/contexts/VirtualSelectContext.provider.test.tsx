// @vitest-environment jsdom

import type { VirtualListDataState } from '@repo/ui/components/VirtualList';
import type { ReactNode } from 'react';

import { useGetHasCheckboxes } from '@repo/ui/components/VirtualList/contexts/list/selectors';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { VirtualSelectMetaStateProps } from './VirtualSelectContext.types';

import {
  useGetIsListVisible,
  useGetIsOpen,
  useGetMode,
  useGetPlaceholder,
} from './meta/selectors';
import { VirtualSelectProvider } from './VirtualSelectContext.provider';

type WrapperArgs = {
  readonly metaState: VirtualSelectMetaStateProps;
};

type WrapperProps = {
  readonly children: ReactNode;
};

const DATA_STATE: VirtualListDataState = {
  data: ['apple', 'banana'],
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
};

const createWrapper =
  ({ metaState }: WrapperArgs) =>
  ({ children }: WrapperProps) => (
    <VirtualSelectProvider
      dataState={DATA_STATE}
      filter={{ type: 'select', values: [] }}
      listState={{ hasCheckboxes: true, onChange: vi.fn() }}
      metaState={metaState}
    >
      {children}
    </VirtualSelectProvider>
  );

describe('VirtualSelectProvider', () => {
  it('seeds the meta store from the props with isListVisible pre-computed', () => {
    const wrapper = createWrapper({
      metaState: {
        isAlwaysOpen: true,
        isBusy: false,
        isOpen: false,
        listboxId: 'listbox-id',
        mode: 'multi',
        onToggleDropdown: vi.fn(),
        placeholder: 'Pick...',
      },
    });

    const { result } = renderHook(
      () => ({
        isListVisible: useGetIsListVisible(),
        isOpen: useGetIsOpen(),
        mode: useGetMode(),
        placeholder: useGetPlaceholder(),
      }),
      { wrapper },
    );

    expect(result.current).toEqual({
      isListVisible: true,
      isOpen: false,
      mode: 'multi',
      placeholder: 'Pick...',
    });
  });

  it('exposes the composed list context alongside the select metadata', () => {
    const wrapper = createWrapper({
      metaState: {
        isAlwaysOpen: false,
        isBusy: false,
        isOpen: false,
        listboxId: 'listbox-id',
        mode: 'single',
        onToggleDropdown: vi.fn(),
        placeholder: 'Pick...',
      },
    });

    const { result } = renderHook(
      () => ({
        hasCheckboxes: useGetHasCheckboxes(),
        mode: useGetMode(),
      }),
      { wrapper },
    );

    expect(result.current).toEqual({ hasCheckboxes: true, mode: 'single' });
  });

  it('syncs the meta store when the mirrored props change', async () => {
    let isCurrentlyOpen = false;
    const wrapper = ({ children }: WrapperProps) => (
      <VirtualSelectProvider
        dataState={DATA_STATE}
        filter={{ type: 'select', values: [] }}
        listState={{ hasCheckboxes: true, onChange: vi.fn() }}
        metaState={{
          isAlwaysOpen: false,
          isBusy: false,
          isOpen: isCurrentlyOpen,
          listboxId: 'listbox-id',
          mode: 'single',
          onToggleDropdown: vi.fn(),
          placeholder: 'Pick...',
        }}
      >
        {children}
      </VirtualSelectProvider>
    );

    const { rerender, result } = renderHook(
      () => ({
        isListVisible: useGetIsListVisible(),
        isOpen: useGetIsOpen(),
      }),
      { wrapper },
    );

    expect(result.current).toEqual({ isListVisible: false, isOpen: false });

    isCurrentlyOpen = true;
    rerender();

    await waitFor(() => {
      expect(result.current).toEqual({ isListVisible: true, isOpen: true });
    });
  });
});
