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
