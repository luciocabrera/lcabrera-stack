// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useResizeObserver } from './useResizeObserver.hook';

type ResizeCallback = () => void;

class MockResizeObserver {
  public static callbacks: ResizeCallback[] = [];
  public static instances: MockResizeObserver[] = [];

  public disconnect = vi.fn();

  public observe = vi.fn();
  public unobserve = vi.fn();
  public constructor(callback: ResizeCallback) {
    MockResizeObserver.callbacks.push(callback);
    MockResizeObserver.instances.push(this);
  }
}

afterEach(() => {
  MockResizeObserver.callbacks = [];
  MockResizeObserver.instances = [];
  vi.unstubAllGlobals();
});

describe('useResizeObserver', () => {
  it('does nothing when the target resolves to no element', () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    const onMeasure = vi.fn();

    renderHook(() => useResizeObserver({ getTarget: () => {}, onMeasure }));

    expect(onMeasure).not.toHaveBeenCalled();
    expect(MockResizeObserver.instances).toHaveLength(0);
  });

  it('measures the resolved target on mount and observes it', async () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    const target = document.createElement('div');
    const onMeasure = vi.fn();

    renderHook(() => useResizeObserver({ getTarget: () => target, onMeasure }));

    // The initial measurement is a microtask away (deferred out of the
    // effect body), so wait for it rather than asserting synchronously.
    await waitFor(() => expect(onMeasure).toHaveBeenCalledWith(target));
    expect(MockResizeObserver.instances[0]?.observe).toHaveBeenCalledWith(
      target,
    );
  });

  it('re-measures when the observer fires', async () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    const target = document.createElement('div');
    const onMeasure = vi.fn();

    renderHook(() => useResizeObserver({ getTarget: () => target, onMeasure }));

    await waitFor(() => expect(onMeasure).toHaveBeenCalledTimes(1));
    MockResizeObserver.callbacks[0]?.();
    expect(onMeasure).toHaveBeenCalledTimes(2);
  });

  it('measures once without a ResizeObserver (SSR-safe fallback)', async () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const target = document.createElement('div');
    const onMeasure = vi.fn();

    renderHook(() => useResizeObserver({ getTarget: () => target, onMeasure }));

    await waitFor(() => expect(onMeasure).toHaveBeenCalledWith(target));
    expect(onMeasure).toHaveBeenCalledTimes(1);
  });

  it('cancels the pending initial measurement on unmount', async () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    const target = document.createElement('div');
    const onMeasure = vi.fn();

    const { unmount } = renderHook(() =>
      useResizeObserver({ getTarget: () => target, onMeasure }),
    );

    unmount();
    // Flush the already-queued microtask, then assert it was a no-op.
    await Promise.resolve();
    expect(onMeasure).not.toHaveBeenCalled();
    expect(MockResizeObserver.instances[0]?.disconnect).toHaveBeenCalled();
  });
});
