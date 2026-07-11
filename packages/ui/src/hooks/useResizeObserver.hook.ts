import { useEffect } from 'react';

type UseResizeObserverArgs = {
  readonly getTarget: () => HTMLElement | null | undefined;
  readonly onMeasure: (target: HTMLElement) => void;
};

/**
 * Low-level `ResizeObserver` lifecycle primitive. Resolves the target lazily
 * via `getTarget` (an owned ref's `.current`, a queried descendant, ...) and
 * invokes `onMeasure` with it on mount and on every subsequent resize.
 *
 * Owns the shared observer scaffold so consumers don't repeat it:
 * - The initial measurement is deferred to a microtask so the effect body
 *   never sets state synchronously (react-x/set-state-in-effect); with a
 *   real ResizeObserver, `observe()` also delivers an initial callback.
 * - SSR-safe: without a `ResizeObserver` global it still performs the single
 *   deferred initial measurement and cleans up.
 * - Disconnects the observer and cancels the pending initial measurement on
 *   cleanup.
 */
export const useResizeObserver = ({
  getTarget,
  onMeasure,
}: UseResizeObserverArgs) => {
  useEffect(() => {
    const target = getTarget();

    if (!target) return;

    const measure = () => {
      onMeasure(target);
    };

    let isMeasureCancelled = false;
    queueMicrotask(() => {
      if (!isMeasureCancelled) measure();
    });

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        isMeasureCancelled = true;
      };
    }

    const observer = new ResizeObserver(measure);
    observer.observe(target);

    return () => {
      isMeasureCancelled = true;
      observer.disconnect();
    };
  }, [getTarget, onMeasure]);
};
