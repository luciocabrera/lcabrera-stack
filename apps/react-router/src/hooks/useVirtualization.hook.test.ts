// @vitest-environment jsdom

import type { RefObject } from 'react';

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useVirtualization } from './useVirtualization.hook';

const { cancelAnimationFrameMock, requestAnimationFrameMock } = vi.hoisted(
  () => ({
    cancelAnimationFrameMock: vi.fn(),
    requestAnimationFrameMock: vi.fn<
      (callback: FrameRequestCallback) => number
    >((callback) => {
      callback(0);
      return 1;
    }),
  }),
);

const resizeObserverCallbackRef: {
  current: ResizeObserverCallback | undefined;
} = {
  current: undefined,
};

type CreateContainerArgs = {
  readonly offsetHeight: number;
  readonly scrollHeight?: number;
  readonly scrollTop?: number;
};

const createContainer = ({
  offsetHeight,
  scrollHeight = 1000,
  scrollTop = 0,
}: CreateContainerArgs): HTMLElement => {
  const container = document.createElement('div');

  Object.defineProperties(container, {
    offsetHeight: {
      configurable: true,
      value: offsetHeight,
    },
    scrollHeight: {
      configurable: true,
      value: scrollHeight,
    },
    scrollTop: {
      configurable: true,
      value: scrollTop,
      writable: true,
    },
  });

  return container;
};

describe('useVirtualization', () => {
  beforeEach(() => {
    resizeObserverCallbackRef.current = undefined;
    requestAnimationFrameMock.mockClear();
    cancelAnimationFrameMock.mockClear();

    vi.stubGlobal('requestAnimationFrame', requestAnimationFrameMock);
    vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrameMock);
    vi.stubGlobal(
      'ResizeObserver',
      class {
        public constructor(callback: ResizeObserverCallback) {
          resizeObserverCallbackRef.current = callback;
        }

        public disconnect() {
          // noop test double
        }

        public observe() {
          // noop test double
        }

        public unobserve() {
          // noop test double
        }
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('computes the initial visible range from container height', () => {
    const container = createContainer({ offsetHeight: 400 });
    const containerRef = {
      current: container,
    } as RefObject<HTMLElement | null>;

    const { result } = renderHook(() =>
      useVirtualization({
        containerRef,
        itemHeight: 50,
        overscan: 3,
        totalItems: 100,
      }),
    );

    expect(result.current.containerHeight).toBe(400);
    expect(result.current.visibleCount).toBe(8);
    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(14);
    expect(result.current.totalHeight).toBe(5000);
  });

  it('updates the visible range when the container scrolls', () => {
    const container = createContainer({ offsetHeight: 400 });
    const containerRef = {
      current: container,
    } as RefObject<HTMLElement | null>;

    const { result } = renderHook(() =>
      useVirtualization({
        containerRef,
        itemHeight: 50,
        overscan: 3,
        totalItems: 100,
      }),
    );

    act(() => {
      container.scrollTop = 250;
      container.dispatchEvent(new Event('scroll'));
    });

    expect(result.current.startIndex).toBe(2);
    expect(result.current.endIndex).toBe(16);
    expect(result.current.offsetY).toBe(100);
    expect(requestAnimationFrameMock).toHaveBeenCalledTimes(1);
  });

  it('updates the height through ResizeObserver measurements', () => {
    const container = createContainer({ offsetHeight: 400 });
    const containerRef = {
      current: container,
    } as RefObject<HTMLElement | null>;

    const { result } = renderHook(() =>
      useVirtualization({
        containerRef,
        itemHeight: 50,
        totalItems: 100,
      }),
    );

    Object.defineProperty(container, 'offsetHeight', {
      configurable: true,
      value: 520,
    });

    act(() => {
      resizeObserverCallbackRef.current?.([], {} as ResizeObserver);
    });

    expect(result.current.containerHeight).toBe(520);
    expect(result.current.visibleCount).toBe(11);
  });

  it('keeps the previous height when a resize measures zero', () => {
    const container = createContainer({ offsetHeight: 400 });
    const containerRef = {
      current: container,
    } as RefObject<HTMLElement | null>;

    const { result } = renderHook(() =>
      useVirtualization({
        containerRef,
        itemHeight: 50,
        overscan: 3,
        totalItems: 100,
      }),
    );

    Object.defineProperty(container, 'offsetHeight', {
      configurable: true,
      value: 0,
    });

    act(() => {
      resizeObserverCallbackRef.current?.([], {} as ResizeObserver);
    });

    expect(result.current.containerHeight).toBe(400);
  });

  it('can temporarily report an empty window when scrollTop outlives the data', () => {
    const container = createContainer({ offsetHeight: 100, scrollTop: 600 });
    const containerRef = {
      current: container,
    } as RefObject<HTMLElement | null>;

    const { rerender, result } = renderHook(
      ({ totalItems }: { readonly totalItems: number }) =>
        useVirtualization({
          containerRef,
          itemHeight: 50,
          overscan: 0,
          totalItems,
        }),
      {
        initialProps: {
          totalItems: 20,
        },
      },
    );

    rerender({ totalItems: 5 });

    expect(result.current.startIndex).toBe(12);
    expect(result.current.endIndex).toBe(5);
    expect(result.current.bottomSpacerHeight).toBe(0);
  });

  it('cancels a pending animation frame when the hook unmounts', () => {
    requestAnimationFrameMock.mockImplementationOnce(() => 7);

    const container = createContainer({ offsetHeight: 400 });
    const containerRef = {
      current: container,
    } as RefObject<HTMLElement | null>;

    const { unmount } = renderHook(() =>
      useVirtualization({
        containerRef,
        itemHeight: 50,
        totalItems: 100,
      }),
    );

    act(() => {
      container.scrollTop = 250;
      container.dispatchEvent(new Event('scroll'));
    });

    unmount();

    expect(cancelAnimationFrameMock).toHaveBeenCalledWith(7);
  });

  it('falls back to the provided default height when no container is mounted', () => {
    const containerRef = {
      current: undefined,
    } as RefObject<HTMLElement | null | undefined>;

    const { result } = renderHook(() =>
      useVirtualization({
        containerRef,
        defaultContainerHeight: 250,
        itemHeight: 50,
        totalItems: 25,
      }),
    );

    expect(result.current.containerHeight).toBe(250);
    expect(result.current.visibleCount).toBe(5);
    expect(result.current.totalHeight).toBe(1250);
  });
});
