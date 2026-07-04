import type { RefObject } from 'react';

import { useEffect, useState } from 'react';

import {
  DEFAULT_CONTAINER_HEIGHT,
  DEFAULT_ROW_OVERSCAN,
} from '@repo/ui/constants/virtualization.constants';
import {
  getVerticalVirtualizationWindow,
  setupObservedContainer,
} from '@repo/ui/hooks/utils';

export type UseVirtualizationArgs = {
  readonly containerRef: RefObject<HTMLElement | null | undefined>;
  readonly defaultContainerHeight?: number;
  readonly itemHeight: number;
  readonly overscan?: number;
  readonly totalItems: number;
};

export const useVirtualization = ({
  containerRef,
  defaultContainerHeight = DEFAULT_CONTAINER_HEIGHT,
  itemHeight,
  overscan = DEFAULT_ROW_OVERSCAN,
  totalItems,
}: UseVirtualizationArgs) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(
    defaultContainerHeight,
  );

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

    return setupObservedContainer({
      container,
      onMeasure: updateHeight,
      readScroll: () => container?.scrollTop ?? 0,
      // eslint-disable-next-line react-x/set-state-in-effect -- Scroll position must be read from DOM events; cannot be derived during render
      setScroll: setScrollTop,
    });
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
