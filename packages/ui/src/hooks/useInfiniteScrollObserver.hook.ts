import type { RefObject } from 'react';

import { useEffect, useRef } from 'react';

export type UseInfiniteScrollObserverArgs = {
  readonly isEnabled: boolean;
  readonly onReachEnd: () => void;
  readonly rootRef: RefObject<HTMLElement | null>;
  readonly sentinelRef: RefObject<HTMLElement | null>;
  /** `false` when the visible rows are a client-side subset of the loaded data. */
  readonly shouldFetchToFill?: boolean;
  readonly threshold: number;
};

/**
 * `onReachEnd` is read through a ref so inline callbacks do not reconnect the observer.
 * The handler must be idempotent: the sentinel can stay in view and fire repeatedly.
 */
export const useInfiniteScrollObserver = ({
  isEnabled,
  onReachEnd,
  rootRef,
  sentinelRef,
  shouldFetchToFill = true,
  threshold,
}: UseInfiniteScrollObserverArgs) => {
  const onReachEndRef = useRef(onReachEnd);

  useEffect(() => {
    onReachEndRef.current = onReachEnd;
  }, [onReachEnd]);

  useEffect(() => {
    const root = rootRef.current;
    const sentinel = sentinelRef.current;

    if (!isEnabled || !root || !sentinel) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        // A visible sentinel in a container that isn't overflowing means the
        // content doesn't fill the viewport, not that a real bottom was
        // reached. Only fill in that case when the caller allows it — a
        // client-side filter must not, or an empty/short result would keep
        // fetching pages forever.
        if (!shouldFetchToFill && root.scrollHeight <= root.clientHeight)
          return;
        onReachEndRef.current();
      },
      {
        root,
        rootMargin: `0px 0px ${threshold}px 0px`,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [isEnabled, rootRef, sentinelRef, shouldFetchToFill, threshold]);
};
