// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import type { TStore } from './useStore.hook';

import { useStore } from './useStore.hook';
import { useStoreSelector } from './useStoreSelector.hook';

type TestState = {
  readonly count: number;
  readonly label: string;
};

const renderStoreSelector = <TSelected>(
  selector: (state: TestState) => TSelected,
) => {
  const renders = { count: 0 };

  const { result } = renderHook(() => {
    renders.count += 1;
    const store = useStore<TestState>({ count: 0, label: 'initial' });

    return { selected: useStoreSelector({ selector, store }), store };
  });

  return { renders, result };
};

describe('useStoreSelector', () => {
  it('returns the selected slice of the current store state', () => {
    const { result } = renderStoreSelector((state) => state.count);

    expect(result.current.selected).toBe(0);
  });

  it('re-renders with the new slice when the selected field changes', () => {
    const { renders, result } = renderStoreSelector((state) => state.count);
    const rendersBefore = renders.count;

    act(() => {
      result.current.store.set({ count: 3 });
    });

    expect(result.current.selected).toBe(3);
    expect(renders.count).toBeGreaterThan(rendersBefore);
  });

  it('does not re-render when a field outside the selection changes', () => {
    const { renders, result } = renderStoreSelector((state) => state.count);
    const rendersBefore = renders.count;

    act(() => {
      result.current.store.set({ label: 'updated' });
    });

    // The store notifies on any change, so the selector re-runs — but it
    // returns the same `count`, so useSyncExternalStore skips the re-render.
    expect(result.current.selected).toBe(0);
    expect(renders.count).toBe(rendersBefore);
  });

  it('selects from the fallback while the store is still empty', () => {
    const emptyStore: TStore<TestState> = {
      get: () => {},
      getServerSnapshot: () => {},
      reset: vi.fn(),
      set: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
    };

    const { result } = renderHook(() =>
      useStoreSelector({
        fallback: { count: 42, label: 'fallback' },
        selector: (state: TestState) => state.count,
        store: emptyStore,
      }),
    );

    expect(result.current).toBe(42);
  });

  it('reads through getServerSnapshot when rendering on the server', () => {
    const getServerSnapshot = vi.fn(() => ({ count: 7, label: 'server' }));
    const store: TStore<TestState> = {
      get: () => ({ count: 1, label: 'client' }),
      getServerSnapshot,
      reset: vi.fn(),
      set: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
    };

    const Probe = () =>
      createElement(
        'span',
        undefined,
        useStoreSelector({ selector: (state) => state.count, store }),
      );

    expect(renderToString(createElement(Probe))).toContain('7');
    expect(getServerSnapshot).toHaveBeenCalled();
  });
});
