// @vitest-environment jsdom

import type { RefObject } from 'react';

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useVirtualization } from './useVirtualization.hook';

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
      globalThis.dispatchEvent(new Event('resize'));
    });

    expect(result.current.containerHeight).toBe(400);
  });

  it('falls back to the provided default height when no container is mounted', () => {
    const containerRef = {
      current: null,
    } as RefObject<HTMLElement | null>;

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
