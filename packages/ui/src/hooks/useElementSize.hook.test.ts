// @vitest-environment jsdom
import type { RefObject } from 'react';

import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useElementSize } from './useElementSize.hook';

type ResizeCallback = () => void;

class MockResizeObserver {
  public static callbacks: ResizeCallback[] = [];

  public constructor(callback: ResizeCallback) {
    MockResizeObserver.callbacks.push(callback);
  }

  public disconnect = vi.fn();
  public observe = vi.fn();
  public unobserve = vi.fn();
}

const createSizedElement = ({
  height,
  width,
}: {
  readonly height: number;
  readonly width: number;
}): HTMLDivElement => {
  const element = document.createElement('div');

  Object.defineProperty(element, 'clientHeight', { value: height });
  Object.defineProperty(element, 'clientWidth', { value: width });

  return element;
};

afterEach(() => {
  MockResizeObserver.callbacks = [];
  vi.unstubAllGlobals();
});

describe('useElementSize', () => {
  it('returns a zero size when the ref has no element', () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    const ref = { current: null } as RefObject<HTMLElement | null>;

    const { result } = renderHook(() => useElementSize({ ref }));

    expect(result.current).toEqual({ height: 0, width: 0 });
  });

  it('measures the element size on mount', () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    const element = createSizedElement({ height: 200, width: 300 });
    const ref = { current: element } as RefObject<HTMLElement | null>;

    const { result } = renderHook(() => useElementSize({ ref }));

    expect(result.current).toEqual({ height: 200, width: 300 });
  });

  it('measures once without a ResizeObserver (SSR-safe fallback)', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const element = createSizedElement({ height: 120, width: 480 });
    const ref = { current: element } as RefObject<HTMLElement | null>;

    const { result } = renderHook(() => useElementSize({ ref }));

    expect(result.current).toEqual({ height: 120, width: 480 });
  });
});
