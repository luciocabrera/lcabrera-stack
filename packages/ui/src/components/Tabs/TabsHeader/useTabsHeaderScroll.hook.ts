import { useEffect, useRef, useState } from 'react';

import type { TabsScrollDirection } from './TabsHeader.types';

type TabsHeaderOverflow = {
  readonly hasEnd: boolean;
  readonly hasStart: boolean;
};

type UseTabsHeaderScrollArgs = {
  readonly tabCount: number;
};

const NO_OVERFLOW: TabsHeaderOverflow = { hasEnd: false, hasStart: false };

const OVERFLOW_EPSILON = 1;

const SCROLL_STEP_RATIO = 0.8;

export const useTabsHeaderScroll = ({ tabCount }: UseTabsHeaderScrollArgs) => {
  const listRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState<TabsHeaderOverflow>(NO_OVERFLOW);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) return;

    let frameId = -1;
    let isCancelled = false;

    const measure = () => {
      const hasStart = viewport.scrollLeft > OVERFLOW_EPSILON;
      const hasEnd =
        viewport.scrollLeft + viewport.clientWidth <
        viewport.scrollWidth - OVERFLOW_EPSILON;

      setOverflow((previous) =>
        previous.hasEnd === hasEnd && previous.hasStart === hasStart
          ? previous
          : { hasEnd, hasStart },
      );
    };

    const scheduleMeasure = () => {
      if (frameId >= 0) return;

      frameId = globalThis.requestAnimationFrame(() => {
        frameId = -1;
        measure();
      });
    };

    queueMicrotask(() => {
      if (!isCancelled) measure();
    });

    viewport.addEventListener('scroll', scheduleMeasure, { passive: true });

    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure);

    observer?.observe(viewport);

    if (listRef.current) observer?.observe(listRef.current);

    return () => {
      isCancelled = true;

      if (frameId >= 0) globalThis.cancelAnimationFrame(frameId);

      viewport.removeEventListener('scroll', scheduleMeasure);
      observer?.disconnect();
    };
  }, [tabCount]);

  const scrollByDirection = (direction: TabsScrollDirection) => {
    const viewport = viewportRef.current;

    if (!viewport) return;

    const step = viewport.clientWidth * SCROLL_STEP_RATIO;

    viewport.scrollLeft += direction === 'start' ? -step : step;
  };

  return {
    hasEndOverflow: overflow.hasEnd,
    hasStartOverflow: overflow.hasStart,
    listRef,
    scrollByDirection,
    viewportRef,
  };
};
