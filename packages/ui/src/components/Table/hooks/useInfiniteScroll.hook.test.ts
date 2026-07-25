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

import { useInfiniteScroll } from './useInfiniteScroll.hook';

type Response = {
  readonly rows: readonly Row[];
  readonly total: number;
};

type Row = {
  readonly id: number;
};

const dataSelector = (response: Response): Row[] => [...response.rows];
const dataTotalSelector = (response: Response): number => response.total;

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

describe('useInfiniteScroll', () => {
  it('fetches more data when the sentinel reaches the bottom', () => {
    const fetchMoreData = vi
      .fn<
        ({
          dataSelector,
          dataTotalSelector,
          onLoadMore,
        }: {
          readonly dataSelector?: (response: Response) => readonly Row[];
          readonly dataTotalSelector?: (
            response: Response,
          ) => number | undefined;
          readonly onLoadMore?: (params: {
            lastRow?: Row;
            limit: number;
            skip: number;
          }) => Promise<Response>;
        }) => Promise<void>
      >()
      .mockResolvedValue();
    const onLoadMore = vi.fn();

    renderHook(() => {
      useInfiniteScroll<Row, Response>({
        dataSelector,
        dataTotalSelector,
        fetchMoreData,
        hasMore: true,
        isLoadingMore: false,
        onLoadMore,
        scrollContainerRef: createRef(),
        sentinelRef: createRef(),
        threshold: 100,
      });
    });

    triggerIntersection(true);

    expect(fetchMoreData).toHaveBeenCalledWith({
      dataSelector,
      dataTotalSelector,
      onLoadMore,
    });
  });

  it('encodes the threshold as the observer rootMargin', () => {
    const fetchMoreData = vi.fn().mockResolvedValue(undefined);

    renderHook(() => {
      useInfiniteScroll<Row, Response>({
        fetchMoreData,
        hasMore: true,
        isLoadingMore: false,
        onLoadMore: vi.fn(),
        scrollContainerRef: createRef(),
        sentinelRef: createRef(),
        threshold: 100,
      });
    });

    expect(observerRef.current?.options?.rootMargin).toBe('0px 0px 100px 0px');
  });

  it('does not observe when already loading or when no more rows exist', () => {
    const fetchMoreData = vi.fn().mockResolvedValue(undefined);

    renderHook(() => {
      useInfiniteScroll<Row, Response>({
        fetchMoreData,
        hasMore: false,
        isLoadingMore: true,
        onLoadMore: vi.fn(),
        scrollContainerRef: createRef(),
        sentinelRef: createRef(),
        threshold: 100,
      });
    });

    expect(observeSpy).not.toHaveBeenCalled();
    triggerIntersection(true);
    expect(fetchMoreData).not.toHaveBeenCalled();
  });

  it('does not observe when onLoadMore is undefined', () => {
    const fetchMoreData = vi.fn().mockResolvedValue(undefined);

    renderHook(() => {
      useInfiniteScroll<Row, Response>({
        fetchMoreData,
        hasMore: true,
        isLoadingMore: false,
        scrollContainerRef: createRef(),
        sentinelRef: createRef(),
        threshold: 100,
      });
    });

    expect(observeSpy).not.toHaveBeenCalled();
    expect(fetchMoreData).not.toHaveBeenCalled();
  });

  it('disconnects the observer on unmount', () => {
    const fetchMoreData = vi.fn().mockResolvedValue(undefined);

    const { unmount } = renderHook(() => {
      useInfiniteScroll<Row, Response>({
        fetchMoreData,
        hasMore: true,
        isLoadingMore: false,
        onLoadMore: vi.fn(),
        scrollContainerRef: createRef(),
        sentinelRef: createRef(),
        threshold: 100,
      });
    });

    unmount();

    expect(disconnectSpy).toHaveBeenCalled();
  });
});
