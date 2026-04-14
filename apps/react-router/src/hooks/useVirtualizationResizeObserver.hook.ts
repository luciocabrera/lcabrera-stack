import type { RefObject } from 'react';

import { useEffect, useRef, useState } from 'react';

import {
  DEFAULT_CONTAINER_HEIGHT,
  DEFAULT_ROW_OVERSCAN,
} from '@/constants/virtualization.constants';
import { getVerticalVirtualizationWindow } from '@/hooks/utils';

export type UseVirtualizationResizeObserverArgs = {
  containerRef: RefObject<HTMLElement | null>;
  defaultContainerHeight?: number;
  itemHeight: number;
  overscan?: number;
  totalItems: number;
};

export const useVirtualizationResizeObserver = ({
  containerRef,
  defaultContainerHeight = DEFAULT_CONTAINER_HEIGHT,
  itemHeight,
  overscan = DEFAULT_ROW_OVERSCAN,
  totalItems,
}: UseVirtualizationResizeObserverArgs) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(
    defaultContainerHeight,
  );
  const rafIdRef = useRef(-1);

  const {
    bottomSpacerHeight,
    endIndex,
    offsetY,
    startIndex,
    totalHeight,
    visibleCount,
  } = getVerticalVirtualizationWindow({
    containerHeight,
    itemHeight,
    overscan,
    scrollTop,
    totalItems,
  });

  useEffect(() => {
    const container = containerRef.current;

    const updateHeight = () => {
      const measured = container?.offsetHeight ?? 0;
      // Skip zero measurements (e.g. display:none from Activity hidden)
      // to preserve the last valid height and avoid layout shifts
      if (measured > 0) {
        // eslint-disable-next-line react-x/set-state-in-effect -- State must be set from DOM measurement (offsetHeight); this cannot be derived during render
        setContainerHeight(measured);
      }
    };

    const handleScroll = () => {
      if (rafIdRef.current >= 0) {
        return;
      }

      rafIdRef.current = globalThis.requestAnimationFrame(() => {
        rafIdRef.current = -1;
        // eslint-disable-next-line react-x/set-state-in-effect -- Scroll position must be read from the DOM event; it cannot be derived during render
        setScrollTop(container?.scrollTop ?? 0);
      });
    };

    const syncScrollPosition = () => {
      if (rafIdRef.current >= 0) {
        globalThis.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = -1;
      }

      // eslint-disable-next-line react-x/set-state-in-effect -- Scroll position must be read from the DOM; it cannot be derived during render
      setScrollTop(container?.scrollTop ?? 0);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    if (container) {
      resizeObserver.observe(container);
    }

    syncScrollPosition();
    container?.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (rafIdRef.current >= 0) {
        globalThis.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = -1;
      }
      container?.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  return {
    bottomSpacerHeight,
    containerHeight,
    endIndex,
    offsetY,
    startIndex,
    totalHeight,
    visibleCount,
  };
};
