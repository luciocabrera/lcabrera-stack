import type { RefObject } from 'react';

import { useEffect } from 'react';

export type UseInfiniteScrollObserverArgs = {
  /** Whether the observer should be active (e.g. there is more data and a fetch is not already in flight) */
  readonly isEnabled: boolean;
  /** Invoked when the sentinel scrolls within `threshold` pixels of the root's bottom edge */
  readonly onReachEnd: () => void;
  /** Scrollable container that acts as the IntersectionObserver root */
  readonly rootRef: RefObject<HTMLElement | null>;
  /** Element rendered at the end of the scrollable content to observe */
  readonly sentinelRef: RefObject<HTMLElement | null>;
  /** Pixel distance from the bottom at which `onReachEnd` fires */
  readonly threshold: number;
};

/**
 * Triggers `onReachEnd` when a sentinel element scrolls near the bottom of a
 * scrollable container.
 *
 * Uses {@link IntersectionObserver} instead of a scroll listener so the browser
 * computes proximity off the main layout pass, avoiding synchronous layout reads
 * (`scrollHeight`/`scrollTop`/`clientHeight`) on every scroll event.
 *
 * The effect re-runs whenever `isEnabled` changes, which re-observes the sentinel
 * and re-fires `onReachEnd` if it is still in view after a page loads — this keeps
 * loading until the content fills the container (or `isEnabled` becomes `false`).
 */
export const useInfiniteScrollObserver = ({
  isEnabled,
  onReachEnd,
  rootRef,
  sentinelRef,
  threshold,
}: UseInfiniteScrollObserverArgs): void => {
  useEffect(() => {
    const root = rootRef.current;
    const sentinel = sentinelRef.current;

    if (!isEnabled || !root || !sentinel) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          onReachEnd();
        }
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
  }, [isEnabled, onReachEnd, rootRef, sentinelRef, threshold]);
};
