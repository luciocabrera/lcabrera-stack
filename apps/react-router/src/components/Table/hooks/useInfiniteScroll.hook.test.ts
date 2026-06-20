// @vitest-environment jsdom

import type { RefObject } from 'react';

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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

const createContainer = (): HTMLElement => {
  const container = document.createElement('div');

  Object.defineProperties(container, {
    clientHeight: {
      configurable: true,
      value: 400,
    },
    scrollHeight: {
      configurable: true,
      value: 1000,
    },
    scrollTop: {
      configurable: true,
      value: 0,
      writable: true,
    },
  });

  return container;
};

describe('useInfiniteScroll', () => {
  it('fetches more data when the user scrolls within the threshold', () => {
    const container = createContainer();
    const fetchMoreData = vi
      .fn<
        ({
          dataSelector,
          dataTotalSelector,
          onLoadMore,
        }: {
          readonly dataSelector?: (response: Response) => Row[];
          readonly dataTotalSelector?: (response: Response) => number;
          readonly onLoadMore?: (params: {
            limit: number;
            skip: number;
          }) => Promise<Response>;
        }) => Promise<void>
      >()
      .mockResolvedValue();
    const onLoadMore = vi.fn();
    const scrollContainerRef = {
      current: container,
    } as RefObject<HTMLElement | null>;

    renderHook(() => {
      useInfiniteScroll<Row, Response>({
        dataSelector,
        dataTotalSelector,
        fetchMoreData,
        hasMore: true,
        isLoadingMore: false,
        onLoadMore,
        scrollContainerRef,
        threshold: 100,
      });
    });

    act(() => {
      container.scrollTop = 520;
      container.dispatchEvent(new Event('scroll'));
    });

    expect(fetchMoreData).toHaveBeenCalledWith({
      dataSelector,
      dataTotalSelector,
      onLoadMore,
    });
  });

  it('does not fetch when already loading or when no more rows exist', () => {
    const container = createContainer();
    const fetchMoreData = vi.fn().mockImplementation(() => Promise.resolve());
    const onLoadMore = vi.fn();
    const scrollContainerRef = {
      current: container,
    } as RefObject<HTMLElement | null>;

    renderHook(() => {
      useInfiniteScroll<Row, Response>({
        fetchMoreData,
        hasMore: false,
        isLoadingMore: true,
        onLoadMore,
        scrollContainerRef,
        threshold: 100,
      });
    });

    act(() => {
      container.scrollTop = 520;
      container.dispatchEvent(new Event('scroll'));
    });

    expect(fetchMoreData).not.toHaveBeenCalled();
  });

  it('does not fetch when onLoadMore is undefined', () => {
    const container = createContainer();
    const fetchMoreData = vi.fn().mockImplementation(() => Promise.resolve());
    const scrollContainerRef = {
      current: container,
    } as RefObject<HTMLElement | null>;

    renderHook(() => {
      useInfiniteScroll<Row, Response>({
        fetchMoreData,
        hasMore: true,
        isLoadingMore: false,
        scrollContainerRef,
        threshold: 100,
      });
    });

    act(() => {
      container.scrollTop = 520;
      container.dispatchEvent(new Event('scroll'));
    });

    expect(fetchMoreData).not.toHaveBeenCalled();
  });

  it('removes the scroll listener on unmount', () => {
    const container = createContainer();
    const fetchMoreData = vi.fn().mockImplementation(() => Promise.resolve());
    const onLoadMore = vi.fn();
    const removeEventListenerSpy = vi.spyOn(container, 'removeEventListener');
    const scrollContainerRef = {
      current: container,
    } as RefObject<HTMLElement | null>;

    const { unmount } = renderHook(() => {
      useInfiniteScroll<Row, Response>({
        fetchMoreData,
        hasMore: true,
        isLoadingMore: false,
        onLoadMore,
        scrollContainerRef,
        threshold: 100,
      });
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
    );
  });
});
