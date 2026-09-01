// @vitest-environment jsdom
import type { RefObject } from 'react';

import { renderHook, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { useElementSize } from './useElementSize.hook';

type ResizeCallback = () => void;

class MockResizeObserver {
  public static callbacks: ResizeCallback[] = [];

  public disconnect = vi.fn();

  public observe = vi.fn();
  public unobserve = vi.fn();
  public constructor(callback: ResizeCallback) {
    MockResizeObserver.callbacks.push(callback);
  }
}

const createSizedElement = ({
  height,
  width,
}: {
  readonly height: number;
  readonly width: number;
}): HTMLDivElement => {
  const element = document.createElement('div');

  Object.defineProperties(element, {
    clientHeight: { value: height },
    clientWidth: { value: width },
  });

  return element;
};

afterEach(() => {
  MockResizeObserver.callbacks = [];
  vi.unstubAllGlobals();
});

describe('useElementSize', () => {
  it('returns a zero size when the ref has no element', () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    const ref = createRef<HTMLElement>();

    const { result } = renderHook(() => useElementSize({ ref }));

    expect(result.current).toEqual({ height: 0, width: 0 });
  });

  it('measures the element size on mount', async () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    const element = createSizedElement({ height: 200, width: 300 });
    const ref = { current: element } as RefObject<HTMLElement | null>;

    const { result } = renderHook(() => useElementSize({ ref }));

    await waitFor(() =>
      expect(result.current).toEqual({ height: 200, width: 300 }),
    );
  });

  it('measures once without a ResizeObserver (SSR-safe fallback)', async () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const element = createSizedElement({ height: 120, width: 480 });
    const ref = { current: element } as RefObject<HTMLElement | null>;

    const { result } = renderHook(() => useElementSize({ ref }));

    await waitFor(() =>
      expect(result.current).toEqual({ height: 120, width: 480 }),
    );
  });
});
