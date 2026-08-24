import { useEffect } from 'react';

type UseResizeObserverArgs = {
  readonly getTarget: () => HTMLElement | null | undefined;
  readonly onMeasure: (target: HTMLElement) => void;
};

/**
 * Owns the shared observer scaffold so consumers don't repeat it: - The initial
 * measurement is deferred to a microtask so the effect body never sets state synchronously
 * (react-x/set-state-in-effect); with a real ResizeObserver, `observe()` also delivers an
 * initial callback.
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
