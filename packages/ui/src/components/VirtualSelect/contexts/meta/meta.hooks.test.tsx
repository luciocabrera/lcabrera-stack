// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { createMockStore } from '#ui/utils/tests/createMockStore.util';

import type { VirtualSelectMetaState } from '../../VirtualSelect.types';
import type { VirtualSelectContextValue } from '../VirtualSelectContext.types';

import { useVirtualSelectContextValue } from '../useVirtualSelectContextValue.hook';
import { VirtualSelectContext } from '../VirtualSelectContext.context';
import { useCloseDropdown } from './actions/useCloseDropdown.hook';
import { useToggleDropdown } from './actions/useToggleDropdown.hook';
import {
  useGetCustomStylex,
  useGetIsAlwaysOpen,
  useGetIsBusy,
  useGetIsListVisible,
  useGetIsOpen,
  useGetListboxId,
  useGetMode,
  useGetPlaceholder,
} from './selectors';

type WrapperProps = {
  readonly children: ReactNode;
};

const setup = (metaState: Partial<VirtualSelectMetaState> = {}) => {
  const metaStore = createMockStore<VirtualSelectMetaState>({
    isAlwaysOpen: false,
    isBusy: false,
    isDisabled: false,
    isListVisible: true,
    isOpen: true,
    listboxId: 'listbox-id',
    mode: 'multi',
    placeholder: 'Pick a fruit...',
    ...metaState,
  });
  const onCloseDropdown = vi.fn();
  const onToggleDropdown = vi.fn();
  const contextValue: VirtualSelectContextValue = {
    anchorRef: { current: document.createElement('div') },
    metaStore: metaStore as never,
    onCloseDropdown,
    onToggleDropdown,
  };
  const wrapper = ({ children }: WrapperProps) =>
    createElement(VirtualSelectContext, { value: contextValue }, children);

  return {
    contextValue,
    metaStore,
    onCloseDropdown,
    onToggleDropdown,
    wrapper,
  };
};

describe('VirtualSelect meta hooks', () => {
  it('returns the select context value and throws outside the provider', () => {
    const { contextValue, wrapper } = setup();

    expect(
      renderHook(() => useVirtualSelectContextValue(), { wrapper }).result
        .current,
    ).toBe(contextValue);
    expect(() => renderHook(() => useVirtualSelectContextValue())).toThrow(
      'useVirtualSelectContextValue must be used within VirtualSelectProvider',
    );
  });

  it('exposes every meta-store slice through the selectors', () => {
    const { wrapper } = setup();

    expect(
      renderHook(() => useGetCustomStylex(), { wrapper }).result.current,
    ).toBeUndefined();
    expect(
      renderHook(() => useGetIsAlwaysOpen(), { wrapper }).result.current,
    ).toBe(false);
    expect(renderHook(() => useGetIsBusy(), { wrapper }).result.current).toBe(
      false,
    );
    expect(
      renderHook(() => useGetIsListVisible(), { wrapper }).result.current,
    ).toBe(true);
    expect(renderHook(() => useGetIsOpen(), { wrapper }).result.current).toBe(
      true,
    );
    expect(
      renderHook(() => useGetListboxId(), { wrapper }).result.current,
    ).toBe('listbox-id');
    expect(renderHook(() => useGetMode(), { wrapper }).result.current).toBe(
      'multi',
    );
    expect(
      renderHook(() => useGetPlaceholder(), { wrapper }).result.current,
    ).toBe('Pick a fruit...');

    const closed = setup({ isListVisible: false, isOpen: false });

    expect(
      renderHook(() => useGetIsListVisible(), { wrapper: closed.wrapper })
        .result.current,
    ).toBe(false);
  });

  it('dispatches the shell toggle callback through the action', () => {
    const { onToggleDropdown, wrapper } = setup();

    const toggleDropdown = renderHook(() => useToggleDropdown(), { wrapper })
      .result.current;
    toggleDropdown();

    expect(onToggleDropdown).toHaveBeenCalledTimes(1);
  });

  it('dispatches the shell close callback through the action', () => {
    const { onCloseDropdown, onToggleDropdown, wrapper } = setup();

    const closeDropdown = renderHook(() => useCloseDropdown(), { wrapper })
      .result.current;
    closeDropdown();

    // Not routed through the toggle: a toggle no-ops while the list is busy,
    // so a dismissal expressed as one would silently do nothing.
    expect(onCloseDropdown).toHaveBeenCalledTimes(1);
    expect(onToggleDropdown).not.toHaveBeenCalled();
  });
});
