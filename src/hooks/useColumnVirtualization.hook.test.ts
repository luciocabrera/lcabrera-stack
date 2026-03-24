// @vitest-environment jsdom

import type { RefObject } from 'react';

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useColumnVirtualization } from './useColumnVirtualization.hook';

// Captured ResizeObserver callback so tests can trigger it directly.
let capturedResizeCallback: (() => void) | undefined;

type CreateContainerArgs = {
  readonly offsetWidth: number;
  readonly scrollLeft?: number;
};

const createContainer = ({
  offsetWidth,
  scrollLeft = 0,
}: CreateContainerArgs): HTMLElement => {
  const container = document.createElement('div');

  Object.defineProperty(container, 'offsetWidth', {
    configurable: true,
    value: offsetWidth,
  });
  Object.defineProperty(container, 'scrollLeft', {
    configurable: true,
    value: scrollLeft,
    writable: true,
  });

  return container;
};

beforeEach(() => {
  capturedResizeCallback = undefined;

  vi.stubGlobal(
    'ResizeObserver',
    class {
      public disconnect = vi.fn();
      public observe = vi.fn();
      public unobserve = vi.fn();
      public constructor(callback: () => void) {
        capturedResizeCallback = callback;
      }
    },
  );

  vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(
    (callback) => {
      callback(0);
      return 1;
    },
  );
  vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(
    (_id) => void 0,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useColumnVirtualization', () => {
  it('prefers measured container width over default fallback on initial render', () => {
    const container = createContainer({ offsetWidth: 1200 });
    const containerRef = {
      current: container,
    } as RefObject<HTMLElement | null>;

    const { result } = renderHook(() =>
      useColumnVirtualization({
        columnWidths: [200, 200, 200, 200, 200, 200, 200],
        containerRef,
        defaultContainerWidth: 300,
        overscan: 0,
      }),
    );

    expect(result.current.endIndex).toBe(6);
  });

  it('returns the full range when all columns fit in the viewport', () => {
    const container = createContainer({ offsetWidth: 800 });
    const containerRef = {
      current: container,
    } as RefObject<HTMLElement | null>;

    const { result } = renderHook(() =>
      useColumnVirtualization({
        columnWidths: [100, 200, 150, 100, 200],
        containerRef,
        overscan: 1,
      }),
    );

    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(5);
    expect(result.current.leftSpacerWidth).toBe(0);
    expect(result.current.rightSpacerWidth).toBe(0);
    expect(result.current.totalWidth).toBe(750);
  });

  it('computes the visible window when scrolled horizontally', () => {
    const container = createContainer({ offsetWidth: 200 });
    const containerRef = {
      current: container,
    } as RefObject<HTMLElement | null>;

    // columnWidths: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
    // cumulative:   [0,   100, 200, 300, 400, 500, 600, 700, 800, 900]
    const { result } = renderHook(() =>
      useColumnVirtualization({
        columnWidths: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
        containerRef,
        overscan: 1,
      }),
    );

    act(() => {
      container.scrollLeft = 300;
      container.dispatchEvent(new Event('scroll'));
    });

    // viewStart=300, viewEnd=500
    // firstVisible col index: 3 (cumStart=300, colEnd=400 > 300)
    // startIndex = max(0, 3-1) = 2
    // firstOutOfView: col index 5 (cumStart=500 >= 500)
    // endIndex = min(10, 5+1) = 6
    expect(result.current.startIndex).toBe(2);
    expect(result.current.endIndex).toBe(6);
    expect(result.current.leftSpacerWidth).toBe(200); // 2 * 100
    expect(result.current.rightSpacerWidth).toBe(400); // (10-6) * 100
  });

  it('returns zeros when no columns are provided', () => {
    const container = createContainer({ offsetWidth: 500 });
    const containerRef = {
      current: container,
    } as RefObject<HTMLElement | null>;

    const { result } = renderHook(() =>
      useColumnVirtualization({
        columnWidths: [],
        containerRef,
      }),
    );

    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(0);
    expect(result.current.leftSpacerWidth).toBe(0);
    expect(result.current.rightSpacerWidth).toBe(0);
    expect(result.current.totalWidth).toBe(0);
  });

  it('keeps the previous width when a resize measures zero', () => {
    // Stub innerWidth to 0 so the hook's viewport-width fallback is also skipped,
    // exercising the zero-guard that preserves the previous containerWidth.
    Object.defineProperty(globalThis.window, 'innerWidth', {
      configurable: true,
      value: 0,
    });

    const container = createContainer({ offsetWidth: 400 });
    const containerRef = {
      current: container,
    } as RefObject<HTMLElement | null>;

    // 5 columns of 100px each, container 400px wide, overscan 0
    // With containerWidth=400: viewEnd=400, col[4] starts at 400 → endIndex=4
    const { result } = renderHook(() =>
      useColumnVirtualization({
        columnWidths: [100, 100, 100, 100, 100],
        containerRef,
        overscan: 0,
      }),
    );

    expect(result.current.endIndex).toBe(4);

    // Simulate the ResizeObserver reporting a zero-width measurement (e.g. display:none)
    Object.defineProperty(container, 'offsetWidth', {
      configurable: true,
      value: 0,
    });

    act(() => {
      capturedResizeCallback?.();
    });

    // With zero width the hook would compute endIndex=0 (past the last column).
    // The zero-guard must preserve the previous containerWidth (400),
    // so endIndex should still be 4.
    expect(result.current.endIndex).toBe(4);
  });
});
