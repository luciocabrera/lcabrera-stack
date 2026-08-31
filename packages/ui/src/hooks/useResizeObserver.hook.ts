import { useEffect } from 'react';

type UseResizeObserverArgs = {
  readonly getTarget: () => HTMLElement | null | undefined;
  readonly onMeasure: (target: HTMLElement) => void;
};

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
