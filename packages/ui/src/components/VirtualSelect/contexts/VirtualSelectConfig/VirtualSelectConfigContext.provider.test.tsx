// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  useGetIsListVisible,
  useGetIsOpen,
  useGetMode,
  useGetPlaceholder,
} from './meta/selectors';
import { VirtualSelectConfigProvider } from './VirtualSelectConfigContext.provider';

type WrapperProps = {
  readonly children: ReactNode;
};

describe('VirtualSelectConfigProvider', () => {
  it('seeds the meta store from the props with isListVisible pre-computed', () => {
    const wrapper = ({ children }: WrapperProps) => (
      <VirtualSelectConfigProvider
        isAlwaysOpen
        isBusy={false}
        isOpen={false}
        listboxId='listbox-id'
        mode='multi'
        onToggleDropdown={vi.fn()}
        placeholder='Pick...'
      >
        {children}
      </VirtualSelectConfigProvider>
    );

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

  it('syncs the meta store when the mirrored props change', async () => {
    let currentIsOpen = false;
    const wrapper = ({ children }: WrapperProps) => (
      <VirtualSelectConfigProvider
        isAlwaysOpen={false}
        isBusy={false}
        isOpen={currentIsOpen}
        listboxId='listbox-id'
        mode='single'
        onToggleDropdown={vi.fn()}
        placeholder='Pick...'
      >
        {children}
      </VirtualSelectConfigProvider>
    );

    const { rerender, result } = renderHook(
      () => ({
        isListVisible: useGetIsListVisible(),
        isOpen: useGetIsOpen(),
      }),
      { wrapper },
    );

    expect(result.current).toEqual({ isListVisible: false, isOpen: false });

    currentIsOpen = true;
    rerender();

    await waitFor(() => {
      expect(result.current).toEqual({ isListVisible: true, isOpen: true });
    });
  });
});
