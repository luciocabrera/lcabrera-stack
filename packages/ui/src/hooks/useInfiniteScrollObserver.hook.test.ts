// @vitest-environment jsdom

import type { RefObject } from 'react';

import { renderHook } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import { useInfiniteScrollObserver } from './useInfiniteScrollObserver.hook';

type ObserverCallback = (entries: readonly IntersectionObserverEntry[]) => void;

const observerRef: {
  current:
    | undefined
    | {
        readonly callback: ObserverCallback;
        readonly options: IntersectionObserverInit | undefined;
      };
} = {
  current: undefined,
};
const disconnectSpy = vi.fn();
const observeSpy = vi.fn();

class MockIntersectionObserver {
  disconnect = disconnectSpy;

  observe = observeSpy;

  constructor(...args: readonly [ObserverCallback, IntersectionObserverInit?]) {
    const [callback, options] = args;
    observerRef.current = { callback, options };
  }

  takeRecords(): readonly IntersectionObserverEntry[] {
    return [];
  }

  unobserve() {
    // no-op
  }
}

const triggerIntersection = (isIntersecting: boolean) => {
  observerRef.current?.callback([
    { isIntersecting } as IntersectionObserverEntry,
  ]);
};

const createRef = (): RefObject<HTMLElement | null> => ({
  current: document.createElement('div'),
});

beforeEach(() => {
  observerRef.current = undefined;
  disconnectSpy.mockClear();
  observeSpy.mockClear();
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useInfiniteScrollObserver', () => {
  it('calls onReachEnd when the sentinel intersects', () => {
    const onReachEnd = vi.fn();

    renderHook(() => {
      useInfiniteScrollObserver({
        isEnabled: true,
        onReachEnd,
        rootRef: createRef(),
        sentinelRef: createRef(),
        threshold: 50,
      });
    });

    expect(observeSpy).toHaveBeenCalledOnce();
    triggerIntersection(true);
    expect(onReachEnd).toHaveBeenCalledOnce();
  });

  it('does not call onReachEnd when the sentinel is not intersecting', () => {
    const onReachEnd = vi.fn();

    renderHook(() => {
      useInfiniteScrollObserver({
        isEnabled: true,
        onReachEnd,
        rootRef: createRef(),
        sentinelRef: createRef(),
        threshold: 50,
      });
    });

    triggerIntersection(false);
    expect(onReachEnd).not.toHaveBeenCalled();
  });

  it('expresses the threshold as the bottom rootMargin', () => {
    renderHook(() => {
      useInfiniteScrollObserver({
        isEnabled: true,
        onReachEnd: vi.fn(),
        rootRef: createRef(),
        sentinelRef: createRef(),
        threshold: 120,
      });
    });

    expect(observerRef.current?.options?.rootMargin).toBe('0px 0px 120px 0px');
  });

  it('does not observe when disabled', () => {
    const onReachEnd = vi.fn();

    renderHook(() => {
      useInfiniteScrollObserver({
        isEnabled: false,
        onReachEnd,
        rootRef: createRef(),
        sentinelRef: createRef(),
        threshold: 50,
      });
    });

    expect(observeSpy).not.toHaveBeenCalled();
  });

  it('does not observe when the refs are empty', () => {
    const emptyRef = {
      current: undefined,
    } as unknown as RefObject<HTMLElement | null>;

    renderHook(() => {
      useInfiniteScrollObserver({
        isEnabled: true,
        onReachEnd: vi.fn(),
        rootRef: emptyRef,
        sentinelRef: emptyRef,
        threshold: 50,
      });
    });

    expect(observeSpy).not.toHaveBeenCalled();
  });

  it('disconnects the observer on unmount', () => {
    const { unmount } = renderHook(() => {
      useInfiniteScrollObserver({
        isEnabled: true,
        onReachEnd: vi.fn(),
        rootRef: createRef(),
        sentinelRef: createRef(),
        threshold: 50,
      });
    });

    unmount();

    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('does not recreate the observer when only onReachEnd changes', () => {
    const rootRef = createRef();
    const sentinelRef = createRef();
    const latestOnReachEnd = vi.fn();

    const { rerender } = renderHook(
      ({ onReachEnd }: { readonly onReachEnd: () => void }) => {
        useInfiniteScrollObserver({
          isEnabled: true,
          onReachEnd,
          rootRef,
          sentinelRef,
          threshold: 50,
        });
      },
      { initialProps: { onReachEnd: vi.fn() } },
    );

    expect(observeSpy).toHaveBeenCalledOnce();

    rerender({ onReachEnd: latestOnReachEnd });

    // The observer is not torn down / recreated on a new callback identity.
    expect(disconnectSpy).not.toHaveBeenCalled();
    expect(observeSpy).toHaveBeenCalledOnce();

    // The latest callback is invoked through the ref.
    triggerIntersection(true);
    expect(latestOnReachEnd).toHaveBeenCalledOnce();
  });

  it('does nothing when IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const onReachEnd = vi.fn();

    expect(() => {
      renderHook(() => {
        useInfiniteScrollObserver({
          isEnabled: true,
          onReachEnd,
          rootRef: createRef(),
          sentinelRef: createRef(),
          threshold: 50,
        });
      });
    }).not.toThrow();

    expect(onReachEnd).not.toHaveBeenCalled();
  });
});
