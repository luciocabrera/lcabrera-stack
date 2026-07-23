// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { useStore } from './useStore.hook';

type TestState = {
  readonly count: number;
  readonly label: string;
};

describe('useStore', () => {
  it('merges partial state updates and preserves untouched keys', () => {
    const { result } = renderHook(() =>
      useStore<TestState>({ count: 0, label: 'initial' }),
    );

    act(() => {
      result.current.set({ count: 2 });
    });

    expect(result.current.get()).toEqual({ count: 2, label: 'initial' });
    expect(result.current.getServerSnapshot()).toEqual({
      count: 0,
      label: 'initial',
    });
  });

  it('notifies subscribers only when the merged state changes', () => {
    const listener = vi.fn();
    const { result } = renderHook(() =>
      useStore<TestState>({ count: 0, label: 'initial' }),
    );

    const unsubscribe = result.current.subscribe(listener);

    act(() => {
      result.current.set({ count: 0 });
    });

    expect(listener).not.toHaveBeenCalled();

    act(() => {
      result.current.set({ count: 1 });
    });

    expect(listener).toHaveBeenCalledTimes(1);

    act(() => {
      unsubscribe();
      result.current.set({ count: 2 });
    });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('resets to the initial snapshot and notifies listeners', () => {
    const listener = vi.fn();
    const { result } = renderHook(() =>
      useStore<TestState>({ count: 0, label: 'initial' }),
    );

    result.current.subscribe(listener);

    act(() => {
      result.current.set({ count: 3, label: 'updated' });
    });

    expect(result.current.get()).toEqual({ count: 3, label: 'updated' });

    act(() => {
      result.current.reset();
    });

    expect(result.current.get()).toEqual({ count: 0, label: 'initial' });
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
