// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { createMockStore } from '@repo/ui/utils/tests/createMockStore.util';
import { renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { VirtualSelectMetaState } from '../../../VirtualSelect.types';
import type { VirtualSelectConfigContextValue } from '../VirtualSelectConfigContext.types';

import { useVirtualSelectConfigContextValue } from '../useVirtualSelectConfigContextValue.hook';
import { INITIAL_SELECT_META_STATE } from '../VirtualSelectConfigContext.constants';
import { VirtualSelectConfigContext } from '../VirtualSelectConfigContext.context';
import { useToggleDropdown } from './actions/useToggleDropdown.hook';
import {
  useGetCustomStylex,
  useGetIsAlwaysOpen,
  useGetIsBusy,
  useGetIsListVisible,
  useGetIsOpen,
  useGetListboxId,
  useGetListMaxHeight,
  useGetMode,
  useGetPlaceholder,
  useGetShouldFillHeight,
} from './selectors';
import { useSelectMetaStore } from './useSelectMetaStore.hook';

type WrapperProps = {
  readonly children: ReactNode;
};

const setup = (metaState: Partial<VirtualSelectMetaState> = {}) => {
  const metaStore = createMockStore<VirtualSelectMetaState>({
    isAlwaysOpen: false,
    isBusy: false,
    isListVisible: true,
    isOpen: true,
    listboxId: 'listbox-id',
    listMaxHeight: '18.75rem',
    mode: 'multi',
    placeholder: 'Pick a fruit...',
    shouldFillHeight: false,
    ...metaState,
  });
  const onToggleDropdown = vi.fn();
  const contextValue: VirtualSelectConfigContextValue = {
    metaStore: metaStore as never,
    onToggleDropdown,
  };
  const wrapper = ({ children }: WrapperProps) =>
    createElement(
      VirtualSelectConfigContext,
      { value: contextValue },
      children,
    );

  return { contextValue, metaStore, onToggleDropdown, wrapper };
};

describe('VirtualSelectConfig meta hooks', () => {
  it('returns the select context value and throws outside the provider', () => {
    const { contextValue, wrapper } = setup();

    expect(
      renderHook(() => useVirtualSelectConfigContextValue(), { wrapper }).result
        .current,
    ).toBe(contextValue);
    expect(() =>
      renderHook(() => useVirtualSelectConfigContextValue()),
    ).toThrow(
      'useVirtualSelectConfigContextValue must be used within VirtualSelectConfigProvider',
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
    expect(
      renderHook(() => useGetListMaxHeight(), { wrapper }).result.current,
    ).toBe('18.75rem');
    expect(renderHook(() => useGetMode(), { wrapper }).result.current).toBe(
      'multi',
    );
    expect(
      renderHook(() => useGetPlaceholder(), { wrapper }).result.current,
    ).toBe('Pick a fruit...');
    expect(
      renderHook(() => useGetShouldFillHeight(), { wrapper }).result.current,
    ).toBe(false);

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

  it('falls back to the initial meta state when the snapshot is undefined', () => {
    const metaStore = createMockStore<undefined | VirtualSelectMetaState>(
      undefined,
    );
    const contextValue: VirtualSelectConfigContextValue = {
      metaStore: metaStore as never,
      onToggleDropdown: vi.fn(),
    };
    const wrapper = ({ children }: WrapperProps) =>
      createElement(
        VirtualSelectConfigContext,
        { value: contextValue },
        children,
      );

    expect(
      renderHook(() => useSelectMetaStore((state) => state), { wrapper }).result
        .current,
    ).toEqual(INITIAL_SELECT_META_STATE);
  });
});
