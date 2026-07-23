import type { RefObject } from 'react';

import { useEffect, useRef } from 'react';

export type UseInfiniteScrollObserverArgs = {
  /** Whether the observer should be active (e.g. there is more data and a fetch is not already in flight) */
  readonly isEnabled: boolean;
  /** Invoked when the sentinel scrolls within `threshold` pixels of the root's bottom edge */
  readonly onReachEnd: () => void;
  /** Scrollable container that acts as the IntersectionObserver root */
  readonly rootRef: RefObject<HTMLElement | null>;
  /** Element rendered at the end of the scrollable content to observe */
  readonly sentinelRef: RefObject<HTMLElement | null>;
  /**
   * When `false`, `onReachEnd` fires only if the root is actually overflowing
   * (the user scrolled to a real bottom), never merely because the sentinel is
   * visible in an under-filled container. Defaults to `true`, which keeps
   * loading until the content fills the container. Set it `false` whenever the
   * rendered rows are a client-side subset (search/filter) of the loaded data:
   * fetching more pages cannot fill such a view, so an empty or short result
   * would otherwise scan the whole dataset.
   */
  readonly shouldFetchToFill?: boolean;
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
 * Pass `shouldFetchToFill: false` to opt out of that fill-loop when the rendered
 * rows are a client-side subset of the loaded data (see the arg's docs).
 *
 * `onReachEnd` is read through a ref so the observer's lifetime is decoupled from
 * the callback's identity. Callers may pass inline callbacks without causing the
 * observer to disconnect/reconnect (and potentially re-fire) on every render.
 *
 * @param onReachEnd - Fired each time the sentinel intersects; may be invoked
 * repeatedly while the sentinel stays in view, so the handler must be idempotent
 * (guard against overlapping loads via `isEnabled`).
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
